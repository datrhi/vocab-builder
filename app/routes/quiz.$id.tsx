import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { MoreHorizontal, Share2, Star } from "lucide-react";
import { useState } from "react";
import { createSupabaseServerClient } from "~/services/supabase.server";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });

  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !quiz) {
    throw new Response("Quiz not found", { status: 404 });
  }

  // Enhancing the quiz data with additional fields needed by the UI
  // but not stored in the database
  const enhancedQuiz = {
    ...quiz,
    votes: 20, // Default values for fields not in the database
    questions: 10,
    duration: "6 min",
    language: "English",
    isAiGenerated: false,
    tags: ["entertainment", "trivia", "characters", "cinema", "movies"],
  };

  return json({ quiz: enhancedQuiz }, { headers: response.headers });
};

export default function QuizDetail() {
  const { quiz } = useLoaderData<typeof loader>();
  const [pin, setPin] = useState("");

  const handleStartGame = () => {
    // In a real app, this would create a game session
    setPin("804004");
    window.location.href = `/play/${quiz.id}?pin=${pin}`;
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-12">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-12">
        <div className="md:col-span-1">
          <div className="overflow-hidden rounded-2xl">
            <img
              src={quiz.image}
              alt={quiz.title}
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=scypthe"
              alt={quiz.author}
              className="h-8 w-8 rounded-full"
            />
            <span className="text-sm text-gray-700">{quiz.author}</span>
          </div>

          <h1 className="mb-2 text-3xl font-bold text-gray-800">
            {quiz.title}
          </h1>

          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{quiz.rating}</span>
              <span className="ml-1 text-sm text-gray-500">
                ({quiz.votes} votes)
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {quiz.questions} questions
            </div>
            <div className="text-sm text-gray-600">
              {quiz.duration} duration
            </div>
            <div className="text-sm text-gray-600">{quiz.language}</div>
          </div>

          {quiz.isAiGenerated && (
            <div className="mb-4 inline-block rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
              AI GENERATED
            </div>
          )}

          <p className="mb-6 text-gray-700">{quiz.description}</p>

          <div className="mb-8 flex flex-wrap gap-2">
            {quiz.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartGame}
              className="rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-white hover:bg-emerald-600"
            >
              Play Now
            </button>
            <button className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
              <MoreHorizontal className="h-6 w-6" />
            </button>
            <button className="rounded-full p-2 text-gray-700 hover:bg-gray-100">
              <Share2 className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
