import { ArrowRight, PauseCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface QuizPlayerProps {
  quizId: string;
  pin: string;
}

export default function QuizPlayer({ quizId, pin }: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [userAnswer, setUserAnswer] = useState("");
  const [scrambledWord, setScrambledWord] = useState("yeutkr");

  // Simulate timer countdown
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeRemaining]);

  const handleSubmitAnswer = () => {
    // In a real app, this would validate the answer
    setUserAnswer("");
    setCurrentQuestion(currentQuestion + 1);
    setTimeRemaining(30);
  };

  return (
    <div className="flex min-h-screen flex-col bg-emerald-900">
      <header className="flex items-center justify-between bg-emerald-950 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">Quiz.com</span>
          <span className="text-sm text-white/75">PIN {pin}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Slide {currentQuestion + 1}/10</span>
          <div className="flex gap-2">
            <button
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Pause"
            >
              <PauseCircle size={16} />
            </button>
            <button
              className="rounded-full p-1 hover:bg-white/10"
              aria-label="Next"
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

      <div className="grid flex-1 grid-cols-2 gap-6 p-6">
        <div className="flex flex-col items-center justify-center">
          <h2 className="mb-4 text-3xl font-bold text-white">
            {scrambledWord}
          </h2>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="mb-4 w-full max-w-xs rounded-lg border-0 text-center"
            placeholder="Enter your answer"
          />
          <button
            onClick={handleSubmitAnswer}
            className="w-full max-w-xs rounded-lg bg-emerald-500 py-2 font-semibold text-white hover:bg-emerald-600"
          >
            Try
          </button>

          <div className="mt-8 h-2 w-full max-w-xs rounded-full bg-black/20">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-300"
              style={{ width: `${(timeRemaining / 30) * 100}%` }}
            ></div>
          </div>
          <div className="mt-1 text-sm text-white/80">{timeRemaining}</div>
        </div>

        <div className="grid grid-cols-4 grid-rows-4 gap-1 rounded-lg bg-emerald-950 p-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded bg-emerald-800/50"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
