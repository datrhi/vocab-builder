import { LoaderFunctionArgs, json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import GameLobby from "~/components/GameLobby";
import QuizPlayer from "~/components/QuizPlayer";
import { getCurrentUser } from "~/services/auth.server";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";
import GameEnd from "../components/GameEnd";
import { MAX_PLAYERS, WORDS_PER_GAME } from "../constants/game";
import { useGameState } from "../services/game-state";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];
type Participant = Database["public"]["Tables"]["quiz_participants"]["Row"];
type RoomWord = Database["public"]["Tables"]["quiz_room_words"]["Row"];
type Word = Database["public"]["Tables"]["words"]["Row"];

interface LoaderData {
  quiz: Quiz;
  room: QuizRoom;
  roomId: string;
  participants: Participant[];
  roomWords: (RoomWord & { word: Word })[];
  userId: string;
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const quizId = params.id;
  const url = new URL(request.url);
  const pin = url.searchParams.get("pin");

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

    if (quizError) {
      console.error("Error fetching quiz:", quizError);
      throw json(
        { message: "Quiz not found", details: quizError.message },
        { status: 404 }
      );
    }

    if (!quiz) {
      throw json({ message: "Quiz not found" }, { status: 404 });
    }

    // Fetch or create room
    const { room, roomId } = await getOrCreateRoom({
      supabase,
      pin,
      quiz,
      userId,
    });

    // Get participants in the room
    const { data: participants, error: participantsError } = await supabase
      .from("quiz_participants")
      .select("*")
      .eq("room_id", roomId);

    if (participantsError) {
      console.error("Error fetching participants:", participantsError);
    }

    // Get room words with their word details
    const { data: roomWords, error: roomWordsError } = await supabase
      .from("quiz_room_words")
      .select(
        `
        *,
        word:words(*)
      `
      )
      .eq("room_id", roomId)
      .order("order_index");

    if (roomWordsError) {
      console.error("Error fetching room words:", roomWordsError);
    }

    return json<LoaderData>(
      {
        quiz,
        room,
        roomId,
        participants: participants || [],
        roomWords: roomWords || [],
        userId,
      },
      { headers: response.headers }
    );
  } catch (error) {
    console.error("Unhandled error in loader:", error);
    if (error instanceof Response) throw error;
    throw json(
      { message: "An unexpected error occurred", details: String(error) },
      { status: 500 }
    );
  }
};

async function getOrCreateRoom({
  supabase,
  pin,
  quiz,
  userId,
}: {
  supabase: SupabaseClient<Database>;
  pin: string | null;
  quiz: Quiz;
  userId: string | null;
}) {
  // Fetch room data if pin is provided
  if (pin) {
    const { data: roomData, error: roomError } = await supabase
      .from("quiz_rooms")
      .select("*")
      .eq("pin_code", pin)
      .single();

    if (!roomError && roomData) {
      return { room: roomData, roomId: roomData.id };
    } else if (roomError && roomError.code !== "PGRST116") {
      // Only log non-404 errors
      console.error("Error fetching room:", roomError);
    }
  }

  // Generate a unique PIN code
  const { data: pinData, error: pinError } = await supabase.rpc(
    "generate_unique_pin"
  );

  if (pinError) {
    console.error("Error generating PIN:", pinError);
    // Fallback to random PIN
    return createRoomWithPin({
      supabase,
      pin,
      quiz,
      userId,
      uniquePin: Math.floor(100000 + Math.random() * 900000).toString(),
    });
  }

  // Insert new room with generated PIN
  const uniquePin =
    pinData || Math.floor(100000 + Math.random() * 900000).toString();
  return createRoomWithPin({
    supabase,
    pin,
    quiz,
    userId,
    uniquePin,
  });
}

async function createRoomWithPin({
  supabase,
  pin,
  quiz,
  userId,
  uniquePin,
}: {
  supabase: SupabaseClient<Database>;
  pin: string | null;
  quiz: Quiz;
  userId: string | null;
  uniquePin: string;
}) {
  // Insert new room
  const { data: newRoom, error: createRoomError } = await supabase
    .from("quiz_rooms")
    .insert({
      category: quiz.category,
      created_by: userId || "anonymous",
      pin_code: pin || uniquePin,
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

  // Insert words into quiz_room_words
  const { error: insertWordsError } = await supabase
    .from("quiz_room_words")
    .insert(roomWords);

  if (insertWordsError) {
    console.error("Error inserting room words:", insertWordsError);
    throw json(
      {
        message: "Failed to setup quiz words",
        details: `Error code: ${insertWordsError.code}, Message: ${
          insertWordsError.message
        }, Hint: ${insertWordsError.hint || "No hint provided"}`,
      },
      { status: 500 }
    );
  }

  return { room: newRoom, roomId };
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 text-white p-4">
        <h1 className="text-3xl font-bold mb-4">{error.status} Error</h1>
        <div className="bg-emerald-950/50 p-6 rounded-lg max-w-lg w-full">
          <p className="mb-4">
            {error.data?.message || "An unexpected error occurred"}
          </p>
          {error.data?.details && (
            <div className="mt-4 p-3 bg-emerald-950/70 rounded overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">
                {error.data.details}
              </pre>
            </div>
          )}
          <div className="mt-6 flex justify-center">
            <a
              href="/"
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold"
            >
              Return to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Unexpected Error</h1>
      <div className="bg-emerald-950/50 p-6 rounded-lg max-w-lg w-full">
        <p className="mb-4">
          An unexpected error occurred while loading the quiz.
        </p>
        <div className="mt-4 p-3 bg-emerald-950/70 rounded overflow-auto">
          <pre className="text-sm whitespace-pre-wrap">
            {error instanceof Error ? error.message : "Unknown error"}
          </pre>
        </div>
        <div className="mt-6 flex justify-center">
          <a
            href="/"
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Play() {
  const { quiz, room, roomId, participants, roomWords, userId } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const pin = searchParams.get("pin") || room.pin_code;

  const {
    gameState,
    submitAnswer,
    endGame,
    joinRoom,
    startGame,
    nextQuestion,
  } = useGameState(roomId, userId, roomWords, participants);

  const renderGame = () => {
    switch (gameState.status) {
      case "waiting":
        return (
          <GameLobby
            pin={pin}
            quizTitle={quiz.title}
            quizThumbnail={quiz.image || ""}
            onStartGame={startGame}
            participants={gameState.participants}
            onJoinRoom={joinRoom}
            isHost={gameState.isHost}
          />
        );
      case "in-progress":
        return (
          <QuizPlayer
            pin={pin}
            roomId={roomId}
            wordData={gameState.wordData}
            playerAnswers={gameState.answers}
            onEndGame={endGame}
            onSubmitAnswer={submitAnswer}
            isHost={gameState.isHost}
            onNextQuestion={nextQuestion}
          />
        );
      case "completed":
        return <GameEnd />;
      default:
        return <div>Unknown game state</div>;
    }
  };

  return <div className="min-h-screen bg-emerald-50">{renderGame()}</div>;
}
