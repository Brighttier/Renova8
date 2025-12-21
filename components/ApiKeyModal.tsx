import React from 'react';

interface Props {
  onClose: () => void;
  onConfirm: () => void;
}

export const ApiKeyModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-pink-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 font-serif">Unlock Premium Magic ✨</h2>
        <p className="text-gray-600 mb-6">
          To use our advanced Creative Studio (High-Quality Images & Video), you need to connect a paid Google Cloud Project.
        </p>
        <p className="text-sm text-gray-500 mb-6">
           This enables premium image and video generation features.
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity shadow-md"
          >
            Select/Create Key
          </button>
          <a 
            href="https://ai.google.dev/gemini-api/docs/billing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-center text-pink-500 text-sm hover:underline"
          >
            Read about billing
          </a>
          <button 
            onClick={onClose}
            className="w-full text-gray-400 py-2 text-sm hover:text-gray-600"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};