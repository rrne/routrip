// 이 파일은 supabase/migrations/ 의 SQL과 일치해야 합니다.
// Supabase CLI 연결 후에는 `pnpm --filter @routrip/db gen:types` 로 자동생성하세요.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      spots: {
        Row: {
          id: string;
          kakao_place_id: string;
          name: string;
          address: string;
          category: string | null;
          lat: number;
          lng: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          kakao_place_id: string;
          name: string;
          address: string;
          category?: string | null;
          lat: number;
          lng: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          kakao_place_id?: string;
          name?: string;
          address?: string;
          category?: string | null;
          lat?: number;
          lng?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          trip_date: string | null;
          total_distance_meters: number | null;
          optimized_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          trip_date?: string | null;
          total_distance_meters?: number | null;
          optimized_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          trip_date?: string | null;
          total_distance_meters?: number | null;
          optimized_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_spots: {
        Row: {
          id: string;
          trip_id: string;
          spot_id: string;
          position: number | null;
          added_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          spot_id: string;
          position?: number | null;
          added_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          spot_id?: string;
          position?: number | null;
          added_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_spots_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'trip_spots_spot_id_fkey';
            columns: ['spot_id'];
            referencedRelation: 'spots';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
