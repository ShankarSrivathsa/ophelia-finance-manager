import React, { useState, useEffect } from 'react';
import { Calculator, BarChart3, FileText, Scale, Database, TrendingUp, Target, Building2, PlusCircle, PiggyBank, Brain, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Transaction } from './types/accounting';
import { UserProfile } from './types/finance';
import { TransactionForm } from './components/TransactionForm';
import { JournalEntries } from './components/JournalEntries';
import { LedgerAccounts } from './components/LedgerAccounts';
import { ProfitLoss } from './components/ProfitLoss';
import { TrialBalance } from './components/TrialBalance';
import { DataManagement } from './components/DataManagement';
import { AuthWrapper } from './components/AuthWrapper';
import { UserProfile as UserProfileComponent } from './components/UserProfile';
import { PersonaQuiz } from './components/PersonaQuiz';
import { ExpenseTracker } from './components/ExpenseTracker';
import { IncomeTracker } from './components/IncomeTracker';
import { SavingsTracker } from './components/SavingsTracker';
import { BudgetManager } from './components/BudgetManager';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { AccountManager } from './components/AccountManager';
import { AIFinancialAdvisor } from './components/AIFinancialAdvisor';
import { AutomatedReports } from './components/AutomatedReports';
import { OnboardingVideo } from './components/OnboardingVideo';
import { BillingPage } from './components/BillingPage';
import { generateLedgerAccounts, generateTrialBalance, generateProfitLoss, getLastDayOfMonth } from './utils/accounting';
import { saveTransaction, loadTransactions, clearAllTransactions } from './services/supabaseStorage';
import { getUserProfile } from './services/financeService';
import { notificationService } from './services/notificationService';
import { offlineService } from './services/offlineService';
import { supabase } from './lib/supabase';
import './i18n';

type ActiveTab = 'expenses' | 'income' | 'savings' | 'transactions' | 'budgets' | 'analytics' | 'accounts' | 'journal' | 'ledger' | 'profitloss' | 'trial' | 'data' | 'ai-advisor' | 'reports' | 'billing';

function AppContent() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<ActiveTab>('expenses');
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showOnboardingVideo, setShowOnboardingVideo] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [netIncome, setNetIncome] = useState(0);
  const [isProUser, setIsProUser] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email || '');
          
          // Check Pro status from localStorage
          const proStatus = localStorage.getItem('user_pro_status');
          setIsProUser(proStatus === 'true');
          
          // Load user profile
          const profile = await getUserProfile();
          setUserProfile(profile);
          
          // Show onboarding video for new users
          if (!profile || !profile.quiz_completed) {
            setShowOnboardingVideo(true);
          } else {
            // Show quiz if profile doesn't exist or quiz not completed
            if (!profile || !profile.quiz_completed) {
              setShowQuiz(true);
            }
          }
          
          const loadedTransactions = await loadTransactions();
          setTransactions(loadedTransactions);
          
          // Calculate net income from income and expenses
          await calculateNetIncome();

          // Request notification permissions
          await notificationService.requestPermission();

          // Sync offline data if online
          if (offlineService.isOnline()) {
            await offlineService.syncOfflineData();
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [currentMonth]);

  // Listen for billing navigation event
  useEffect(() => {
    const handleSetActiveTab = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('set-active-tab', handleSetActiveTab as EventListener);
    
    return () => {
      window.removeEventListener('set-active-tab', handleSetActiveTab as EventListener);
    };
  }, []);

  // Listen for Pro status changes
  useEffect(() => {
    const handleStorageChange = () => {
      const proStatus = localStorage.getItem('user_pro_status');
      setIsProUser(proStatus === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const calculateNetIncome = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = `${currentMonth}-01`;
      const endDate = getLastDayOfMonth(currentMonth);

      const [incomeData, expenseData] = await Promise.all([
        supabase
          .from('income')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
      ]);

      const totalIncome = incomeData.data?.reduce((sum, item) => sum + item.amount, 0) || 0;
      const totalExpenses = expenseData.data?.reduce((sum, item) => sum + item.amount, 0) || 0;
      
      setNetIncome(totalIncome - totalExpenses);
    } catch (error) {
      console.error('Error calculating net income:', error);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingVideo(false);
    setShowQuiz(true);
  };

  const handleQuizComplete = async (persona: string) => {
    setShowQuiz(false);
    const profile = await getUserProfile();
    setUserProfile(profile);
    // Set default tab based on persona
    if (persona === 'student' || persona === 'homemaker') {
      setActiveTab('expenses');
    } else if (persona === 'business' || persona === 'freelancer') {
      setActiveTab('transactions');
    } else {
      setActiveTab('budgets');
    }
  };

  const handleProStatusChange = (isPro: boolean) => {
    setIsProUser(isPro);
  };

  const handleAddTransaction = async (transactionData: Omit<Transaction, 'id'>) => {
    try {
      if (offlineService.isOnline()) {
        const newTransaction = await saveTransaction(transactionData);
        if (newTransaction) {
          setTransactions(prev => [newTransaction, ...prev]);
        }
      } else {
        // Save offline
        await offlineService.addOfflineTransaction(transactionData);
        // Add to local state with temporary ID
        const tempTransaction = {
          ...transactionData,
          id: `offline_${Date.now()}`
        };
        setTransactions(prev => [tempTransaction, ...prev]);
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleImportTransactions = async (importedTransactions: Transaction[]) => {
    try {
      // Clear existing transactions first
      await clearAllTransactions();
      
      // Save each imported transaction
      const savedTransactions: Transaction[] = [];
      for (const transaction of importedTransactions) {
        const { id, ...transactionData } = transaction;
        const savedTransaction = await saveTransaction(transactionData);
        if (savedTransaction) {
          savedTransactions.push(savedTransaction);
        }
      }
      
      setTransactions(savedTransactions);
    } catch (error) {
      console.error('Error importing transactions:', error);
      alert('Failed to import transactions. Please try again.');
    }
  };

  const handleClearData = async () => {
    try {
      await clearAllTransactions();
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  const handleDataUpdate = () => {
    // Refresh data when needed
    loadTransactions().then(setTransactions);
    calculateNetIncome();
  };

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#121212' }}
      >
        <div className="text-center bg-[#1F1F1F] backdrop-blur-sm rounded-xl p-8 shadow-lg border border-[#2C2C2E]">
          <div className="w-12 h-12 border-4 border-[#2C2C2E] border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  if (showOnboardingVideo) {
    return <OnboardingVideo onComplete={handleOnboardingComplete} />;
  }

  if (showQuiz) {
    return <PersonaQuiz onComplete={handleQuizComplete} />;
  }

  // Show billing page as a separate full-screen page
  if (activeTab === 'billing') {
    return (
      <BillingPage 
        userEmail={userEmail} 
        onBack={() => setActiveTab('expenses')} 
        onProStatusChange={handleProStatusChange}
      />
    );
  }

  const ledgerAccounts = generateLedgerAccounts(transactions);
  const trialBalanceItems = generateTrialBalance(ledgerAccounts);
  const { items: profitLossItems, netIncome: accountingNetIncome } = generateProfitLoss(ledgerAccounts);

  const getPersonalizedTabs = () => {
    const baseTabs = [
      { id: 'expenses', label: t('navigation.expenses'), icon: Calculator },
      { id: 'income', label: t('navigation.income'), icon: PlusCircle },
      { id: 'savings', label: t('navigation.savings'), icon: PiggyBank },
      { id: 'budgets', label: t('navigation.budgets'), icon: Target },
      { id: 'analytics', label: t('navigation.analytics'), icon: TrendingUp },
      { id: 'accounts', label: t('navigation.accounts'), icon: Building2 }
    ];

    // Add AI Advisor to all users (now free)
    baseTabs.push({ id: 'ai-advisor', label: t('navigation.aiAdvisor'), icon: Brain });

    // Add Pro features - show for all users but indicate Pro status
    baseTabs.push(
      { id: 'reports', label: t('navigation.aiReports'), icon: FileText }
    );

    // Add accounting tabs for business users
    if (userProfile?.persona === 'business' || userProfile?.persona === 'freelancer') {
      baseTabs.push(
        { id: 'transactions', label: t('navigation.transactions'), icon: Calculator },
        { id: 'journal', label: t('navigation.journal'), icon: FileText },
        { id: 'ledger', label: t('navigation.ledger'), icon: BarChart3 },
        { id: 'profitloss', label: t('navigation.profitLoss'), icon: BarChart3 },
        { id: 'trial', label: t('navigation.trialBalance'), icon: Scale }
      );
    }

    baseTabs.push({ id: 'data', label: t('navigation.data'), icon: Database });
    return baseTabs;
  };

  const tabs = getPersonalizedTabs();

  const getWelcomeMessage = () => {
    const persona = userProfile?.persona;
    switch (persona) {
      case 'student': return 'Track your expenses and build healthy savings habits';
      case 'freelancer': return 'Manage irregular income and save for the future';
      case 'salaried': return 'Plan your savings and achieve your financial goals';
      case 'business': return 'Complete financial management for your business';
      case 'homemaker': return 'Manage household finances and family savings';
      case 'retiree': return 'Monitor spending and preserve your savings';
      default: return t('app.subtitle');
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#121212' }}
    >
      <div className="container mx-auto px-4 py-8">
        {/* Header with Bolt Logo */}
        <div className="text-center mb-8 relative">
          {/* Bolt Logo - Top Right */}
          <div className="absolute top-0 right-0">
            <img 
              src="/bolt_logo.png" 
              alt="Powered by Bolt" 
              className="w-16 h-16 opacity-80 hover:opacity-100 transition-opacity duration-200"
              title="Powered by Bolt"
            />
          </div>
          
          {/* Main Header Content */}
          <div className="inline-block bg-[#1F1F1F] backdrop-blur-sm rounded-xl p-6 shadow-lg mb-6 border border-[#2C2C2E]">
            <h1 className="text-4xl font-bold text-white mb-2">{t('app.title')}</h1>
            <p className="text-lg text-gray-300">{getWelcomeMessage()}</p>
            {isProUser && (
              <div className="mt-2 flex items-center justify-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-yellow-400">Pro Member</span>
              </div>
            )}
          </div>
          
          {/* User Profile - Separate from header */}
          <div className="mb-4 flex justify-center">
            <UserProfileComponent userEmail={userEmail} />
          </div>
          
          {/* Month Selector - Separate from header */}
          <div className="mb-4 flex justify-center">
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="px-3 py-2 border border-[#2C2C2E] rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-[#1F1F1F] text-white"
            />
          </div>
          
          {/* Net Income Display - Separate from header */}
          <div className="inline-flex items-center gap-4 text-sm text-gray-300 bg-[#1F1F1F] backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg border border-[#2C2C2E]">
            <span className={netIncome >= 0 ? 'text-green-400' : 'text-red-400'}>
              Net {netIncome >= 0 ? 'Income' : 'Loss'}: ${Math.abs(netIncome).toFixed(2)}
            </span>
            {transactions.length > 0 && (
              <>
                <span>•</span>
                <span>{transactions.length} transactions recorded</span>
              </>
            )}
            {!offlineService.isOnline() && (
              <>
                <span>•</span>
                <span className="text-orange-400">📱 Offline Mode</span>
              </>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap justify-center gap-2 p-2 bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg border border-[#2C2C2E]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isProFeature = ['reports'].includes(tab.id);
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-md'
                      : 'text-gray-300 hover:bg-[#2C2C2E]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isProFeature && (
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center ${
                      isProUser ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-600'
                    }`}>
                      <span className="text-[8px] text-white font-bold">
                        {isProUser ? '✦' : '🔒'}
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto">
          {activeTab === 'expenses' && (
            <ExpenseTracker onExpenseAdded={handleDataUpdate} />
          )}
          
          {activeTab === 'income' && (
            <IncomeTracker onIncomeAdded={handleDataUpdate} />
          )}
          
          {activeTab === 'savings' && (
            <SavingsTracker onSavingsUpdated={handleDataUpdate} />
          )}
          
          {activeTab === 'budgets' && (
            <BudgetManager 
              currentMonth={currentMonth} 
              onBudgetUpdated={handleDataUpdate} 
            />
          )}
          
          {activeTab === 'analytics' && (
            <AnalyticsDashboard currentMonth={currentMonth} />
          )}
          
          {activeTab === 'accounts' && (
            <AccountManager onAccountsUpdated={handleDataUpdate} />
          )}

          {activeTab === 'ai-advisor' && (
            <AIFinancialAdvisor onAdviceGenerated={handleDataUpdate} />
          )}

          {activeTab === 'reports' && (
            isProUser ? (
              <AutomatedReports currentMonth={currentMonth} />
            ) : (
              <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-8 text-center border border-[#2C2C2E]">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Pro Feature</h3>
                <p className="text-gray-300 mb-4">
                  Upgrade to Pro to access AI-generated financial reports and insights.
                </p>
                <button
                  onClick={() => setActiveTab('billing')}
                  className="bg-gradient-to-r from-white to-gray-200 text-black px-6 py-3 rounded-lg hover:from-gray-200 hover:to-white transition-all duration-200 flex items-center gap-2 mx-auto"
                >
                  <Crown className="w-5 h-5" />
                  Upgrade to Pro
                </button>
              </div>
            )
          )}
          
          {activeTab === 'transactions' && (
            <TransactionForm onAddTransaction={handleAddTransaction} />
          )}
          
          {activeTab === 'journal' && (
            <JournalEntries transactions={transactions} />
          )}
          
          {activeTab === 'ledger' && (
            <LedgerAccounts ledgerAccounts={ledgerAccounts} />
          )}
          
          {activeTab === 'profitloss' && (
            <ProfitLoss items={profitLossItems} netIncome={accountingNetIncome} />
          )}
          
          {activeTab === 'trial' && (
            <TrialBalance items={trialBalanceItems} />
          )}
          
          {activeTab === 'data' && (
            <DataManagement
              transactions={transactions}
              onImportTransactions={handleImportTransactions}
              onClearData={handleClearData}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-lg p-4 shadow-lg border border-[#2C2C2E]">
            <p className="text-gray-400 text-sm">Your data is securely stored and synced across all your devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthWrapper>
      <AppContent />
    </AuthWrapper>
  );
}

export default App;