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
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: 'demo-shop-123',
  email: 'shopkeeper@ughrani.com',
  shopName: 'Shree Ughrani Kirana Store',
  ownerName: 'Uday Patel',
  phone: '9876543210',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Default to demo user if not logged out
      setUser(DEMO_USER);
      setIsLoading(false);
      return;
    }

    // Check active Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setIsLoading(false);
      }
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
        .single();

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
        // Fallback profile if profile row is pending creation
        setUser({
          id: userId,
          email,
          shopName: 'My Shop',
          ownerName: 'Shopkeeper',
          phone: '',
          createdAt: new Date().toISOString(),
        });
      }
    } catch {
      setUser({
        id: userId,
        email,
        shopName: 'My Shop',
        ownerName: 'Shopkeeper',
        phone: '',
        createdAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      setUser(DEMO_USER);
      return {};
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
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
    if (!isSupabaseConfigured) {
      setUser({
        id: Date.now().toString(),
        email,
        shopName,
        ownerName,
        phone,
        createdAt: new Date().toISOString(),
      });
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            shop_name: shopName,
            owner_name: ownerName,
            phone: phone,
          },
        },
      });

      if (error) return { error: error.message };

      if (data.user) {
        // Create profile row in profiles table
        await supabase.from('profiles').upsert({
          id: data.user.id,
          shop_name: shopName,
          owner_name: ownerName,
          phone: phone,
          created_at: new Date().toISOString(),
        });
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'Registration failed' };
    }
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const loginAsDemo = () => {
    setUser(DEMO_USER);
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
        loginAsDemo,
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
