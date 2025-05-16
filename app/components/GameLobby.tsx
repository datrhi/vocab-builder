import { Copy, User } from "lucide-react";
import { useState } from "react";
import type { Database } from "../../types/supabase";

type Participant = Database["public"]["Tables"]["quiz_participants"]["Row"];

interface GameLobbyProps {
  pin: string;
  quizTitle: string;
  quizThumbnail: string;
  onStartGame: () => void;
  participants: Participant[];
  roomCreatedBy: string;
  onJoinRoom?: (displayName: string) => Promise<boolean>;
  isHost: boolean;
}

export default function GameLobby({
  pin,
  quizTitle,
  quizThumbnail,
  participants,
  roomCreatedBy,
  onStartGame,
  onJoinRoom = () => Promise.resolve(true),
}: GameLobbyProps) {
  const [displayName, setDisplayName] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  const handleJoinRoom = async () => {
    if (!displayName.trim()) return;

    const success = await onJoinRoom(displayName);
    if (!success) return;

    setIsJoined(true);
  };

  const [settings, setSettings] = useState({
    teamMode: false,
    hideLeaderboard: false,
    hideCountryFlags: false,
    noYoutubeMedia: false,
    muteSound: false,
    optimizePerformance: false,
  });

  const toggleSetting = (setting: keyof typeof settings) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  const copyPinToClipboard = () => {
    navigator.clipboard.writeText(pin);
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-emerald-900 lg:grid-cols-5">
      <div className="col-span-3 flex flex-col items-center justify-center p-8">
        <div className="mb-8 w-full max-w-md rounded-2xl bg-emerald-950/50 p-6 text-center text-white">
          <div className="mb-6 flex flex-col items-center">
            <h3 className="mb-2 text-sm">PIN code:</h3>
            <div className="text-6xl font-bold tracking-wider text-yellow-200">
              {pin.slice(0, 3)} {pin.slice(3)}
            </div>
            <button
              className="mt-2 flex items-center justify-center gap-1 rounded-full bg-emerald-800/50 px-3 py-1 text-sm hover:bg-emerald-800"
              onClick={copyPinToClipboard}
            >
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>

        {!isJoined ? (
          <div className="mb-8 w-full max-w-md">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleJoinRoom();
                }
              }}
              placeholder="Enter your display name"
              className="mb-3 w-full rounded-lg border-0 px-4 py-2 text-center"
            />
            <button
              className="w-full rounded-lg bg-emerald-600 py-2 font-semibold text-white hover:bg-emerald-700"
              onClick={handleJoinRoom}
            >
              Join Game
            </button>
          </div>
        ) : (
          <div className="text-center text-lg font-semibold text-white/90">
            <div className="mb-2 flex items-center justify-center gap-2">
              <User size={20} />
              <span>Players ({participants.length})</span>
            </div>
            <div className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-3">
              {participants.map((participant) => (
                <div
                  className="rounded-lg bg-emerald-950/50 p-2 gap-2 text-center text-sm flex items-center"
                  key={participant.id}
                >
                  {/* Avatar */}
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-amber-500 bg-white">
                    <img
                      src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${participant.display_name}`}
                      alt={`${participant.display_name}'s avatar`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Username and host badge */}
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      {participant.display_name}
                    </span>
                    {participant.user_id === roomCreatedBy && (
                      <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 border border-red-600">
                        HOST
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {/* {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-lg bg-emerald-950/50 p-2 gap-2 text-center text-sm flex items-center"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${participant.display_name}`}
                    alt={`${participant.display_name}'s avatar`}
                    className="w-10 h-10 mb-1 rounded-full"
                  />
                  {participant.display_name}
                </div>
              ))} */}
            </div>
            {isHost ? (
              <button
                className="mt-6 w-full max-w-xs rounded-full bg-lime-300 py-3 font-bold text-emerald-900 transition-all hover:bg-lime-400"
                onClick={onStartGame}
              >
                Start game
              </button>
            ) : (
              <button
                className="mt-6 w-full max-w-xs rounded-full bg-lime-300 py-3 font-bold text-emerald-900 transition-all hover:bg-lime-400"
                disabled
              >
                Waiting for host to start game
              </button>
            )}
          </div>
        )}
      </div>

      <div className="col-span-2 flex flex-col bg-emerald-950/30 p-8">
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src={quizThumbnail}
            alt="Quiz thumbnail"
            className="h-40 w-full object-cover"
          />
        </div>

        <h2 className="text-xl font-bold text-white">{quizTitle}</h2>
        <p className="mb-2 text-sm text-white/80">10 questions</p>

        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Sound</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm text-white/80">Music</span>
              <div className="ml-auto w-36 rounded-full bg-white/20 p-1">
                <div className="h-1 w-1/2 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-white/80">YouTube</span>
              <div className="ml-auto w-36 rounded-full bg-white/20 p-1">
                <div className="h-1 w-3/4 rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-white/80">Voice</span>
              <div className="ml-auto w-36 rounded-full bg-white/20 p-1">
                <div className="h-1 w-full rounded-full bg-white"></div>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-white/80">Effects</span>
              <div className="ml-auto w-36 rounded-full bg-white/20 p-1">
                <div className="h-1 w-2/3 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Gameplay</h3>
          <div className="space-y-2">
            {Object.entries(settings).map(([key, value]) => (
              <div key={key} className="flex items-center">
                <label className="flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() => toggleSetting(key as keyof typeof settings)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  <span className="ml-2 text-sm text-white/80">
                    {key === "teamMode" && "Team mode"}
                    {key === "hideLeaderboard" && "Hide leaderboard"}
                    {key === "hideCountryFlags" && "Hide country flags"}
                    {key === "noYoutubeMedia" && "No YouTube media"}
                    {key === "muteSound" && "Mute sound on players' devices"}
                    {key === "optimizePerformance" && "Optimize performance"}
                  </span>
                </label>
                {key === "teamMode" && (
                  <span className="ml-2 rounded bg-pink-500 px-1.5 py-0.5 text-xs font-medium text-white">
                    NEW
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-lg font-semibold text-white">Safety</h3>
          <div className="space-y-2">
            <div className="flex items-center">
              <label className="flex cursor-pointer items-center">
                <input type="checkbox" className="h-4 w-4 accent-emerald-500" />
                <span className="ml-2 text-sm text-white/80">
                  Moderate nickname words
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
