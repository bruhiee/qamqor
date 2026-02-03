export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      anonymized_analytics: {
        Row: {
          category: string | null
          count: number | null
          created_at: string
          event_type: string
          id: string
          region: string | null
          rounded_timestamp: string
        }
        Insert: {
          category?: string | null
          count?: number | null
          created_at?: string
          event_type: string
          id?: string
          region?: string | null
          rounded_timestamp: string
        }
        Update: {
          category?: string | null
          count?: number | null
          created_at?: string
          event_type?: string
          id?: string
          region?: string | null
          rounded_timestamp?: string
        }
        Relationships: []
      }
      case_collections: {
        Row: {
          case_ids: string[] | null
          created_at: string
          description: string | null
          doctor_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          case_ids?: string[] | null
          created_at?: string
          description?: string | null
          doctor_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          case_ids?: string[] | null
          created_at?: string
          description?: string | null
          doctor_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          report: Json | null
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          report?: Json | null
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          report?: Json | null
          role?: string
          session_id?: string
        }
        Relationships: []
      }
      chat_sessions: {
        Row: {
          created_at: string
          id: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clinical_cases: {
        Row: {
          age_range: string
          created_at: string
          diagnostic_markers: string[] | null
          doctor_id: string
          duration: string | null
          id: string
          insights: string | null
          is_private: boolean | null
          symptoms: string[]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          age_range: string
          created_at?: string
          diagnostic_markers?: string[] | null
          doctor_id: string
          duration?: string | null
          id?: string
          insights?: string | null
          is_private?: boolean | null
          symptoms?: string[]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          age_range?: string
          created_at?: string
          diagnostic_markers?: string[] | null
          doctor_id?: string
          duration?: string | null
          id?: string
          insights?: string | null
          is_private?: boolean | null
          symptoms?: string[]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      doctor_applications: {
        Row: {
          bio: string | null
          country: string
          created_at: string
          full_name: string
          id: string
          license_document_url: string | null
          license_number: string | null
          region: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          specialization: string
          status: string
          updated_at: string
          user_id: string
          workplace: string | null
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          country: string
          created_at?: string
          full_name: string
          id?: string
          license_document_url?: string | null
          license_number?: string | null
          region?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization: string
          status?: string
          updated_at?: string
          user_id: string
          workplace?: string | null
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          license_document_url?: string | null
          license_number?: string | null
          region?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          specialization?: string
          status?: string
          updated_at?: string
          user_id?: string
          workplace?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_urgent: boolean | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_urgent?: boolean | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_urgent?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai_moderated: boolean | null
          is_anonymous: boolean | null
          is_doctor_reply: boolean | null
          moderation_flags: string[] | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai_moderated?: boolean | null
          is_anonymous?: boolean | null
          is_doctor_reply?: boolean | null
          moderation_flags?: string[] | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai_moderated?: boolean | null
          is_anonymous?: boolean | null
          is_doctor_reply?: boolean | null
          moderation_flags?: string[] | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      health_articles: {
        Row: {
          author_id: string | null
          category: string | null
          content_en: string
          content_kk: string | null
          content_ru: string | null
          created_at: string
          id: string
          is_ai_generated: boolean | null
          is_published: boolean | null
          needs_review: boolean | null
          summary_en: string | null
          summary_kk: string | null
          summary_ru: string | null
          tags: string[] | null
          title_en: string
          title_kk: string | null
          title_ru: string | null
          updated_at: string
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content_en: string
          content_kk?: string | null
          content_ru?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          needs_review?: boolean | null
          summary_en?: string | null
          summary_kk?: string | null
          summary_ru?: string | null
          tags?: string[] | null
          title_en: string
          title_kk?: string | null
          title_ru?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content_en?: string
          content_kk?: string | null
          content_ru?: string | null
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          is_published?: boolean | null
          needs_review?: boolean | null
          summary_en?: string | null
          summary_kk?: string | null
          summary_ru?: string | null
          tags?: string[] | null
          title_en?: string
          title_kk?: string | null
          title_ru?: string | null
          updated_at?: string
          views_count?: number | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          created_at: string
          dosage: string | null
          expiration_date: string
          form_type: string | null
          id: string
          name: string
          notes: string | null
          purpose: string | null
          quantity: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dosage?: string | null
          expiration_date: string
          form_type?: string | null
          id?: string
          name: string
          notes?: string | null
          purpose?: string | null
          quantity?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dosage?: string | null
          expiration_date?: string
          form_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          purpose?: string | null
          quantity?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          analytics_opt_in: boolean | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analytics_opt_in?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analytics_opt_in?: boolean | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          language: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          language?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          created_at: string
          id: string
          mood: string | null
          notes: string | null
          severity: number
          sleep_hours: number | null
          symptom_date: string
          symptoms: string[]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          mood?: string | null
          notes?: string | null
          severity?: number
          sleep_hours?: number | null
          symptom_date?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string | null
          notes?: string | null
          severity?: number
          sleep_hours?: number | null
          symptom_date?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "doctor" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "doctor", "admin"],
    },
  },
} as const
