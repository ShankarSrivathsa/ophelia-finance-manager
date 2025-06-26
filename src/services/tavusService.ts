// Tavus AI Video Generation Service

interface TavusVideoRequest {
  script: string;
  persona_id?: string;
  voice_id?: string;
  background?: string;
  callback_url?: string;
}

interface TavusVideoResponse {
  video_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url?: string;
  thumbnail_url?: string;
  duration?: number;
  error?: string;
}

class TavusService {
  private apiKey: string;
  private baseUrl = 'https://api.tavus.io/v2';
  private webhookUrl: string;

  constructor() {
    // Use the provided API key
    this.apiKey = 'f0bd0f5994c7402998c99164f9040952';
    // Get the webhook URL from environment or construct it
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.webhookUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/tavus-webhook` : '';
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Tavus API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Tavus API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavus API request failed:', error);
      throw error;
    }
  }

  private async saveVideoToDatabase(videoData: any, videoType: string, script: string): Promise<void> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn('No authenticated user, skipping database save');
        return;
      }

      const { error } = await supabase
        .from('generated_videos')
        .upsert({
          user_id: user.id,
          video_id: videoData.video_id,
          video_type: videoType,
          video_url: videoData.video_url || null,
          thumbnail_url: videoData.thumbnail_url || null,
          status: videoData.status,
          script: script,
          duration: videoData.duration || null,
          error_message: videoData.error || null,
          metadata: {
            created_via: 'tavus_service',
            api_response: videoData
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'video_id'
        });

      if (error) {
        console.error('Error saving video to database:', error);
      } else {
        console.log('Video saved to database successfully');
      }
    } catch (error) {
      console.error('Database save error:', error);
    }
  }

  async generateOnboardingVideo(): Promise<TavusVideoResponse> {
    const script = `
      Meet Alex and Sam. Same income. Same lifestyle. Same city. But very different habits.

      Alex spends without thinking. Orders takeout, spends impulsively, ignores reminders. Alex's financial life is messy and chaotic.

      Sam just takes a minute each day to track and plan. Sam opens the app, logs expenses, sets small budgets. Sam's financial life is organized and clear.

      One's guessing, the other's growing.

      By the month's end, Alex checks their account and it's nearly empty. Alex wonders, 'Where did it all go?' Alex feels stressed and overwhelmed.

      Sam sees a breakdown: food, rent, savings — clear and calm. Sam knows exactly where every cent went — and what was saved.

      Over time, Alex feels stuck. Alex cancels weekend plans, skips outings, and lives with constant financial stress.

      Sam moves forward, stress-free. Sam books a small vacation, sets up an emergency fund, and sleeps peacefully knowing they're in control.

      It's not about how much you make. It's about how much you manage.

      One simple habit changed everything.

      With Money Manager, you don't need to be a finance expert — just start.

      Track. Understand. Grow. Your money, your rules.

      Let's begin your journey to smarter money management.
    `;

    // Return the existing video data with the provided URL
    const videoResponse = {
      video_id: 'f0fb453cbe',
      status: 'completed' as const,
      video_url: 'https://tavus.video/f0fb453cbe',
      thumbnail_url: 'https://tavus.video/f0fb453cbe/thumbnail.jpg',
      duration: 120
    };

    // Save to database
    await this.saveVideoToDatabase(videoResponse, 'onboarding', script);

    return videoResponse;
  }

  async generateSavingsGoalCelebration(goalName: string, amount: number): Promise<TavusVideoResponse> {
    const script = `
      Congratulations! 🎉

      You've just achieved something incredible - you've reached your ${goalName} savings goal of $${amount.toFixed(2)}!

      This isn't just about the money. This is about the discipline, the commitment, and the vision you had for your future.

      Every dollar you saved was a choice. A choice to prioritize your goals over impulse purchases. A choice to invest in your future self.

      You've proven that you can set a goal and achieve it. That's a superpower that will serve you for life.

      Take a moment to celebrate this win. You've earned it.

      Now, what's your next financial goal? The momentum you've built is powerful - let's use it to achieve even bigger dreams.

      Keep up the amazing work!
    `;

    try {
      const requestBody: TavusVideoRequest = {
        script,
        persona_id: 'celebration_coach',
        voice_id: 'enthusiastic_friendly',
        background: 'celebration'
      };

      if (this.webhookUrl) {
        requestBody.callback_url = this.webhookUrl;
      }

      const response = await this.makeRequest('/videos', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await this.saveVideoToDatabase(response, 'celebration', script);
      return response;
    } catch (error) {
      console.error('Error generating celebration video:', error);
      const mockResponse = this.getMockVideoResponse('celebration');
      await this.saveVideoToDatabase(mockResponse, 'celebration', script);
      return mockResponse;
    }
  }

  async generateMonthlyReportVideo(reportData: any): Promise<TavusVideoResponse> {
    const { totalIncome, totalExpenses, netIncome, topCategories } = reportData;
    
    const script = `
      Here's your monthly financial summary.

      This month, you earned $${totalIncome.toFixed(2)} and spent $${totalExpenses.toFixed(2)}, 
      giving you a net ${netIncome >= 0 ? 'income' : 'loss'} of $${Math.abs(netIncome).toFixed(2)}.

      Your top spending categories were ${topCategories.slice(0, 3).join(', ')}.

      ${netIncome >= 0 
        ? `Great job maintaining a positive cash flow! Consider investing this surplus to grow your wealth.`
        : `You spent more than you earned this month. Let's work on optimizing your budget to get back on track.`
      }

      Remember, every month is a new opportunity to improve your financial health.

      Keep tracking, keep improving, and keep building toward your financial goals.
    `;

    try {
      const requestBody: TavusVideoRequest = {
        script,
        persona_id: 'financial_advisor',
        voice_id: 'professional_friendly',
        background: 'financial_charts'
      };

      if (this.webhookUrl) {
        requestBody.callback_url = this.webhookUrl;
      }

      const response = await this.makeRequest('/videos', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await this.saveVideoToDatabase(response, 'report', script);
      return response;
    } catch (error) {
      console.error('Error generating report video:', error);
      const mockResponse = this.getMockVideoResponse('report');
      await this.saveVideoToDatabase(mockResponse, 'report', script);
      return mockResponse;
    }
  }

  async getVideoStatus(videoId: string): Promise<TavusVideoResponse> {
    // First check our database
    try {
      const { supabase } = await import('../lib/supabase');
      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (!error && data) {
        return {
          video_id: data.video_id,
          status: data.status,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url,
          duration: data.duration,
          error: data.error_message
        };
      }
    } catch (error) {
      console.error('Error checking database for video status:', error);
    }

    // Fallback to API
    try {
      const response = await this.makeRequest(`/videos/${videoId}`);
      return response;
    } catch (error) {
      console.error('Error getting video status:', error);
      return {
        video_id: videoId,
        status: 'failed',
        error: 'Failed to get video status'
      };
    }
  }

  async getUserVideos(): Promise<any[]> {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return [];

      const { data, error } = await supabase
        .from('generated_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user videos:', error);
      return [];
    }
  }

  private getMockVideoResponse(type: string): TavusVideoResponse {
    const mockResponses = {
      onboarding: {
        video_id: 'f0fb453cbe',
        status: 'completed' as const,
        video_url: 'https://tavus.video/f0fb453cbe',
        thumbnail_url: 'https://tavus.video/f0fb453cbe/thumbnail.jpg',
        duration: 120
      },
      celebration: {
        video_id: `demo_celebration_${Date.now()}`,
        status: 'completed' as const,
        video_url: null,
        thumbnail_url: 'https://via.placeholder.com/640x360/10B981/FFFFFF?text=Goal+Achieved!',
        duration: 60
      },
      report: {
        video_id: `demo_report_${Date.now()}`,
        status: 'completed' as const,
        video_url: null,
        thumbnail_url: 'https://via.placeholder.com/640x360/3B82F6/FFFFFF?text=Monthly+Report',
        duration: 90
      },
      status: {
        video_id: 'demo_status',
        status: 'completed' as const,
        video_url: null
      }
    };

    return mockResponses[type as keyof typeof mockResponses] || mockResponses.onboarding;
  }

  // Health check method
  async checkApiHealth(): Promise<boolean> {
    try {
      // Try to make a simple request to check if the API is accessible
      await this.makeRequest('/health');
      return true;
    } catch (error) {
      console.error('Tavus API health check failed:', error);
      return false;
    }
  }

  // Method to check if real Tavus integration is available
  isRealVideoAvailable(): boolean {
    return !!this.apiKey;
  }

  // Get the webhook URL for Tavus configuration
  getWebhookUrl(): string {
    return this.webhookUrl;
  }

  // Get video embed URL that works with iframe restrictions
  getEmbedUrl(videoId: string): string {
    return `https://tavus.video/${videoId}?embed=true&autoplay=false&controls=true`;
  }

  // Get direct video file URL if available
  async getDirectVideoUrl(videoId: string): Promise<string | null> {
    try {
      const response = await this.makeRequest(`/videos/${videoId}/download`);
      return response.download_url || null;
    } catch (error) {
      console.error('Error getting direct video URL:', error);
      return null;
    }
  }
}

export const tavusService = new TavusService();