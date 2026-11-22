import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { UserProfile } from '@/types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (params: {
    email: string;
    password: string;
    shopName: string;
    ownerName: string;
    phone: string;
  }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setUser({
          id: userId,
          email,
          shopName: data.shop_name || 'My Shop',
          ownerName: data.owner_name || 'Shopkeeper',
          phone: data.phone || '',
          createdAt: data.created_at || new Date().toISOString(),
        });
      } else {
        setUser({
          id: userId,
          email,
          shopName: 'Shree Ughrani Kirana Store',
          ownerName: 'Uday Ahir',
          phone: '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setUser({
        id: userId,
        email,
        shopName: 'Shree Ughrani Kirana Store',
        ownerName: 'Uday Ahir',
        phone: '',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error: error.message };
      return {};
    } catch (err: any) {
      return { error: err.message || 'Login failed' };
    }
  };

  const signUp = async ({
    email,
    password,
    shopName,
    ownerName,
    phone,
  }: {
    email: string;
    password: string;
    shopName: string;
    ownerName: string;
    phone: string;
  }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            shop_name: shopName.trim(),
            owner_name: ownerName.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          shop_name: shopName.trim(),
          owner_name: ownerName.trim(),
          phone: phone.trim(),
          created_at: new Date().toISOString(),
        });

        // Automatically log user in immediately after signup
        const signInRes = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (!signInRes.error) {
          await fetchProfile(data.user.id, email.trim());
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isConfigured: isSupabaseConfigured,
        signIn,
        signUp,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
