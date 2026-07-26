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
      avaliacoes: {
        Row: {
          created_at: string
          expedicao: number
          goleiro: number
          id: string
          inducao: number
          montagem: number
          nome: string
          pesca: number
          separacao_rk: number
          turma: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expedicao?: number
          goleiro?: number
          id?: string
          inducao?: number
          montagem?: number
          nome: string
          pesca?: number
          separacao_rk?: number
          turma?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expedicao?: number
          goleiro?: number
          id?: string
          inducao?: number
          montagem?: number
          nome?: string
          pesca?: number
          separacao_rk?: number
          turma?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pessoas_turma: {
        Row: {
          nomes: string[]
          turma: string
          updated_at: string
          user_id: string
        }
        Insert: {
          nomes?: string[]
          turma: string
          updated_at?: string
          user_id: string
        }
        Update: {
          nomes?: string[]
          turma?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      planejamento_codigos: {
        Row: {
          codigo: string
          created_at: string
          created_by: string
          expires_at: string | null
          permissao: string
          planejamento_id: string
        }
        Insert: {
          codigo: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          permissao: string
          planejamento_id: string
        }
        Update: {
          codigo?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          permissao?: string
          planejamento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_codigos_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamento_shares: {
        Row: {
          created_at: string
          permissao: string
          planejamento_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          permissao: string
          planejamento_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          permissao?: string
          planejamento_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planejamento_shares_planejamento_id_fkey"
            columns: ["planejamento_id"]
            isOneToOne: false
            referencedRelation: "planejamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      planejamentos: {
        Row: {
          created_at: string
          data: string
          esteira: Json
          id: string
          nome: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: string
          esteira?: Json
          id?: string
          nome: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: string
          esteira?: Json
          id?: string
          nome?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      produtividade: {
        Row: {
          created_at: string
          data: string
          id: string
          montagens: number
          nome: string
          produtividade_efetiva: number
          produtividade_liquida: number
          tempo_min: number
          tempo_ocioso: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          montagens?: number
          nome: string
          produtividade_efetiva?: number
          produtividade_liquida?: number
          tempo_min?: number
          tempo_ocioso?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          montagens?: number
          nome?: string
          produtividade_efetiva?: number
          produtividade_liquida?: number
          tempo_min?: number
          tempo_ocioso?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_planejamento: {
        Args: { _pid: string; _uid: string }
        Returns: boolean
      }
      can_view_planejamento: {
        Args: { _pid: string; _uid: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
