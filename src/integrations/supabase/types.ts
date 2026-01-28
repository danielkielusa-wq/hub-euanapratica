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
      app_configs: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      assignment_materials: {
        Row: {
          assignment_id: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          title: string
          uploaded_at: string | null
        }
        Insert: {
          assignment_id: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          title: string
          uploaded_at?: string | null
        }
        Update: {
          assignment_id?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          title?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_materials_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          allow_late_submission: boolean | null
          allowed_file_types: string[] | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string
          espaco_id: string
          id: string
          instructions: string | null
          max_file_size: number | null
          published_at: string | null
          status: Database["public"]["Enums"]["assignment_status"] | null
          submission_type: Database["public"]["Enums"]["submission_type"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          allow_late_submission?: boolean | null
          allowed_file_types?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date: string
          espaco_id: string
          id?: string
          instructions?: string | null
          max_file_size?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          submission_type?:
            | Database["public"]["Enums"]["submission_type"]
            | null
          title: string
          updated_at?: string | null
        }
        Update: {
          allow_late_submission?: boolean | null
          allowed_file_types?: string[] | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string
          espaco_id?: string
          id?: string
          instructions?: string | null
          max_file_size?: number | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["assignment_status"] | null
          submission_type?:
            | Database["public"]["Enums"]["submission_type"]
            | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      e2e_test_results: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          expected_result: string | null
          id: string
          log_raw: string | null
          log_summary: string | null
          objective: string | null
          related_url: string | null
          run_id: string
          status: Database["public"]["Enums"]["e2e_test_status"] | null
          suite: string
          test_code: string
          test_name: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          expected_result?: string | null
          id?: string
          log_raw?: string | null
          log_summary?: string | null
          objective?: string | null
          related_url?: string | null
          run_id: string
          status?: Database["public"]["Enums"]["e2e_test_status"] | null
          suite: string
          test_code: string
          test_name: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          expected_result?: string | null
          id?: string
          log_raw?: string | null
          log_summary?: string | null
          objective?: string | null
          related_url?: string | null
          run_id?: string
          status?: Database["public"]["Enums"]["e2e_test_status"] | null
          suite?: string
          test_code?: string
          test_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2e_test_results_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "e2e_test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      e2e_test_runs: {
        Row: {
          correction_prompt: string | null
          created_at: string | null
          error_message: string | null
          failed_count: number | null
          finished_at: string | null
          id: string
          passed_count: number | null
          skipped_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["e2e_run_status"] | null
          suites_executed: Json | null
          total_tests: number | null
          triggered_by_user_id: string | null
        }
        Insert: {
          correction_prompt?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_count?: number | null
          finished_at?: string | null
          id?: string
          passed_count?: number | null
          skipped_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["e2e_run_status"] | null
          suites_executed?: Json | null
          total_tests?: number | null
          triggered_by_user_id?: string | null
        }
        Update: {
          correction_prompt?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_count?: number | null
          finished_at?: string | null
          id?: string
          passed_count?: number | null
          skipped_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["e2e_run_status"] | null
          suites_executed?: Json | null
          total_tests?: number | null
          triggered_by_user_id?: string | null
        }
        Relationships: []
      }
      enrollment_history: {
        Row: {
          action: string
          created_at: string | null
          espaco_id: string
          id: string
          new_status: string | null
          notes: string | null
          old_status: string | null
          performed_by: string | null
          user_espaco_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          espaco_id: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
          user_espaco_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          espaco_id?: string
          id?: string
          new_status?: string | null
          notes?: string | null
          old_status?: string | null
          performed_by?: string | null
          user_espaco_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_history_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      espaco_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string | null
          email: string
          espaco_id: string
          expires_at: string
          id: string
          invited_by: string
          invited_name: string | null
          status: Database["public"]["Enums"]["invitation_status"] | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email: string
          espaco_id: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_name?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string | null
          email?: string
          espaco_id?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_name?: string | null
          status?: Database["public"]["Enums"]["invitation_status"] | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "espaco_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "espaco_invitations_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      espacos: {
        Row: {
          category: Database["public"]["Enums"]["espaco_category"] | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          gradient_end: string | null
          gradient_preset: string | null
          gradient_start: string | null
          id: string
          max_students: number | null
          mentor_id: string | null
          name: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          visibility: Database["public"]["Enums"]["espaco_visibility"] | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["espaco_category"] | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          gradient_end?: string | null
          gradient_preset?: string | null
          gradient_start?: string | null
          id?: string
          max_students?: number | null
          mentor_id?: string | null
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["espaco_visibility"] | null
        }
        Update: {
          category?: Database["public"]["Enums"]["espaco_category"] | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          gradient_end?: string | null
          gradient_preset?: string | null
          gradient_start?: string | null
          id?: string
          max_students?: number | null
          mentor_id?: string | null
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          visibility?: Database["public"]["Enums"]["espaco_visibility"] | null
        }
        Relationships: []
      }
      feedback_items: {
        Row: {
          admin_notes: string | null
          attachment_name: string | null
          attachment_url: string | null
          created_at: string | null
          description: string
          id: string
          page_url: string
          priority: Database["public"]["Enums"]["feedback_priority"]
          status: Database["public"]["Enums"]["feedback_status"]
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          admin_notes?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string | null
          description: string
          id?: string
          page_url: string
          priority?: Database["public"]["Enums"]["feedback_priority"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title: string
          type: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          admin_notes?: string | null
          attachment_name?: string | null
          attachment_url?: string | null
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string
          priority?: Database["public"]["Enums"]["feedback_priority"]
          status?: Database["public"]["Enums"]["feedback_status"]
          title?: string
          type?: Database["public"]["Enums"]["feedback_type"]
          updated_at?: string | null
          user_id?: string
          user_role?: string
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
          owner_role: string | null
          owner_user_id: string | null
          title: string | null
          updated_at: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          visibility_scope: Database["public"]["Enums"]["visibility_scope"]
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
          owner_role?: string | null
          owner_user_id?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          visibility_scope?: Database["public"]["Enums"]["visibility_scope"]
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
          owner_role?: string | null
          owner_user_id?: string | null
          title?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          visibility_scope?: Database["public"]["Enums"]["visibility_scope"]
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
      plans: {
        Row: {
          created_at: string
          cta_text: string
          display_features: Json
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          monthly_limit: number
          name: string
          price: number
        }
        Insert: {
          created_at?: string
          cta_text?: string
          display_features?: Json
          features?: Json
          id: string
          is_active?: boolean
          is_popular?: boolean
          monthly_limit?: number
          name: string
          price?: number
        }
        Update: {
          created_at?: string
          cta_text?: string
          display_features?: Json
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          monthly_limit?: number
          name?: string
          price?: number
        }
        Relationships: []
      }
      product_espacos: {
        Row: {
          created_at: string | null
          espaco_id: string
          id: string
          product_id: string
        }
        Insert: {
          created_at?: string | null
          espaco_id: string
          id?: string
          product_id: string
        }
        Update: {
          created_at?: string | null
          espaco_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_espacos_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_espacos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          access_duration_days: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          access_duration_days?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          access_duration_days?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          alternative_email: string | null
          birth_date: string | null
          created_at: string | null
          current_city: string | null
          current_country: string | null
          current_state: string | null
          email: string
          full_name: string
          has_completed_onboarding: boolean | null
          id: string
          is_whatsapp: boolean | null
          last_login_at: string | null
          linkedin_url: string | null
          phone: string | null
          phone_country_code: string | null
          preferred_name: string | null
          profile_photo_url: string | null
          resume_url: string | null
          status: string | null
          target_country: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          alternative_email?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_city?: string | null
          current_country?: string | null
          current_state?: string | null
          email: string
          full_name: string
          has_completed_onboarding?: boolean | null
          id: string
          is_whatsapp?: boolean | null
          last_login_at?: string | null
          linkedin_url?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferred_name?: string | null
          profile_photo_url?: string | null
          resume_url?: string | null
          status?: string | null
          target_country?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          alternative_email?: string | null
          birth_date?: string | null
          created_at?: string | null
          current_city?: string | null
          current_country?: string | null
          current_state?: string | null
          email?: string
          full_name?: string
          has_completed_onboarding?: boolean | null
          id?: string
          is_whatsapp?: boolean | null
          last_login_at?: string | null
          linkedin_url?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferred_name?: string | null
          profile_photo_url?: string | null
          resume_url?: string | null
          status?: string | null
          target_country?: string | null
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
      session_post_votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_post_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "session_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      session_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_mentor_post: boolean | null
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_mentor_post?: boolean | null
          session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_mentor_post?: boolean | null
          session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_posts_session_id_fkey"
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
          gradient_end: string | null
          gradient_preset: string | null
          gradient_start: string | null
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
          gradient_end?: string | null
          gradient_preset?: string | null
          gradient_start?: string | null
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
          gradient_end?: string | null
          gradient_preset?: string | null
          gradient_start?: string | null
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
      submission_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          sender_id: string
          submission_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          sender_id: string
          submission_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          sender_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_messages_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          created_at: string | null
          draft_saved_at: string | null
          feedback: string | null
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          review_result: Database["public"]["Enums"]["review_result"] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"] | null
          submitted_at: string | null
          text_content: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          draft_saved_at?: string | null
          feedback?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          review_result?: Database["public"]["Enums"]["review_result"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submitted_at?: string | null
          text_content?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          draft_saved_at?: string | null
          feedback?: string | null
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          review_result?: Database["public"]["Enums"]["review_result"] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submitted_at?: string | null
          text_content?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_logs: {
        Row: {
          app_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          app_id?: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_audit_logs: {
        Row: {
          action: string
          changed_by_user_id: string | null
          created_at: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          user_id: string
        }
        Insert: {
          action: string
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          changed_by_user_id?: string | null
          created_at?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      user_espacos: {
        Row: {
          access_expires_at: string | null
          enrolled_at: string | null
          enrolled_by: string | null
          espaco_id: string
          id: string
          last_access_at: string | null
          notes: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          espaco_id: string
          id?: string
          last_access_at?: string | null
          notes?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          enrolled_at?: string | null
          enrolled_by?: string | null
          espaco_id?: string
          id?: string
          last_access_at?: string | null
          notes?: string | null
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
          {
            foreignKeyName: "user_espacos_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_products: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          product_id: string
          purchased_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          product_id: string
          purchased_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          product_id?: string
          purchased_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_change_user_plan: {
        Args: { p_new_plan_id: string; p_user_id: string }
        Returns: boolean
      }
      admin_get_users_with_usage: {
        Args: never
        Returns: {
          email: string
          full_name: string
          last_usage_at: string
          monthly_limit: number
          plan_id: string
          plan_name: string
          profile_photo_url: string
          used_this_month: number
          user_id: string
        }[]
      }
      admin_reset_user_usage: { Args: { p_user_id: string }; Returns: boolean }
      can_access_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      get_invitation_by_token: {
        Args: { _token: string }
        Returns: {
          espaco_cover_image_url: string
          espaco_description: string
          espaco_id: string
          espaco_name: string
          expires_at: string
          id: string
          invited_name: string
          status: Database["public"]["Enums"]["invitation_status"]
        }[]
      }
      get_user_quota: {
        Args: { p_user_id: string }
        Returns: {
          features: Json
          monthly_limit: number
          plan_id: string
          plan_name: string
          remaining: number
          used_this_month: number
        }[]
      }
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
      record_curriculo_usage: { Args: { p_user_id: string }; Returns: boolean }
    }
    Enums: {
      access_level: "public" | "restricted"
      app_role: "admin" | "mentor" | "student"
      assignment_status: "draft" | "published" | "closed"
      attendance_status: "present" | "absent" | "unmarked"
      e2e_run_status: "started" | "running" | "passed" | "failed" | "cancelled"
      e2e_test_status: "passed" | "failed" | "skipped" | "pending"
      espaco_category:
        | "immersion"
        | "group_mentoring"
        | "workshop"
        | "bootcamp"
        | "course"
      espaco_visibility: "public" | "private"
      feedback_priority: "low" | "medium" | "high"
      feedback_status:
        | "new"
        | "in_review"
        | "resolved"
        | "considered_no_action"
        | "discarded"
      feedback_type: "bug" | "enhancement"
      file_type:
        | "pdf"
        | "docx"
        | "xlsx"
        | "pptx"
        | "zip"
        | "png"
        | "jpg"
        | "link"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      material_type: "pdf" | "link" | "video" | "other"
      notification_type:
        | "reminder_24h"
        | "reminder_1h"
        | "recording_available"
        | "session_cancelled"
        | "new_session"
      review_result: "approved" | "revision" | "rejected"
      session_status: "scheduled" | "live" | "completed" | "cancelled"
      submission_status: "draft" | "submitted" | "reviewed"
      submission_type: "file" | "text" | "both"
      visibility_scope: "space_all" | "mentor_and_owner"
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
      assignment_status: ["draft", "published", "closed"],
      attendance_status: ["present", "absent", "unmarked"],
      e2e_run_status: ["started", "running", "passed", "failed", "cancelled"],
      e2e_test_status: ["passed", "failed", "skipped", "pending"],
      espaco_category: [
        "immersion",
        "group_mentoring",
        "workshop",
        "bootcamp",
        "course",
      ],
      espaco_visibility: ["public", "private"],
      feedback_priority: ["low", "medium", "high"],
      feedback_status: [
        "new",
        "in_review",
        "resolved",
        "considered_no_action",
        "discarded",
      ],
      feedback_type: ["bug", "enhancement"],
      file_type: ["pdf", "docx", "xlsx", "pptx", "zip", "png", "jpg", "link"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      material_type: ["pdf", "link", "video", "other"],
      notification_type: [
        "reminder_24h",
        "reminder_1h",
        "recording_available",
        "session_cancelled",
        "new_session",
      ],
      review_result: ["approved", "revision", "rejected"],
      session_status: ["scheduled", "live", "completed", "cancelled"],
      submission_status: ["draft", "submitted", "reviewed"],
      submission_type: ["file", "text", "both"],
      visibility_scope: ["space_all", "mentor_and_owner"],
    },
  },
} as const
