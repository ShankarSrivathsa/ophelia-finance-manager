import React, { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AuthForm } from './AuthForm';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError('Failed to connect to authentication service. Please check your internet connection.');
        } else {
          setUser(session?.user ?? null);
          setError(null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setError(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#121212' }}
      >
        <div className="max-w-md w-full bg-[#1F1F1F] rounded-lg shadow-md p-6 border border-[#2C2C2E]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-white mb-2">Connection Error</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <>{children}</>;
};