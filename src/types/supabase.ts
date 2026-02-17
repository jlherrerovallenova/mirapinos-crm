// src/types/supabase.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'agent' | 'viewer'
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'agent' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'agent' | 'viewer'
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          created_at: string
          name: string
          email: string | null
          phone: string | null
          company: string | null
          status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost'
          source: string | null
          notes: string | null
          assigned_to: string | null
          value: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost'
          source?: string | null
          notes?: string | null
          assigned_to?: string | null
          value?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed' | 'lost'
          source?: string | null
          notes?: string | null
          assigned_to?: string | null
          value?: number | null
        }
      }
      inventory: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          price: number
          type: string | null
          status: 'available' | 'reserved' | 'sold'
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          price: number
          type?: string | null
          status?: 'available' | 'reserved' | 'sold'
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          price?: number
          type?: string | null
          status?: 'available' | 'reserved' | 'sold'
          image_url?: string | null
        }
      }
      // NUEVA TABLA AÑADIDA
      tasks: {
        Row: {
          id: number
          created_at: string
          title: string
          contact_name: string | null
          due_date: string
          due_time: string | null
          type: 'call' | 'visit' | 'email' | 'meeting'
          priority: 'high' | 'medium' | 'low'
          status: 'pending' | 'completed'
          user_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          title: string
          contact_name?: string | null
          due_date: string
          due_time?: string | null
          type: 'call' | 'visit' | 'email' | 'meeting'
          priority: 'high' | 'medium' | 'low'
          status?: 'pending' | 'completed'
          user_id?: string
        }
        Update: {
          id?: number
          created_at?: string
          title?: string
          contact_name?: string | null
          due_date?: string
          due_time?: string | null
          type?: 'call' | 'visit' | 'email' | 'meeting'
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'completed'
          user_id?: string
        }
      }
    }
  }
}