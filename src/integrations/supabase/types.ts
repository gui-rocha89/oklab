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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      creative_approvals: {
        Row: {
          attachment_index: number
          caption: string | null
          created_at: string
          feedback: string | null
          id: string
          keyframe_id: string
          publish_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attachment_index: number
          caption?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          keyframe_id: string
          publish_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_index?: number
          caption?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          keyframe_id?: string
          publish_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_approvals_keyframe_id_fkey"
            columns: ["keyframe_id"]
            isOneToOne: false
            referencedRelation: "project_keyframes"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_reviews: {
        Row: {
          client_email: string
          client_name: string | null
          comment: string | null
          created_at: string
          id: string
          project_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          client_email: string
          client_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          project_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          client_email?: string
          client_name?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          project_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cargo: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cargo?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_downloads: {
        Row: {
          client_ip: string | null
          created_at: string
          downloaded_at: string
          files_downloaded: Json
          id: string
          project_id: string
        }
        Insert: {
          client_ip?: string | null
          created_at?: string
          downloaded_at?: string
          files_downloaded?: Json
          id?: string
          project_id: string
        }
        Update: {
          client_ip?: string | null
          created_at?: string
          downloaded_at?: string
          files_downloaded?: Json
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_downloads_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_feedback: {
        Row: {
          comment: string
          created_at: string
          id: string
          keyframe_id: string
          response: string | null
          status: string
          updated_at: string
          user_id: string
          x_position: number
          y_position: number
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          keyframe_id: string
          response?: string | null
          status?: string
          updated_at?: string
          user_id: string
          x_position: number
          y_position: number
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          keyframe_id?: string
          response?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_feedback_keyframe_id_fkey"
            columns: ["keyframe_id"]
            isOneToOne: false
            referencedRelation: "project_keyframes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_keyframes: {
        Row: {
          attachments: Json | null
          created_at: string
          feedback_count: number | null
          id: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          feedback_count?: number | null
          id?: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          feedback_count?: number | null
          id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_keyframes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          approval_date: string | null
          client: string
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          share_id: string
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          approval_date?: string | null
          client: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          share_id: string
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          approval_date?: string | null
          client?: string
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          share_id?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_annotations: {
        Row: {
          canvas_data: Json
          comment: string | null
          created_at: string
          created_by: string | null
          id: string
          project_id: string
          timestamp_ms: number
          updated_at: string
        }
        Insert: {
          canvas_data: Json
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id: string
          timestamp_ms: number
          updated_at?: string
        }
        Update: {
          canvas_data?: Json
          comment?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          project_id?: string
          timestamp_ms?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_annotations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          check_role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "supreme_admin" | "manager" | "team_lead" | "user"
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
      app_role: ["supreme_admin", "manager", "team_lead", "user"],
    },
  },
} as const
