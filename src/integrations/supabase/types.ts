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
      espacos: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          mentor_id: string | null
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          mentor_id?: string | null
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          mentor_id?: string | null
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      folders: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          espaco_id: string
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          espaco_id: string
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          espaco_id?: string
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folders_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      material_downloads: {
        Row: {
          downloaded_at: string | null
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string | null
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string | null
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "material_downloads_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          access_level: Database["public"]["Enums"]["access_level"] | null
          available_at: string | null
          description: string | null
          display_order: number | null
          file_size: number | null
          file_type: Database["public"]["Enums"]["file_type"]
          file_url: string
          filename: string
          folder_id: string
          id: string
          title: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          access_level?: Database["public"]["Enums"]["access_level"] | null
          available_at?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_type: Database["public"]["Enums"]["file_type"]
          file_url: string
          filename: string
          folder_id: string
          id?: string
          title?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          access_level?: Database["public"]["Enums"]["access_level"] | null
          available_at?: string | null
          description?: string | null
          display_order?: number | null
          file_size?: number | null
          file_type?: Database["public"]["Enums"]["file_type"]
          file_url?: string
          filename?: string
          folder_id?: string
          id?: string
          title?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          sent_at: string | null
          session_id: string | null
          status: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          profile_photo_url: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id: string
          phone?: string | null
          profile_photo_url?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_photo_url?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          id: string
          marked_at: string | null
          marked_by: string | null
          session_id: string
          status: Database["public"]["Enums"]["attendance_status"] | null
          user_id: string
        }
        Insert: {
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          session_id: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          user_id: string
        }
        Update: {
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          session_id?: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_materials: {
        Row: {
          file_url: string
          id: string
          material_type: Database["public"]["Enums"]["material_type"] | null
          session_id: string
          title: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          file_url: string
          id?: string
          material_type?: Database["public"]["Enums"]["material_type"] | null
          session_id: string
          title: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          file_url?: string
          id?: string
          material_type?: Database["public"]["Enums"]["material_type"] | null
          session_id?: string
          title?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string | null
          created_by: string | null
          datetime: string
          description: string | null
          duration_minutes: number | null
          espaco_id: string
          id: string
          is_recurring: boolean | null
          meeting_link: string | null
          recording_url: string | null
          recurrence_pattern: Json | null
          status: Database["public"]["Enums"]["session_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          datetime: string
          description?: string | null
          duration_minutes?: number | null
          espaco_id: string
          id?: string
          is_recurring?: boolean | null
          meeting_link?: string | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          datetime?: string
          description?: string | null
          duration_minutes?: number | null
          espaco_id?: string
          id?: string
          is_recurring?: boolean | null
          meeting_link?: string | null
          recording_url?: string | null
          recurrence_pattern?: Json | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_espacos: {
        Row: {
          enrolled_at: string | null
          espaco_id: string
          id: string
          status: string | null
          user_id: string
        }
        Insert: {
          enrolled_at?: string | null
          espaco_id: string
          id?: string
          status?: string | null
          user_id: string
        }
        Update: {
          enrolled_at?: string | null
          espaco_id?: string
          id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_espacos_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          material_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          material_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          material_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_mentor: { Args: { _user_id: string }; Returns: boolean }
      is_enrolled_in_espaco: {
        Args: { _espaco_id: string; _user_id: string }
        Returns: boolean
      }
      is_mentor_of_espaco: {
        Args: { _espaco_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level: "public" | "restricted"
      app_role: "admin" | "mentor" | "student"
      attendance_status: "present" | "absent" | "unmarked"
      file_type:
        | "pdf"
        | "docx"
        | "xlsx"
        | "pptx"
        | "zip"
        | "png"
        | "jpg"
        | "link"
      material_type: "pdf" | "link" | "video" | "other"
      notification_type:
        | "reminder_24h"
        | "reminder_1h"
        | "recording_available"
        | "session_cancelled"
        | "new_session"
      session_status: "scheduled" | "live" | "completed" | "cancelled"
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
      access_level: ["public", "restricted"],
      app_role: ["admin", "mentor", "student"],
      attendance_status: ["present", "absent", "unmarked"],
      file_type: ["pdf", "docx", "xlsx", "pptx", "zip", "png", "jpg", "link"],
      material_type: ["pdf", "link", "video", "other"],
      notification_type: [
        "reminder_24h",
        "reminder_1h",
        "recording_available",
        "session_cancelled",
        "new_session",
      ],
      session_status: ["scheduled", "live", "completed", "cancelled"],
    },
  },
} as const
