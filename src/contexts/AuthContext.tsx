import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { signInAnonymous, signOutUser } from '../firebase/auth';

type AuthUser = {
  uid: string;
  displayName: string;
  phone?: string;
  country?: string;
  age?: number;
  photoUri?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (displayName: string, phone: string, country: string, age?: number, photoUri?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserFields: (fields: Partial<AuthUser>) => void;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  updateUserFields: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (displayName: string, phone: string, country: string, age?: number, photoUri?: string) => {
    setLoading(true);
    try {
      const authUser = await signInAnonymous(displayName, phone, country, age, photoUri);
      setUser(authUser);
    } catch (error) {
      const fallbackUser = {
        uid: `guest-${Date.now()}`,
        displayName: displayName || 'ضيف',
        phone: phone || undefined,
        country: country || undefined,
        age: age || undefined,
        photoUri: photoUri || undefined,
        score: 0,
      };
      setUser(fallbackUser);
      Alert.alert('تنبيه', 'تم تسجيل الدخول محلياً، وقد تكون هناك مشكلة مؤقتة في التخزين.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserFields = (fields: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...fields,
      };
    });
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUserFields }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
