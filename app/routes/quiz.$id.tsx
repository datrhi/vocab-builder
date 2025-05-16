import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MoreHorizontal, Share2, Star } from "lucide-react";
import { MAX_PLAYERS, WORDS_PER_GAME } from "~/constants/game";
import { getCurrentUser } from "~/services/auth.server";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type Word = Database["public"]["Tables"]["words"]["Row"];

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

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const quizId = params.id;

  if (!quizId) {
    throw json({ message: "Quiz ID is required" }, { status: 400 });
  }

  try {
    // Get current user
    const { user, response } = await getCurrentUser(request);
    const supabase = createSupabaseServerClient({ request, response });
    const userId = user?.id || null;

    if (!userId) {
      throw json({ message: "User not found" }, { status: 401 });
    }

    // Fetch quiz data
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      throw json(
        { message: "Quiz not found", details: quizError?.message },
        { status: 404 }
      );
    }

    // Generate a unique PIN code
    const { data: uniquePin, error: pinError } = await supabase.rpc(
      "generate_unique_pin"
    );

    if (pinError) {
      console.error("Error generating PIN:", pinError);
      // Fallback to random PIN
      const fallbackPin = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      return createRoomWithPin(supabase, quiz, userId, fallbackPin, response);
    }

    // Create room with generated PIN
    return createRoomWithPin(
      supabase,
      quiz,
      userId,
      uniquePin || Math.floor(100000 + Math.random() * 900000).toString(),
      response
    );
  } catch (error) {
    console.error("Unhandled error in action:", error);
    if (error instanceof Response) throw error;
    throw json(
      { message: "An unexpected error occurred", details: String(error) },
      { status: 500 }
    );
  }
};

async function createRoomWithPin(
  supabase: SupabaseClient<Database>,
  quiz: Quiz,
  userId: string,
  pin: string,
  response: Response
) {
  // Insert new room
  const { data: newRoom, error: createRoomError } = await supabase
    .from("quiz_rooms")
    .insert({
      category: quiz.category,
      created_by: userId,
      pin_code: pin,
      is_active: true,
      max_players: MAX_PLAYERS,
    })
    .select()
    .single();

  if (createRoomError) {
    console.error("Error creating room:", createRoomError);
    throw json(
      {
        message: "Failed to create room",
        details: createRoomError.message,
      },
      { status: 500 }
    );
  }

  if (!newRoom) {
    throw json(
      { message: "Failed to create room: no room data returned" },
      { status: 500 }
    );
  }

  const roomId = newRoom.id;

  // Fetch words with the same category
  const { data: words, error: wordsError } = await supabase
    .from("words")
    .select("*")
    .eq("category", quiz.category)
    .order("created_at", { ascending: false })
    .limit(WORDS_PER_GAME);

  if (wordsError) {
    console.error("Error fetching words:", wordsError);
    throw json(
      { message: "Failed to fetch words", details: wordsError.message },
      { status: 500 }
    );
  }

  // Insert words into quiz_room_words
  const roomWords = words.map((word: Word, index: number) => ({
    room_id: roomId,
    word_id: word.id,
    order_index: index,
  }));

  const { error: insertWordsError } = await supabase
    .from("quiz_room_words")
    .insert(roomWords);

  if (insertWordsError) {
    console.error("Error inserting room words:", insertWordsError);
    throw json(
      {
        message: "Failed to setup quiz words",
        details: insertWordsError.message,
      },
      { status: 500 }
    );
  }

  // Redirect to the play page with roomId and pin
  return redirect(`/play/${roomId}?pin=${pin}`, {
    headers: response.headers,
  });
}

export default function QuizDetail() {
  const { quiz } = useLoaderData<typeof loader>();

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
            <Form method="post">
              <button
                type="submit"
                className="rounded-xl bg-emerald-500 px-8 py-3 font-semibold text-white hover:bg-emerald-600"
              >
                Play Now
              </button>
            </Form>
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
