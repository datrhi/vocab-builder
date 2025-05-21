export interface FinalLeaderboardPlayer {
  id: string;
  username: string;
  score: number;
  avatar?: string;
  isHost?: boolean;
  totalCorrect: number;
  totalIncorrect: number;
  accuracy: string;
}

interface FinalLeaderboardProps {
  players: FinalLeaderboardPlayer[];
  className?: string;
}

export const FinalLeaderboard = ({
  players,
  className = "",
}: FinalLeaderboardProps) => {
  // Sort players by score in descending order
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Get top 3 players for podium display
  const topPlayers = sortedPlayers.slice(0, 3);
  const remainingPlayers = sortedPlayers.slice(3);

  // Arrange podium with winner in center, 2nd place on left, 3rd place on right
  const podiumArrangement = [
    topPlayers[1] || null, // 2nd place
    topPlayers[0] || null, // 1st place
    topPlayers[2] || null, // 3rd place
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <h1 className="text-3xl font-bold text-center text-white bg-indigo-600 py-4 rounded-lg shadow-lg mb-24">
        Final Results
      </h1>

      {sortedPlayers.length === 0 ? (
        <p className="text-gray-500 text-center">No players in this game</p>
      ) : (
        <>
          {/* Podium for top 3 players */}
          <div className="flex justify-center items-end space-x-4 mb-8">
            {podiumArrangement.map((player, index) => {
              if (!player)
                return <div key={`empty-${index}`} className="w-1/3" />;

              const position = index === 0 ? 2 : index === 1 ? 1 : 3;
              const podiumHeight =
                index === 0 ? "h-60" : index === 1 ? "h-72" : "h-52";
              const bgColor =
                index === 0
                  ? "bg-sky-400"
                  : index === 1
                  ? "bg-amber-400"
                  : "bg-fuchsia-400";

              return (
                <div
                  key={player.id}
                  className={`relative w-1/3 ${podiumHeight} rounded-t-lg ${bgColor} flex flex-col items-center justify-between pb-4 shadow-lg`}
                >
                  <div className="absolute -top-14">
                    <div className="text-center">
                      <div className="mb-2">
                        <span className="text-lg font-bold text-white">
                          {player.username}
                        </span>
                      </div>

                      {/* Avatar with crown for 1st place */}
                      <div className="relative inline-block">
                        {position === 1 && (
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-3xl">
                            👑
                          </div>
                        )}
                        <div className="relative h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-white shadow-md mx-auto">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={`${player.username}'s avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-amber-100 text-3xl font-bold text-amber-800">
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-24 flex flex-col items-center">
                    <span className="text-5xl font-bold text-white">
                      {position}
                    </span>
                    <span className="text-xl font-bold mt-2">
                      {player.score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table for all players with detailed stats */}
          <div className="overflow-hidden rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-indigo-600 text-white text-left">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Total Correct</th>
                  <th className="py-3 px-4">Total Incorrect</th>
                  <th className="py-3 px-4">Overall Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedPlayers.map((player, index) => (
                  <tr
                    key={player.id}
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-3 px-4 font-bold">
                      {index === 0 && (
                        <span className="text-amber-500">⭐</span>
                      )}{" "}
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 mr-3">
                          {player.avatar ? (
                            <img
                              src={player.avatar}
                              alt={`${player.username}'s avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-amber-100 text-xl font-bold text-amber-800">
                              {player.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-indigo-600">
                            {player.username}
                          </div>
                          {player.isHost && (
                            <div className="text-xs text-red-600 font-semibold">
                              HOST
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-indigo-600">
                      {player.score}
                    </td>
                    <td className="py-3 px-4 text-green-600 font-medium">
                      {player.totalCorrect}
                    </td>
                    <td className="py-3 px-4 text-red-600 font-medium">
                      {player.totalIncorrect}
                    </td>
                    <td className="py-3 px-4 font-medium text-indigo-600">
                      {player.accuracy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
