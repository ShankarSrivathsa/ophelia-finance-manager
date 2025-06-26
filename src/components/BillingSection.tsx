import React from 'react';
import { useTranslation } from 'react-i18next';

interface BillingSectionProps {
  userEmail: string;
  onViewPlans: () => void;
}

export const BillingSection: React.FC<BillingSectionProps> = ({ userEmail, onViewPlans }) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onViewPlans}
      className="text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
    >
      Billing
    </button>
  );
};