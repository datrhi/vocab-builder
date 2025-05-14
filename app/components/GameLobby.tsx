import { Copy, User } from "lucide-react";
import { useState } from "react";

interface GameLobbyProps {
  pin: string;
  quizTitle: string;
  onStartGame: () => void;
}

export default function GameLobby({
  pin,
  quizTitle,
  onStartGame,
}: GameLobbyProps) {
  const [players, setPlayers] = useState<string[]>([]);
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

  return (
    <div className="grid min-h-screen grid-cols-1 bg-emerald-900 lg:grid-cols-5">
      <div className="col-span-3 flex flex-col items-center justify-center p-8">
        <div className="mb-8 w-full max-w-md rounded-2xl bg-emerald-950/50 p-6 text-center text-white">
          <h2 className="mb-4 text-xl font-bold">Join at:</h2>
          <div className="mb-2 flex items-center justify-center">
            <div className="text-4xl font-bold">
              <span className="mr-4">Quiz.com</span>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="mb-2 text-sm">PIN code:</h3>
            <div className="text-6xl font-bold tracking-wider text-yellow-200">
              {pin.slice(0, 3)} {pin.slice(3)}
            </div>
            <button className="mt-2 flex items-center justify-center gap-1 rounded-full bg-emerald-800/50 px-3 py-1 text-sm hover:bg-emerald-800">
              <Copy size={14} /> Copy
            </button>
          </div>
          <div className="mb-2 flex justify-center">
            <div className="h-36 w-36 rounded-lg bg-white p-2">
              {/* This would be a QR code in a real app */}
              <div className="h-full w-full rounded bg-gray-200"></div>
            </div>
          </div>
        </div>

        <div className="text-center text-lg font-semibold text-white/90">
          <div className="mb-2 flex items-center justify-center gap-2">
            <User size={20} />
            <span>Waiting for players</span>
          </div>
          <button
            className="mt-6 w-full max-w-xs rounded-full bg-lime-300 py-3 font-bold text-emerald-900 transition-all hover:bg-lime-400"
            onClick={onStartGame}
          >
            Start game
          </button>
        </div>
      </div>

      <div className="col-span-2 flex flex-col bg-emerald-950/30 p-8">
        <div className="mb-6 overflow-hidden rounded-xl">
          <img
            src="https://images.pexels.com/photos/261763/pexels-photo-261763.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
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
