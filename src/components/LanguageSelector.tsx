import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Search, X, Check } from 'lucide-react';
import { Language } from '../types/language';
import { lingoService } from '../services/lingoService';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [currentLang, setCurrentLang] = useState(i18n.language.split('-')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [filteredLanguages, setFilteredLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLanguages = async () => {
      setLoading(true);
      const langs = await lingoService.getLanguages();
      setLanguages(langs);
      setFilteredLanguages(langs);
      setLoading(false);
    };

    loadLanguages();
  }, []);

  const changeLanguage = async (languageCode: string) => {
    try {
      console.log('Changing language from', i18n.language, 'to', languageCode);
      
      // Update local state first for immediate UI feedback
      setCurrentLang(languageCode);
      setIsOpen(false);
      
      // Force update localStorage to ensure persistence
      localStorage.setItem('i18nextLng', languageCode);
      
      // Change the language in i18next
      await i18n.changeLanguage(languageCode);
      
      console.log('Language changed successfully, reloading page');
      
      // Reload the page to ensure all components update properly
      window.location.reload();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      
      // Position dropdown to the left if there's not enough space on the right
      const left = windowWidth - rect.right < 320 
        ? rect.left - 320 + rect.width 
        : rect.left;
      
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: Math.max(10, left) // Ensure it's not off-screen to the left
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredLanguages(languages);
    } else {
      const filtered = languages.filter(lang => 
        lang.name.toLowerCase().includes(query.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(query.toLowerCase()) ||
        lang.code.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredLanguages(filtered);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredLanguages(languages);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', updateDropdownPosition);
      window.addEventListener('resize', updateDropdownPosition);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updateDropdownPosition);
      window.removeEventListener('resize', updateDropdownPosition);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Update current language when i18n language changes
  useEffect(() => {
    // Extract the language code without region (e.g., 'en' from 'en-US')
    const langCode = i18n.language.split('-')[0];
    console.log('i18n language changed to:', i18n.language, 'setting currentLang to:', langCode);
    setCurrentLang(langCode);
  }, [i18n.language]);

  // Get current language info
  const currentLanguage = languages.find(lang => lang.code === currentLang) || 
    { code: currentLang, name: currentLang === 'en' ? 'English' : currentLang, nativeName: currentLang === 'en' ? 'English' : currentLang, flag: '🌐' };

  // Get language code display (e.g., "EN" for English)
  const getLanguageCode = (code: string) => {
    return code.slice(0, 2).toUpperCase();
  };

  const dropdown = isOpen ? createPortal(
    <div 
      ref={dropdownRef}
      className="bg-[#1F1F1F] border border-[#2C2C2E] rounded-lg shadow-xl w-[320px]"
      style={{ 
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 999999
      }}
    >
      {/* Search Bar */}
      <div className="p-3 border-b border-[#2C2C2E]">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder={t('language.search', 'Search languages...')}
            className="w-full pl-10 pr-10 py-2 bg-[#2C2C2E] border-none rounded-lg text-white focus:ring-1 focus:ring-white focus:outline-none"
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Language List */}
      <div className="max-h-[300px] overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-400">
            <div className="w-5 h-5 border-2 border-[#2C2C2E] border-t-white rounded-full animate-spin mx-auto mb-2"></div>
            {t('language.loading', 'Loading languages...')}
          </div>
        ) : filteredLanguages.length === 0 ? (
          <div className="p-4 text-center text-gray-400">
            {t('language.noResults', 'No languages found')}
          </div>
        ) : (
          filteredLanguages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-[#2C2C2E] transition-colors flex items-center gap-2 ${
                currentLang === language.code ? 'bg-[#2C2C2E] text-white font-medium' : 'text-gray-300'
              }`}
            >
              <span className="text-xl">{language.flag}</span>
              <div className="flex-1">
                <div className="font-medium">{language.name}</div>
                <div className="text-xs text-gray-400">{language.nativeName}</div>
              </div>
              {currentLang === language.code && (
                <Check className="w-4 h-4 text-white" />
              )}
            </button>
          ))
        )}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-[#2C2C2E] rounded-lg transition-colors"
        title={`${t('language.current', 'Current language')}: ${currentLanguage.name}`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">
          {getLanguageCode(currentLang)}
        </span>
      </button>
      {dropdown}
    </>
  );
};