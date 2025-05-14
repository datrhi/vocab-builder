import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { User } from "@supabase/supabase-js";
import { PencilLine } from "lucide-react";
import CallToActionCard from "~/components/CallToActionCard";
import Header from "~/components/Header";
import QuizCard from "~/components/QuizCard";
import { getCurrentUser } from "~/services/auth.server";

type Quiz = {
  id: string;
  title: string;
  author: string;
  rating: number;
  image: string;
  isAiGenerated: boolean;
};

type LoaderData = {
  user: User | null;
  recentQuizzes: Quiz[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { user } = await getCurrentUser(request);

  // In a real app, this would fetch from a database
  const recentQuizzes = [
    {
      id: "famous-movie-characters",
      title: "Famous Movie Characters",
      author: "scypthe",
      rating: 3.8,
      image:
        "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      isAiGenerated: true,
    },
    {
      id: "nba-quiz",
      title: "NBA Quiz",
      author: "dmaionwww",
      rating: 4.5,
      image:
        "https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      isAiGenerated: false,
    },
    {
      id: "french-beginners",
      title: "Les Nombres 1 - 10 (Beginner French)",
      author: "ThunderMannn",
      rating: 4.7,
      image:
        "https://images.pexels.com/photos/699122/pexels-photo-699122.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      isAiGenerated: false,
    },
    {
      id: "true-or-false",
      title: "True or False?",
      author: "conofmany",
      rating: 3.9,
      image:
        "https://images.pexels.com/photos/7516363/pexels-photo-7516363.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      isAiGenerated: false,
    },
    {
      id: "hot-dogs",
      title: "Quiz 'bout Hot Dogs",
      author: "techy",
      rating: 4.7,
      image:
        "https://images.pexels.com/photos/3023479/pexels-photo-3023479.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
      isAiGenerated: false,
    },
  ];

  return json<LoaderData>({ recentQuizzes, user });
};

export default function Index() {
  const { recentQuizzes, user } = useLoaderData<LoaderData>();
  console.log(user);

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
            {recentQuizzes.map((quiz) => (
              <QuizCard
                key={quiz.id}
                id={quiz.id}
                title={quiz.title}
                author={quiz.author}
                rating={quiz.rating}
                image={quiz.image}
                isAiGenerated={quiz.isAiGenerated}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
