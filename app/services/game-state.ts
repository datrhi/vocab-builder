import { useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import type { Database } from "../../types/supabase";

export type GameStatus = "waiting" | "in-progress" | "completed";

export type GameEvent = {
  type:
    | "player-joined"
    | "player-left"
    | "game-start"
    | "game-end"
    | "new-answer"
    | "next-question";
  data: Record<string, unknown>;
  timestamp: string;
};

export type GameState = {
  status: GameStatus;
  currentRound: number;
  totalRounds: number;
  participants: Database["public"]["Tables"]["quiz_participants"]["Row"][];
  answers: Database["public"]["Tables"]["player_answers"]["Row"][];
  events: GameEvent[];
  isHost: boolean;
  wordData: {
    scrambleWord: string;
    answer: string;
    definition: string;
    image: string;
    wordIndex: number;
    id: string;
  };
};

export const useGameState = (
  roomId: string,
  userId: string,
  roomWords: (Database["public"]["Tables"]["quiz_room_words"]["Row"] & {
    word: Database["public"]["Tables"]["words"]["Row"];
  })[],
  initialParticipants: Database["public"]["Tables"]["quiz_participants"]["Row"][]
) => {
  const [gameState, setGameState] = useState<GameState>({
    status: "waiting",
    currentRound: 0,
    totalRounds: 10,
    participants: initialParticipants,
    answers: [],
    events: [],
    isHost: false,
    wordData: {
      scrambleWord: "",
      answer: "",
      definition: "",
      image: "",
      wordIndex: 0,
      id: "",
    },
  });
  console.log("🚀 hieudang log ~ gameState:", gameState);

  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();

  const scrambleWord = (word: string) => {
    return word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  };

  const checkRoomHost = async () => {
    try {
      const { data: room, error: roomError } = await supabase
        .from("quiz_rooms")
        .select("*")
        .eq("id", roomId)
        .single();
      if (roomError) throw roomError;
      if (room?.created_by === userId) {
        setGameState((prev) => ({
          ...prev,
          isHost: true,
        }));
      }
    } catch (error) {
      console.error("Error checking room host:", error);
    }
  };

  useEffect(() => {
    if (!roomId) return;
    checkRoomHost();
  }, [roomId, supabase]);

  // Setup all realtime channel subscriptions
  useEffect(() => {
    if (!roomId) return;
    // Channel for participants (joins/leaves)
    const participantsChannel = supabase
      .channel(`room:${roomId}:participants`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_participants",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            // A new player joined
            setGameState((prev) => ({
              ...prev,
              participants: [
                ...prev.participants,
                payload.new as Database["public"]["Tables"]["quiz_participants"]["Row"],
              ],
              events: [
                ...prev.events,
                {
                  type: "player-joined",
                  data: payload.new as Record<string, unknown>,
                  timestamp: new Date().toISOString(),
                },
              ],
            }));
          } else if (payload.eventType === "DELETE") {
            // A player left
            setGameState((prev) => ({
              ...prev,
              participants: prev.participants.filter(
                (p) => p.id !== payload.old.id
              ),
              events: [
                ...prev.events,
                {
                  type: "player-left",
                  data: payload.old as Record<string, unknown>,
                  timestamp: new Date().toISOString(),
                },
              ],
            }));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(participantsChannel);
    };
  }, [roomId, supabase]);

  useEffect(() => {
    if (!roomId) return;

    // Channel for answers
    const answersChannel = supabase
      .channel(`room:${roomId}:answers`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_answers",
          filter: `participant_id=in.(${gameState.participants
            .map((p) => p.id)
            .join(",")})`,
        },
        (payload) => {
          console.log(
            "🚀 hieudang log ~ .on answers channel~ payload:",
            payload
          );
          setGameState((prev) => ({
            ...prev,
            answers: [
              ...prev.answers,
              payload.new as Database["public"]["Tables"]["player_answers"]["Row"],
            ],
            events: [
              ...prev.events,
              {
                type: "new-answer",
                data: payload.new as Record<string, unknown>,
                timestamp: new Date().toISOString(),
              },
            ],
          }));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(answersChannel);
    };
  }, [roomId, supabase, gameState.participants]);

  useEffect(() => {
    if (!roomId) return;
    // Custom channel for game events
    const gameEventsChannel = supabase
      .channel(`game:${roomId}`)
      .on("broadcast", { event: "game_start" }, (payload) => {
        console.log("🚀 hieudang log ~ .on game start~ payload:", payload);
        const nextWord = roomWords[0];
        gameState.isHost &&
          supabase.channel(`game:${roomId}`).send({
            type: "broadcast",
            event: "next_question",
            payload: {
              wordData: {
                scrambleWord: scrambleWord(nextWord.word.word),
                answer: nextWord.word.word,
                definition: nextWord.word.definition,
                image: nextWord.word.image_storage_path,
                wordIndex: 0,
                id: nextWord.id,
              },
            },
          });
        setGameState((prev) => ({
          ...prev,
          status: "in-progress",
          events: [
            ...prev.events,
            {
              type: "game-start",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .on("broadcast", { event: "game_end" }, (payload) => {
        console.log("🚀 hieudang log ~ .on game end~ payload:", payload);
        setGameState((prev) => ({
          ...prev,
          status: "completed",
          events: [
            ...prev.events,
            {
              type: "game-end",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .on("broadcast", { event: "next_question" }, (payload) => {
        console.log("🚀 hieudang log ~ .on next question~ payload:", payload);
        setGameState((prev) => ({
          ...prev,
          wordData: payload.payload.wordData as GameState["wordData"],
          events: [
            ...prev.events,
            {
              type: "next-question",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .subscribe();

    // Clean up function for when component unmounts
    return () => {
      supabase.removeChannel(gameEventsChannel);
    };
  }, [roomId, supabase, gameState.isHost, roomWords]);

  // Helper function to start the game
  const startGame = async () => {
    try {
      if (!gameState.isHost) return;
      // Broadcast game start event to all participants
      await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "game_start",
        payload: {
          started_by: supabase.auth.getUser(),
          started_at: new Date().toISOString(),
        },
      });

      // // Update local state
      // setGameState((prev) => ({
      //   ...prev,
      //   status: "in-progress",
      // }));
    } catch (error) {
      console.error("Error starting game:", error);
    }
  };

  // Helper function to end the game
  const endGame = async () => {
    try {
      if (!gameState.isHost) return;
      // Broadcast game end event to all participants
      await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "game_end",
        payload: {
          ended_at: new Date().toISOString(),
        },
      });

      // // Update local state
      // setGameState((prev) => ({
      //   ...prev,
      //   status: "completed",
      // }));
    } catch (error) {
      console.error("Error ending game:", error);
    }
  };

  // Helper function to submit an answer
  const submitAnswer = async (
    answerText: string,
    isCorrect: boolean,
    score: number,
    timeTakenMs: number
  ) => {
    try {
      const participantId = gameState.participants.find(
        (p) => p.user_id === userId
      )?.id;

      if (!participantId) {
        throw new Error("Participant not found");
      }

      const roomWordId = gameState.wordData.id;

      const { error } = await supabase.from("player_answers").insert({
        participant_id: participantId,
        room_word_id: roomWordId,
        answer_text: answerText,
        is_correct: isCorrect,
        score: score,
        time_taken_ms: timeTakenMs,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
  };

  const joinRoom = async (displayName: string) => {
    try {
      const { error } = await supabase.from("quiz_participants").insert({
        display_name: displayName,
        room_id: roomId,
        user_id: userId,
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const nextQuestion = async () => {
    try {
      if (!gameState.isHost) return;

      const nextWordIndex = gameState.wordData.wordIndex + 1;

      if (nextWordIndex >= roomWords.length) {
        endGame();
        return;
      }

      const nextWord = roomWords[nextWordIndex];
      await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "next_question",
        payload: {
          wordData: {
            scrambleWord: scrambleWord(nextWord.word.word),
            answer: nextWord.word.word,
            definition: nextWord.word.definition,
            image: nextWord.word.image_storage_path,
            wordIndex: nextWordIndex,
            id: nextWord.id,
          },
        },
      });
    } catch (error) {
      console.error("Error next question:", error);
    }
  };

  return {
    gameState,
    startGame,
    endGame,
    submitAnswer,
    joinRoom,
    nextQuestion,
  };
};
