import { useParams, useSearchParams } from "@remix-run/react";
import { useState } from "react";
import GameLobby from "~/components/GameLobby";
import QuizPlayer from "~/components/QuizPlayer";

export default function Play() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const pin = searchParams.get("pin") || "804004";
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
          quizTitle="Word Scramble: Thanksgiving Edition"
          onStartGame={handleStartGame}
        />
      )}
    </div>
  );
}
