import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface LeaderboardItemProps {
  rank: number;
  username: string;
  score: number;
  oldScore?: number;
  avatar?: string;
  isHost?: boolean;
}

export const LeaderboardItem = ({
  rank,
  username,
  score,
  oldScore,
  avatar,
  isHost = false,
}: LeaderboardItemProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const pointsAdded = oldScore !== undefined ? score - oldScore : 0;
  const shouldAnimate = oldScore !== undefined && oldScore !== score;

  // Format score with spaces for thousands
  const formatScore = (value: number) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const formattedScore = formatScore(score);
  const formattedOldScore =
    oldScore !== undefined ? formatScore(oldScore) : formattedScore;
  const formattedPointsAdded =
    pointsAdded > 0 ? `+${formatScore(pointsAdded)}` : formatScore(pointsAdded);

  useEffect(() => {
    // Only animate if oldScore is provided and different from score
    if (shouldAnimate) {
      setShowAnimation(true);

      // After animation completes, reset animation state
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [score, oldScore, shouldAnimate]);

  return (
    <div className="flex items-center justify-between rounded-full bg-lime-300 px-4 py-2 shadow-md">
      <div className="flex items-center gap-3">
        {/* Rank number */}
        <div className="flex h-8 w-8 items-center justify-center font-bold">
          {rank}
        </div>

        {/* Avatar */}
        <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-amber-500 bg-white">
          {avatar ? (
            <img
              src={avatar}
              alt={`${username}'s avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-amber-100 text-xl font-bold text-amber-800">
              {username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Username and host badge */}
        <div className="flex items-center gap-2">
          <span className="font-bold">{username}</span>
          {isHost && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 border border-red-600">
              HOST
            </span>
          )}
        </div>
      </div>

      {/* Score with animation */}
      <div className="font-bold relative min-w-[60px] text-right">
        <AnimatePresence>
          {pointsAdded !== 0 ? (
            <motion.div className="flex justify-end items-center">
              {showAnimation && (
                <motion.span
                  key="oldScore"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-gray-600"
                >
                  {formattedOldScore}
                </motion.span>
              )}
              {showAnimation && (
                <motion.span
                  key="points"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className={`ml-2 ${
                    pointsAdded > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formattedPointsAdded}
                </motion.span>
              )}

              <motion.span
                key="newScore"
                initial={{
                  opacity: 0,
                  scale: 0.8,
                  position: "absolute",
                  right: 0,
                }}
                animate={{ opacity: 1, scale: 1.2 }}
                transition={{ duration: 0.3, delay: 2 }}
                className="font-bold text-black absolute right-0"
              >
                {formattedScore}
              </motion.span>
            </motion.div>
          ) : (
            <motion.div
              key="regularScore"
              initial={shouldAnimate ? { scale: 1.2 } : { scale: 1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {formattedScore}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
