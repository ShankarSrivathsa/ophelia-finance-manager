import { Language } from '../types/language';

class LingoService {
  private apiKey: string;
  private cachedLanguages: Language[] | null = null;

  constructor() {
    this.apiKey = 'api_tbylillg5erclzehj8z8qvyu';
  }

  async getLanguages(): Promise<Language[]> {
    // Return cached languages if available
    if (this.cachedLanguages) {
      return this.cachedLanguages;
    }

    try {
      // In a real implementation, we would fetch languages from the Lingo API
      // For now, we'll use a static list that matches our available translations
      const languages: Language[] = [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
        { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
        { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
        { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
        { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
        { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
      ];

      // Cache the languages
      this.cachedLanguages = languages;
      return languages;
    } catch (error) {
      console.error('Error fetching languages:', error);
      return this.getFallbackLanguages();
    }
  }

  private getFallbackLanguages(): Language[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
    ];
  }
}

export const lingoService = new LingoService();