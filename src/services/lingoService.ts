import { Language } from '../types/language';

class LingoService {
  private apiKey: string;
  private baseUrl = 'https://api.lingohub.com/v1';
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
      // For demo purposes, we'll use a static list of languages
      // In a real app, you would fetch this from the Lingo API
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
        { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
        { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
        { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
        { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
        { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
        { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
        { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
        { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
        { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
        { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
        { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱' },
        { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
        { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
        { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' }
      ];

      // Cache the languages
      this.cachedLanguages = languages;
      return languages;
    } catch (error) {
      console.error('Error fetching languages:', error);
      return [];
    }
  }

  async searchLanguages(query: string): Promise<Language[]> {
    const languages = await this.getLanguages();
    
    if (!query) return languages;
    
    const lowerQuery = query.toLowerCase();
    
    return languages.filter(lang => 
      lang.name.toLowerCase().includes(lowerQuery) || 
      lang.nativeName.toLowerCase().includes(lowerQuery) ||
      lang.code.toLowerCase().includes(lowerQuery)
    );
  }

  async getTranslation(key: string, language: string): Promise<string> {
    // In a real app, you would fetch this from the Lingo API
    // For now, we'll just return the key
    return key;
  }
}

export const lingoService = new LingoService();