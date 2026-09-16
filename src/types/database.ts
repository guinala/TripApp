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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          address: string | null
          category: string
          created_at: string
          day_id: string
          duration_minutes: number | null
          estimated_cost: number | null
          id: string
          location: Json | null
          notes: string | null
          order_index: number
          place_id: string | null
          time: string | null
          title: string
        }
        Insert: {
          address?: string | null
          category?: string
          created_at?: string
          day_id: string
          duration_minutes?: number | null
          estimated_cost?: number | null
          id?: string
          location?: Json | null
          notes?: string | null
          order_index?: number
          place_id?: string | null
          time?: string | null
          title: string
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string
          day_id?: string
          duration_minutes?: number | null
          estimated_cost?: number | null
          id?: string
          location?: Json | null
          notes?: string | null
          order_index?: number
          place_id?: string | null
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
        ]
      }
      days: {
        Row: {
          created_at: string
          date: string
          day_number: number
          id: string
          notes: string | null
          title: string | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          date: string
          day_number: number
          id?: string
          notes?: string | null
          title?: string | null
          trip_id: string
        }
        Update: {
          created_at?: string
          date?: string
          day_number?: number
          id?: string
          notes?: string | null
          title?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "days_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          date: string
          day_id: string | null
          description: string | null
          id: string
          receipt_path: string | null
          trip_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          currency?: string
          date?: string
          day_id?: string | null
          description?: string | null
          id?: string
          receipt_path?: string | null
          trip_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          date?: string
          day_id?: string | null
          description?: string | null
          id?: string
          receipt_path?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      explore_destinations: {
        Row: {
          continent: string
          country: string
          country_code: string | null
          cover_query: string
          description_en: string | null
          description_es: string
          featured: boolean
          id: string
          name: string
          place_id: string | null
          published: boolean
          sort_order: number
          types: string[]
          updated_at: string
        }
        Insert: {
          continent: string
          country: string
          country_code?: string | null
          cover_query: string
          description_en?: string | null
          description_es?: string
          featured?: boolean
          id: string
          name: string
          place_id?: string | null
          published?: boolean
          sort_order?: number
          types?: string[]
          updated_at?: string
        }
        Update: {
          continent?: string
          country?: string
          country_code?: string | null
          cover_query?: string
          description_en?: string | null
          description_es?: string
          featured?: boolean
          id?: string
          name?: string
          place_id?: string | null
          published?: boolean
          sort_order?: number
          types?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "explore_destinations_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_references"
            referencedColumns: ["google_place_id"]
          },
        ]
      }
      packing_items: {
        Row: {
          category: string
          checked: boolean
          created_at: string
          id: string
          name: string
          trip_id: string
        }
        Insert: {
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          name: string
          trip_id: string
        }
        Update: {
          category?: string
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      photos: {
        Row: {
          caption: string | null
          created_at: string
          day_id: string | null
          id: string
          location: Json | null
          taken_at: string
          trip_id: string
          uri: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          day_id?: string | null
          id?: string
          location?: Json | null
          taken_at?: string
          trip_id: string
          uri: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          day_id?: string | null
          id?: string
          location?: Json | null
          taken_at?: string
          trip_id?: string
          uri?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photos_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      place_references: {
        Row: {
          created_at: string
          google_place_id: string
        }
        Insert: {
          created_at?: string
          google_place_id: string
        }
        Update: {
          created_at?: string
          google_place_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_currency: string
          display_name: string | null
          email: string
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string
          display_name?: string | null
          email: string
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_currency?: string
          display_name?: string | null
          email?: string
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          budget: number | null
          cover_image: string | null
          created_at: string
          currency: string
          destination: string
          destination_place_id: string | null
          end_date: string
          id: string
          start_date: string
          status: string
          title: string
          trip_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          destination: string
          destination_place_id?: string | null
          end_date: string
          id?: string
          start_date: string
          status?: string
          title: string
          trip_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          cover_image?: string | null
          created_at?: string
          currency?: string
          destination?: string
          destination_place_id?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          title?: string
          trip_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_destination_place_id_fkey"
            columns: ["destination_place_id"]
            isOneToOne: false
            referencedRelation: "place_references"
            referencedColumns: ["google_place_id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_places_request: {
        Args: { p_action: string; p_user_id: string }
        Returns: boolean
      }
      replace_packing_items: {
        Args: { p_items: Json; p_trip_id: string }
        Returns: {
          category: string
          checked: boolean
          created_at: string
          id: string
          name: string
          trip_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "packing_items"
          isOneToOne: false
          isSetofReturn: true
        }
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
