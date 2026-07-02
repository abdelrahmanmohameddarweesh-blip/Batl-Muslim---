import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { signInAnonymous, signOutUser } from '../firebase/auth';

type AuthUser = {
  uid: string;
  displayName: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (displayName: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (displayName: string) => {
    setLoading(true);
    try {
      const authUser = await signInAnonymous(displayName);
      setUser(authUser);
    } catch (error) {
      const fallbackUser = {
        uid: `guest-${Date.now()}`,
        displayName: displayName || 'ضيف',
        score: 0,
      };
      setUser(fallbackUser);
      Alert.alert('تنبيه', 'تم تسجيل الدخول محلياً، وقد تكون هناك مشكلة مؤقتة في التخزين.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
