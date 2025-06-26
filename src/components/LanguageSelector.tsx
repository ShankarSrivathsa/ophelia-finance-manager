import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [currentLang, setCurrentLang] = useState(i18n.language);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const changeLanguage = async (languageCode: string) => {
    try {
      console.log('Changing language from', i18n.language, 'to', languageCode);
      
      // Change the language
      await i18n.changeLanguage(languageCode);
      
      // Update local state
      setCurrentLang(languageCode);
      setIsOpen(false);
      
      // Force update localStorage
      localStorage.setItem('i18nextLng', languageCode);
      
      // Trigger a page reload to ensure all components update
      window.location.reload();
      
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const updateDropdownPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right - 160 + window.scrollX
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      updateDropdownPosition();
    }
    setIsOpen(!isOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
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

  // Update current language when i18n language changes
  useEffect(() => {
    setCurrentLang(i18n.language);
  }, [i18n.language]);

  // Get current language info
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0];

  const dropdown = isOpen ? createPortal(
    <div 
      className="bg-white border border-gray-200 rounded-lg shadow-xl min-w-[160px]"
      style={{ 
        position: 'absolute',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        zIndex: 999999
      }}
    >
      {languages.map((language) => (
        <button
          key={language.code}
          onClick={() => changeLanguage(language.code)}
          className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${
            currentLang === language.code ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
          }`}
        >
          <span>{language.flag}</span>
          <span>{language.name}</span>
          {currentLang === language.code && (
            <span className="ml-auto text-blue-600">✓</span>
          )}
        </button>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button 
        ref={buttonRef}
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-100/55 rounded-lg transition-colors"
        title={`Current language: ${currentLanguage.name}`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">
          {currentLanguage.flag}
        </span>
      </button>
      {dropdown}
    </>
  );
};