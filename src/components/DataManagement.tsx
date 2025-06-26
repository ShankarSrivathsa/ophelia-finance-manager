import React, { useRef } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Transaction } from '../types/accounting';
import { exportTransactions, importTransactions } from '../services/storage';

interface DataManagementProps {
  transactions: Transaction[];
  onImportTransactions: (transactions: Transaction[]) => void;
  onClearData: () => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  transactions,
  onImportTransactions,
  onClearData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportTransactions(transactions);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const importedTransactions = await importTransactions(file);
      onImportTransactions(importedTransactions);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      alert('Failed to import transactions. Please check the file format.');
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      onClearData();
    }
  };

  return (
    <div className="bg-white/55 backdrop-blur-sm rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Data Management</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleExport}
          disabled={transactions.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Data
          </button>
        </div>

        <button
          onClick={handleClear}
          disabled={transactions.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Export:</strong> Download your transactions as a JSON file for backup</p>
        <p><strong>Import:</strong> Upload a previously exported JSON file to restore data</p>
        <p><strong>Clear:</strong> Remove all transactions from local storage</p>
      </div>
    </div>
  );
};