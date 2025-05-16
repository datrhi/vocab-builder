import { ArrowRight, PauseCircle, Share2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GameEvent } from "~/services/game-state";
import type { Database } from "../../types/supabase";
import { TIME_PER_QUESTION } from "../constants/game";
import { Leaderboard, LeaderboardPlayer } from "./Leaderboard";

interface QuizPlayerProps {
  pin: string;
  wordData: {
    answer: string;
    scrambleWord: string;
    wordIndex: number;
    definition: string;
    image: string;
  };
  playerAnswers: Database["public"]["Tables"]["player_answers"]["Row"][];
  onSubmitAnswer?: (
    answerText: string,
    isCorrect: boolean,
    score: number,
    timeTakenMs: number
  ) => void;
  onEndGame?: () => void;
  onNextQuestion?: () => void;
  onShowLeaderboard?: () => void;
  isHost: boolean;
  canAnswer: boolean;
  gameEvents: GameEvent[];
  leaderboard: LeaderboardPlayer[];
}

export default function QuizPlayer({
  pin,
  wordData,
  playerAnswers,
  isHost,
  onSubmitAnswer = () => {},
  onEndGame = () => {},
  onNextQuestion = () => {},
  onShowLeaderboard = () => {},
  canAnswer,
  gameEvents,
  leaderboard,
}: QuizPlayerProps) {
  const [timeRemaining, setTimeRemaining] = useState(TIME_PER_QUESTION);
  const [userAnswer, setUserAnswer] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isShowLeaderboard = useMemo(() => {
    // if the last event is a show leaderboard event, return true
    return gameEvents[gameEvents.length - 1].type === "show-leaderboard";
  }, [gameEvents]);

  const currentScore = useMemo(() => {
    const scoreMultiplier = Math.max(1, timeRemaining / 10);
    const baseScore = 100;
    const score = Math.round(baseScore * scoreMultiplier);
    return score;
  }, [timeRemaining]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      // Move to next question when time runs out
      onShowLeaderboard();
    }
  }, [timeRemaining]);

  useEffect(() => {
    if (wordData.wordIndex > -1) {
      setTimeRemaining(TIME_PER_QUESTION);
      setUserAnswer("");
      inputRef.current?.focus();
    }
  }, [wordData]);

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;

    try {
      const startTime =
        new Date().getTime() - (TIME_PER_QUESTION - timeRemaining) * 1000;
      const timeTaken = new Date().getTime() - startTime;
      const isCorrect =
        userAnswer.toLowerCase() === wordData.answer.toLowerCase();

      // Calculate score - more points for faster answers
      const scoreMultiplier = Math.max(1, timeRemaining / 10);
      const baseScore = isCorrect ? 100 : 0;
      const score = Math.round(baseScore * scoreMultiplier);

      onSubmitAnswer(userAnswer, isCorrect, score, timeTaken);

      if (!isCorrect) {
        // Clear answer and move to next question
        setUserAnswer("");
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-emerald-900">
      <header className="flex items-center justify-between bg-emerald-950 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm ft-bold">Quiz.com</span>
          <span className="text-sm text-white/75">PIN {pin}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>
            Question {wordData.wordIndex + 1}/{10}
          </span>
          <div className="flex gap-2">
            <button
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Pause"
              disabled={!isHost}
            >
              <PauseCircle size={16} />
            </button>
            <button
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Next"
              onClick={onNextQuestion}
              disabled={!isHost}
            >
              <ArrowRight size={16} />
            </button>
            <button
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      {isShowLeaderboard ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto max-w-lg p-6 w-full">
            <Leaderboard players={leaderboard} />
          </div>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-6 p-6 md:grid-cols-2">
          <div className="flex flex-col items-center justify-center">
            <div className="mb-4 text-center">
              <p className="text-lg text-white/80">Unscramble this word:</p>
              <h2 className="mb-4 text-4xl font-bold text-white">
                {wordData.scrambleWord}
              </h2>
              {wordData.definition && (
                <p className="mb-4 italic text-white/80">
                  <span className="font-semibold">Hint:</span>{" "}
                  {wordData.definition}
                </p>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="mb-4 w-full max-w-xs rounded-lg border-0 px-4 py-2 text-center"
              placeholder="Enter your answer"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmitAnswer();
                }
              }}
              disabled={!canAnswer}
              autoFocus
            />
            {canAnswer && (
              <button
                onClick={handleSubmitAnswer}
                className="w-full max-w-xs rounded-lg bg-emerald-500 py-2 font-semibold text-white hover:bg-emerald-600"
              >
                Submit
              </button>
            )}

            <div className="mt-8 h-2 w-full max-w-xs rounded-full bg-black/20">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300"
                style={{
                  width: `${(timeRemaining / TIME_PER_QUESTION) * 100}%`,
                }}
              />
            </div>
            <div className="mt-1 text-sm text-white/80">{currentScore}</div>
          </div>

          <div className="flex flex-col rounded-lg bg-emerald-950 p-4">
            <div className="flex-1 overflow-y-auto items-center flex justify-center">
              <img
                src={wordData.image}
                alt="Guess this word"
                className="w-full h-72 object-contain rounded-lg shadow-md mb-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
