export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      daily_checkins: {
        Row: {
          checked_at: string
          checkin_date: string
          user_id: string
        }
        Insert: {
          checked_at?: string
          checkin_date: string
          user_id: string
        }
        Update: {
          checked_at?: string
          checkin_date?: string
          user_id?: string
        }
        Relationships: []
      }
      resource_categories: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          resource_id: number
          sort_order: number
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          resource_id: number
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          resource_id?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_categories_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_history: {
        Row: {
          first_visited_at: string
          last_visited_at: string
          resource_id: number
          user_id: string
          visit_count: number
        }
        Insert: {
          first_visited_at?: string
          last_visited_at?: string
          resource_id: number
          user_id: string
          visit_count?: number
        }
        Update: {
          first_visited_at?: string
          last_visited_at?: string
          resource_id?: number
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_history_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_marks: {
        Row: {
          marked_at: string
          resource_id: number
          user_id: string
        }
        Insert: {
          marked_at?: string
          resource_id: number
          user_id: string
        }
        Update: {
          marked_at?: string
          resource_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_marks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          description: string
          id: number
          name: string
          normalized_url: string
          owner_id: string | null
          tags: string[]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: never
          name: string
          normalized_url: string
          owner_id?: string | null
          tags?: string[]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: never
          name?: string
          normalized_url?: string
          owner_id?: string | null
          tags?: string[]
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_in_today: { Args: { p_checkin_date: string }; Returns: string }
      create_private_resource: {
        Args: {
          p_category: Database["public"]["Enums"]["resource_category"]
          p_description: string
          p_name: string
          p_similar_resources_reviewed: boolean
          p_tags: string[]
          p_url: string
        }
        Returns: Json
      }
      find_similar_resources: {
        Args: { p_exclude_resource_id?: number; p_url: string }
        Returns: {
          category: Database["public"]["Enums"]["resource_category"]
          description: string
          match_type: string
          name: string
          resource_id: number
          sort_order: number
          source: string
          tags: string[]
          url: string
        }[]
      }
      get_catalog_snapshot: {
        Args: never
        Returns: {
          category: Database["public"]["Enums"]["resource_category"]
          description: string
          locked_count: number
          marked: boolean
          name: string
          resource_id: number
          sort_order: number
          tags: string[]
          total_count: number
          url: string
        }[]
      }
      normalize_resource_tags: {
        Args: { input_tags: string[] }
        Returns: string[]
      }
      normalize_resource_url: { Args: { input_url: string }; Returns: string }
      private_resource_limit: { Args: never; Returns: number }
      record_resource_visit: {
        Args: { p_resource_id: number }
        Returns: undefined
      }
      resource_tags_are_valid: {
        Args: { input_tags: string[] }
        Returns: boolean
      }
      set_resource_mark: {
        Args: { p_marked: boolean; p_resource_id: number }
        Returns: undefined
      }
      similar_resource_limit: { Args: never; Returns: number }
      submit_feedback: { Args: { p_content: string }; Returns: string }
      update_private_resource: {
        Args: {
          p_category: Database["public"]["Enums"]["resource_category"]
          p_description: string
          p_name: string
          p_resource_id: number
          p_similar_resources_reviewed: boolean
          p_tags: string[]
          p_url: string
        }
        Returns: Json
      }
    }
    Enums: {
      resource_category:
        | "basic"
        | "exam"
        | "listening"
        | "speaking"
        | "reading"
        | "writing"
        | "tools"
        | "japan"
        | "weekly"
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
      resource_category: [
        "basic",
        "exam",
        "listening",
        "speaking",
        "reading",
        "writing",
        "tools",
        "japan",
        "weekly",
      ],
    },
  },
} as const
