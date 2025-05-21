import { FinalLeaderboard, FinalLeaderboardPlayer } from "./FinalLeaderboard";

export const FinalLeaderboardDemo = () => {
  // Sample data for demonstration with extended player stats
  const samplePlayers: FinalLeaderboardPlayer[] = [
    {
      id: "1",
      username: "Tom",
      score: 152,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Tom",
      isHost: true,
      totalCorrect: 2,
      totalIncorrect: 2,
      accuracy: "50%",
    },
    {
      id: "2",
      username: "Nathan",
      score: 130,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Nathan",
      totalCorrect: 2,
      totalIncorrect: 2,
      accuracy: "45%",
    },
    {
      id: "3",
      username: "Harry",
      score: 75,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Harry",
      totalCorrect: 1,
      totalIncorrect: 3,
      accuracy: "30%",
    },
    {
      id: "4",
      username: "Jessie",
      score: 10,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Jessie",
      totalCorrect: 0,
      totalIncorrect: 4,
      accuracy: "20%",
    },
  ];

  return (
    <div className="bg-emerald-900 p-8 min-h-screen">
      <div className="mx-auto max-w-6xl">
        <FinalLeaderboard players={samplePlayers} />
      </div>
    </div>
  );
};

export default FinalLeaderboardDemo;
