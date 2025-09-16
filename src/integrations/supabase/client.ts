// Mock Supabase client implementation
const createMockSupabaseClient = () => {
  return {
    auth: {
      getSession: async () => {
        const mockSession = localStorage.getItem('mock_session');
        return { 
          data: { 
            session: mockSession ? JSON.parse(mockSession) : null 
          } 
        };
      },
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        // Mock authentication - in real app this would be Supabase
        if (email === 'gui@streamlab.com.br' && password) {
          const mockSession = {
            user: {
              id: '1',
              email: 'gui@streamlab.com.br',
              user_metadata: {
                full_name: 'Gui'
              }
            },
            access_token: 'mock_token'
          };
          localStorage.setItem('mock_session', JSON.stringify(mockSession));
          return { error: null };
        }
        return { error: { message: 'Credenciais inválidas' } };
      },
      signUp: async ({ email, password, options }: any) => {
        // Mock signup
        const mockSession = {
          user: {
            id: Date.now().toString(),
            email,
            user_metadata: {
              full_name: options?.data?.full_name || email.split('@')[0]
            }
          },
          access_token: 'mock_token'
        };
        localStorage.setItem('mock_session', JSON.stringify(mockSession));
        return { error: null };
      },
      signOut: async () => {
        localStorage.removeItem('mock_session');
        return { error: null };
      },
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        // Mock auth state listener
        const checkSession = () => {
          const mockSession = localStorage.getItem('mock_session');
          callback('SIGNED_IN', mockSession ? JSON.parse(mockSession) : null);
        };
        
        // Check immediately
        checkSession();
        
        // Listen for storage changes
        const handleStorageChange = (e: StorageEvent) => {
          if (e.key === 'mock_session') {
            checkSession();
          }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                window.removeEventListener('storage', handleStorageChange);
              }
            }
          }
        };
      }
    }
  };
};

export const supabase = createMockSupabaseClient();