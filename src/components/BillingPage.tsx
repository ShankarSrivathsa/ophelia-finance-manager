import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Crown, Zap, Star, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BillingPageProps {
  userEmail: string;
  onBack: () => void;
  onProStatusChange: (isPro: boolean) => void;
}

export const BillingPage: React.FC<BillingPageProps> = ({ userEmail, onBack, onProStatusChange }) => {
  const { t } = useTranslation();
  const [isProUser, setIsProUser] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check subscription status from localStorage
  useEffect(() => {
    const proStatus = localStorage.getItem('user_pro_status');
    setIsProUser(proStatus === 'true');
  }, []);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Set Pro status in localStorage
      localStorage.setItem('user_pro_status', 'true');
      setIsProUser(true);
      
      // Notify parent component immediately
      onProStatusChange(true);
      
      // Show success message
      alert('🎉 Successfully upgraded to Pro! You now have access to all premium features.');
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = () => {
    // For demo purposes, allow downgrade
    if (confirm('Would you like to cancel your Pro subscription?')) {
      localStorage.setItem('user_pro_status', 'false');
      setIsProUser(false);
      
      // Notify parent component immediately
      onProStatusChange(false);
      
      alert('Pro subscription cancelled. You can upgrade again anytime.');
    }
  };

  const freeFeatures = [
    'Track daily expenses',
    'Record income sources',
    'Set monthly budgets',
    'Savings goal tracking',
    'Account management',
    'Basic analytics & reports',
    'AI Financial Advisor',
    'Data export/import',
    'Multi-language support'
  ];

  const proFeatures = [
    'All Free features',
    'Smart Budget Optimizer',
    'AI-Generated Reports',
    'Advanced analytics',
    'Priority customer support',
    'Unlimited savings goals',
    'Custom categories',
    'Premium insights'
  ];

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: 'url(/bg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="bg-white/55 backdrop-blur-sm rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Billing & Subscription</h1>
                <p className="text-gray-600">Manage your subscription and billing preferences</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Account: {userEmail}</span>
              <span>•</span>
              <span className={`flex items-center gap-1 ${isProUser ? 'text-yellow-600' : 'text-gray-600'}`}>
                {isProUser ? <Crown className="w-4 h-4" /> : <div className="w-4 h-4 bg-gray-300 rounded-full" />}
                {isProUser ? 'Pro Plan' : 'Free Plan'}
              </span>
            </div>
          </div>
        </div>

        {/* Current Plan Status */}
        {isProUser && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800">Pro Plan Active</h3>
                    <p className="text-yellow-700">You have access to all premium features</p>
                  </div>
                </div>
                <button
                  onClick={handleManageSubscription}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Manage Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Free Plan</h3>
                  <p className="text-gray-600">Perfect for getting started</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-800">$0</span>
                <span className="text-gray-600 ml-2">forever</span>
              </div>
              
              {!isProUser && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Current Plan</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-gray-800 mb-4">What's included:</h4>
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className={`text-gray-700 ${feature === 'AI Financial Advisor' ? 'font-medium' : ''}`}>
                      {feature}
                      {feature === 'AI Financial Advisor' && (
                        <span className="ml-2 text-xs bg-gradient-to-r from-blue-400 to-purple-500 text-white px-2 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border-2 border-blue-200 relative">
            {/* Popular Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-bl-lg">
              <span className="text-sm font-medium">Most Popular</span>
            </div>
            
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                  <Crown className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">Pro Plan</h3>
                  <p className="text-gray-600">Advanced features & AI insights</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-4xl font-bold text-gray-800">$9.99</span>
                <span className="text-gray-600 ml-2">per month</span>
              </div>
              
              {isProUser ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Check className="w-4 h-4" />
                    <span className="font-medium">Current Plan</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Upgrading...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Upgrade to Pro
                    </>
                  )}
                </button>
              )}
            </div>
            
            <div className="p-6">
              <h4 className="font-semibold text-gray-800 mb-4">Everything in Free, plus:</h4>
              <ul className="space-y-3">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className={`${index === 0 ? 'text-gray-500' : 'text-gray-700'} ${index > 0 && index <= 2 ? 'font-medium' : ''}`}>
                      {feature}
                      {index > 0 && index <= 2 && (
                        <span className="ml-2 text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 rounded-full">
                          AI
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Success Message for Pro Users */}
        {isProUser && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-green-800">Welcome to Pro!</h3>
                  <p className="text-green-700">You now have access to all premium features including advanced AI-powered insights.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800">⚡ Smart Budget Optimizer</div>
                  <div className="text-sm text-gray-600">Optimize your spending automatically</div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800">📊 AI Reports</div>
                  <div className="text-sm text-gray-600">Generate detailed financial reports</div>
                </div>
                <div className="bg-white/50 p-3 rounded-lg">
                  <div className="font-medium text-gray-800">🎯 Premium Insights</div>
                  <div className="text-sm text-gray-600">Advanced analytics and recommendations</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Can I cancel my subscription anytime?</h4>
                <p className="text-gray-600">Yes, you can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your billing period.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">What happens to my data if I downgrade?</h4>
                <p className="text-gray-600">Your data is always safe. If you downgrade, you'll lose access to Pro features but all your financial data remains intact.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Is there a free trial for Pro features?</h4>
                <p className="text-gray-600">We offer a 7-day free trial for new Pro subscribers. You can try all premium features risk-free.</p>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">How does the AI advisor work?</h4>
                <p className="text-gray-600">Our AI analyzes your spending patterns, income, and goals to provide personalized financial advice. The basic AI advisor is free, while Pro users get advanced optimization features.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <div className="bg-white/55 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <p className="text-gray-500 text-sm">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@moneymanager.com" className="text-blue-600 hover:text-blue-700">
                support@moneymanager.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};