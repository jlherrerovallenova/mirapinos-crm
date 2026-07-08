Need to install the following packages:
supabase@2.109.1
Ok to proceed? (y) export type Json =
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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agenda: {
        Row: {
          call_attended: boolean | null
          comments: string | null
          completed: boolean | null
          created_at: string | null
          due_date: string
          id: string
          lead_id: string | null
          title: string
          tracking_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          call_attended?: boolean | null
          comments?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date: string
          id?: string
          lead_id?: string | null
          title: string
          tracking_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          call_attended?: boolean | null
          comments?: string | null
          completed?: boolean | null
          created_at?: string | null
          due_date?: string
          id?: string
          lead_id?: string | null
          title?: string
          tracking_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_tracking_id_fkey"
            columns: ["tracking_id"]
            isOneToOne: false
            referencedRelation: "email_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          lead_id: string | null
          location: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          lead_id?: string | null
          location?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          lead_id?: string | null
          location?: string | null
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          name: string
          url: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          name: string
          url: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      email_tracking: {
        Row: {
          created_at: string | null
          first_opened_at: string | null
          id: string
          last_opened_at: string | null
          lead_id: string | null
          opens_count: number | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          lead_id?: string | null
          opens_count?: number | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string | null
          first_opened_at?: string | null
          id?: string
          last_opened_at?: string | null
          lead_id?: string | null
          opens_count?: number | null
          status?: string | null
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_tracking_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          completed: boolean | null
          date: string | null
          description: string | null
          id: string
          leadId: string | null
          type: string
        }
        Insert: {
          completed?: boolean | null
          date?: string | null
          description?: string | null
          id?: string
          leadId?: string | null
          type: string
        }
        Update: {
          completed?: boolean | null
          date?: string | null
          description?: string | null
          id?: string
          leadId?: string | null
          type?: string
        }
        Relationships: []
      }
      installments: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          installment_number: number
          paid: boolean
          paid_date: string | null
          sale_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          installment_number: number
          paid?: boolean
          paid_date?: string | null
          sale_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          installment_number?: number
          paid?: boolean
          paid_date?: string | null
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "installments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          banos: number | null
          created_at: string
          estado_vivienda: string | null
          habitaciones: number | null
          id: number
          leadId: string | null
          modelo: string
          numero_vivienda: string
          precio: number | null
          superficie_construida: number | null
          superficie_parcela: number | null
          superficie_util: number | null
        }
        Insert: {
          banos?: number | null
          created_at?: string
          estado_vivienda?: string | null
          habitaciones?: number | null
          id?: number
          leadId?: string | null
          modelo?: string
          numero_vivienda?: string
          precio?: number | null
          superficie_construida?: number | null
          superficie_parcela?: number | null
          superficie_util?: number | null
        }
        Update: {
          banos?: number | null
          created_at?: string
          estado_vivienda?: string | null
          habitaciones?: number | null
          id?: number
          leadId?: string | null
          modelo?: string
          numero_vivienda?: string
          precio?: number | null
          superficie_construida?: number | null
          superficie_parcela?: number | null
          superficie_util?: number | null
        }
        Relationships: []
      }
      lead_properties: {
        Row: {
          created_at: string | null
          id: string
          inventory_id: number | null
          lead_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_id?: number | null
          lead_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_id?: number | null
          lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_properties_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_properties_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          assigned_to: string | null
          auth_user_id: string | null
          city: string | null
          civil_status: string | null
          company: string | null
          created_at: string
          dni: string | null
          email: string | null
          feedback_comment: string | null
          feedback_rating: string | null
          feedback_responded_at: string | null
          feedback_sent: boolean | null
          feedback_sent_at: string | null
          id: string
          interested_in: string | null
          is_subscribed: boolean | null
          joint_buyer_dni: string | null
          joint_buyer_email: string | null
          joint_buyer_name: string | null
          joint_buyer_phone: string | null
          name: string
          nationality: string | null
          notes: string | null
          occupation: string | null
          phone: string | null
          postal_code: string | null
          property_id: number | null
          province: string | null
          sale_status: string | null
          source: string | null
          status: string | null
          survey_data: Json | null
          value: number | null
        }
        Insert: {
          address?: string | null
          assigned_to?: string | null
          auth_user_id?: string | null
          city?: string | null
          civil_status?: string | null
          company?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          feedback_comment?: string | null
          feedback_rating?: string | null
          feedback_responded_at?: string | null
          feedback_sent?: boolean | null
          feedback_sent_at?: string | null
          id?: string
          interested_in?: string | null
          is_subscribed?: boolean | null
          joint_buyer_dni?: string | null
          joint_buyer_email?: string | null
          joint_buyer_name?: string | null
          joint_buyer_phone?: string | null
          name: string
          nationality?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          property_id?: number | null
          province?: string | null
          sale_status?: string | null
          source?: string | null
          status?: string | null
          survey_data?: Json | null
          value?: number | null
        }
        Update: {
          address?: string | null
          assigned_to?: string | null
          auth_user_id?: string | null
          city?: string | null
          civil_status?: string | null
          company?: string | null
          created_at?: string
          dni?: string | null
          email?: string | null
          feedback_comment?: string | null
          feedback_rating?: string | null
          feedback_responded_at?: string | null
          feedback_sent?: boolean | null
          feedback_sent_at?: string | null
          id?: string
          interested_in?: string | null
          is_subscribed?: boolean | null
          joint_buyer_dni?: string | null
          joint_buyer_email?: string | null
          joint_buyer_name?: string | null
          joint_buyer_phone?: string | null
          name?: string
          nationality?: string | null
          notes?: string | null
          occupation?: string | null
          phone?: string | null
          postal_code?: string | null
          property_id?: number | null
          province?: string | null
          sale_status?: string | null
          source?: string | null
          status?: string | null
          survey_data?: Json | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletters: {
        Row: {
          created_at: string
          design: Json | null
          html_content: string | null
          id: string
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          design?: Json | null
          html_content?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          design?: Json | null
          html_content?: string | null
          id?: string
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          name: string
          price: number
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          name: string
          price: number
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          name?: string
          price?: number
          status?: string | null
        }
        Relationships: []
      }
      sale_documents: {
        Row: {
          created_at: string
          document_type: string
          file_path: string
          file_size: number | null
          id: string
          name: string
          sale_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_path: string
          file_size?: number | null
          id?: string
          name: string
          sale_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          name?: string
          sale_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_documents_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          contract_date: string | null
          created_at: string
          escritura_date: string | null
          id: string
          iva_percentage: number
          lead_id: string
          notes: string | null
          property_id: number
          reservation_amount: number
          reservation_date: string | null
          sale_price: number
          sale_status: string
        }
        Insert: {
          contract_date?: string | null
          created_at?: string
          escritura_date?: string | null
          id?: string
          iva_percentage?: number
          lead_id: string
          notes?: string | null
          property_id: number
          reservation_amount?: number
          reservation_date?: string | null
          sale_price: number
          sale_status?: string
        }
        Update: {
          contract_date?: string | null
          created_at?: string
          escritura_date?: string | null
          id?: string
          iva_percentage?: number
          lead_id?: string
          notes?: string | null
          property_id?: number
          reservation_amount?: number
          reservation_date?: string | null
          sale_price?: number
          sale_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      sent_documents: {
        Row: {
          doc_name: string
          id: string
          lead_id: string | null
          method: string | null
          sent_at: string | null
        }
        Insert: {
          doc_name: string
          id?: string
          lead_id?: string | null
          method?: string | null
          sent_at?: string | null
        }
        Update: {
          doc_name?: string
          id?: string
          lead_id?: string | null
          method?: string | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sent_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: number
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: number
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: number
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          contact_name: string | null
          created_at: string
          due_date: string
          due_time: string | null
          id: number
          priority: string
          status: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          due_date: string
          due_time?: string | null
          id?: number
          priority: string
          status?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          due_date?: string
          due_time?: string | null
          id?: number
          priority?: string
          status?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { user_id: string }; Returns: string }
      increment_email_open: {
        Args: { tracking_id: string }
        Returns: undefined
      }
      submit_lead_survey: {
        Args: { p_lead_id: string; p_survey_data: Json }
        Returns: undefined
      }
    }
    Enums: {
      event_type:
        | "Contacto"
        | "Llamada"
        | "Cita Oficina"
        | "Cita Obra"
        | "Reserva"
        | "Envio Documentacion"
        | "Otros"
      lead_source:
        | "Web"
        | "RRSS"
        | "Idealista"
        | "Buzoneo"
        | "Referido"
        | "Otros"
      pipeline_stage: "Prospecto" | "Visitando" | "Interés" | "Cierre"
      property_type: "OLIVO" | "ARCE" | "PARCELA"
      unit_status: "available" | "reserved" | "sold"
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
      event_type: [
        "Contacto",
        "Llamada",
        "Cita Oficina",
        "Cita Obra",
        "Reserva",
        "Envio Documentacion",
        "Otros",
      ],
      lead_source: ["Web", "RRSS", "Idealista", "Buzoneo", "Referido", "Otros"],
      pipeline_stage: ["Prospecto", "Visitando", "Interés", "Cierre"],
      property_type: ["OLIVO", "ARCE", "PARCELA"],
      unit_status: ["available", "reserved", "sold"],
    },
  },
} as const
