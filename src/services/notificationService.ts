// Mock Expo Notifications service for web
// In a real Expo app, you'd use expo-notifications

interface NotificationData {
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private isSupported = 'Notification' in window;
  private permission: NotificationPermission = 'default';

  constructor() {
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission === 'granted';
  }

  async scheduleNotification(notification: NotificationData, delay: number = 0): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.warn('Notification permission denied');
      return;
    }

    setTimeout(() => {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/vite.svg',
        badge: '/vite.svg',
        data: notification.data
      });
    }, delay);
  }

  // Budget overspend notification
  async notifyBudgetOverspend(category: string, amount: number, budgetAmount: number): Promise<void> {
    await this.scheduleNotification({
      title: '💸 Budget Alert!',
      body: `You've exceeded your ${category} budget by $${(amount - budgetAmount).toFixed(2)}`,
      data: { type: 'budget_overspend', category, amount, budgetAmount }
    });
  }

  // Savings goal progress notification
  async notifySavingsProgress(goalName: string, progress: number): Promise<void> {
    if (progress >= 25 && progress < 50) {
      await this.scheduleNotification({
        title: '🎯 Quarter Way There!',
        body: `You're 25% closer to your ${goalName} goal. Keep it up!`,
        data: { type: 'savings_progress', goalName, progress }
      });
    } else if (progress >= 50 && progress < 75) {
      await this.scheduleNotification({
        title: '🚀 Halfway to Success!',
        body: `You're 50% of the way to your ${goalName} goal!`,
        data: { type: 'savings_progress', goalName, progress }
      });
    } else if (progress >= 75 && progress < 100) {
      await this.scheduleNotification({
        title: '🔥 Almost There!',
        body: `You're 75% of the way to your ${goalName} goal. The finish line is in sight!`,
        data: { type: 'savings_progress', goalName, progress }
      });
    } else if (progress >= 100) {
      await this.scheduleNotification({
        title: '🎉 Goal Achieved!',
        body: `Congratulations! You've reached your ${goalName} savings goal!`,
        data: { type: 'goal_achieved', goalName, progress }
      });
    }
  }

  // Monthly report notification
  async notifyMonthlyReport(): Promise<void> {
    await this.scheduleNotification({
      title: '📊 Monthly Report Ready',
      body: 'Your financial summary for this month is ready to view!',
      data: { type: 'monthly_report' }
    });
  }

  // AI insights notification
  async notifyAIInsights(insightCount: number): Promise<void> {
    await this.scheduleNotification({
      title: '🧠 New AI Insights',
      body: `Your AI advisor has ${insightCount} new insights to help optimize your finances!`,
      data: { type: 'ai_insights', count: insightCount }
    });
  }

  // Bill reminder notification
  async notifyBillReminder(billName: string, amount: number, dueDate: string): Promise<void> {
    await this.scheduleNotification({
      title: '💳 Bill Reminder',
      body: `${billName} ($${amount.toFixed(2)}) is due on ${dueDate}`,
      data: { type: 'bill_reminder', billName, amount, dueDate }
    });
  }
}

export const notificationService = new NotificationService();