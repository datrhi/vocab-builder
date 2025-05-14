import { LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData, useParams, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import GameLobby from "~/components/GameLobby";
import QuizPlayer from "~/components/QuizPlayer";
import { createSupabaseServerClient } from "~/services/supabase.server";
import type { Database } from "../../types/supabase";

type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
type QuizRoom = Database["public"]["Tables"]["quiz_rooms"]["Row"];

interface LoaderData {
  quiz: Quiz;
  room: QuizRoom;
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const response = new Response();
  const supabase = createSupabaseServerClient({ request, response });
  const quizId = params.id;
  const url = new URL(request.url);
  const pin = url.searchParams.get("pin");

  if (!quizId) {
    throw new Response("Quiz ID is required", { status: 400 });
  }

  // Fetch quiz data
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("*")
    .eq("id", quizId)
    .single();

  if (quizError || !quiz) {
    throw new Response("Quiz not found", { status: 404 });
  }

  // Fetch room data if pin is provided
  let room: QuizRoom | null = null;

  if (pin) {
    const { data: roomData, error: roomError } = await supabase
      .from("quiz_rooms")
      .select("*")
      .eq("pin_code", pin)
      .single();

    if (!roomError && roomData) {
      room = roomData;
    }
  }

  // If no room was found, create default room data
  if (!room) {
    room = {
      id: "",
      pin_code: pin || "804004",
      category: quiz.category,
      created_at: new Date().toISOString(),
      created_by: "",
      is_active: true,
      max_players: 20,
    };
  }

  return json<LoaderData>({ quiz, room }, { headers: response.headers });
};

export default function Play() {
  const { quiz, room } = useLoaderData<typeof loader>();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pin = searchParams.get("pin") || room.pin_code;
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  return (
    <div>
      {gameStarted ? (
        <QuizPlayer quizId={params.id || ""} pin={pin} />
      ) : (
        <GameLobby
          pin={pin}
          quizTitle={quiz.title}
          quizThumbnail={quiz.image || ""}
          onStartGame={handleStartGame}
        />
      )}
    </div>
  );
}
