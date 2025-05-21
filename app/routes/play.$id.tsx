import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  useBeforeUnload,
  useFetcher,
  useLoaderData,
  useRouteError,
  useSearchParams,
} from "@remix-run/react";
import { useCallback } from "react";
import AudioPlayer from "~/components/AudioPlayer";
import GameEnd from "~/components/GameEnd";
import GameLobby from "~/components/GameLobby";
import QuizPlayer from "~/components/QuizPlayer";
import { getCurrentUser } from "~/services/auth.server";
import { useGameState } from "~/services/game-state";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";

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
  const roomId = params.id;
  const url = new URL(request.url);
  const pin = url.searchParams.get("pin");

  if (!roomId) {
    throw json({ message: "Room ID is required" }, { status: 400 });
  }

  if (!pin) {
    throw json({ message: "PIN is required" }, { status: 400 });
  }

  try {
    // Get current user
    const { user, response } = await getCurrentUser(request);
    const supabase = createSupabaseServerClient({ request, response });
    const userId = user?.id || null;

    if (!userId) {
      throw json({ message: "User not found" }, { status: 401 });
    }

    // Fetch room data
    const { data: room, error: roomError } = await supabase
      .from("quiz_rooms")
      .select("*")
      .eq("id", roomId)
      .eq("pin_code", pin)
      .single();

    if (roomError || !room) {
      console.error("Error fetching room:", roomError);
      throw json(
        {
          message: "Room not found or invalid PIN",
          details: roomError?.message,
        },
        { status: 404 }
      );
    }

    // Fetch the quiz associated with this room's category
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("*")
      .eq("category", room.category)
      .single();

    if (quizError || !quiz) {
      console.error("Error fetching quiz:", quizError);
      throw json(
        { message: "Quiz not found", details: quizError?.message },
        { status: 404 }
      );
    }

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

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const roomId = params.id;
  const intent = formData.get("intent");
  const isHost = formData.get("isHost") === "true";

  if (!roomId) {
    return json(
      { success: false, message: "Missing required parameters" },
      { status: 400 }
    );
  }

  if (intent === "leave-room") {
    try {
      const { user, response } = await getCurrentUser(request);
      const supabase = createSupabaseServerClient({ request, response });

      if (!user?.id) {
        return json(
          { success: false, message: "User not authenticated" },
          { status: 401 }
        );
      }

      if (isHost) {
        await supabase.from("quiz_rooms").delete().eq("id", roomId);
      }
      return json({ success: true }, { headers: response.headers });
    } catch (error) {
      console.error("Error leaving room:", error);
      return json(
        { success: false, message: "Failed to leave room" },
        { status: 500 }
      );
    }
  }

  return json({ success: false, message: "Invalid intent" }, { status: 400 });
};

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
  const { quiz, room, participants, roomWords, userId } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const pin = searchParams.get("pin") || room.pin_code;

  const {
    gameState,
    canAnswer,
    leaderboard,
    finalLeaderboard,
    isHost,
    submitAnswer,
    endGame,
    joinRoom,
    startGame,
    nextQuestion,
    showLeaderboard,
  } = useGameState(room, userId, roomWords, participants);

  const leaveFetcher = useFetcher();
  useBeforeUnload(
    useCallback(() => {
      leaveFetcher.submit(
        {
          intent: "leave-room",
          isHost,
        },
        { method: "post" }
      );
    }, [leaveFetcher, isHost])
  );

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
            isHost={isHost}
            roomCreatedBy={room.created_by}
          />
        );
      case "in-progress":
        return (
          <QuizPlayer
            pin={pin}
            wordData={gameState.wordData}
            playerAnswers={gameState.answers}
            onEndGame={endGame}
            onSubmitAnswer={submitAnswer}
            onShowLeaderboard={showLeaderboard}
            isHost={isHost}
            onNextQuestion={nextQuestion}
            canAnswer={canAnswer}
            gameEvents={gameState.events}
            leaderboard={leaderboard}
          />
        );
      case "completed":
        return <GameEnd finalLeaderboardData={finalLeaderboard} />;
      default:
        return <div>Unknown game state</div>;
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50">
      <AudioPlayer audioSrc="/audio/game3.mp3" autoPlay loop volume={0.3} />
      {renderGame()}
    </div>
  );
}
