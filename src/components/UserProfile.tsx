import React from 'react';
import { LogOut, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { LanguageSelector } from './LanguageSelector';

interface UserProfileProps {
  userEmail: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userEmail }) => {
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-lg p-4 shadow-lg border border-[#2C2C2E]">
      {/* User Info & Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <User className="w-4 h-4" />
          <span>{userEmail}</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <LanguageSelector />
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 px-3 py-1 text-red-400 hover:bg-red-900/50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('app.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
};