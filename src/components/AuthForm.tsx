import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          // Handle specific signup errors
          if (error.message.includes('already registered')) {
            setError('This email is already registered. Try signing in instead.');
          } else if (error.message.includes('invalid email')) {
            setError('Please enter a valid email address.');
          } else if (error.message.includes('weak password')) {
            setError('Password is too weak. Please use a stronger password.');
          } else {
            setError(error.message);
          }
        } else if (data.user && !data.session) {
          setSuccess('Account created successfully! Please check your email to verify your account.');
        } else {
          setSuccess('Account created successfully! You are now signed in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          // Handle specific signin errors
          if (error.message.includes('Invalid login credentials')) {
            setError('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            setError('Please check your email and click the confirmation link before signing in.');
          } else if (error.message.includes('too many requests')) {
            setError('Too many login attempts. Please wait a moment before trying again.');
          } else {
            setError(error.message);
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#121212' }}
    >
      <div className="max-w-md w-full bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-8 border border-[#2C2C2E]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Money Manager</h1>
          <p className="text-gray-300">Simple accounting for everyone</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
              placeholder="Enter your password (min. 6 characters)"
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-900/50 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
              <span className="text-sm">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-3 px-4 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-white focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                {isSignUp ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleModeSwitch}
            className="text-gray-300 hover:text-white font-medium"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-400">
          <p>Your data is securely stored and synced across devices</p>
          {!isSignUp && (
            <p className="mt-2">
              <span className="text-gray-500">Tip:</span> Make sure you've created an account first
            </p>
          )}
        </div>
      </div>
    </div>
  );
};