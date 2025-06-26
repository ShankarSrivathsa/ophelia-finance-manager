import React from 'react';
import { BookOpen } from 'lucide-react';
import { Transaction } from '../types/accounting';
import { formatCurrency, formatDate, createJournalEntry } from '../utils/accounting';

interface JournalEntriesProps {
  transactions: Transaction[];
}

export const JournalEntries: React.FC<JournalEntriesProps> = ({ transactions }) => {
  const journalEntries = transactions.map(createJournalEntry);

  if (journalEntries.length === 0) {
    return (
      <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Journal Entries</h2>
        </div>
        <p className="text-gray-500 text-center py-8">No journal entries yet. Add some transactions to get started!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">Journal Entries</h2>
      </div>

      <div className="space-y-4">
        {journalEntries.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white/55">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-medium text-gray-800">{entry.description}</h3>
                <p className="text-sm text-gray-500">{formatDate(entry.date)}</p>
              </div>
              <span className="text-lg font-semibold text-gray-800">{formatCurrency(entry.amount)}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Debit:</span>
                <div className="text-right">
                  <div className="font-medium text-red-600">{entry.debitAccount}</div>
                  <div className="text-sm text-red-500">{formatCurrency(entry.amount)}</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Credit:</span>
                <div className="text-right">
                  <div className="font-medium text-green-600">{entry.creditAccount}</div>
                  <div className="text-sm text-green-500">{formatCurrency(entry.amount)}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};