// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

// Definimos un tipo para el perfil del usuario basado en tu tabla de base de datos
interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'admin' | 'agent' | 'viewer';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null; // Datos extendidos del usuario
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>; // Para actualizar el nombre/foto desde Settings
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para obtener los datos extra del perfil desde la tabla 'profiles'
  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error cargando el perfil del usuario:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Obtener la sesión activa al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // 2. Suscribirse a cambios (Login, Logout, Cambio de Contraseña)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshProfile = async () => {
    if (user?.id) await fetchProfile(user.id);
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signIn,
    signOut,
    refreshProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};