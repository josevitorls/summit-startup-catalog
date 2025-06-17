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
      allowed_domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      allowed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          allowed_as_destination: boolean | null
          allowed_as_origin: boolean | null
          code: string
          continent: string
          created_at: string | null
          flag_emoji: string
          id: string
          lat: number
          lng: number
          name: string
          updated_at: string | null
        }
        Insert: {
          allowed_as_destination?: boolean | null
          allowed_as_origin?: boolean | null
          code: string
          continent: string
          created_at?: string | null
          flag_emoji: string
          id?: string
          lat: number
          lng: number
          name: string
          updated_at?: string | null
        }
        Update: {
          allowed_as_destination?: boolean | null
          allowed_as_origin?: boolean | null
          code?: string
          continent?: string
          created_at?: string | null
          flag_emoji?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      country_relations: {
        Row: {
          color_gradient: string
          created_at: string | null
          description: string
          destination_country_code: string
          flow_type: string
          icon_type: string
          id: string
          is_active: boolean | null
          origin_country_code: string
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          color_gradient: string
          created_at?: string | null
          description: string
          destination_country_code: string
          flow_type: string
          icon_type: string
          id?: string
          is_active?: boolean | null
          origin_country_code: string
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          color_gradient?: string
          created_at?: string | null
          description?: string
          destination_country_code?: string
          flow_type?: string
          icon_type?: string
          id?: string
          is_active?: boolean | null
          origin_country_code?: string
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_relations_destination_country_code_fkey"
            columns: ["destination_country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "country_relations_origin_country_code_fkey"
            columns: ["origin_country_code"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["code"]
          },
        ]
      }
      funding_tiers: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      migration_progress: {
        Row: {
          batch_number: number | null
          completed_at: string | null
          error_message: string | null
          file_name: string
          id: string
          processed_count: number | null
          started_at: string | null
          status: string
          total_count: number | null
        }
        Insert: {
          batch_number?: number | null
          completed_at?: string | null
          error_message?: string | null
          file_name: string
          id?: string
          processed_count?: number | null
          started_at?: string | null
          status?: string
          total_count?: number | null
        }
        Update: {
          batch_number?: number | null
          completed_at?: string | null
          error_message?: string | null
          file_name?: string
          id?: string
          processed_count?: number | null
          started_at?: string | null
          status?: string
          total_count?: number | null
        }
        Relationships: []
      }
      predefined_tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      relation_services: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          relation_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          relation_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          relation_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "relation_services_relation_id_fkey"
            columns: ["relation_id"]
            isOneToOne: false
            referencedRelation: "country_relations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relation_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      startup_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          startup_id: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          startup_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          startup_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_startup_comments_startup_id"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_comments_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_external_urls: {
        Row: {
          alternative_website: string | null
          angellist: string | null
          created_at: string | null
          crunchbase: string | null
          facebook: string | null
          homepage: string | null
          id: string
          instagram: string | null
          linkedin: string | null
          startup_id: string | null
          twitter: string | null
          youtube: string | null
        }
        Insert: {
          alternative_website?: string | null
          angellist?: string | null
          created_at?: string | null
          crunchbase?: string | null
          facebook?: string | null
          homepage?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          startup_id?: string | null
          twitter?: string | null
          youtube?: string | null
        }
        Update: {
          alternative_website?: string | null
          angellist?: string | null
          created_at?: string | null
          crunchbase?: string | null
          facebook?: string | null
          homepage?: string | null
          id?: string
          instagram?: string | null
          linkedin?: string | null
          startup_id?: string | null
          twitter?: string | null
          youtube?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_startup_external_urls_startup_id"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_external_urls_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: true
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_tags: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          startup_id: string | null
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          startup_id?: string | null
          tag_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          startup_id?: string | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_startup_tags_startup_id"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_tags_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_team_members: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          country_name: string | null
          created_at: string | null
          email: string | null
          facebook_url: string | null
          first_name: string | null
          github_url: string | null
          id: string
          industry_name: string | null
          job_title: string | null
          last_name: string | null
          member_id: string
          name: string
          startup_id: string | null
          twitter_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country_name?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          industry_name?: string | null
          job_title?: string | null
          last_name?: string | null
          member_id: string
          name: string
          startup_id?: string | null
          twitter_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country_name?: string | null
          created_at?: string | null
          email?: string | null
          facebook_url?: string | null
          first_name?: string | null
          github_url?: string | null
          id?: string
          industry_name?: string | null
          job_title?: string | null
          last_name?: string | null
          member_id?: string
          name?: string
          startup_id?: string | null
          twitter_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_startup_team_members_startup_id"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_team_members_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_topics: {
        Row: {
          created_at: string | null
          id: string
          startup_id: string | null
          topic_id: string
          topic_name: string
          topic_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          startup_id?: string | null
          topic_id: string
          topic_name: string
          topic_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          startup_id?: string | null
          topic_id?: string
          topic_name?: string
          topic_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_startup_topics_startup_id"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "startup_topics_startup_id_fkey"
            columns: ["startup_id"]
            isOneToOne: false
            referencedRelation: "startups"
            referencedColumns: ["id"]
          },
        ]
      }
      startups: {
        Row: {
          city: string | null
          company_id: string
          country: string | null
          created_at: string | null
          elevator_pitch: string | null
          endorsed_by: string | null
          exhibition_date: string | null
          funding_tier: string | null
          fundraising: boolean | null
          id: string
          industry: string | null
          kanban_column: string | null
          logo_url: string | null
          meet_investors: boolean | null
          name: string
          province: string | null
          show_in_kanban: boolean | null
          startup_black_founder: boolean | null
          startup_indigenous_founder: boolean | null
          startup_women_founder: boolean | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          company_id: string
          country?: string | null
          created_at?: string | null
          elevator_pitch?: string | null
          endorsed_by?: string | null
          exhibition_date?: string | null
          funding_tier?: string | null
          fundraising?: boolean | null
          id?: string
          industry?: string | null
          kanban_column?: string | null
          logo_url?: string | null
          meet_investors?: boolean | null
          name: string
          province?: string | null
          show_in_kanban?: boolean | null
          startup_black_founder?: boolean | null
          startup_indigenous_founder?: boolean | null
          startup_women_founder?: boolean | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          company_id?: string
          country?: string | null
          created_at?: string | null
          elevator_pitch?: string | null
          endorsed_by?: string | null
          exhibition_date?: string | null
          funding_tier?: string | null
          fundraising?: boolean | null
          id?: string
          industry?: string | null
          kanban_column?: string | null
          logo_url?: string | null
          meet_investors?: boolean | null
          name?: string
          province?: string | null
          show_in_kanban?: boolean | null
          startup_black_founder?: boolean | null
          startup_indigenous_founder?: boolean | null
          startup_women_founder?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
