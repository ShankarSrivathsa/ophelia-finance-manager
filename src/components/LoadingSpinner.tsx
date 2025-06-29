import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#121212' }}
    >
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#2C2C2E] border-t-white rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-300">Loading...</p>
      </div>
    </div>
  );
};