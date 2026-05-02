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
      trip_collaborators: {
        Row: {
          trip_id: string;
          user_id: string;
          role: 'owner' | 'editor';
          invited_by: string | null;
          joined_at: string;
        };
        Insert: {
          trip_id: string;
          user_id: string;
          role?: 'owner' | 'editor';
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: {
          trip_id?: string;
          user_id?: string;
          role?: 'owner' | 'editor';
          invited_by?: string | null;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_collaborators_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      trip_invites: {
        Row: {
          id: string;
          trip_id: string;
          token: string;
          created_by: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          token: string;
          created_by: string;
          expires_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          token?: string;
          created_by?: string;
          expires_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'trip_invites_trip_id_fkey';
            columns: ['trip_id'];
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_invite: {
        Args: { p_token: string };
        Returns:
          | { ok: true; trip_id: string }
          | { ok: false; error: string };
      };
      is_trip_member: {
        Args: { p_trip_id: string };
        Returns: boolean;
      };
      is_trip_owner: {
        Args: { p_trip_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
