import { sfxData } from "~/data/sound-data";

// Define the sprite data structure
export interface SoundSprite {
  [soundName: string]: [number, number, boolean];
}

export interface SoundData {
  sprite: SoundSprite;
}

// SoundManager class for handling audio sprites
export class SoundManager {
  private audio: HTMLAudioElement | null = null;
  private sprites: SoundSprite = {};
  private currentSprite: string | null = null;
  private timeoutId: number | null = null;
  private isLoaded: boolean = false;
  private static instance: SoundManager | null = null;

  // Make constructor private to enforce singleton pattern
  private constructor(audioSrc: string, spriteData: SoundData) {
    this.sprites = spriteData.sprite;

    if (typeof window !== "undefined") {
      this.audio = new Audio(audioSrc);
      this.audio.preload = "auto";

      // Add loaded event listener
      this.audio.addEventListener("canplaythrough", () => {
        this.isLoaded = true;
      });

      // Handle load error
      this.audio.addEventListener("error", (e) => {
        console.error("Error loading audio file:", e);
      });
    }
  }

  // Static method to get the singleton instance
  public static getInstance(): SoundManager {
    console.log("Getting instance of SoundManager", SoundManager.instance);
    if (!SoundManager.instance) {
      console.log("Creating new instance of SoundManager");
      // Only create the instance on the client side
      SoundManager.instance = new SoundManager("/audio/sfx.mp3", sfxData);
    }
    return SoundManager.instance;
  }

  play(spriteName: string, onEnd?: () => void): void {
    if (!this.audio) {
      console.warn("Audio element not created");
      return;
    }

    if (!this.sprites[spriteName]) {
      console.warn(`Sprite "${spriteName}" not found`);
      return;
    }

    // If not loaded yet, attempt to load and then play
    if (!this.isLoaded) {
      console.log("Audio not fully loaded, attempting to play anyway");
      // Add a one-time event listener to play the sound once loaded
      const loadHandler = () => {
        this.audio?.removeEventListener("canplaythrough", loadHandler);
        this.playSprite(spriteName, onEnd);
      };

      this.audio.addEventListener("canplaythrough", loadHandler);
      return;
    }

    this.playSprite(spriteName, onEnd);
  }

  // Internal method to actually play the sprite
  private playSprite(spriteName: string, onEnd?: () => void): void {
    if (!this.audio) return;

    // Stop any currently playing sound
    this.stop();

    // Set the current sprite
    this.currentSprite = spriteName;
    console.log("Playing sprite:", spriteName);

    // Get sprite data [start, duration, loop]
    const [start, duration, loop] = this.sprites[spriteName];

    // Convert milliseconds to seconds
    const startTime = start / 1000;
    const durationTime = duration / 1000;

    // Set audio position
    this.audio.currentTime = startTime;

    // Play the audio
    const playPromise = this.audio.play();

    // Handle the play promise
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Set a timeout to stop the audio after the sprite duration
          this.timeoutId = window.setTimeout(() => {
            if (!loop) {
              this.audio?.pause();
              if (onEnd) onEnd();
            } else {
              // If looping, replay the sprite
              this.playSprite(spriteName, onEnd);
            }
          }, duration);
        })
        .catch((error) => {
          console.error("Audio playback failed:", error);
        });
    }
  }

  stop(): void {
    if (!this.audio) return;

    this.audio.pause();

    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.currentSprite = null;
  }

  isPlaying(spriteName?: string): boolean {
    if (!this.audio) return false;

    if (spriteName) {
      return !this.audio.paused && this.currentSprite === spriteName;
    }

    return !this.audio.paused;
  }

  isInitialized(): boolean {
    return this.isLoaded;
  }
}

// Export the singleton instance
export const soundManager = SoundManager.getInstance();
