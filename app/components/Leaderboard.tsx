import { AnimatePresence, motion } from "framer-motion";
import { LeaderboardItem } from "./LeaderboardItem";

export interface LeaderboardPlayer {
  id: string;
  username: string;
  score: number;
  avatar?: string;
  isHost?: boolean;
}

interface LeaderboardProps {
  players: PlayerWithPreviousScore[];
  className?: string;
}

interface PlayerWithPreviousScore extends LeaderboardPlayer {
  oldScore?: number;
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
          <AnimatePresence initial={false}>
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  delay: index * 0.05,
                }}
                layout
              >
                <LeaderboardItem
                  rank={index + 1}
                  username={player.username}
                  score={player.score}
                  oldScore={player.oldScore}
                  avatar={player.avatar}
                  isHost={player.isHost}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
