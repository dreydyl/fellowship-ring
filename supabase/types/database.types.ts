// Generated Supabase database types.
//
// Regenerate after schema changes with:
//
//   supabase gen types typescript --local --schema public > supabase/types/database.types.ts
//
// See: https://supabase.com/docs/guides/api/rest/generating-types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AssessmentSource = 'self_report' | 'ai';

export type Database = {
  public: {
    Tables: {
      confession_entries: {
        Row: {
          id: string;
          user_id: string;
          content: string;
          urge_intensity: number;
          desperation_level: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          urge_intensity?: number;
          desperation_level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          urge_intensity?: number;
          desperation_level?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addiction_assessments: {
        Row: {
          id: string;
          user_id: string;
          source: AssessmentSource;
          severity_level: number;
          addiction_type: string | null;
          notes: string | null;
          based_on_entry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source: AssessmentSource;
          severity_level: number;
          addiction_type?: string | null;
          notes?: string | null;
          based_on_entry_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: AssessmentSource;
          severity_level?: number;
          addiction_type?: string | null;
          notes?: string | null;
          based_on_entry_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      guidance_records: {
        Row: {
          id: string;
          user_id: string;
          confession_entry_id: string;
          assessment_id: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          confession_entry_id: string;
          assessment_id?: string | null;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          confession_entry_id?: string;
          assessment_id?: string | null;
          content?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reading_plans: {
        Row: {
          id: string;
          user_id: string;
          confession_entry_id: string;
          title: string;
          description: string | null;
          plan_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          confession_entry_id: string;
          title: string;
          description?: string | null;
          plan_json: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          confession_entry_id?: string;
          title?: string;
          description?: string | null;
          plan_json?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      guided_prayers: {
        Row: {
          id: string;
          user_id: string;
          confession_entry_id: string;
          content: string;
          desperation_level: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          confession_entry_id: string;
          content: string;
          desperation_level?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          confession_entry_id?: string;
          content?: string;
          desperation_level?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          current_severity_level: number | null;
          current_addiction_type: string | null;
          gender: 'male' | 'female' | 'none' | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          current_severity_level?: number | null;
          current_addiction_type?: string | null;
          gender?: 'male' | 'female' | 'none' | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          current_severity_level?: number | null;
          current_addiction_type?: string | null;
          gender?: 'male' | 'female' | 'none' | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      ai_usage_events: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      assessment_source: AssessmentSource;
    };
  };
};
