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
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
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
      };
      guided_prayers: {
        Row: {
          id: string;
          user_id: string;
          confession_entry_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          confession_entry_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          confession_entry_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      assessment_source: AssessmentSource;
    };
  };
};
