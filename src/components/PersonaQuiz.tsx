import React, { useState } from 'react';
import { ChevronRight, User, CheckCircle } from 'lucide-react';
import { QuizQuestion, QuizOption } from '../types/finance';
import { supabase } from '../lib/supabase';

interface PersonaQuizProps {
  onComplete: (persona: string) => void;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: '1',
    question: 'What best describes your current situation?',
    options: [
      { value: 'studying', label: 'I\'m currently studying', personas: ['student'] },
      { value: 'working-employee', label: 'I work as an employee', personas: ['salaried'] },
      { value: 'working-freelance', label: 'I work as a freelancer/contractor', personas: ['freelancer'] },
      { value: 'business-owner', label: 'I own a business', personas: ['business'] },
      { value: 'managing-home', label: 'I manage household finances', personas: ['homemaker'] },
      { value: 'retired', label: 'I\'m retired', personas: ['retiree'] }
    ]
  },
  {
    id: '2',
    question: 'What\'s your primary source of income?',
    options: [
      { value: 'allowance', label: 'Allowance/Financial aid', personas: ['student'] },
      { value: 'salary', label: 'Regular salary', personas: ['salaried'] },
      { value: 'project-based', label: 'Project-based payments', personas: ['freelancer'] },
      { value: 'business-revenue', label: 'Business revenue', personas: ['business'] },
      { value: 'partner-income', label: 'Partner\'s income', personas: ['homemaker'] },
      { value: 'pension', label: 'Pension/Savings', personas: ['retiree'] }
    ]
  },
  {
    id: '3',
    question: 'What\'s your main financial goal?',
    options: [
      { value: 'manage-expenses', label: 'Manage daily expenses', personas: ['student', 'homemaker'] },
      { value: 'save-future', label: 'Save for future goals', personas: ['salaried', 'freelancer'] },
      { value: 'grow-business', label: 'Grow my business', personas: ['business'] },
      { value: 'maintain-lifestyle', label: 'Maintain current lifestyle', personas: ['retiree'] },
      { value: 'budget-household', label: 'Budget household expenses', personas: ['homemaker'] },
      { value: 'irregular-income', label: 'Manage irregular income', personas: ['freelancer'] }
    ]
  },
  {
    id: '4',
    question: 'How often do you track your expenses?',
    options: [
      { value: 'rarely', label: 'Rarely or never', personas: ['student', 'salaried'] },
      { value: 'monthly', label: 'Monthly', personas: ['salaried', 'retiree'] },
      { value: 'weekly', label: 'Weekly', personas: ['homemaker', 'freelancer'] },
      { value: 'daily', label: 'Daily', personas: ['business', 'freelancer'] }
    ]
  },
  {
    id: '5',
    question: 'What type of expenses do you want to track most?',
    options: [
      { value: 'education', label: 'Education & learning', personas: ['student'] },
      { value: 'household', label: 'Household & family', personas: ['homemaker', 'salaried'] },
      { value: 'business', label: 'Business expenses', personas: ['business', 'freelancer'] },
      { value: 'healthcare', label: 'Healthcare & wellness', personas: ['retiree'] },
      { value: 'entertainment', label: 'Entertainment & lifestyle', personas: ['salaried', 'student'] },
      { value: 'investments', label: 'Investments & savings', personas: ['salaried', 'business'] }
    ]
  }
];

export const PersonaQuiz: React.FC<PersonaQuizProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswer = (optionValue: string) => {
    const newAnswers = [...answers, optionValue];
    setAnswers(newAnswers);

    if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const calculatePersona = (userAnswers: string[]): string => {
    const personaScores: Record<string, number> = {
      student: 0,
      freelancer: 0,
      salaried: 0,
      business: 0,
      homemaker: 0,
      retiree: 0
    };

    userAnswers.forEach((answer, questionIndex) => {
      const question = QUIZ_QUESTIONS[questionIndex];
      const selectedOption = question.options.find(opt => opt.value === answer);
      
      if (selectedOption) {
        selectedOption.personas.forEach(persona => {
          personaScores[persona] += 1;
        });
      }
    });

    // Find the persona with the highest score
    return Object.entries(personaScores).reduce((a, b) => 
      personaScores[a[0]] > personaScores[b[0]] ? a : b
    )[0];
  };

  const submitQuiz = async (userAnswers: string[]) => {
    setIsSubmitting(true);
    try {
      const persona = calculatePersona(userAnswers);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            persona,
            quiz_completed: true
          });
        
        onComplete(persona);
      }
    } catch (error) {
      console.error('Error saving quiz results:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100;

  if (isSubmitting) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center px-4"
        style={{
          backgroundImage: 'url(/9454a5b8ddf65221c0136ec981a86537.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Setting up your profile...</h2>
          <p className="text-gray-600">We're personalizing your experience based on your answers.</p>
        </div>
      </div>
    );
  }

  const question = QUIZ_QUESTIONS[currentQuestion];

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        backgroundImage: 'url(/9454a5b8ddf65221c0136ec981a86537.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Let's personalize your experience</h1>
          <p className="text-gray-600">Answer a few questions to get started with your financial journey</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{question.question}</h2>
          
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/55 transition-colors group bg-white/55 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 group-hover:text-blue-700">{option.label}</span>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Back Button */}
        {currentQuestion > 0 && (
          <button
            onClick={() => {
              setCurrentQuestion(currentQuestion - 1);
              setAnswers(answers.slice(0, -1));
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to previous question
          </button>
        )}
      </div>
    </div>
  );
};