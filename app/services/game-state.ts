import { useBeforeUnload, useOutletContext } from "@remix-run/react";
import { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { LeaderboardPlayer } from "~/components/Leaderboard";
import { useSoundEffects } from "~/components/sound-effects";
import {
  TIME_TO_SHOW_CORRECT_ANSWER,
  TIME_TO_SHOW_LEADERBOARD,
  TIME_TO_SHOW_NEXT_QUESTION,
} from "~/constants/game";
import type { Database } from "../../types/supabase";

export type GameStatus = "waiting" | "in-progress" | "completed";

export type GameEvent = {
  type:
    | "player-joined"
    | "player-left"
    | "game-start"
    | "game-end"
    | "new-answer"
    | "next-question"
    | "show-leaderboard"
    | "show-correct-answer"
    | "show-final-leaderboard";
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
  wordData: {
    scrambleWord: string;
    answer: string;
    definition: string;
    image: string;
    wordIndex: number;
    id: string;
  };
  isShowLeaderboard: boolean;
  isShowCorrectAnswer: boolean;
  isFinalLeaderboard: boolean;
  leaderboard: LeaderboardPlayer[];
};

export const useGameState = (
  room: Database["public"]["Tables"]["quiz_rooms"]["Row"],
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
    wordData: {
      scrambleWord: "",
      answer: "",
      definition: "",
      image: "",
      wordIndex: -1,
      id: "",
    },
    isShowLeaderboard: false,
    isShowCorrectAnswer: false,
    isFinalLeaderboard: false,
    leaderboard: [],
  });

  const { play } = useSoundEffects();

  const isHost = room.created_by === userId;
  // Handle when user leaves the page (before unload event)
  const roomId = room.id;

  const { supabase } = useOutletContext<{
    supabase: SupabaseClient<Database>;
  }>();
  console.log("gameState", gameState);
  useBeforeUnload(
    useCallback(() => {
      console.log("User leaving room (before unload):", roomId);
      supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "player_left",
        payload: {
          userId,
        },
      });
    }, [roomId, userId, supabase])
  );

  const finalLeaderboard = useMemo(() => {
    return gameState.leaderboard.map((player) => {
      const playerAnswers = gameState.answers.filter(
        (answer) => answer.participant_id === player.id
      );
      const totalCorrect = playerAnswers.filter(
        (answer) => answer.is_correct
      ).length;
      const totalIncorrect = playerAnswers.length - totalCorrect;
      const accuracy =
        playerAnswers.length > 0
          ? Math.round((totalCorrect / playerAnswers.length) * 100)
          : 0;

      return {
        ...player,
        totalCorrect,
        totalIncorrect,
        accuracy: `${accuracy}%`,
      };
    });
  }, [gameState.answers, gameState.leaderboard]);

  const canAnswer = useMemo(() => {
    const participantId = gameState.participants.find(
      (p) => p.user_id === userId
    )?.id;
    const isAnswerCorrect = gameState.answers.find(
      (answer) =>
        answer.participant_id === participantId &&
        answer.is_correct &&
        answer.room_word_id == gameState.wordData.id
    );

    return isAnswerCorrect === undefined;
  }, [
    gameState.answers,
    userId,
    gameState.participants,
    gameState.wordData.id,
  ]);

  const incorrectAnswers = useMemo(() => {
    return gameState.answers
      .filter(
        (answer) =>
          answer.is_correct === false &&
          answer.room_word_id === gameState.wordData.id
      )
      .map((answer) => {
        return {
          answer: answer.answer_text || "",
        };
      });
  }, [gameState.answers, gameState.wordData.id]);

  const correctedUsers = useMemo(() => {
    return gameState.answers
      .filter(
        (answer) =>
          answer.is_correct === true &&
          answer.room_word_id === gameState.wordData.id
      )
      .map((answer) => {
        const participant = gameState.participants.find(
          (p) => p.id === answer.participant_id
        );
        if (!participant) return { id: "", name: "", avatarUrl: "" };
        return {
          id: participant.id,
          name: participant.display_name,
          avatarUrl: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${participant.display_name}`,
        };
      })
      .filter((user) => user.id.length > 0);
  }, [gameState.answers, gameState.participants, gameState.wordData.id]);

  const scrambleWord = (word: string) => {
    let scrambledWord = word
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("/");
    while (scrambledWord === word.split("").join("/")) {
      scrambledWord = word
        .split("")
        .sort(() => Math.random() - 0.5)
        .join("/");
    }
    return scrambledWord;
  };

  useEffect(() => {
    if (gameState.participants.length > 0) {
      // check if everyone has answered correct current word -> call next question
      const isEveryoneAnsweredCorrectly =
        gameState.answers.filter(
          (answer) =>
            answer.is_correct && answer.room_word_id === gameState.wordData.id
        ).length === gameState.participants.length;

      if (isEveryoneAnsweredCorrectly) {
        setTimeout(() => {
          showCorrectAnswer();
        }, TIME_TO_SHOW_CORRECT_ANSWER);
      }
    }
  }, [gameState.participants, gameState.answers, gameState.wordData]);

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
          console.log("payload on answers channel", payload);
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
      .on("broadcast", { event: "game_start" }, async (payload) => {
        console.log("payload on game start channel", payload);
        const nextWord = roomWords[0];
        if (isHost) {
          const imagePublicUrl = await getImagePublicUrl(
            nextWord.word.image_storage_path
          );
          supabase.channel(`game:${roomId}`).send({
            type: "broadcast",
            event: "next_question",
            payload: {
              wordData: {
                scrambleWord: scrambleWord(nextWord.word.word),
                answer: nextWord.word.word,
                definition: nextWord.word.definition,
                image: imagePublicUrl,
                wordIndex: 0,
                id: nextWord.id,
              },
            },
          });
        }
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
        console.log("payload on game end channel", payload);
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
        console.log("payload on next question channel", payload);
        setGameState((prev) => ({
          ...prev,
          wordData: payload.payload.wordData as GameState["wordData"],
          isShowLeaderboard: false,
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
      .on("broadcast", { event: "show_correct_answer" }, (payload) => {
        console.log("payload on show correct answer channel", payload);
        setGameState((prev) => ({
          ...prev,
          isShowCorrectAnswer: true,
          events: [
            ...prev.events,
            {
              type: "show-correct-answer",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .on("broadcast", { event: "show_leaderboard" }, (payload) => {
        console.log("payload on show leaderboard channel", payload);
        setGameState((prev) => ({
          ...prev,
          isShowLeaderboard: true,
          isShowCorrectAnswer: false,
          leaderboard: payload.payload.leaderboard as LeaderboardPlayer[],
          events: [
            ...prev.events,
            {
              type: "show-leaderboard",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .on("broadcast", { event: "show_final_leaderboard" }, (payload) => {
        console.log("payload on show final leaderboard channel", payload);
        setGameState((prev) => ({
          ...prev,
          isFinalLeaderboard: true,
          events: [
            ...prev.events,
            {
              type: "show-final-leaderboard",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .on("broadcast", { event: "player_left" }, (payload) => {
        console.log("payload on player left channel", payload);
        setGameState((prev) => ({
          ...prev,
          participants: prev.participants.filter(
            (p) => p.user_id !== payload.payload.userId
          ),
          events: [
            ...prev.events,
            {
              type: "player-left",
              data: payload as Record<string, unknown>,
              timestamp: new Date().toISOString(),
            },
          ],
        }));
      })
      .on("broadcast", { event: "player_joined" }, (payload) => {
        console.log("payload on player joined channel", payload);
        play("answerRecieved1");
        setGameState((prev) => ({
          ...prev,
          participants: [
            ...prev.participants.filter(
              (p) => p.user_id !== payload.payload.player.user_id
            ),
            payload.payload
              .player as Database["public"]["Tables"]["quiz_participants"]["Row"],
          ],
          events: [
            ...prev.events,
            {
              type: "player-joined",
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
  }, [roomId, supabase, isHost, roomWords]);

  // Helper function to start the game
  const startGame = async () => {
    try {
      if (!isHost) return;
      // Broadcast game start event to all participants
      const data = await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "game_start",
        payload: {
          started_by: supabase.auth.getUser(),
          started_at: new Date().toISOString(),
        },
      });
      if (data === "ok") {
        return true;
      }
      throw new Error(`Error starting game: ${data}`);
    } catch (error) {
      console.error("Error starting game:", error);
      toast.error(
        `Error starting game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  // Helper function to end the game
  const endGame = async () => {
    try {
      if (!isHost) return;
      // Broadcast game end event to all participants
      const data = await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "game_end",
        payload: {
          ended_at: new Date().toISOString(),
        },
      });
      if (data === "ok") {
        return true;
      }
      throw new Error(`Error ending game: ${data}`);
    } catch (error) {
      console.error("Error ending game:", error);
      toast.error(
        `Error ending game: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
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
      console.log("submitAnswer", answerText, isCorrect, score, timeTakenMs);
      const participantId = gameState.participants.find(
        (p) => p.user_id === userId
      )?.id;

      if (!participantId) {
        throw new Error("Participant not found");
      }
      if (isCorrect) {
        play("correctTypedAnswer");
      } else {
        // create a random number between 1 and 14
        const randomNumber = Math.floor(Math.random() * 14) + 1;
        play(`wrongAnswer${randomNumber}`);
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
      return true;
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error(
        `Error submitting answer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const joinRoom = async (displayName: string) => {
    try {
      // check if user is already in the room, if exists, update the display name
      const { data: existingParticipant, error: existingParticipantError } =
        await supabase
          .from("quiz_participants")
          .select("*")
          .eq("user_id", userId)
          .eq("room_id", roomId);
      if (existingParticipantError) throw existingParticipantError;

      if (existingParticipant.length > 0) {
        const { error: updateError } = await supabase
          .from("quiz_participants")
          .update({ display_name: displayName })
          .eq("id", existingParticipant[0].id);
        if (updateError) throw updateError;
        await supabase.channel(`game:${roomId}`).send({
          type: "broadcast",
          event: "player_joined",
          payload: {
            player: {
              ...existingParticipant[0],
              display_name: displayName,
            },
          },
        });
      } else {
        const { error, data } = await supabase
          .from("quiz_participants")
          .insert({
            display_name: displayName,
            room_id: roomId,
            user_id: userId,
          })
          .select();

        if (error) throw error;
        await supabase.channel(`game:${roomId}`).send({
          type: "broadcast",
          event: "player_joined",
          payload: {
            player: data[0],
          },
        });
      }
      return true;
    } catch (error) {
      console.error("Error joining room:", error, roomId, userId, displayName);
      toast.error(
        `Error joining room: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const getImagePublicUrl = async (imagePath: string) => {
    try {
      const { data: publicUrlData } = await supabase.storage
        .from("word-images")
        .getPublicUrl(imagePath);
      if (!publicUrlData) throw new Error("Can't get image");

      return publicUrlData.publicUrl;
    } catch (error) {
      console.error("Error getting image public url:", error);
      toast.error(
        `Error loading image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const nextQuestion = async () => {
    try {
      if (!isHost) return;

      const nextWordIndex = gameState.wordData.wordIndex + 1;

      if (nextWordIndex >= roomWords.length) {
        await showFinalLeaderboard();
        endGame();
        return;
      }

      const nextWord = roomWords[nextWordIndex];
      const imagePublicUrl = await getImagePublicUrl(
        nextWord.word.image_storage_path
      );
      const data = await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "next_question",
        payload: {
          wordData: {
            scrambleWord: scrambleWord(nextWord.word.word),
            answer: nextWord.word.word,
            definition: nextWord.word.definition,
            image: imagePublicUrl,
            wordIndex: nextWordIndex,
            id: nextWord.id,
          },
        },
      });
      if (data === "ok") {
        return true;
      }
      throw new Error(`Error next question: ${data}`);
    } catch (error) {
      console.error("Error next question:", error);
      toast.error(
        `Error loading next question: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const showCorrectAnswer = async () => {
    try {
      if (!isHost) return;
      const data = await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "show_correct_answer",
        payload: {
          started_at: new Date().toISOString(),
        },
      });
      if (data === "ok") {
        setTimeout(() => {
          showLeaderboard();
        }, TIME_TO_SHOW_LEADERBOARD);
        return true;
      }
      throw new Error(`Error showing correct answer: ${data}`);
    } catch (error) {
      console.error("Error showing correct answer:", error);
      toast.error(
        `Error showing correct answer: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const showLeaderboard = async () => {
    try {
      if (!isHost) return;
      const leaderboard = gameState.participants.map((participant) => {
        const score = gameState.answers.reduce((acc, answer) => {
          if (answer.participant_id === participant.id) {
            return acc + (answer.score || 0);
          }
          return acc;
        }, 0);
        return {
          id: participant.id,
          username: participant.display_name,
          score: score,
          avatar: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${participant.display_name}`,
          isHost: participant.user_id === room.created_by,
        };
      });
      const data = await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "show_leaderboard",
        payload: {
          started_at: new Date().toISOString(),
          leaderboard,
        },
      });
      if (data === "ok") {
        setTimeout(() => {
          nextQuestion();
        }, TIME_TO_SHOW_NEXT_QUESTION);
        return true;
      }
      throw new Error(`Error showing leaderboard: ${data}`);
    } catch (error) {
      console.error("Error showing leaderboard:", error);
      toast.error(
        `Error showing leaderboard: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  const showFinalLeaderboard = async () => {
    try {
      if (!isHost) return;
      const data = await supabase.channel(`game:${roomId}`).send({
        type: "broadcast",
        event: "show_final_leaderboard",
        payload: {
          ended_at: new Date().toISOString(),
        },
      });

      if (data === "ok") {
        return true;
      }
      throw new Error(`Error showing final leaderboard: ${data}`);
    } catch (error) {
      console.error("Error showing final leaderboard:", error);
      toast.error(
        `Error showing final leaderboard: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      return false;
    }
  };

  return {
    gameState,
    canAnswer,
    finalLeaderboard,
    isHost,
    incorrectAnswers,
    correctedUsers,
    startGame,
    endGame,
    submitAnswer,
    joinRoom,
    nextQuestion,
    showLeaderboard,
    showCorrectAnswer,
    showFinalLeaderboard,
  };
};
