import { FinalLeaderboard, FinalLeaderboardPlayer } from "./FinalLeaderboard";

interface GameEndProps {
  finalLeaderboardData?: FinalLeaderboardPlayer[];
}

export default function GameEnd({ finalLeaderboardData = [] }: GameEndProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-emerald-900 p-8 text-white">
      {finalLeaderboardData.length > 0 ? (
        <div className="w-full max-w-5xl">
          <FinalLeaderboard players={finalLeaderboardData} />
          <div className="mt-8 flex justify-center">
            <a
              href="/"
              className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
            >
              Back to Home
            </a>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mb-6 text-3xl font-bold">Game Over!</h1>
          <p className="mb-8 text-xl">Thanks for playing!</p>
          <a
            href="/"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Back to Home
          </a>
        </>
      )}
    </div>
  );
}
