import React from 'react';
import { LogOut, User, CreditCard } from 'lucide-react';
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

  const handleBillingClick = () => {
    // Trigger navigation to billing tab in parent component
    const event = new CustomEvent('set-active-tab', { detail: 'billing' });
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-white/55 backdrop-blur-sm rounded-lg p-4 shadow-lg">
      {/* User Info & Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="w-4 h-4" />
          <span>{userEmail}</span>
        </div>
        
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={handleBillingClick}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors font-medium"
          >
            <CreditCard className="w-4 h-4" />
            Billing
          </button>
          
          <LanguageSelector />
          
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t('app.signOut')}
          </button>
        </div>
      </div>
    </div>
  );
};