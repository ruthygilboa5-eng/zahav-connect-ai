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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contacts: {
        Row: {
          created_at: string
          emergency_status: string | null
          full_name: string
          id: string
          is_emergency_candidate: boolean | null
          main_user_id: string | null
          owner_user_id: string
          phone: string
          relation: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          emergency_status?: string | null
          full_name: string
          id?: string
          is_emergency_candidate?: boolean | null
          main_user_id?: string | null
          owner_user_id: string
          phone: string
          relation: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          emergency_status?: string | null
          full_name?: string
          id?: string
          is_emergency_candidate?: boolean | null
          main_user_id?: string | null
          owner_user_id?: string
          phone?: string
          relation?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_consents: {
        Row: {
          contact_id: string
          created_at: string
          expires_at: string
          id: string
          status: string | null
          token: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          expires_at: string
          id?: string
          status?: string | null
          token: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          status?: string | null
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      family_links: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          gender: string | null
          id: string
          member_user_id: string | null
          owner_email: string | null
          owner_phone: string | null
          owner_user_id: string | null
          phone: string | null
          relation: string
          relationship_to_primary_user: string | null
          scopes: string[] | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          member_user_id?: string | null
          owner_email?: string | null
          owner_phone?: string | null
          owner_user_id?: string | null
          phone?: string | null
          relation: string
          relationship_to_primary_user?: string | null
          scopes?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          member_user_id?: string | null
          owner_email?: string | null
          owner_phone?: string | null
          owner_user_id?: string | null
          phone?: string | null
          relation?: string
          relationship_to_primary_user?: string | null
          scopes?: string[] | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          created_at: string
          email: string
          full_name: string
          gender: string
          id: string
          main_user_id: string
          phone: string | null
          relationship_label: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          gender: string
          id?: string
          main_user_id: string
          phone?: string | null
          relationship_label: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          gender?: string
          id?: string
          main_user_id?: string
          phone?: string | null
          relationship_label?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      family_members_permissions: {
        Row: {
          created_at: string
          family_member_id: string
          feature: string
          id: string
          main_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_member_id: string
          feature: string
          id?: string
          main_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_member_id?: string
          feature?: string
          id?: string
          main_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_family_member"
            columns: ["family_member_id"]
            isOneToOne: false
            referencedRelation: "family_links"
            referencedColumns: ["id"]
          },
        ]
      }
      family_permission_requests: {
        Row: {
          created_at: string
          family_link_id: string
          id: string
          owner_user_id: string
          scope: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_link_id: string
          id?: string
          owner_user_id: string
          scope: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_link_id?: string
          id?: string
          owner_user_id?: string
          scope?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      memories: {
        Row: {
          content_type: string | null
          content_url: string | null
          created_at: string
          description: string | null
          id: string
          owner_user_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          owner_user_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          body: string
          created_at: string
          feature: string
          gender: string
          id: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          feature: string
          gender: string
          id?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          feature?: string
          gender?: string
          id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_queue: {
        Row: {
          created_at: string
          id: string
          item_data: Json
          item_type: string
          owner_user_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_data: Json
          item_type: string
          owner_user_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_data?: Json
          item_type?: string
          owner_user_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions_requests: {
        Row: {
          created_at: string
          family_member_email: string
          family_member_id: string
          family_member_name: string
          id: string
          primary_user_id: string
          requested_permissions: string[] | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          family_member_email: string
          family_member_id: string
          family_member_name: string
          id?: string
          primary_user_id: string
          requested_permissions?: string[] | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          family_member_email?: string
          family_member_id?: string
          family_member_name?: string
          id?: string
          primary_user_id?: string
          requested_permissions?: string[] | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_completed: boolean
          owner_user_id: string
          reminder_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          owner_user_id: string
          reminder_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_completed?: boolean
          owner_user_id?: string
          reminder_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          granted_by_user_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by_user_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by_user_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_message_template: {
        Args: { p_feature: string; p_gender: string }
        Returns: {
          body: string
          subject: string
        }[]
      }
      get_user_id_by_email: {
        Args: { email_address: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      init_account_with_profile_and_contacts: {
        Args: {
          p_contacts?: Json
          p_display_name?: string
          p_first_name: string
          p_last_name: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "primary_user" | "family_member" | "admin"
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
      app_role: ["primary_user", "family_member", "admin"],
    },
  },
} as const
