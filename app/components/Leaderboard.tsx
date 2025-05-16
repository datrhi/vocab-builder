import { LeaderboardItem } from "./LeaderboardItem";

export interface LeaderboardPlayer {
  id: string;
  username: string;
  score: number;
  avatar?: string;
  isHost?: boolean;
}

interface LeaderboardProps {
  players: LeaderboardPlayer[];
  className?: string;
}

export const Leaderboard = ({ players, className = "" }: LeaderboardProps) => {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={`space-y-3 ${className}`}>
      <h2 className="text-xl font-bold text-white">Leaderboard</h2>

      {sortedPlayers.length === 0 ? (
        <p className="text-gray-500">No players yet</p>
      ) : (
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <LeaderboardItem
              key={player.id}
              rank={index + 1}
              username={player.username}
              score={player.score}
              avatar={player.avatar}
              isHost={player.isHost}
            />
          ))}
        </div>
      )}
    </div>
  );
};
