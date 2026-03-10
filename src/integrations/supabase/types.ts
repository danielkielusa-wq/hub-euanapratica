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
          fallback_api_key: string | null
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
          fallback_api_key?: string | null
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
          fallback_api_key?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_configs_fallback_api_key_fkey"
            columns: ["fallback_api_key"]
            isOneToOne: false
            referencedRelation: "api_configs"
            referencedColumns: ["api_key"]
          },
        ]
      }
      api_cost_logs: {
        Row: {
          cost_usd: number | null
          created_at: string | null
          duration_ms: number | null
          edge_function: string
          error_message: string | null
          id: string
          input_tokens: number | null
          metadata: Json | null
          model: string | null
          output_tokens: number | null
          provider: string
          status: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          edge_function: string
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          provider: string
          status?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string | null
          duration_ms?: number | null
          edge_function?: string
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          metadata?: Json | null
          model?: string | null
          output_tokens?: number | null
          provider?: string
          status?: string
          total_tokens?: number | null
          user_id?: string | null
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
            foreignKeyName: "bookings_mentor_profile_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          {
            foreignKeyName: "bookings_student_profile_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_ideas: {
        Row: {
          attachments: Json | null
          column_status: string
          competition: string | null
          created_at: string | null
          distribution_hypothesis: string | null
          existing_assets: string | null
          gate_answers: Json | null
          id: string
          integrations: string | null
          interest_score: number | null
          key_metric: string | null
          kill_criteria: string | null
          market_size: string | null
          mvp_scope: string | null
          name: string
          notes: string | null
          one_liner: string | null
          persona: string | null
          pricing_model: string | null
          problem: string | null
          revenue_model: string | null
          signals_collected: string | null
          strongest_objection: string | null
          tags: string[] | null
          unfair_advantage: string | null
          updated_at: string | null
          user_id: string
          validation_method: string | null
        }
        Insert: {
          attachments?: Json | null
          column_status?: string
          competition?: string | null
          created_at?: string | null
          distribution_hypothesis?: string | null
          existing_assets?: string | null
          gate_answers?: Json | null
          id?: string
          integrations?: string | null
          interest_score?: number | null
          key_metric?: string | null
          kill_criteria?: string | null
          market_size?: string | null
          mvp_scope?: string | null
          name?: string
          notes?: string | null
          one_liner?: string | null
          persona?: string | null
          pricing_model?: string | null
          problem?: string | null
          revenue_model?: string | null
          signals_collected?: string | null
          strongest_objection?: string | null
          tags?: string[] | null
          unfair_advantage?: string | null
          updated_at?: string | null
          user_id: string
          validation_method?: string | null
        }
        Update: {
          attachments?: Json | null
          column_status?: string
          competition?: string | null
          created_at?: string | null
          distribution_hypothesis?: string | null
          existing_assets?: string | null
          gate_answers?: Json | null
          id?: string
          integrations?: string | null
          interest_score?: number | null
          key_metric?: string | null
          kill_criteria?: string | null
          market_size?: string | null
          mvp_scope?: string | null
          name?: string
          notes?: string | null
          one_liner?: string | null
          persona?: string | null
          pricing_model?: string | null
          problem?: string | null
          revenue_model?: string | null
          signals_collected?: string | null
          strongest_objection?: string | null
          tags?: string[] | null
          unfair_advantage?: string | null
          updated_at?: string | null
          user_id?: string
          validation_method?: string | null
        }
        Relationships: []
      }
      career_evaluations: {
        Row: {
          access_count: number | null
          access_token: string
          access_token_expires_at: string | null
          area: string | null
          atuacao: string | null
          auto_nurture_sequence: string | null
          best_contact_time: string | null
          budget_gap: string | null
          can_apply_jobs: boolean | null
          consentimento_marketing: boolean | null
          country_code: string | null
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
          referral_code: string | null
          referral_count: number
          referral_unlocked: boolean
          referred_by_code: string | null
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
          access_token_expires_at?: string | null
          area?: string | null
          atuacao?: string | null
          auto_nurture_sequence?: string | null
          best_contact_time?: string | null
          budget_gap?: string | null
          can_apply_jobs?: boolean | null
          consentimento_marketing?: boolean | null
          country_code?: string | null
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
          referral_code?: string | null
          referral_count?: number
          referral_unlocked?: boolean
          referred_by_code?: string | null
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
          access_token_expires_at?: string | null
          area?: string | null
          atuacao?: string | null
          auto_nurture_sequence?: string | null
          best_contact_time?: string | null
          budget_gap?: string | null
          can_apply_jobs?: boolean | null
          consentimento_marketing?: boolean | null
          country_code?: string | null
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
          referral_code?: string | null
          referral_count?: number
          referral_unlocked?: boolean
          referred_by_code?: string | null
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
      content_generation_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          generation_type: string
          id: string
          input_summary: string | null
          metadata: Json | null
          model_used: string | null
          output_summary: string | null
          status: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          generation_type: string
          id?: string
          input_summary?: string | null
          metadata?: Json | null
          model_used?: string | null
          output_summary?: string | null
          status?: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          generation_type?: string
          id?: string
          input_summary?: string | null
          metadata?: Json | null
          model_used?: string | null
          output_summary?: string | null
          status?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      content_ideas: {
        Row: {
          category: string
          content_type: string
          created_at: string
          data_points_used: Json | null
          description: string | null
          estimated_virality_score: number | null
          hooks: Json
          id: string
          insight_id: string | null
          metadata: Json | null
          notes: string | null
          priority: string
          scheduled_date: string | null
          status: string
          target_audience: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content_type: string
          created_at?: string
          data_points_used?: Json | null
          description?: string | null
          estimated_virality_score?: number | null
          hooks?: Json
          id?: string
          insight_id?: string | null
          metadata?: Json | null
          notes?: string | null
          priority?: string
          scheduled_date?: string | null
          status?: string
          target_audience?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_type?: string
          created_at?: string
          data_points_used?: Json | null
          description?: string | null
          estimated_virality_score?: number | null
          hooks?: Json
          id?: string
          insight_id?: string | null
          metadata?: Json | null
          notes?: string | null
          priority?: string
          scheduled_date?: string | null
          status?: string
          target_audience?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_ideas_insight_id_fkey"
            columns: ["insight_id"]
            isOneToOne: false
            referencedRelation: "content_insights"
            referencedColumns: ["id"]
          },
        ]
      }
      content_insights: {
        Row: {
          controversy_score: number | null
          created_at: string
          data_points: Json
          id: string
          insight_type: string
          period_end: string
          period_start: string
          relevance_score: number
          source_tables: string[]
          status: string
          summary: string
          title: string
          updated_at: string
          used_in_idea_id: string | null
        }
        Insert: {
          controversy_score?: number | null
          created_at?: string
          data_points?: Json
          id?: string
          insight_type: string
          period_end: string
          period_start: string
          relevance_score?: number
          source_tables?: string[]
          status?: string
          summary: string
          title: string
          updated_at?: string
          used_in_idea_id?: string | null
        }
        Update: {
          controversy_score?: number | null
          created_at?: string
          data_points?: Json
          id?: string
          insight_type?: string
          period_end?: string
          period_start?: string
          relevance_score?: number
          source_tables?: string[]
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          used_in_idea_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_content_insights_used_in_idea"
            columns: ["used_in_idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      content_scripts: {
        Row: {
          body_sections: Json
          created_at: string
          cta: string | null
          data_sources_summary: string | null
          duration_estimate_seconds: number | null
          hook: string
          id: string
          idea_id: string
          metadata: Json | null
          platform: string
          scheduled_for: string | null
          status: string
          title: string
          tone: string
          updated_at: string
          virality_score: number | null
        }
        Insert: {
          body_sections?: Json
          created_at?: string
          cta?: string | null
          data_sources_summary?: string | null
          duration_estimate_seconds?: number | null
          hook: string
          id?: string
          idea_id: string
          metadata?: Json | null
          platform: string
          scheduled_for?: string | null
          status?: string
          title: string
          tone?: string
          updated_at?: string
          virality_score?: number | null
        }
        Update: {
          body_sections?: Json
          created_at?: string
          cta?: string | null
          data_sources_summary?: string | null
          duration_estimate_seconds?: number | null
          hook?: string
          id?: string
          idea_id?: string
          metadata?: Json | null
          platform?: string
          scheduled_for?: string | null
          status?: string
          title?: string
          tone?: string
          updated_at?: string
          virality_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_scripts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      content_social_posts: {
        Row: {
          content: string
          created_at: string
          cta: string | null
          hashtags: string[] | null
          id: string
          metadata: Json | null
          platform: string
          scheduled_for: string | null
          script_id: string
          status: string
          tone: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          id?: string
          metadata?: Json | null
          platform: string
          scheduled_for?: string | null
          script_id: string
          status?: string
          tone?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          cta?: string | null
          hashtags?: string[] | null
          id?: string
          metadata?: Json | null
          platform?: string
          scheduled_for?: string | null
          script_id?: string
          status?: string
          tone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_social_posts_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "content_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lesson_attachments: {
        Row: {
          created_at: string | null
          display_order: number | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lesson_attachments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          bunny_video_id: string | null
          captions_generated: boolean | null
          content_html: string | null
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_free_preview: boolean | null
          is_published: boolean | null
          module_id: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_duration_seconds: number | null
          video_status: string | null
          video_url: string | null
        }
        Insert: {
          bunny_video_id?: string | null
          captions_generated?: boolean | null
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_free_preview?: boolean | null
          is_published?: boolean | null
          module_id: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_status?: string | null
          video_url?: string | null
        }
        Update: {
          bunny_video_id?: string | null
          captions_generated?: boolean | null
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_free_preview?: boolean | null
          is_published?: boolean | null
          module_id?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_duration_seconds?: number | null
          video_status?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_milestones: {
        Row: {
          email_sent: boolean | null
          espaco_id: string
          id: string
          milestone: number
          reached_at: string | null
          user_id: string
        }
        Insert: {
          email_sent?: boolean | null
          espaco_id: string
          id?: string
          milestone: number
          reached_at?: string | null
          user_id: string
        }
        Update: {
          email_sent?: boolean | null
          espaco_id?: string
          id?: string
          milestone?: number
          reached_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_milestones_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number
          espaco_id: string
          id: string
          is_published: boolean | null
          title: string
          unlock_days_after_enrollment: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          espaco_id: string
          id?: string
          is_published?: boolean | null
          title: string
          unlock_days_after_enrollment?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number
          espaco_id?: string
          id?: string
          is_published?: boolean | null
          title?: string
          unlock_days_after_enrollment?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
        ]
      }
      course_progress: {
        Row: {
          completed_at: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          status: string | null
          updated_at: string | null
          user_id: string
          watch_percentage: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          watch_percentage?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          watch_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string | null
          id: string
          passed: boolean
          quiz_id: string
          score: number
          started_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json
          completed_at?: string | null
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          started_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          display_order: number
          explanation: string | null
          id: string
          options: Json
          question_text: string
          question_type: string
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          display_order?: number
          explanation?: string | null
          id?: string
          options?: Json
          question_text: string
          question_type?: string
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          display_order?: number
          explanation?: string | null
          id?: string
          options?: Json
          question_text?: string
          question_type?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "course_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      course_quizzes: {
        Row: {
          created_at: string | null
          id: string
          is_required: boolean | null
          lesson_id: string
          max_attempts: number | null
          passing_grade: number
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id: string
          max_attempts?: number | null
          passing_grade?: number
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          lesson_id?: string
          max_attempts?: number | null
          passing_grade?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_analytics_snapshots: {
        Row: {
          ai_summary: string | null
          cost_usd: number | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error_message: string | null
          generation_method: string
          id: string
          model_used: string | null
          raw_metrics: Json | null
          snapshot_date: string
          status: string
          tokens_used: number | null
          webhook_dispatched: boolean | null
        }
        Insert: {
          ai_summary?: string | null
          cost_usd?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          generation_method?: string
          id?: string
          model_used?: string | null
          raw_metrics?: Json | null
          snapshot_date: string
          status?: string
          tokens_used?: number | null
          webhook_dispatched?: boolean | null
        }
        Update: {
          ai_summary?: string | null
          cost_usd?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          generation_method?: string
          id?: string
          model_used?: string | null
          raw_metrics?: Json | null
          snapshot_date?: string
          status?: string
          tokens_used?: number | null
          webhook_dispatched?: boolean | null
        }
        Relationships: []
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
      email_automations: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          drip_steps: Json | null
          enabled: boolean | null
          id: string
          is_drip: boolean | null
          last_triggered_at: string | null
          metadata: Json | null
          name: string
          template_name: string | null
          template_variables: Json | null
          total_sent: number | null
          total_skipped: number | null
          trigger_condition: Json | null
          trigger_cron: string | null
          trigger_event: string | null
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          drip_steps?: Json | null
          enabled?: boolean | null
          id?: string
          is_drip?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name: string
          template_name?: string | null
          template_variables?: Json | null
          total_sent?: number | null
          total_skipped?: number | null
          trigger_condition?: Json | null
          trigger_cron?: string | null
          trigger_event?: string | null
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          drip_steps?: Json | null
          enabled?: boolean | null
          id?: string
          is_drip?: boolean | null
          last_triggered_at?: string | null
          metadata?: Json | null
          name?: string
          template_name?: string | null
          template_variables?: Json | null
          total_sent?: number | null
          total_skipped?: number | null
          trigger_condition?: Json | null
          trigger_cron?: string | null
          trigger_event?: string | null
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      email_campaign_contacts: {
        Row: {
          campaign_id: string
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          lead_id: string | null
          position: number
          processed_at: string | null
          recipient_name: string | null
          resend_id: string | null
          skip_reason: string | null
          status: string
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          position?: number
          processed_at?: string | null
          recipient_name?: string | null
          resend_id?: string | null
          skip_reason?: string | null
          status?: string
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          lead_id?: string | null
          position?: number
          processed_at?: string | null
          recipient_name?: string | null
          resend_id?: string | null
          skip_reason?: string | null
          status?: string
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_contacts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_events: {
        Row: {
          automation_id: string | null
          campaign_contact_id: string | null
          campaign_id: string | null
          created_at: string | null
          email: string
          event_type: string
          id: string
          ip_address: string | null
          link_url: string | null
          user_agent: string | null
        }
        Insert: {
          automation_id?: string | null
          campaign_contact_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          email: string
          event_type: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          user_agent?: string | null
        }
        Update: {
          automation_id?: string | null
          campaign_contact_id?: string | null
          campaign_id?: string | null
          created_at?: string | null
          email?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          link_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_events_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_events_campaign_contact_id_fkey"
            columns: ["campaign_contact_id"]
            isOneToOne: false
            referencedRelation: "email_campaign_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_campaign_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience_filters: Json | null
          audience_type: string
          completed_at: string | null
          contacts_failed: number | null
          contacts_per_cycle: number
          contacts_queued: number | null
          contacts_sent: number | null
          contacts_skipped: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          error_rate: number | null
          id: string
          last_cycle_at: string | null
          metadata: Json | null
          name: string
          paused_at: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          template_name: string
          template_variables: Json | null
          total_contacts: number | null
          updated_at: string | null
        }
        Insert: {
          audience_filters?: Json | null
          audience_type: string
          completed_at?: string | null
          contacts_failed?: number | null
          contacts_per_cycle?: number
          contacts_queued?: number | null
          contacts_sent?: number | null
          contacts_skipped?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_rate?: number | null
          id?: string
          last_cycle_at?: string | null
          metadata?: Json | null
          name: string
          paused_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          template_name: string
          template_variables?: Json | null
          total_contacts?: number | null
          updated_at?: string | null
        }
        Update: {
          audience_filters?: Json | null
          audience_type?: string
          completed_at?: string | null
          contacts_failed?: number | null
          contacts_per_cycle?: number
          contacts_queued?: number | null
          contacts_sent?: number | null
          contacts_skipped?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          error_rate?: number | null
          id?: string
          last_cycle_at?: string | null
          metadata?: Json | null
          name?: string
          paused_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          template_name?: string
          template_variables?: Json | null
          total_contacts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      email_drip_enrollments: {
        Row: {
          automation_id: string
          created_at: string | null
          current_step: number
          email: string
          id: string
          lead_id: string | null
          next_send_at: string
          recipient_name: string | null
          status: string
          steps_completed: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          automation_id: string
          created_at?: string | null
          current_step?: number
          email: string
          id?: string
          lead_id?: string | null
          next_send_at: string
          recipient_name?: string | null
          status?: string
          steps_completed?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          automation_id?: string
          created_at?: string | null
          current_step?: number
          email?: string
          id?: string
          lead_id?: string | null
          next_send_at?: string
          recipient_name?: string | null
          status?: string
          steps_completed?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_drip_enrollments_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string | null
          edge_function: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string
          resend_id: string | null
          status: string
          subject: string | null
          template_name: string
        }
        Insert: {
          created_at?: string | null
          edge_function?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          resend_id?: string | null
          status: string
          subject?: string | null
          template_name: string
        }
        Update: {
          created_at?: string | null
          edge_function?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          resend_id?: string | null
          status?: string
          subject?: string | null
          template_name?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          design_json: Json | null
          display_name: string
          enabled: boolean | null
          id: string
          name: string
          subject: string
          updated_at: string | null
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          body_html: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design_json?: Json | null
          display_name: string
          enabled?: boolean | null
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          body_html?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          design_json?: Json | null
          display_name?: string
          enabled?: boolean | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          automation_id: string | null
          campaign_id: string | null
          email: string
          metadata: Json | null
          source: string
          unsubscribed_at: string
        }
        Insert: {
          automation_id?: string | null
          campaign_id?: string | null
          email: string
          metadata?: Json | null
          source?: string
          unsubscribed_at?: string
        }
        Update: {
          automation_id?: string | null
          campaign_id?: string | null
          email?: string
          metadata?: Json | null
          source?: string
          unsubscribed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_unsubscribes_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "email_automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_unsubscribes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
          anchor_price: number | null
          category: string | null
          created_at: string | null
          cta_text: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          duration: string | null
          espaco_id: string | null
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
          order_bump_service_id: string | null
          plan_feature_key: string | null
          price: number | null
          price_display: string | null
          product_type: string | null
          redirect_url: string | null
          report_dimension: string | null
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
          anchor_price?: number | null
          category?: string | null
          created_at?: string | null
          cta_text?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          espaco_id?: string | null
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
          order_bump_service_id?: string | null
          plan_feature_key?: string | null
          price?: number | null
          price_display?: string | null
          product_type?: string | null
          redirect_url?: string | null
          report_dimension?: string | null
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
          anchor_price?: number | null
          category?: string | null
          created_at?: string | null
          cta_text?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          duration?: string | null
          espaco_id?: string | null
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
          order_bump_service_id?: string | null
          plan_feature_key?: string | null
          price?: number | null
          price_display?: string | null
          product_type?: string | null
          redirect_url?: string | null
          report_dimension?: string | null
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
        Relationships: [
          {
            foreignKeyName: "hub_services_espaco_id_fkey"
            columns: ["espaco_id"]
            isOneToOne: false
            referencedRelation: "espacos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hub_services_order_bump_service_id_fkey"
            columns: ["order_bump_service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
        ]
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
      job_imports: {
        Row: {
          created_at: string | null
          errors: Json | null
          file_name: string
          id: string
          imported_by: string
          inserted: number
          raw_json: Json | null
          skipped: number
          total_jobs: number
          updated: number
        }
        Insert: {
          created_at?: string | null
          errors?: Json | null
          file_name: string
          id?: string
          imported_by: string
          inserted?: number
          raw_json?: Json | null
          skipped?: number
          total_jobs?: number
          updated?: number
        }
        Update: {
          created_at?: string | null
          errors?: Json | null
          file_name?: string
          id?: string
          imported_by?: string
          inserted?: number
          raw_json?: Json | null
          skipped?: number
          total_jobs?: number
          updated?: number
        }
        Relationships: []
      }
      job_link_clicks: {
        Row: {
          clicked_at: string | null
          id: string
          job_id: string
          link_type: string
          user_id: string
        }
        Insert: {
          clicked_at?: string | null
          id?: string
          job_id: string
          link_type: string
          user_id: string
        }
        Update: {
          clicked_at?: string | null
          id?: string
          job_id?: string
          link_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_link_clicks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "brazil_friendly_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_link_clicks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          ai_enrichment: Json | null
          company: string
          contact_name: string | null
          contact_profile_link: string | null
          created_at: string | null
          description: string | null
          employment_type: string | null
          error: string | null
          experience_level: string | null
          expires_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          is_brazil_friendly: boolean | null
          is_featured: boolean | null
          job_category: string | null
          location: string | null
          location_restrictions: string | null
          logo_url: string | null
          posted_at: string | null
          relevance_notes: string | null
          relevance_score: number | null
          remote_type: string | null
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          salary_notes: string | null
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
          ai_enrichment?: Json | null
          company: string
          contact_name?: string | null
          contact_profile_link?: string | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          error?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_brazil_friendly?: boolean | null
          is_featured?: boolean | null
          job_category?: string | null
          location?: string | null
          location_restrictions?: string | null
          logo_url?: string | null
          posted_at?: string | null
          relevance_notes?: string | null
          relevance_score?: number | null
          remote_type?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_notes?: string | null
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
          ai_enrichment?: Json | null
          company?: string
          contact_name?: string | null
          contact_profile_link?: string | null
          created_at?: string | null
          description?: string | null
          employment_type?: string | null
          error?: string | null
          experience_level?: string | null
          expires_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          is_brazil_friendly?: boolean | null
          is_featured?: boolean | null
          job_category?: string | null
          location?: string | null
          location_restrictions?: string | null
          logo_url?: string | null
          posted_at?: string | null
          relevance_notes?: string | null
          relevance_score?: number | null
          remote_type?: string | null
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          salary_notes?: string | null
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
      lead_interactions: {
        Row: {
          channel: string | null
          content: string | null
          created_at: string
          created_by: string | null
          direction: string | null
          id: string
          lead_id: string
          metadata: Json | null
          type: string
        }
        Insert: {
          channel?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          type: string
        }
        Update: {
          channel?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_interactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tasks: {
        Row: {
          ai_generation_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string
          priority: string
          source: string
          status: string
          title: string
          type: string
          updated_at: string
          whatsapp_message: string | null
        }
        Insert: {
          ai_generation_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id: string
          priority?: string
          source?: string
          status?: string
          title: string
          type: string
          updated_at?: string
          whatsapp_message?: string | null
        }
        Update: {
          ai_generation_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string
          priority?: string
          source?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          whatsapp_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      library_folders: {
        Row: {
          access_level: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          access_level?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      library_item_downloads: {
        Row: {
          downloaded_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_item_downloads_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_item_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_item_favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          file_size: number | null
          file_type: string | null
          file_url: string | null
          filename: string | null
          folder_id: string
          id: string
          item_type: string
          link_url: string | null
          tags: string[]
          title: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          filename?: string | null
          folder_id: string
          id?: string
          item_type: string
          link_url?: string | null
          tags?: string[]
          title: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          file_size?: number | null
          file_type?: string | null
          file_url?: string | null
          filename?: string | null
          folder_id?: string
          id?: string
          item_type?: string
          link_url?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "library_items_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "library_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      live_guest_participants: {
        Row: {
          added_by: string
          attended: boolean
          created_at: string
          email: string
          id: string
          live_id: string
          name: string
          phone: string | null
        }
        Insert: {
          added_by: string
          attended?: boolean
          created_at?: string
          email: string
          id?: string
          live_id: string
          name: string
          phone?: string | null
        }
        Update: {
          added_by?: string
          attended?: boolean
          created_at?: string
          email?: string
          id?: string
          live_id?: string
          name?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_guest_participants_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "lives"
            referencedColumns: ["id"]
          },
        ]
      }
      live_registrations: {
        Row: {
          attended: boolean
          id: string
          live_id: string
          payment_status: string
          registered_at: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          id?: string
          live_id: string
          payment_status?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          attended?: boolean
          id?: string
          live_id?: string
          payment_status?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_registrations_live_id_fkey"
            columns: ["live_id"]
            isOneToOne: false
            referencedRelation: "lives"
            referencedColumns: ["id"]
          },
        ]
      }
      lives: {
        Row: {
          access_type: Database["public"]["Enums"]["live_access_type"]
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          long_description: string | null
          max_attendees: number | null
          meeting_link: string | null
          mentor_id: string
          mentor_notes: string | null
          og_image_url: string | null
          price: number
          recording_url: string | null
          scheduled_at: string
          slug: string
          status: Database["public"]["Enums"]["live_status"]
          thumbnail_url: string | null
          ticto_checkout_url: string | null
          ticto_product_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          access_type?: Database["public"]["Enums"]["live_access_type"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          long_description?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          mentor_id: string
          mentor_notes?: string | null
          og_image_url?: string | null
          price?: number
          recording_url?: string | null
          scheduled_at: string
          slug: string
          status?: Database["public"]["Enums"]["live_status"]
          thumbnail_url?: string | null
          ticto_checkout_url?: string | null
          ticto_product_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          access_type?: Database["public"]["Enums"]["live_access_type"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          long_description?: string | null
          max_attendees?: number | null
          meeting_link?: string | null
          mentor_id?: string
          mentor_notes?: string | null
          og_image_url?: string | null
          price?: number
          recording_url?: string | null
          scheduled_at?: string
          slug?: string
          status?: Database["public"]["Enums"]["live_status"]
          thumbnail_url?: string | null
          ticto_checkout_url?: string | null
          ticto_product_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      manychat_flow_logs: {
        Row: {
          channel: string
          created_at: string
          flow_id: string | null
          flow_name: string
          id: string
          lead_id: string
          metadata: Json
          status: string
          trigger_source: string
          triggered_by: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          flow_id?: string | null
          flow_name: string
          id?: string
          lead_id: string
          metadata?: Json
          status?: string
          trigger_source: string
          triggered_by?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          flow_id?: string | null
          flow_name?: string
          id?: string
          lead_id?: string
          metadata?: Json
          status?: string
          trigger_source?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manychat_flow_logs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "manychat_flows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manychat_flow_logs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manychat_flows: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          email_fallback_template: string | null
          enabled: boolean
          hsm_template_language: string
          hsm_template_name: string | null
          hsm_template_params: Json
          hsm_template_preview: string | null
          id: string
          mc_flow_ns: string | null
          name: string
          requires_phone: boolean
          sort_order: number
          trigger_type: string
          updated_at: string
          use_case: string
          variables: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          email_fallback_template?: string | null
          enabled?: boolean
          hsm_template_language?: string
          hsm_template_name?: string | null
          hsm_template_params?: Json
          hsm_template_preview?: string | null
          id?: string
          mc_flow_ns?: string | null
          name: string
          requires_phone?: boolean
          sort_order?: number
          trigger_type?: string
          updated_at?: string
          use_case: string
          variables?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          email_fallback_template?: string | null
          enabled?: boolean
          hsm_template_language?: string
          hsm_template_name?: string | null
          hsm_template_params?: Json
          hsm_template_preview?: string | null
          id?: string
          mc_flow_ns?: string | null
          name?: string
          requires_phone?: boolean
          sort_order?: number
          trigger_type?: string
          updated_at?: string
          use_case?: string
          variables?: Json
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
          default_meeting_link: string | null
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
          default_meeting_link?: string | null
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
          default_meeting_link?: string | null
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
            foreignKeyName: "mentor_services_mentor_profile_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mentor_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_automations: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          cron_job_name: string | null
          description: string | null
          display_name: string
          enabled: boolean | null
          headers: Json | null
          id: string
          last_status: string | null
          last_triggered_at: string | null
          max_retries: number | null
          metadata: Json | null
          name: string
          timeout_ms: number | null
          trigger_event: string
          updated_at: string | null
          updated_by: string | null
          webhook_method: string
          webhook_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          cron_job_name?: string | null
          description?: string | null
          display_name: string
          enabled?: boolean | null
          headers?: Json | null
          id?: string
          last_status?: string | null
          last_triggered_at?: string | null
          max_retries?: number | null
          metadata?: Json | null
          name: string
          timeout_ms?: number | null
          trigger_event: string
          updated_at?: string | null
          updated_by?: string | null
          webhook_method?: string
          webhook_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          cron_job_name?: string | null
          description?: string | null
          display_name?: string
          enabled?: boolean | null
          headers?: Json | null
          id?: string
          last_status?: string | null
          last_triggered_at?: string | null
          max_retries?: number | null
          metadata?: Json | null
          name?: string
          timeout_ms?: number | null
          trigger_event?: string
          updated_at?: string | null
          updated_by?: string | null
          webhook_method?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      n8n_webhook_logs: {
        Row: {
          automation_id: string | null
          automation_name: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          metadata: Json | null
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_attempt: number | null
          status: string
          trigger_event: string
        }
        Insert: {
          automation_id?: string | null
          automation_name: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_attempt?: number | null
          status?: string
          trigger_event: string
        }
        Update: {
          automation_id?: string | null
          automation_name?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_attempt?: number | null
          status?: string
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "n8n_webhook_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "n8n_automations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_type_configs: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          display_name: string
          email_enabled: boolean | null
          icon: string | null
          id: string
          in_app_enabled: boolean | null
          type_key: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          email_enabled?: boolean | null
          icon?: string | null
          id?: string
          in_app_enabled?: boolean | null
          type_key: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          email_enabled?: boolean | null
          icon?: string | null
          id?: string
          in_app_enabled?: boolean | null
          type_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          icon: string | null
          id: string
          message: string | null
          metadata: Json | null
          read_at: string | null
          sent_at: string | null
          session_id: string | null
          status: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          session_id?: string | null
          status?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read_at?: string | null
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
      orders: {
        Row: {
          amount: number
          billing_cycle: string | null
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          plan_id: string | null
          product_name: string
          product_type: string
          service_id: string | null
          status: string
          subscription_id: string | null
          ticto_event_type: string | null
          ticto_order_id: string | null
          ticto_transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          plan_id?: string | null
          product_name: string
          product_type: string
          service_id?: string | null
          status?: string
          subscription_id?: string | null
          ticto_event_type?: string | null
          ticto_order_id?: string | null
          ticto_transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string | null
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          plan_id?: string | null
          product_name?: string
          product_type?: string
          service_id?: string | null
          status?: string
          subscription_id?: string | null
          ticto_event_type?: string | null
          ticto_order_id?: string | null
          ticto_transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "hub_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
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
      payment_logs_backup_20260222: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string | null
          payload: Json | null
          processed_at: string | null
          service_id: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          payload?: Json | null
          processed_at?: string | null
          service_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string | null
          payload?: Json | null
          processed_at?: string | null
          service_id?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          cta_text: string
          description: string | null
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
          ticto_checkout_url_annual: string | null
          ticto_checkout_url_monthly: string | null
          ticto_offer_id_annual: string | null
          ticto_offer_id_monthly: string | null
        }
        Insert: {
          created_at?: string
          cta_text?: string
          description?: string | null
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
          ticto_checkout_url_annual?: string | null
          ticto_checkout_url_monthly?: string | null
          ticto_offer_id_annual?: string | null
          ticto_offer_id_monthly?: string | null
        }
        Update: {
          created_at?: string
          cta_text?: string
          description?: string | null
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
          ticto_checkout_url_annual?: string | null
          ticto_checkout_url_monthly?: string | null
          ticto_offer_id_annual?: string | null
          ticto_offer_id_monthly?: string | null
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
          anos_experiencia: string | null
          area_profissional: string | null
          birth_date: string | null
          cargo_atual: string | null
          composicao_familiar: string | null
          created_at: string | null
          current_city: string | null
          current_country: string | null
          current_state: string | null
          email: string
          faixa_investimento: string | null
          faixa_renda: string | null
          full_name: string
          guided_tour_state: Json | null
          has_completed_onboarding: boolean | null
          id: string
          is_whatsapp: boolean | null
          last_login_at: string | null
          linkedin_url: string | null
          maior_duvida: string | null
          nivel_ingles: string | null
          objetivo: string | null
          phone: string | null
          phone_country_code: string | null
          prazo_movimento: string | null
          preferred_name: string | null
          principal_obstaculo: string | null
          profile_photo_url: string | null
          resume_url: string | null
          status: string | null
          status_visto: string | null
          target_country: string | null
          timezone: string | null
          trabalha_internacional: string | null
          updated_at: string | null
        }
        Insert: {
          alternative_email?: string | null
          anos_experiencia?: string | null
          area_profissional?: string | null
          birth_date?: string | null
          cargo_atual?: string | null
          composicao_familiar?: string | null
          created_at?: string | null
          current_city?: string | null
          current_country?: string | null
          current_state?: string | null
          email: string
          faixa_investimento?: string | null
          faixa_renda?: string | null
          full_name: string
          guided_tour_state?: Json | null
          has_completed_onboarding?: boolean | null
          id: string
          is_whatsapp?: boolean | null
          last_login_at?: string | null
          linkedin_url?: string | null
          maior_duvida?: string | null
          nivel_ingles?: string | null
          objetivo?: string | null
          phone?: string | null
          phone_country_code?: string | null
          prazo_movimento?: string | null
          preferred_name?: string | null
          principal_obstaculo?: string | null
          profile_photo_url?: string | null
          resume_url?: string | null
          status?: string | null
          status_visto?: string | null
          target_country?: string | null
          timezone?: string | null
          trabalha_internacional?: string | null
          updated_at?: string | null
        }
        Update: {
          alternative_email?: string | null
          anos_experiencia?: string | null
          area_profissional?: string | null
          birth_date?: string | null
          cargo_atual?: string | null
          composicao_familiar?: string | null
          created_at?: string | null
          current_city?: string | null
          current_country?: string | null
          current_state?: string | null
          email?: string
          faixa_investimento?: string | null
          faixa_renda?: string | null
          full_name?: string
          guided_tour_state?: Json | null
          has_completed_onboarding?: boolean | null
          id?: string
          is_whatsapp?: boolean | null
          last_login_at?: string | null
          linkedin_url?: string | null
          maior_duvida?: string | null
          nivel_ingles?: string | null
          objetivo?: string | null
          phone?: string | null
          phone_country_code?: string | null
          prazo_movimento?: string | null
          preferred_name?: string | null
          principal_obstaculo?: string | null
          profile_photo_url?: string | null
          resume_url?: string | null
          status?: string | null
          status_visto?: string | null
          target_country?: string | null
          timezone?: string | null
          trabalha_internacional?: string | null
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
      sdr_campaigns: {
        Row: {
          ai_context: string | null
          ai_persona: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          sequence: Json
          started_at: string | null
          status: string
          target_criteria: Json | null
          total_converted: number
          total_prospects: number
          total_replied: number
          total_sent: number
          updated_at: string
        }
        Insert: {
          ai_context?: string | null
          ai_persona?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sequence?: Json
          started_at?: string | null
          status?: string
          target_criteria?: Json | null
          total_converted?: number
          total_prospects?: number
          total_replied?: number
          total_sent?: number
          updated_at?: string
        }
        Update: {
          ai_context?: string | null
          ai_persona?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sequence?: Json
          started_at?: string | null
          status?: string
          target_criteria?: Json | null
          total_converted?: number
          total_prospects?: number
          total_replied?: number
          total_sent?: number
          updated_at?: string
        }
        Relationships: []
      }
      sdr_message_templates: {
        Row: {
          ai_instructions: string | null
          body_template: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          performance_score: number | null
          subject_template: string | null
          template_key: string
          updated_at: string
          variant: string
        }
        Insert: {
          ai_instructions?: string | null
          body_template: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          performance_score?: number | null
          subject_template?: string | null
          template_key: string
          updated_at?: string
          variant?: string
        }
        Update: {
          ai_instructions?: string | null
          body_template?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          performance_score?: number | null
          subject_template?: string | null
          template_key?: string
          updated_at?: string
          variant?: string
        }
        Relationships: []
      }
      sdr_outreach_logs: {
        Row: {
          ai_generation_metadata: Json | null
          campaign_id: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          message_body: string
          opened_at: string | null
          prospect_id: string
          replied_at: string | null
          sent_at: string | null
          status: string
          step_number: number
          subject: string | null
        }
        Insert: {
          ai_generation_metadata?: Json | null
          campaign_id?: string | null
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_body: string
          opened_at?: string | null
          prospect_id: string
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          step_number: number
          subject?: string | null
        }
        Update: {
          ai_generation_metadata?: Json | null
          campaign_id?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message_body?: string
          opened_at?: string | null
          prospect_id?: string
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          step_number?: number
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sdr_outreach_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sdr_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_outreach_logs_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "sdr_prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_prospects: {
        Row: {
          ai_qualification: Json | null
          ai_qualified_at: string | null
          ai_score: number | null
          ai_temperature: string | null
          bio: string | null
          campaign_id: string | null
          company: string | null
          converted_evaluation_id: string | null
          created_at: string
          current_step: number
          email: string | null
          english_level: string | null
          experience_years: number | null
          headline: string | null
          id: string
          instagram_handle: string | null
          last_contacted_at: string | null
          last_replied_at: string | null
          linkedin_url: string | null
          location: string | null
          name: string
          next_outreach_at: string | null
          outreach_status: string
          phone: string | null
          skills: string[] | null
          source: string
          source_metadata: Json | null
          updated_at: string
        }
        Insert: {
          ai_qualification?: Json | null
          ai_qualified_at?: string | null
          ai_score?: number | null
          ai_temperature?: string | null
          bio?: string | null
          campaign_id?: string | null
          company?: string | null
          converted_evaluation_id?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          english_level?: string | null
          experience_years?: number | null
          headline?: string | null
          id?: string
          instagram_handle?: string | null
          last_contacted_at?: string | null
          last_replied_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          name: string
          next_outreach_at?: string | null
          outreach_status?: string
          phone?: string | null
          skills?: string[] | null
          source?: string
          source_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          ai_qualification?: Json | null
          ai_qualified_at?: string | null
          ai_score?: number | null
          ai_temperature?: string | null
          bio?: string | null
          campaign_id?: string | null
          company?: string | null
          converted_evaluation_id?: string | null
          created_at?: string
          current_step?: number
          email?: string | null
          english_level?: string | null
          experience_years?: number | null
          headline?: string | null
          id?: string
          instagram_handle?: string | null
          last_contacted_at?: string | null
          last_replied_at?: string | null
          linkedin_url?: string | null
          location?: string | null
          name?: string
          next_outreach_at?: string | null
          outreach_status?: string
          phone?: string | null
          skills?: string[] | null
          source?: string
          source_metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_prospects_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sdr_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_replies: {
        Row: {
          ai_classification: Json | null
          ai_intent: string | null
          ai_sentiment: string | null
          ai_suggested_action: string | null
          channel: string
          created_at: string
          id: string
          outreach_log_id: string | null
          prospect_id: string
          raw_message: string
        }
        Insert: {
          ai_classification?: Json | null
          ai_intent?: string | null
          ai_sentiment?: string | null
          ai_suggested_action?: string | null
          channel: string
          created_at?: string
          id?: string
          outreach_log_id?: string | null
          prospect_id: string
          raw_message: string
        }
        Update: {
          ai_classification?: Json | null
          ai_intent?: string | null
          ai_sentiment?: string | null
          ai_suggested_action?: string | null
          channel?: string
          created_at?: string
          id?: string
          outreach_log_id?: string | null
          prospect_id?: string
          raw_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "sdr_replies_outreach_log_id_fkey"
            columns: ["outreach_log_id"]
            isOneToOne: false
            referencedRelation: "sdr_outreach_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sdr_replies_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "sdr_prospects"
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
          capacity: number | null
          created_at: string | null
          created_by: string | null
          datetime: string
          description: string | null
          duration_minutes: number | null
          espaco_id: string | null
          gradient_end: string | null
          gradient_preset: string | null
          gradient_start: string | null
          id: string
          is_public: boolean
          is_recurring: boolean | null
          meeting_link: string | null
          price: number
          recording_url: string | null
          recurrence_pattern: Json | null
          status: Database["public"]["Enums"]["session_status"] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          datetime: string
          description?: string | null
          duration_minutes?: number | null
          espaco_id?: string | null
          gradient_end?: string | null
          gradient_preset?: string | null
          gradient_start?: string | null
          id?: string
          is_public?: boolean
          is_recurring?: boolean | null
          meeting_link?: string | null
          price?: number
          recording_url?: string | null
          recurrence_pattern?: Json | null
          status?: Database["public"]["Enums"]["session_status"] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          created_by?: string | null
          datetime?: string
          description?: string | null
          duration_minutes?: number | null
          espaco_id?: string | null
          gradient_end?: string | null
          gradient_preset?: string | null
          gradient_start?: string | null
          id?: string
          is_public?: boolean
          is_recurring?: boolean | null
          meeting_link?: string | null
          price?: number
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
      subscription_cancellation_surveys: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          reason: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          reason: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          reason?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_cancellation_surveys_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          processed_at: string
          subscription_id: string | null
          ticto_transaction_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          processed_at?: string
          subscription_id?: string | null
          ticto_transaction_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          processed_at?: string
          subscription_id?: string | null
          ticto_transaction_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
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
          credits_used: number
          id: string
          user_id: string
        }
        Insert: {
          app_id?: string
          created_at?: string
          credits_used?: number
          id?: string
          user_id: string
        }
        Update: {
          app_id?: string
          created_at?: string
          credits_used?: number
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
          access_source: string
          expires_at: string | null
          id: string
          metadata: Json
          service_id: string
          sessions_total: number | null
          sessions_used: number
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          access_source?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          service_id: string
          sessions_total?: number | null
          sessions_used?: number
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          access_source?: string
          expires_at?: string | null
          id?: string
          metadata?: Json
          service_id?: string
          sessions_total?: number | null
          sessions_used?: number
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
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          in_app_enabled: boolean | null
          type_key: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          type_key: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          in_app_enabled?: boolean | null
          type_key?: string
          user_id?: string
        }
        Relationships: []
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
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created_at: string
          dunning_stage: number | null
          expires_at: string | null
          grace_period_ends_at: string | null
          id: string
          last_payment_attempt: string | null
          next_billing_date: string | null
          plan_id: string
          starts_at: string
          status: string
          terms_accepted_at: string | null
          terms_version: string | null
          ticto_change_card_url: string | null
          ticto_offer_id: string | null
          ticto_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          dunning_stage?: number | null
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_payment_attempt?: string | null
          next_billing_date?: string | null
          plan_id: string
          starts_at?: string
          status?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          ticto_change_card_url?: string | null
          ticto_offer_id?: string | null
          ticto_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created_at?: string
          dunning_stage?: number | null
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          last_payment_attempt?: string | null
          next_billing_date?: string | null
          plan_id?: string
          starts_at?: string
          status?: string
          terms_accepted_at?: string | null
          terms_version?: string | null
          ticto_change_card_url?: string | null
          ticto_offer_id?: string | null
          ticto_subscription_id?: string | null
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
      waitlist_mentoriarota: {
        Row: {
          contacted_at: string | null
          created_at: string
          email: string
          enrolled_at: string | null
          id: string
          name: string
          notes: string | null
          referrer: string | null
          status: Database["public"]["Enums"]["waitlist_mentoriarota_status"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          whatsapp: string
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          email: string
          enrolled_at?: string | null
          id?: string
          name: string
          notes?: string | null
          referrer?: string | null
          status?: Database["public"]["Enums"]["waitlist_mentoriarota_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp: string
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          email?: string
          enrolled_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          referrer?: string | null
          status?: Database["public"]["Enums"]["waitlist_mentoriarota_status"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      weekly_intelligence_reports: {
        Row: {
          ai_analysis: Json | null
          ai_analysis_text: string | null
          approved_for_assistant: boolean
          assistant_directives: string | null
          cost_usd: number | null
          created_at: string
          created_by: string | null
          duration_ms: number | null
          error_message: string | null
          generation_method: string
          id: string
          model_used: string | null
          period_end: string
          period_start: string
          raw_metrics: Json | null
          status: string
          tokens_used: number | null
          webhook_dispatched: boolean | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analysis_text?: string | null
          approved_for_assistant?: boolean
          assistant_directives?: string | null
          cost_usd?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          generation_method?: string
          id?: string
          model_used?: string | null
          period_end: string
          period_start: string
          raw_metrics?: Json | null
          status?: string
          tokens_used?: number | null
          webhook_dispatched?: boolean | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_analysis_text?: string | null
          approved_for_assistant?: boolean
          assistant_directives?: string | null
          cost_usd?: number | null
          created_at?: string
          created_by?: string | null
          duration_ms?: number | null
          error_message?: string | null
          generation_method?: string
          id?: string
          model_used?: string | null
          period_end?: string
          period_start?: string
          raw_metrics?: Json | null
          status?: string
          tokens_used?: number | null
          webhook_dispatched?: boolean | null
        }
        Relationships: []
      }
      whatsapp_batch_contacts: {
        Row: {
          batch_job_id: string
          created_at: string | null
          error_message: string | null
          id: string
          lead_email: string | null
          lead_id: string | null
          lead_name: string | null
          phone: string
          position: number
          processed_at: string | null
          session_id: string | null
          skip_reason: string | null
          status: string
          variables: Json | null
        }
        Insert: {
          batch_job_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          phone: string
          position?: number
          processed_at?: string | null
          session_id?: string | null
          skip_reason?: string | null
          status?: string
          variables?: Json | null
        }
        Update: {
          batch_job_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          lead_email?: string | null
          lead_id?: string | null
          lead_name?: string | null
          phone?: string
          position?: number
          processed_at?: string | null
          session_id?: string | null
          skip_reason?: string | null
          status?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_batch_contacts_batch_job_id_fkey"
            columns: ["batch_job_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_batch_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_batch_contacts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_flow_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_batch_jobs: {
        Row: {
          business_hours_only: boolean | null
          completed_at: string | null
          contacts_failed: number | null
          contacts_per_cycle: number
          contacts_queued: number | null
          contacts_sent: number | null
          contacts_skipped: number | null
          created_at: string | null
          created_by: string | null
          error_rate: number | null
          flow_id: string
          id: string
          last_cycle_at: string | null
          metadata: Json | null
          name: string
          paused_at: string | null
          scheduled_at: string | null
          source_config: Json | null
          source_type: string
          started_at: string | null
          status: string
          total_contacts: number | null
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          completed_at?: string | null
          contacts_failed?: number | null
          contacts_per_cycle?: number
          contacts_queued?: number | null
          contacts_sent?: number | null
          contacts_skipped?: number | null
          created_at?: string | null
          created_by?: string | null
          error_rate?: number | null
          flow_id: string
          id?: string
          last_cycle_at?: string | null
          metadata?: Json | null
          name: string
          paused_at?: string | null
          scheduled_at?: string | null
          source_config?: Json | null
          source_type: string
          started_at?: string | null
          status?: string
          total_contacts?: number | null
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          completed_at?: string | null
          contacts_failed?: number | null
          contacts_per_cycle?: number
          contacts_queued?: number | null
          contacts_sent?: number | null
          contacts_skipped?: number | null
          created_at?: string | null
          created_by?: string | null
          error_rate?: number | null
          flow_id?: string
          id?: string
          last_cycle_at?: string | null
          metadata?: Json | null
          name?: string
          paused_at?: string | null
          scheduled_at?: string | null
          source_config?: Json | null
          source_type?: string
          started_at?: string | null
          status?: string
          total_contacts?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_batch_jobs_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_flow_sessions: {
        Row: {
          completed_at: string | null
          current_step_id: string | null
          error_message: string | null
          flow_id: string
          id: string
          last_activity_at: string | null
          last_reply_text: string | null
          lead_id: string | null
          messages_received: number | null
          messages_sent: number | null
          metadata: Json | null
          phone: string
          resume_at: string | null
          started_at: string | null
          status: string
          timeout_at: string | null
          trigger_data: Json | null
          trigger_type: string | null
          variables: Json | null
        }
        Insert: {
          completed_at?: string | null
          current_step_id?: string | null
          error_message?: string | null
          flow_id: string
          id?: string
          last_activity_at?: string | null
          last_reply_text?: string | null
          lead_id?: string | null
          messages_received?: number | null
          messages_sent?: number | null
          metadata?: Json | null
          phone: string
          resume_at?: string | null
          started_at?: string | null
          status?: string
          timeout_at?: string | null
          trigger_data?: Json | null
          trigger_type?: string | null
          variables?: Json | null
        }
        Update: {
          completed_at?: string | null
          current_step_id?: string | null
          error_message?: string | null
          flow_id?: string
          id?: string
          last_activity_at?: string | null
          last_reply_text?: string | null
          lead_id?: string | null
          messages_received?: number | null
          messages_sent?: number | null
          metadata?: Json | null
          phone?: string
          resume_at?: string | null
          started_at?: string | null
          status?: string
          timeout_at?: string | null
          trigger_data?: Json | null
          trigger_type?: string | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_flow_sessions_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_flow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_flow_sessions_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_flow_steps: {
        Row: {
          config: Json
          created_at: string | null
          display_name: string | null
          flow_id: string
          id: string
          step_key: string
          step_order: number
          step_type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json
          created_at?: string | null
          display_name?: string | null
          flow_id: string
          id?: string
          step_key: string
          step_order: number
          step_type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json
          created_at?: string | null
          display_name?: string | null
          flow_id?: string
          id?: string
          step_key?: string
          step_order?: number
          step_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_flow_steps_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_flows: {
        Row: {
          allow_concurrent: boolean | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          id: string
          name: string
          session_timeout_hours: number | null
          status: string
          trigger_config: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          allow_concurrent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          id?: string
          name: string
          session_timeout_hours?: number | null
          status?: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          allow_concurrent?: boolean | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          id?: string
          name?: string
          session_timeout_hours?: number | null
          status?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          evolution_message_id: string | null
          id: string
          interaction_id: string | null
          lead_id: string | null
          message_text: string | null
          metadata: Json | null
          phone: string
          status: string
          template_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          direction: string
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          interaction_id?: string | null
          lead_id?: string | null
          message_text?: string | null
          metadata?: Json | null
          phone: string
          status?: string
          template_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          evolution_message_id?: string | null
          id?: string
          interaction_id?: string | null
          lead_id?: string | null
          message_text?: string | null
          metadata?: Json | null
          phone?: string
          status?: string
          template_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "lead_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_optouts: {
        Row: {
          opted_out_at: string
          phone: string
          source: string
        }
        Insert: {
          opted_out_at?: string
          phone: string
          source?: string
        }
        Update: {
          opted_out_at?: string
          phone?: string
          source?: string
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          display_name: string
          enabled: boolean | null
          id: string
          name: string
          updated_at: string | null
          updated_by: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name: string
          enabled?: boolean | null
          id?: string
          name: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_name?: string
          enabled?: boolean | null
          id?: string
          name?: string
          updated_at?: string | null
          updated_by?: string | null
          variables?: Json | null
        }
        Relationships: []
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
      accept_subscription_terms: {
        Args: {
          p_billing_cycle: string
          p_plan_id: string
          p_terms_version?: string
        }
        Returns: undefined
      }
      admin_change_user_plan: {
        Args: { p_new_plan_id: string; p_user_id: string }
        Returns: boolean
      }
      admin_get_cron_schedule: {
        Args: { p_job_name: string }
        Returns: {
          command: string
          jobname: string
          schedule: string
        }[]
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
      admin_update_cron_schedule: {
        Args: { p_job_name: string; p_new_schedule: string }
        Returns: boolean
      }
      award_course_points: {
        Args: { p_action_type: string; p_context?: Json; p_user_id: string }
        Returns: Json
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
      check_daily_priorities_limit: {
        Args: { p_user_id: string }
        Returns: {
          allowed: boolean
          max_limit: number
          used: number
        }[]
      }
      check_job_exists: { Args: { job_url: string }; Returns: boolean }
      check_live_access: {
        Args: { p_live_id: string; p_user_id: string }
        Returns: Json
      }
      check_sdr_prospect_in_crm: {
        Args: { p_email?: string; p_phone?: string }
        Returns: {
          created_at: string
          evaluation_id: string
          evaluation_name: string
          exists_in_crm: boolean
          has_report: boolean
          has_subscription: boolean
          subscription_status: string
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
      generate_career_report_from_profile: {
        Args: { p_user_id: string }
        Returns: {
          evaluation_id: string
          status: string
        }[]
      }
      get_api_config_by_key: {
        Args: { p_api_key: string }
        Returns: {
          api_key: string
          base_url: string
          created_at: string
          credentials: Json
          description: string
          fallback_api_key: string
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
      get_career_data_by_email: {
        Args: { p_email: string }
        Returns: {
          area: string
          english_level: string
          objetivo: string
          timeline: string
        }[]
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
      get_email_template_by_name: {
        Args: { p_template_name: string }
        Returns: {
          body_html: string
          design_json: Json
          display_name: string
          enabled: boolean
          id: string
          name: string
          subject: string
          variables: Json
        }[]
      }
      get_full_plan_access: {
        Args: { p_user_id: string }
        Returns: {
          billing_cycle: string
          cancel_at_period_end: boolean
          dunning_stage: number
          expires_at: string
          features: Json
          grace_period_ends_at: string
          monthly_limit: number
          next_billing_date: string
          plan_id: string
          plan_name: string
          price_annual: number
          price_monthly: number
          remaining: number
          subscription_status: string
          theme: string
          ticto_change_card_url: string
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
          ai_enrichment: Json
          benefits: string
          category: string
          company_logo_url: string
          company_name: string
          created_at: string
          description: string
          experience_level: string
          id: string
          industry: string
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
          salary_notes: string
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
      get_legal_page_content: {
        Args: { p_page_key: string }
        Returns: {
          value: string
        }[]
      }
      get_live_registrations_with_profiles: {
        Args: { p_live_id: string }
        Returns: {
          attended: boolean
          email: string
          full_name: string
          id: string
          live_id: string
          payment_status: string
          profile_photo_url: string
          registered_at: string
          user_id: string
        }[]
      }
      get_masked_api_configs: {
        Args: never
        Returns: {
          api_key: string
          base_url: string
          credentials: Json
          description: string
          fallback_api_key: string
          id: string
          is_active: boolean
          name: string
          parameters: Json
          updated_at: string
          updated_by: string
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
      get_sdr_exclusion_list: {
        Args: never
        Returns: {
          email: string
          phone: string
        }[]
      }
      get_sdr_prospect_detail: {
        Args: { p_prospect_id: string }
        Returns: {
          crm_match: Json
          outreach_history: Json
          prospect: Json
        }[]
      }
      get_service_session_info: {
        Args: { p_service_id: string; p_student_id: string }
        Returns: {
          available: number
          sessions_total: number
          sessions_used: number
          upcoming_confirmed: number
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
      get_unified_credits: {
        Args: { p_user_id: string }
        Returns: {
          features: Json
          monthly_credits: number
          plan_id: string
          plan_name: string
          remaining_credits: number
          used_credits: number
        }[]
      }
      get_unread_notification_count: { Args: never; Returns: number }
      get_user_access_history: {
        Args: { p_user_id: string }
        Returns: {
          application_id: string
          applied_at: string
          category: string
          company_logo_url: string
          company_name: string
          experience_level: string
          is_active: boolean
          job_id: string
          remote_type: string
          title: string
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
      get_user_report_token: { Args: never; Returns: string }
      get_whatsapp_template_by_name: {
        Args: { p_template_name: string }
        Returns: {
          body: string
          enabled: boolean
          id: string
          name: string
          variables: Json
        }[]
      }
      has_library_access: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_flow_step_with_shift: {
        Args: {
          p_config: Json
          p_display_name: string
          p_flow_id: string
          p_step_key: string
          p_step_order: number
          p_step_type: string
        }
        Returns: string
      }
      invoke_edge_function: {
        Args: { p_body?: Json; p_function_name: string }
        Returns: number
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
      mark_all_notifications_read: { Args: never; Returns: undefined }
      mark_booking_no_show: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: boolean
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: undefined
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
      reorder_flow_steps: {
        Args: { p_flow_id: string; p_steps: Json }
        Returns: undefined
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
      update_content_studio_cron: {
        Args: { p_cron_expression: string }
        Returns: Json
      }
      user_has_plan_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level: "public" | "restricted"
      app_role: "admin" | "mentor" | "student" | "assistant"
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
      live_access_type: "free" | "paid" | "subscribers" | "pro" | "vip"
      live_status:
        | "draft"
        | "scheduled"
        | "live"
        | "completed"
        | "cancelled"
        | "expired"
      material_type: "pdf" | "link" | "video" | "other"
      notification_type:
        | "reminder_24h"
        | "reminder_1h"
        | "recording_available"
        | "session_cancelled"
        | "new_session"
        | "post_commented"
        | "post_liked"
        | "product_launch"
        | "live_scheduled"
        | "live_starting"
        | "live_reminder"
        | "new_course_content"
        | "badge_earned"
        | "course_completed"
        | "credits_recharged"
        | "subscription_activated"
        | "subscription_cancelled"
        | "payment_failed"
        | "welcome"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_rescheduled"
        | "espaco_invitation"
      review_result: "approved" | "revision" | "rejected"
      session_status: "scheduled" | "live" | "completed" | "cancelled"
      submission_status: "draft" | "submitted" | "reviewed"
      submission_type: "file" | "text" | "both"
      visibility_scope: "space_all" | "mentor_and_owner"
      waitlist_mentoriarota_status:
        | "waiting"
        | "contacted"
        | "enrolled"
        | "declined"
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
      app_role: ["admin", "mentor", "student", "assistant"],
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
      live_access_type: ["free", "paid", "subscribers", "pro", "vip"],
      live_status: [
        "draft",
        "scheduled",
        "live",
        "completed",
        "cancelled",
        "expired",
      ],
      material_type: ["pdf", "link", "video", "other"],
      notification_type: [
        "reminder_24h",
        "reminder_1h",
        "recording_available",
        "session_cancelled",
        "new_session",
        "post_commented",
        "post_liked",
        "product_launch",
        "live_scheduled",
        "live_starting",
        "live_reminder",
        "new_course_content",
        "badge_earned",
        "course_completed",
        "credits_recharged",
        "subscription_activated",
        "subscription_cancelled",
        "payment_failed",
        "welcome",
        "booking_confirmed",
        "booking_cancelled",
        "booking_rescheduled",
        "espaco_invitation",
      ],
      review_result: ["approved", "revision", "rejected"],
      session_status: ["scheduled", "live", "completed", "cancelled"],
      submission_status: ["draft", "submitted", "reviewed"],
      submission_type: ["file", "text", "both"],
      visibility_scope: ["space_all", "mentor_and_owner"],
      waitlist_mentoriarota_status: [
        "waiting",
        "contacted",
        "enrolled",
        "declined",
      ],
    },
  },
} as const
