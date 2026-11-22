export interface UserProfile {
  id: string;
  email: string;
  shopName: string;
  ownerName: string;
  phone: string;
  createdAt: string;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean; // whether Supabase URL/key is configured
}
