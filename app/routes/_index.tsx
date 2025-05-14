import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { User } from "@supabase/supabase-js";
import { PencilLine } from "lucide-react";
import CallToActionCard from "~/components/CallToActionCard";
import Header from "~/components/Header";
import QuizCard from "~/components/QuizCard";
import { getCurrentUser } from "~/services/auth.server";
import type { Database } from "../../types/supabase";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"] & {
  isAiGenerated?: boolean;
};

type LoaderData = {
  user: User | null;
  quizzes: Quiz[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user, supabase } = await getCurrentUser(request);

  // Fetch quizzes from Supabase
  const { data: quizzes, error } = await supabase
    .from("quizzes")
    .select("*")
    .order("rating", { ascending: false });

  if (error) {
    console.error("Error fetching quizzes:", error);
    throw new Response("Error fetching quizzes", { status: 500 });
  }

  // Fallback data if no quizzes are found
  let enhancedQuizzes: Quiz[] = [];

  if (quizzes && quizzes.length > 0) {
    // Add isAiGenerated field with default value for compatibility with UI
    enhancedQuizzes = quizzes.map((quiz) => ({
      ...quiz,
      isAiGenerated: false,
    }));
  }
  return json<LoaderData>({ quizzes: enhancedQuizzes, user });
};

export default function Index() {
  const { quizzes, user } = useLoaderData<LoaderData>();

  return (
    <div className="flex min-h-screen flex-col bg-background bubble-bg">
      <Header user={user} />

      <main className="mx-auto w-full max-w-6xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-1">
          <CallToActionCard
            title="Create a quiz"
            subtitle="Play for free with 300 participants"
            buttonText="Quiz editor"
            buttonLink="#"
            image={<PencilLine size={80} className="text-white/80" />}
            bgColor="bg-emerald-800"
          />
        </div>

        <section className="mt-12">
          <h2 className="mb-6 text-xl font-bold text-gray-800">Quizzes</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {quizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                id={quiz.id}
                title={quiz.title}
                author={quiz.author}
                rating={quiz.rating}
                image={quiz.image || ""}
                isAiGenerated={quiz.isAiGenerated}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
