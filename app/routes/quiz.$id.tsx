import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { MoreHorizontal, Share2, Star } from "lucide-react";
import { useState } from "react";
import Header from "~/components/Header";

export const loader = async ({ params }: { params: { id: string } }) => {
  // In a real app, this would fetch from a database
  const quizData = {
    id: params.id,
    title: "Famous Movie Characters",
    author: "scypthe",
    rating: 3.8,
    votes: 20,
    questions: 12,
    duration: "6 min",
    language: "English",
    description: "Test your knowledge about characters from famous movies.",
    isAiGenerated: true,
    image:
      "https://images.pexels.com/photos/2873486/pexels-photo-2873486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    tags: ["entertainment", "trivia", "characters", "cinema", "movies"],
  };

  return json({ quiz: quizData });
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
    <div className="flex min-h-screen flex-col bg-background bubble-bg">
      <Header />

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
              {quiz.tags.map((tag) => (
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
    </div>
  );
}
