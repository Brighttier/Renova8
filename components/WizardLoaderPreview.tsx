import React from 'react';
import WizardLoader from './WizardLoader';

/**
 * Preview page for the WizardLoader component
 * This is a temporary file for demonstration purposes
 */
const WizardLoaderPreview: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">WizardLoader Preview</h1>
      <p className="text-slate-500 mb-8">Tech-Wizard Loading Animation</p>

      <div className="border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        <WizardLoader />
      </div>

      <div className="mt-8 border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
        <WizardLoader
          title="Building your website..."
          subtitle="The AI wizard is crafting something magical"
        />
      </div>
    </div>
  );
};

export default WizardLoaderPreview;
