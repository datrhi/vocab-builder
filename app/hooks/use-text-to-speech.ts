import { useCallback, useEffect, useState } from "react";

export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    // Check if the browser supports speech synthesis
    const isSupported =
      typeof window !== "undefined" && "speechSynthesis" in window;
    setSupported(isSupported);

    if (isSupported) {
      // Handle initial voice loading
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
          setVoices(availableVoices);
        }
      };

      // Load voices immediately if available
      loadVoices();

      // Also handle the voiceschanged event
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, []);

  const getPreferredVoice = useCallback(() => {
    if (voices.length === 0) return null;

    // Priority list:
    // 1. High quality US or UK English voices
    // 2. Any English voice
    // 3. Default voice

    // Try to find premium US/UK voice first
    const premiumEnglishVoice = voices.find(
      (voice) =>
        (voice.lang === "en-US" || voice.lang === "en-GB") &&
        !voice.localService &&
        voice.name.includes("Google") // Google voices are typically high quality
    );

    if (premiumEnglishVoice) return premiumEnglishVoice;

    // Next try any English voice (prefer US)
    const usEnglishVoice = voices.find((voice) => voice.lang === "en-US");
    if (usEnglishVoice) return usEnglishVoice;

    // Next try UK English
    const ukEnglishVoice = voices.find((voice) => voice.lang === "en-GB");
    if (ukEnglishVoice) return ukEnglishVoice;

    // Fallback to any English voice
    const anyEnglishVoice = voices.find((voice) => voice.lang.startsWith("en"));
    if (anyEnglishVoice) return anyEnglishVoice;

    // Last resort: just use the default voice
    return null;
  }, [voices]);

  const speak = useCallback(
    (
      text: string,
      {
        onStart,
        onEnd,
        onError,
      }: { onStart?: () => void; onEnd?: () => void; onError?: () => void } = {}
    ) => {
      if (!supported || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      // Set language to English
      utterance.lang = "en-US";

      // Try to use a preferred English voice
      const preferredVoice = getPreferredVoice();
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStart?.();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        onError?.();
      };

      // Set rate slightly slower for definitions
      utterance.rate = 0.9;

      window.speechSynthesis.speak(utterance);
    },
    [supported, getPreferredVoice]
  );

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return {
    speak,
    isSpeaking,
    supported,
    stop,
  };
}
