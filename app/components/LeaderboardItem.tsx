interface LeaderboardItemProps {
  rank: number;
  username: string;
  score: number;
  avatar?: string;
  isHost?: boolean;
}

export const LeaderboardItem = ({
  rank,
  username,
  score,
  avatar,
  isHost = false,
}: LeaderboardItemProps) => {
  // Format score with spaces for thousands
  const formattedScore = score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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

      {/* Score */}
      <div className="font-bold">{formattedScore}</div>
    </div>
  );
};
