export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      player_answers: {
        Row: {
          answer_text: string | null
          answered_at: string
          id: string
          is_correct: boolean | null
          participant_id: string | null
          room_word_id: string | null
          score: number | null
          time_taken_ms: number | null
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string
          id?: string
          is_correct?: boolean | null
          participant_id?: string | null
          room_word_id?: string | null
          score?: number | null
          time_taken_ms?: number | null
        }
        Update: {
          answer_text?: string | null
          answered_at?: string
          id?: string
          is_correct?: boolean | null
          participant_id?: string | null
          room_word_id?: string | null
          score?: number | null
          time_taken_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_answers_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "quiz_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_answers_room_word_id_fkey"
            columns: ["room_word_id"]
            isOneToOne: false
            referencedRelation: "quiz_room_words"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_participants: {
        Row: {
          display_name: string
          id: string
          joined_at: string
          room_id: string | null
          user_id: string
        }
        Insert: {
          display_name: string
          id?: string
          joined_at?: string
          room_id?: string | null
          user_id: string
        }
        Update: {
          display_name?: string
          id?: string
          joined_at?: string
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_room_words: {
        Row: {
          id: string
          order_index: number
          room_id: string | null
          word_id: string | null
        }
        Insert: {
          id?: string
          order_index: number
          room_id?: string | null
          word_id?: string | null
        }
        Update: {
          id?: string
          order_index?: number
          room_id?: string | null
          word_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_room_words_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_room_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_rooms: {
        Row: {
          category: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          max_players: number | null
          pin_code: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          max_players?: number | null
          pin_code: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          max_players?: number | null
          pin_code?: string
        }
        Relationships: []
      }
      user_word_progress: {
        Row: {
          correct_in_a_row: number | null
          id: string
          last_reviewed_at: string | null
          status: string | null
          total_correct: number | null
          total_incorrect: number | null
          user_id: string
          word_id: string
        }
        Insert: {
          correct_in_a_row?: number | null
          id?: string
          last_reviewed_at?: string | null
          status?: string | null
          total_correct?: number | null
          total_incorrect?: number | null
          user_id: string
          word_id: string
        }
        Update: {
          correct_in_a_row?: number | null
          id?: string
          last_reviewed_at?: string | null
          status?: string | null
          total_correct?: number | null
          total_incorrect?: number | null
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_word_progress_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          category: string | null
          created_at: string
          definition: string | null
          example_sentence: string | null
          id: string
          image_alt_text: string | null
          image_storage_path: string
          part_of_speech_type: string | null
          uploader_id: string | null
          word: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          definition?: string | null
          example_sentence?: string | null
          id?: string
          image_alt_text?: string | null
          image_storage_path: string
          part_of_speech_type?: string | null
          uploader_id?: string | null
          word: string
        }
        Update: {
          category?: string | null
          created_at?: string
          definition?: string | null
          example_sentence?: string | null
          id?: string
          image_alt_text?: string | null
          image_storage_path?: string
          part_of_speech_type?: string | null
          uploader_id?: string | null
          word?: string
        }
        Relationships: []
      }
    }
    Views: {
      room_leaderboards: {
        Row: {
          correct_answers: number | null
          display_name: string | null
          questions_answered: number | null
          room_id: string | null
          total_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "quiz_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      generate_unique_pin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_quiz_stats: {
        Args: { user_id: string }
        Returns: {
          total_rooms_joined: number
          total_words_answered: number
          total_correct_answers: number
          total_points: number
          average_score_per_answer: number
          most_played_category: string
        }[]
      }
      get_valid_categories_for_quiz: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
