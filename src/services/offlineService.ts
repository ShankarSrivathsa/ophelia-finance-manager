// Mock offline data service
// In a real Expo app, you'd use expo-secure-store and @react-native-async-storage/async-storage

interface OfflineData {
  transactions: any[];
  expenses: any[];
  income: any[];
  budgets: any[];
  savingsGoals: any[];
  lastSync: string;
}

class OfflineService {
  private storageKey = 'money_manager_offline_data';

  async saveOfflineData(data: Partial<OfflineData>): Promise<void> {
    try {
      const existingData = await this.getOfflineData();
      const updatedData = {
        ...existingData,
        ...data,
        lastSync: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  async getOfflineData(): Promise<OfflineData> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }

    return {
      transactions: [],
      expenses: [],
      income: [],
      budgets: [],
      savingsGoals: [],
      lastSync: new Date().toISOString()
    };
  }

  async addOfflineTransaction(transaction: any): Promise<void> {
    const data = await this.getOfflineData();
    data.transactions.push({
      ...transaction,
      id: `offline_${Date.now()}`,
      offline: true,
      createdAt: new Date().toISOString()
    });
    await this.saveOfflineData(data);
  }

  async addOfflineExpense(expense: any): Promise<void> {
    const data = await this.getOfflineData();
    data.expenses.push({
      ...expense,
      id: `offline_${Date.now()}`,
      offline: true,
      createdAt: new Date().toISOString()
    });
    await this.saveOfflineData(data);
  }

  async addOfflineIncome(income: any): Promise<void> {
    const data = await this.getOfflineData();
    data.income.push({
      ...income,
      id: `offline_${Date.now()}`,
      offline: true,
      createdAt: new Date().toISOString()
    });
    await this.saveOfflineData(data);
  }

  async syncOfflineData(): Promise<void> {
    try {
      const offlineData = await this.getOfflineData();
      const itemsToSync = [
        ...offlineData.transactions.filter(t => t.offline),
        ...offlineData.expenses.filter(e => e.offline),
        ...offlineData.income.filter(i => i.offline)
      ];

      if (itemsToSync.length === 0) {
        return;
      }

      console.log(`Syncing ${itemsToSync.length} offline items...`);

      // In a real app, you'd sync with Supabase here
      // For now, we'll just mark them as synced
      const syncedData = {
        ...offlineData,
        transactions: offlineData.transactions.map(t => ({ ...t, offline: false })),
        expenses: offlineData.expenses.map(e => ({ ...e, offline: false })),
        income: offlineData.income.map(i => ({ ...i, offline: false })),
        lastSync: new Date().toISOString()
      };

      await this.saveOfflineData(syncedData);
      console.log('Offline data synced successfully');
    } catch (error) {
      console.error('Error syncing offline data:', error);
    }
  }

  async clearOfflineData(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const offlineService = new OfflineService();

// Auto-sync when coming back online
window.addEventListener('online', () => {
  console.log('Connection restored, syncing offline data...');
  offlineService.syncOfflineData();
});

window.addEventListener('offline', () => {
  console.log('Connection lost, switching to offline mode...');
});