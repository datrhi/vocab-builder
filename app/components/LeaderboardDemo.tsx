import { Leaderboard, LeaderboardPlayer } from "./Leaderboard";

export const LeaderboardDemo = () => {
  // Sample data for demonstration
  const samplePlayers: LeaderboardPlayer[] = [
    {
      id: "1",
      username: "Hieu",
      score: 1538,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Hieu",
      isHost: true,
    },
    {
      id: "2",
      username: "Alex",
      score: 1245,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Alex",
    },
    {
      id: "3",
      username: "Maya",
      score: 987,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Maya",
    },
    {
      id: "4",
      username: "Sam",
      score: 856,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Sam",
    },
    {
      id: "5",
      username: "Jo",
      score: 723,
      avatar: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Jo",
    },
  ];

  return (
    <div className="mx-auto max-w-lg p-6">
      <Leaderboard players={samplePlayers} />
    </div>
  );
};
