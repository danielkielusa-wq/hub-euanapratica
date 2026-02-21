Initialising login role...
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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_configs: {
        Row: {
          api_key: string
          base_url: string | null
          created_at: string | null
          credentials: Json | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parameters: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          api_key: string
          base_url?: string | null
          created_at?: string | null
          credentials?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parameters?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          api_key?: string
          base_url?: string | null
          created_at?: string | null
          credentials?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
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
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          source: string
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          source: string
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          condition_type: string
          condition_value: number | null
          created_at: string | null
          description: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          condition_type: string
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          condition_type?: string
          condition_value?: number | null
          created_at?: string | null
          description?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      booking_history: {
        Row: {
          action: Database["public"]["Enums"]["booking_action"]
          booking_id: string
          created_at: string | null
          id: string
          new_datetime: string | null
          notes: string | null
          old_datetime: string | null
          performed_by: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["booking_action"]
          booking_id: string
          created_at?: string | null
          id?: string
          new_datetime?: string | null
          notes?: string | null
          old_datetime?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["booking_action"]
          booking_id?: string
          created_at?: string | null
          id?: string
          new_datetime?: string | null
          notes?: string | null
          old_datetime?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_policies: {
        Row: {
          cancellation_window_hours: number | null
          created_at: string | null
          default_duration_minutes: number | null
          id: string
          is_active: boolean | null
          max_advance_days: number | null
          max_concurrent_bookings: number | null
          max_reschedules_per_booking: number | null
          min_notice_hours: number | null
          service_id: string | null
          slot_interval_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          cancellation_window_hours?: number | null
          created_at?: string | null
          default_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_advance_days?: number | null
          max_concurrent_bookings?: number | null
          max_reschedules_per_booking?: number | null
          min_notice_hours?: number | null
          service_id?: string | null
          slot_interval_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          cancellation_window_hours?: number | null
          created_at?: string | null
          default_duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_advance_days?: number | null
          max_concurrent_bookings?: number | null
          max_reschedules_per_booking?: number | null
          min_notice_hours?: number | null
          service_id?: string | null
          slot_interval_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_policies_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          last_rescheduled_at: string | null
          meeting_link: string | null
          mentor_id: string | null
          mentor_notes: string | null
          mentor_service_id: string | null
          original_datetime: string | null
          reschedule_count: number | null
          scheduled_end: string
          scheduled_start: string
          service_id: string
          status: Database["public"]["Enums"]["booking_status"] | null
          student_id: string
          student_notes: string | null
          updated_at: string | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          last_rescheduled_at?: string | null
          meeting_link?: string | null
          mentor_id?: string | null
          mentor_notes?: string | null
          mentor_service_id?: string | null
          original_datetime?: string | null
          reschedule_count?: number | null
          scheduled_end: string
          scheduled_start: string
          service_id: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id: string
          student_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          last_rescheduled_at?: string | null
          meeting_link?: string | null
          mentor_id?: string | null
          mentor_notes?: string | null
          mentor_service_id?: string | null
          original_datetime?: string | null
          reschedule_count?: number | null
          scheduled_end?: string
          scheduled_start?: string
          service_id?: string
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id?: string
          student_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_mentor_service_id_fkey"
            columns: ["mentor_service_id"]
            isOneToOne: false
            referencedRelation: "mentor_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      career_evaluations: {
        Row: {
          access_count: number | null
          access_token: string
          area: string | null
          atuacao: string | null
          auto_nurture_sequence: string | null
          best_contact_time: string | null
          budget_gap: string | null
          can_apply_jobs: boolean | null
          consentimento_marketing: boolean | null
          created_at: string | null
          critical_blockers: string[] | null
          device: string | null
          email: string
          english_level: string | null
          estimated_ltv: number | null
          estimated_preparation_months: number | null
          experiencia: string | null
          family_status: string | null
          fbclid: string | null
          first_accessed_at: string | null
          fit_score: number | null
          formatted_at: string | null
          formatted_report: string | null
          gclid: string | null
          has_budget: boolean | null
          has_clarity_barrier: boolean | null
          has_english_barrier: boolean | null
          has_experience_barrier: boolean | null
          has_family: boolean | null
          has_family_barrier: boolean | null
          has_financial_barrier: boolean | null
          has_time_barrier: boolean | null
          has_visa_barrier: boolean | null
          id: string | null
          impediment: string | null
          impediment_other: string | null
          import_batch_id: string | null
          imported_by: string | null
          income_range: string | null
          investment_range: string | null
          is_high_income: boolean | null
          is_senior_level: boolean | null
          is_tech_professional: boolean | null
          lead_priority_score: number | null
          lead_temperature: string | null
          main_concern: string | null
          name: string
          next_milestone_action: string | null
          next_milestone_deadline: string | null
          objetivo: string | null
          phase_emoji: string | null
          phase_id: number | null
          phase_name: string | null
          phone: string | null
          preferred_communication: string | null
          processing_error: string | null
          processing_started_at: string | null
          processing_status: string | null
          raw_llm_response: Json | null
          readiness_percentual: number | null
          readiness_score: number | null
          recheck_recommended_at: string | null
          recommendation_description: string | null
          recommendation_landing_page_url: string | null
          recommendation_status: string | null
          recommended_first_action: string | null
          recommended_product_name: string | null
          recommended_product_price: string | null
          recommended_product_tier: string | null
          recommended_product_url: string | null
          report_content: string
          rota_letter: string | null
          scheduled_follow_up_1: string | null
          scheduled_follow_up_2: string | null
          scheduled_follow_up_3: string | null
          score_area_bonus: number | null
          score_english: number | null
          score_experience: number | null
          score_international_work: number | null
          score_objective: number | null
          score_readiness: number | null
          score_timeline: number | null
          score_visa: number | null
          secondary_fit_score: number | null
          secondary_product_name: string | null
          secondary_product_tier: string | null
          timeline: string | null
          trabalha_internacional: boolean | null
          updated_at: string | null
          urgency_level: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visa_status: string | null
          works_remotely: boolean | null
        }
        Insert: {
          access_count?: number | null
          access_token?: string
          area?: string | null
          atuacao?: string | null
          auto_nurture_sequence?: string | null
          best_contact_time?: string | null
          budget_gap?: string | null
          can_apply_jobs?: boolean | null
          consentimento_marketing?: boolean | null
          created_at?: string | null
          critical_blockers?: string[] | null
          device?: string | null
          email: string
          english_level?: string | null
          estimated_ltv?: number | null
          estimated_preparation_months?: number | null
          experiencia?: string | null
          family_status?: string | null
          fbclid?: string | null
          first_accessed_at?: string | null
          fit_score?: number | null
          formatted_at?: string | null
          formatted_report?: string | null
          gclid?: string | null
          has_budget?: boolean | null
          has_clarity_barrier?: boolean | null
          has_english_barrier?: boolean | null
          has_experience_barrier?: boolean | null
          has_family?: boolean | null
          has_family_barrier?: boolean | null
          has_financial_barrier?: boolean | null
          has_time_barrier?: boolean | null
          has_visa_barrier?: boolean | null
          id?: string | null
          impediment?: string | null
          impediment_other?: string | null
          import_batch_id?: string | null
          imported_by?: string | null
          income_range?: string | null
          investment_range?: string | null
          is_high_income?: boolean | null
          is_senior_level?: boolean | null
          is_tech_professional?: boolean | null
          lead_priority_score?: number | null
          lead_temperature?: string | null
          main_concern?: string | null
          name: string
          next_milestone_action?: string | null
          next_milestone_deadline?: string | null
          objetivo?: string | null
          phase_emoji?: string | null
          phase_id?: number | null
          phase_name?: string | null
          phone?: string | null
          preferred_communication?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          raw_llm_response?: Json | null
          readiness_percentual?: number | null
          readiness_score?: number | null
          recheck_recommended_at?: string | null
          recommendation_description?: string | null
          recommendation_landing_page_url?: string | null
          recommendation_status?: string | null
          recommended_first_action?: string | null
          recommended_product_name?: string | null
          recommended_product_price?: string | null
          recommended_product_tier?: string | null
          recommended_product_url?: string | null
          report_content: string
          rota_letter?: string | null
          scheduled_follow_up_1?: string | null
          scheduled_follow_up_2?: string | null
          scheduled_follow_up_3?: string | null
          score_area_bonus?: number | null
          score_english?: number | null
          score_experience?: number | null
          score_international_work?: number | null
          score_objective?: number | null
          score_readiness?: number | null
          score_timeline?: number | null
          score_visa?: number | null
          secondary_fit_score?: number | null
          secondary_product_name?: string | null
          secondary_product_tier?: string | null
          timeline?: string | null
          trabalha_internacional?: boolean | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visa_status?: string | null
          works_remotely?: boolean | null
        }
        Update: {
          access_count?: number | null
          access_token?: string
          area?: string | null
          atuacao?: string | null
          auto_nurture_sequence?: string | null
          best_contact_time?: string | null
          budget_gap?: string | null
          can_apply_jobs?: boolean | null
          consentimento_marketing?: boolean | null
          created_at?: string | null
          critical_blockers?: string[] | null
          device?: string | null
          email?: string
          english_level?: string | null
          estimated_ltv?: number | null
          estimated_preparation_months?: number | null
          experiencia?: string | null
          family_status?: string | null
          fbclid?: string | null
          first_accessed_at?: string | null
          fit_score?: number | null
          formatted_at?: string | null
          formatted_report?: string | null
          gclid?: string | null
          has_budget?: boolean | null
          has_clarity_barrier?: boolean | null
          has_english_barrier?: boolean | null
          has_experience_barrier?: boolean | null
          has_family?: boolean | null
          has_family_barrier?: boolean | null
          has_financial_barrier?: boolean | null
          has_time_barrier?: boolean | null
          has_visa_barrier?: boolean | null
          id?: string | null
          impediment?: string | null
          impediment_other?: string | null
          import_batch_id?: string | null
          imported_by?: string | null
          income_range?: string | null
          investment_range?: string | null
          is_high_income?: boolean | null
          is_senior_level?: boolean | null
          is_tech_professional?: boolean | null
          lead_priority_score?: number | null
          lead_temperature?: string | null
          main_concern?: string | null
          name?: string
          next_milestone_action?: string | null
          next_milestone_deadline?: string | null
          objetivo?: string | null
          phase_emoji?: string | null
          phase_id?: number | null
          phase_name?: string | null
          phone?: string | null
          preferred_communication?: string | null
          processing_error?: string | null
          processing_started_at?: string | null
          processing_status?: string | null
          raw_llm_response?: Json | null
          readiness_percentual?: number | null
          readiness_score?: number | null
          recheck_recommended_at?: string | null
          recommendation_description?: string | null
          recommendation_landing_page_url?: string | null
          recommendation_status?: string | null
          recommended_first_action?: string | null
          recommended_product_name?: string | null
          recommended_product_price?: string | null
          recommended_product_tier?: string | null
          recommended_product_url?: string | null
          report_content?: string
          rota_letter?: string | null
          scheduled_follow_up_1?: string | null
          scheduled_follow_up_2?: string | null
          scheduled_follow_up_3?: string | null
          score_area_bonus?: number | null
          score_english?: number | null
          score_experience?: number | null
          score_international_work?: number | null
          score_objective?: number | null
          score_readiness?: number | null
          score_timeline?: number | null
          score_visa?: number | null
          secondary_fit_score?: number | null
          secondary_product_name?: string | null
          secondary_product_tier?: string | null
          timeline?: string | null
          trabalha_internacional?: boolean | null
          updated_at?: string | null
          urgency_level?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visa_status?: string | null
          works_remotely?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "career_evaluations_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_evaluations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_categories: {
        Row: {
          created_at: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      community_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          category_id: string | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "community_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      gamification_rules: {
        Row: {
          action_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          points: number
        }
        Insert: {
          action_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points: number
        }
        Update: {
          action_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          points?: number
        }
        Relationships: []
      }
      hub_services: {
        Row: {
          accent_color: string | null
          category: string | null
          created_at: string | null
          cta_text: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          icon_name: string
          id: string
          is_highlighted: boolean | null
          is_visible_for_upsell: boolean | null
          is_visible_in_hub: boolean | null
          keywords: string[] | null
          landing_page_data: Json | null
          landing_page_url: string | null
          meeting_type: string | null
          name: string
          price: number | null
          price_display: string | null
          product_type: string | null
          redirect_url: string | null
          ribbon: string | null
          route: string | null
          service_type: string | null
          status: string
          stripe_price_id: string | null
          target_tier: string | null
          thank_you_page_data: Json | null
          ticto_checkout_url: string | null
          ticto_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          accent_color?: string | null
          category?: string | null
          created_at?: string | null
          cta_text?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          icon_name: string
          id?: string
          is_highlighted?: boolean | null
          is_visible_for_upsell?: boolean | null
          is_visible_in_hub?: boolean | null
          keywords?: string[] | null
          landing_page_data?: Json | null
          landing_page_url?: string | null
          meeting_type?: string | null
          name: string
          price?: number | null
          price_display?: string | null
          product_type?: string | null
          redirect_url?: string | null
          ribbon?: string | null
          route?: string | null
          service_type?: string | null
          status?: string
          stripe_price_id?: string | null
          target_tier?: string | null
          thank_you_page_data?: Json | null
          ticto_checkout_url?: string | null
          ticto_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accent_color?: string | null
          category?: string | null
          created_at?: string | null
          cta_text?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          icon_name?: string
          id?: string
          is_highlighted?: boolean | null
          is_visible_for_upsell?: boolean | null
          is_visible_in_hub?: boolean | null
          keywords?: string[] | null
          landing_page_data?: Json | null
          landing_page_url?: string | null
          meeting_type?: string | null
          name?: string
          price?: number | null
          price_display?: string | null
          product_type?: string | null
          redirect_url?: string | null
          ribbon?: string | null
          route?: string | null
          service_type?: string | null
          status?: string
          stripe_price_id?: string | null
          target_tier?: string | null
          thank_you_page_data?: Json | null
          ticto_checkout_url?: string | null
          ticto_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applied_at: string | null
          id: string
          job_id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          id?: string
          job_id: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_at?: string | null
          id?: string
          job_id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "brazil_friendly_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_bookmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "brazil_friendly_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_bookmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          company: string
          created_at: string | null
          description: string | null
          employment_type: string | null
          error: string | null
          experience_level: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_brazil_friendly: boolean | null
          is_featured: boolean | null
          job_category: string | null
          location: string | null
          location_restrictions: string | null
          logo_url: string | null
          posted_at: string | null
          remote_type: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_type: string | null
          source: string
          tags: string[] | null
          tech_stack: string[] | null
          timezone_requirements: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          company: string
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          error?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_brazil_friendly?: boolean | null
          is_featured?: boolean | null
          job_category?: string | null
          location?: string | null
          location_restrictions?: string | null
          logo_url?: string | null
          posted_at?: string | null
          remote_type?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          source: string
          tags?: string[] | null
          tech_stack?: string[] | null
          timezone_requirements?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          company?: string
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          error?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_brazil_friendly?: boolean | null
          is_featured?: boolean | null
          job_category?: string | null
          location?: string | null
          location_restrictions?: string | null
          logo_url?: string | null
          posted_at?: string | null
          remote_type?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_type?: string | null
          source?: string
          tags?: string[] | null
          tech_stack?: string[] | null
          timezone_requirements?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      kanban_tasks: {
        Row: {
          column_id: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          owner: string | null
          position: number | null
          priority: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          column_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          position?: number | null
          priority?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          column_id?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner?: string | null
          position?: number | null
          priority?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
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
      mentor_availability: {
        Row: {
          created_at: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active: boolean | null
          mentor_id: string
          start_time: string
          timezone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_active?: boolean | null
          mentor_id: string
          start_time: string
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_active?: boolean | null
          mentor_id?: string
          start_time?: string
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      mentor_blocked_times: {
        Row: {
          created_at: string | null
          end_datetime: string
          id: string
          mentor_id: string
          reason: string | null
          start_datetime: string
        }
        Insert: {
          created_at?: string | null
          end_datetime: string
          id?: string
          mentor_id: string
          reason?: string | null
          start_datetime: string
        }
        Update: {
          created_at?: string | null
          end_datetime?: string
          id?: string
          mentor_id?: string
          reason?: string | null
          start_datetime?: string
        }
        Relationships: []
      }
      mentor_services: {
        Row: {
          buffer_minutes: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          mentor_id: string
          price_override: number | null
          service_id: string
          slot_duration_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          buffer_minutes?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mentor_id: string
          price_override?: number | null
          service_id: string
          slot_duration_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          buffer_minutes?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          mentor_id?: string
          price_override?: number | null
          service_id?: string
          slot_duration_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mentor_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
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
      payment_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          service_id: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          service_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          service_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_logs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          price_annual: number | null
          theme: string | null
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
          price_annual?: number | null
          theme?: string | null
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
          price_annual?: number | null
          theme?: string | null
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
          checkout_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          landing_page_url: string | null
          name: string
          price: number | null
          updated_at: string | null
        }
        Insert: {
          access_duration_days?: number | null
          checkout_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          landing_page_url?: string | null
          name: string
          price?: number | null
          updated_at?: string | null
        }
        Update: {
          access_duration_days?: number | null
          checkout_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          landing_page_url?: string | null
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
      resumepass_reports: {
        Row: {
          created_at: string
          id: string
          report_data: Json
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_data: Json
          title?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_data?: Json
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumepass_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      title_translations: {
        Row: {
          all_suggestions: Json | null
          area: string | null
          created_at: string | null
          credits_used: number | null
          id: string
          responsibilities: string | null
          title_br_input: string
          title_us_recommended: string | null
          user_id: string
          years_experience: number | null
        }
        Insert: {
          all_suggestions?: Json | null
          area?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          responsibilities?: string | null
          title_br_input: string
          title_us_recommended?: string | null
          user_id: string
          years_experience?: number | null
        }
        Update: {
          all_suggestions?: Json | null
          area?: string | null
          created_at?: string | null
          credits_used?: number | null
          id?: string
          responsibilities?: string | null
          title_br_input?: string
          title_us_recommended?: string | null
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      upsell_blacklist: {
        Row: {
          blacklisted_until: string
          created_at: string
          id: string
          reason: string | null
          service_id: string
          user_id: string
        }
        Insert: {
          blacklisted_until: string
          created_at?: string
          id?: string
          reason?: string | null
          service_id: string
          user_id: string
        }
        Update: {
          blacklisted_until?: string
          created_at?: string
          id?: string
          reason?: string | null
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_blacklist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_blacklist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_impressions: {
        Row: {
          clicked_at: string | null
          confidence_score: number
          converted_at: string | null
          dismissed_at: string | null
          id: string
          metadata: Json | null
          microcopy: string
          post_id: string
          reason: string
          service_id: string
          shown_at: string
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          confidence_score: number
          converted_at?: string | null
          dismissed_at?: string | null
          id?: string
          metadata?: Json | null
          microcopy: string
          post_id: string
          reason: string
          service_id: string
          shown_at?: string
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          confidence_score?: number
          converted_at?: string | null
          dismissed_at?: string | null
          id?: string
          metadata?: Json | null
          microcopy?: string
          post_id?: string
          reason?: string
          service_id?: string
          shown_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_impressions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_impressions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "upsell_impressions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      user_gamification: {
        Row: {
          comments_count: number | null
          last_activity_at: string | null
          level: number | null
          likes_received: number | null
          posts_count: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          last_activity_at?: string | null
          level?: number | null
          likes_received?: number | null
          posts_count?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          last_activity_at?: string | null
          level?: number | null
          likes_received?: number | null
          posts_count?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hub_services: {
        Row: {
          expires_at: string | null
          id: string
          service_id: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          service_id: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          service_id?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_hub_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_hub_services_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      brazil_friendly_jobs: {
        Row: {
          company: string | null
          created_at: string | null
          description: string | null
          id: string | null
          location_restrictions: string | null
          posted_at: string | null
          remote_type: string | null
          source: string | null
          tags: string[] | null
          timezone_requirements: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location_restrictions?: string | null
          posted_at?: string | null
          remote_type?: string | null
          source?: string | null
          tags?: string[] | null
          timezone_requirements?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          location_restrictions?: string | null
          posted_at?: string | null
          remote_type?: string | null
          source?: string | null
          tags?: string[] | null
          timezone_requirements?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: []
      }
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
      admin_update_api_credentials: {
        Args: { p_api_key: string; p_credentials_json: Json }
        Returns: undefined
      }
      calculate_level: { Args: { p_points: number }; Returns: number }
      can_access_session: {
        Args: { _session_id: string; _user_id: string }
        Returns: boolean
      }
      cancel_booking: {
        Args: { p_booking_id: string; p_reason?: string; p_user_id: string }
        Returns: boolean
      }
      check_api_credentials_status: {
        Args: never
        Returns: {
          api_key: string
          has_credentials: boolean
          is_active: boolean
          name: string
        }[]
      }
      check_job_exists: { Args: { job_url: string }; Returns: boolean }
      check_prime_jobs_quota: {
        Args: { p_user_id: string }
        Returns: {
          can_apply: boolean
          monthly_limit: number
          plan_id: string
          remaining: number
          used_this_month: number
        }[]
      }
      check_upsell_blacklist: {
        Args: { p_service_id: string; p_user_id: string }
        Returns: boolean
      }
      check_upsell_rate_limit: { Args: { p_user_id: string }; Returns: boolean }
      cleanup_old_jobs: { Args: never; Returns: Json }
      complete_booking: {
        Args: {
          p_booking_id: string
          p_mentor_notes?: string
          p_user_id: string
        }
        Returns: boolean
      }
      create_booking:
        | {
            Args: {
              p_duration_minutes?: number
              p_scheduled_start: string
              p_service_id: string
              p_student_id: string
              p_student_notes?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_booking_datetime: string
              p_mentor_service_id: string
              p_student_notes?: string
              p_timezone?: string
              p_user_id: string
            }
            Returns: string
          }
      get_api_config_by_key: {
        Args: { p_api_key: string }
        Returns: {
          api_key: string
          base_url: string
          created_at: string
          credentials: Json
          description: string
          id: string
          is_active: boolean
          name: string
          parameters: Json
          updated_at: string
          updated_by: string
        }[]
      }
      get_api_config_with_credentials: {
        Args: { p_api_key: string }
        Returns: {
          api_key: string
          base_url: string
          credentials: Json
          description: string
          id: string
          is_active: boolean
          name: string
          parameters: Json
        }[]
      }
      get_app_quota: {
        Args: { p_app_id: string; p_user_id: string }
        Returns: {
          features: Json
          monthly_limit: number
          plan_id: string
          plan_name: string
          remaining: number
          used_this_month: number
        }[]
      }
      get_available_slots: {
        Args: { p_end_date: string; p_service_id: string; p_start_date: string }
        Returns: {
          duration_minutes: number
          mentor_id: string
          slot_end: string
          slot_start: string
        }[]
      }
      get_booking_policy: {
        Args: { p_service_id: string }
        Returns: {
          cancellation_window_hours: number | null
          created_at: string | null
          default_duration_minutes: number | null
          id: string
          is_active: boolean | null
          max_advance_days: number | null
          max_concurrent_bookings: number | null
          max_reschedules_per_booking: number | null
          min_notice_hours: number | null
          service_id: string | null
          slot_interval_minutes: number | null
          updated_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "booking_policies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_community_ranking: {
        Args: { p_limit?: number }
        Returns: {
          full_name: string
          level: number
          profile_photo_url: string
          total_points: number
          user_id: string
        }[]
      }
      get_full_plan_access: {
        Args: { p_user_id: string }
        Returns: {
          features: Json
          monthly_limit: number
          plan_id: string
          plan_name: string
          price_annual: number
          price_monthly: number
          remaining: number
          theme: string
          used_this_month: number
        }[]
      }
      get_gamification_points: {
        Args: { p_action_type: string }
        Returns: number
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
      get_job_by_id: {
        Args: { p_job_id: string; p_user_id?: string }
        Returns: {
          apply_url: string
          benefits: string
          category: string
          company_logo_url: string
          company_name: string
          created_at: string
          description: string
          experience_level: string
          id: string
          is_applied: boolean
          is_bookmarked: boolean
          is_featured: boolean
          job_type: string
          location: string
          remote_type: string
          requirements: string
          salary_currency: string
          salary_max: number
          salary_min: number
          tech_stack: string[]
          title: string
        }[]
      }
      get_job_categories: {
        Args: never
        Returns: {
          category: string
          count: number
        }[]
      }
      get_jobs_with_user_context: {
        Args: {
          p_category?: string
          p_experience_level?: string
          p_job_type?: string
          p_limit?: number
          p_offset?: number
          p_remote_type?: string
          p_salary_min?: number
          p_search?: string
          p_user_id: string
        }
        Returns: {
          apply_url: string
          benefits: string
          category: string
          company_logo_url: string
          company_name: string
          created_at: string
          description: string
          experience_level: string
          id: string
          is_applied: boolean
          is_bookmarked: boolean
          is_featured: boolean
          job_type: string
          location: string
          remote_type: string
          requirements: string
          salary_currency: string
          salary_max: number
          salary_min: number
          tech_stack: string[]
          title: string
          total_count: number
        }[]
      }
      get_mentor_for_service: {
        Args: { p_service_id: string }
        Returns: string
      }
      get_prime_jobs_stats: {
        Args: never
        Returns: {
          avg_salary_min: number
          new_this_week: number
          top_category: string
          total_active_jobs: number
        }[]
      }
      get_student_booking_stats: {
        Args: { p_student_id: string }
        Returns: {
          cancelled_bookings: number
          completed_bookings: number
          no_show_bookings: number
          remaining_slots: number
          total_bookings: number
          upcoming_bookings: number
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
      is_phone_available: {
        Args: { p_country_code: string; p_phone: string; p_user_id?: string }
        Returns: boolean
      }
      mark_upsell_click: {
        Args: { p_impression_id: string }
        Returns: undefined
      }
      mark_upsell_conversion: {
        Args: { p_impression_id: string }
        Returns: undefined
      }
      mark_upsell_dismiss: {
        Args: { p_impression_id: string }
        Returns: undefined
      }
      record_analytics_event: {
        Args: {
          p_entity_id?: string
          p_entity_type?: string
          p_event_type: string
          p_metadata?: Json
        }
        Returns: boolean
      }
      record_curriculo_usage: { Args: { p_user_id: string }; Returns: boolean }
      record_prime_jobs_application: {
        Args: { p_job_id: string; p_user_id: string }
        Returns: {
          application_id: string
          message: string
          success: boolean
        }[]
      }
      reschedule_booking:
        | {
            Args: {
              p_booking_id: string
              p_new_start: string
              p_user_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_booking_id: string
              p_new_datetime: string
              p_reason?: string
              p_user_id: string
            }
            Returns: boolean
          }
      test_encryption: {
        Args: never
        Returns: {
          decrypted: string
          encrypted: string
          original: string
          success: boolean
        }[]
      }
      user_has_plan_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level: "public" | "restricted"
      app_role: "admin" | "mentor" | "student"
      assignment_status: "draft" | "published" | "closed"
      attendance_status: "present" | "absent" | "unmarked"
      booking_action:
        | "created"
        | "rescheduled"
        | "cancelled"
        | "completed"
        | "no_show_marked"
      booking_status: "confirmed" | "completed" | "cancelled" | "no_show"
      day_of_week:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      access_level: ["public", "restricted"],
      app_role: ["admin", "mentor", "student"],
      assignment_status: ["draft", "published", "closed"],
      attendance_status: ["present", "absent", "unmarked"],
      booking_action: [
        "created",
        "rescheduled",
        "cancelled",
        "completed",
        "no_show_marked",
      ],
      booking_status: ["confirmed", "completed", "cancelled", "no_show"],
      day_of_week: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
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
