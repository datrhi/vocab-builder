import { useEffect, useRef } from "react";

interface AudioPlayerProps {
  audioSrc: string;
  autoPlay?: boolean;
  loop?: boolean;
  volume?: number;
}

export default function AudioPlayer({
  audioSrc,
  autoPlay = false,
  loop = false,
  volume = 0.5,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Load audio when src changes
  useEffect(() => {
    if (audioRef.current) {
      if (autoPlay) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            // Auto-play was prevented
            console.log("Audio playback was prevented:", error);
          });
        }
      }
    }
  }, [audioSrc, autoPlay]);

  return (
    <audio
      ref={audioRef}
      src={audioSrc}
      autoPlay={autoPlay}
      loop={loop}
      className="hidden"
    />
  );
}
