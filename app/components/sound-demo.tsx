import { useState } from "react";
import {
  SoundButton,
  SoundEffectName,
  useSoundEffects,
} from "~/components/sound-effects";
import { sfxData } from "~/data/sound-data";

export function SoundDemo() {
  const { play, stop, isPlaying } = useSoundEffects();
  const [currentSound, setCurrentSound] = useState<SoundEffectName | null>(
    null
  );

  // Get all available sound effect names
  const soundEffects = Object.keys(sfxData.sprite) as SoundEffectName[];

  // Group sounds by category for better organization
  const soundCategories = {
    Answers: soundEffects.filter(
      (s) => String(s).includes("answer") || String(s).includes("Answer")
    ),
    Game: soundEffects.filter(
      (s) =>
        String(s).includes("game") ||
        String(s).includes("timer") ||
        String(s).includes("player")
    ),
    UI: soundEffects.filter(
      (s) =>
        String(s).includes("appear") ||
        String(s).includes("reveal") ||
        String(s).includes("typing") ||
        String(s).includes("hover") ||
        String(s).includes("typewriter")
    ),
    Feedback: soundEffects.filter(
      (s) =>
        String(s).includes("applause") ||
        String(s).includes("confetti") ||
        String(s).includes("top3") ||
        String(s).includes("wrong") ||
        String(s).includes("correct")
    ),
    Other: soundEffects.filter(
      (s) =>
        !String(s).includes("answer") &&
        !String(s).includes("Answer") &&
        !String(s).includes("game") &&
        !String(s).includes("timer") &&
        !String(s).includes("player") &&
        !String(s).includes("appear") &&
        !String(s).includes("reveal") &&
        !String(s).includes("typing") &&
        !String(s).includes("hover") &&
        !String(s).includes("typewriter") &&
        !String(s).includes("applause") &&
        !String(s).includes("confetti") &&
        !String(s).includes("top3") &&
        !String(s).includes("wrong") &&
        !String(s).includes("correct")
    ),
  };

  // Play a sound and track it
  const handlePlaySound = (sound: SoundEffectName) => {
    setCurrentSound(sound);
    play(sound, () => {
      setCurrentSound(null);
    });
  };

  // Stop the current sound
  const handleStopSound = () => {
    stop();
    setCurrentSound(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sound Effects Demo</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Current Playing</h2>
        <div className="p-4 bg-gray-100 rounded-lg min-h-16 flex items-center">
          {currentSound ? (
            <div className="flex items-center gap-4">
              <span className="text-lg">{currentSound}</span>
              <button
                onClick={handleStopSound}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Stop
              </button>
            </div>
          ) : (
            <span className="text-gray-500">No sound playing</span>
          )}
        </div>
      </div>

      {/* Display the sounds by category */}
      {Object.entries(soundCategories).map(([category, sounds]) => (
        <div key={category} className="mb-8">
          <h2 className="text-xl font-semibold mb-3">{category}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sounds.map((sound) => (
              <button
                key={sound}
                onClick={() => handlePlaySound(sound)}
                className={`
                  p-3 rounded-lg text-left truncate
                  ${
                    isPlaying(sound)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 hover:bg-gray-200"
                  }
                `}
              >
                {sound}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Example SoundButton usage */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold mb-3">SoundButton Example</h2>
        <div className="flex flex-wrap gap-2">
          <SoundButton sound="applause">Applause</SoundButton>

          <SoundButton
            sound="correctAnswerReveal"
            className="bg-green-500 hover:bg-green-600"
          >
            Correct Answer
          </SoundButton>

          <SoundButton
            sound="wrongAnswer1"
            className="bg-red-500 hover:bg-red-600"
          >
            Wrong Answer
          </SoundButton>

          <SoundButton
            sound="confetti_poof"
            className="bg-purple-500 hover:bg-purple-600"
          >
            Confetti
          </SoundButton>
        </div>
      </div>
    </div>
  );
}
