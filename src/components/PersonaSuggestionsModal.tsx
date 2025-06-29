import React from 'react';
import { ArrowRight, Quote, Brain } from 'lucide-react';
import { PersonaQuizSuggestions } from '../types/finance';

interface PersonaSuggestionsModalProps {
  suggestions: PersonaQuizSuggestions;
  onContinue: () => void;
}

export const PersonaSuggestionsModal: React.FC<PersonaSuggestionsModalProps> = ({ 
  suggestions, 
  onContinue 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50 p-4">
      {/* AI Suggestion Box */}
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 max-w-xl w-full mb-6 border border-[#2C2C2E]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-semibold text-white">AI Suggestion</h2>
        </div>
        <p className="text-white text-lg leading-relaxed">
          {suggestions.suggestion.mainSuggestion}
        </p>
      </div>
      
      {/* Financial Quote Box */}
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-lg p-6 max-w-xl w-full mb-8 border border-[#2C2C2E]">
        <div className="flex items-start gap-3">
          <Quote className="w-8 h-8 text-white flex-shrink-0 mt-1" />
          <div>
            <p className="text-white text-lg font-medium italic mb-2">
              "{suggestions.suggestion.financialQuote.text}"
            </p>
            <p className="text-gray-400">
              — {suggestions.suggestion.financialQuote.author}
            </p>
          </div>
        </div>
      </div>
      
      {/* Continue Button */}
      <button
        onClick={onContinue}
        className="bg-white text-black px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 font-medium"
      >
        Continue to Dashboard
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};