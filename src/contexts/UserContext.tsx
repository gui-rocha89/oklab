import { createContext, useContext, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'supreme_admin' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
}

interface UserContextType {
  user: User | null;
  isSupremeAdmin: boolean;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Mock do usuário supremo - em um app real, isso viria de uma API/auth
const mockSupremeUser: User = {
  id: '1',
  name: 'GUI',
  email: 'gui@streamlab.com.br',
  role: 'supreme_admin',
  avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956'
};

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  // Por enquanto, sempre retorna o usuário supremo
  // Em um app real, isso seria baseado na autenticação
  const user = mockSupremeUser;
  
  const value: UserContextType = {
    user,
    isSupremeAdmin: user?.role === 'supreme_admin',
    isAdmin: user?.role === 'admin' || user?.role === 'supreme_admin',
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}