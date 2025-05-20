import { createContext, ReactNode, useContext } from "react";
import { sfxData } from "~/data/sound-data";
import { soundManager } from "~/utils/sound-manager";

// Create a context for sound effects
type SoundEffectsContextType = {
  playSound: (name: string, onEnd?: () => void) => void;
  stopSound: () => void;
  isPlaying: (name?: string) => boolean;
};

const SoundEffectsContext = createContext<SoundEffectsContextType | null>(null);

// Keys of the sfx sprite data to create type safety
export type SoundEffectName = keyof typeof sfxData.sprite;

export function SoundEffectsProvider({ children }: { children: ReactNode }) {
  // Set context ready when sound manager is ready

  const playSound = (name: string, onEnd?: () => void) => {
    if (soundManager && name in sfxData.sprite) {
      soundManager.play(name, onEnd);
    } else if (!soundManager) {
      console.warn("Sound manager not initialized");
    }
  };

  const stopSound = () => {
    if (soundManager) {
      soundManager.stop();
    }
  };

  const isPlaying = (name?: string) => {
    if (!soundManager) return false;
    return soundManager.isPlaying(name);
  };

  return (
    <SoundEffectsContext.Provider value={{ playSound, stopSound, isPlaying }}>
      {children}
    </SoundEffectsContext.Provider>
  );
}

// Custom hook to use sound effects
export function useSoundEffects() {
  const context = useContext(SoundEffectsContext);

  if (!context) {
    throw new Error(
      "useSoundEffects must be used within a SoundEffectsProvider"
    );
  }

  return {
    // Type-safe play function
    play: (name: SoundEffectName, onEnd?: () => void) => {
      context.playSound(String(name), onEnd);
    },

    stop: context.stopSound,

    isPlaying: (name?: SoundEffectName) => {
      return context.isPlaying(name ? String(name) : undefined);
    },
  };
}

// Example button component that plays a sound when clicked
export function SoundButton({
  sound,
  children,
  className = "",
  onClick,
  disabled = false,
}: {
  sound: SoundEffectName;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { play } = useSoundEffects();

  const handleClick = () => {
    play(sound);
    if (onClick) onClick();
  };

  return (
    <button
      className={`rounded px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
