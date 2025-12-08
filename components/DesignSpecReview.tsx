import React, { useState } from 'react';
import { DesignSpecification } from '../types';

interface DesignSpecReviewProps {
  designSpec: DesignSpecification;
  conceptImage?: string;
  onConfirm: (updatedSpec: DesignSpecification) => void;
  onCancel: () => void;
}

// Common Google Fonts for selection
const FONT_OPTIONS = [
  'Inter', 'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
  'Playfair Display', 'Merriweather', 'Source Sans Pro', 'Nunito',
  'Raleway', 'Work Sans', 'Quicksand', 'DM Sans', 'Outfit'
];

export const DesignSpecReview: React.FC<DesignSpecReviewProps> = ({
  designSpec,
  conceptImage,
  onConfirm,
  onCancel
}) => {
  const [spec, setSpec] = useState<DesignSpecification>(designSpec);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'sections'>('colors');

  const updateColor = (key: keyof typeof spec.colors, value: string) => {
    setSpec(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  const updateTypography = (key: string, value: string) => {
    if (key.startsWith('headingSizes.')) {
      const sizeKey = key.split('.')[1] as 'h1' | 'h2' | 'h3';
      setSpec(prev => ({
        ...prev,
        typography: {
          ...prev.typography,
          headingSizes: { ...prev.typography.headingSizes, [sizeKey]: value }
        }
      }));
    } else {
      setSpec(prev => ({
        ...prev,
        typography: { ...prev.typography, [key]: value }
      }));
    }
  };

  const updateLayout = (key: keyof typeof spec.layout, value: string | number) => {
    setSpec(prev => ({
      ...prev,
      layout: { ...prev.layout, [key]: value }
    }));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...spec.content.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
    sections.forEach((s, i) => s.order = i + 1);

    setSpec(prev => ({
      ...prev,
      content: { ...prev.content, sections }
    }));
  };

  const removeSection = (index: number) => {
    const sections = spec.content.sections.filter((_, i) => i !== index);
    sections.forEach((s, i) => s.order = i + 1);
    setSpec(prev => ({
      ...prev,
      content: { ...prev.content, sections }
    }));
  };

  const addSection = (type: string) => {
    const newSection = {
      type,
      order: spec.content.sections.length + 1,
      requiredContent: []
    };
    setSpec(prev => ({
      ...prev,
      content: {
        ...prev.content,
        sections: [...prev.content.sections, newSection]
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#4A4A4A]">Review Design Specifications</h2>
            <p className="text-sm text-[#4A4A4A]/60 mt-1">Verify and adjust the extracted design specs before building</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Concept Image Preview */}
          {conceptImage && (
            <div className="w-1/3 border-r border-gray-200 p-4 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Concept Reference</h3>
              <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                <img
                  src={conceptImage}
                  alt="Website Concept"
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Design specs were extracted from this concept
              </p>
            </div>
          )}

          {/* Spec Editor */}
          <div className={`flex-1 flex flex-col ${conceptImage ? '' : 'w-full'}`}>
            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-4">
              {(['colors', 'typography', 'layout', 'sections'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Colors Tab */}
              {activeTab === 'colors' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 mb-4">
                    These exact hex codes will be used in the website. Adjust if needed.
                  </p>

                  {[
                    { key: 'primary', label: 'Primary Color', desc: 'Main brand color for headers and key elements' },
                    { key: 'secondary', label: 'Secondary Color', desc: 'Supporting color for backgrounds' },
                    { key: 'accent', label: 'Accent Color', desc: 'Call-to-action buttons and highlights' },
                    { key: 'background', label: 'Background', desc: 'Main page background' },
                    { key: 'text', label: 'Text Color', desc: 'Primary text color' }
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">{label}</label>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={spec.colors[key as keyof typeof spec.colors] as string}
                          onChange={(e) => updateColor(key as keyof typeof spec.colors, e.target.value)}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={spec.colors[key as keyof typeof spec.colors] as string}
                          onChange={(e) => updateColor(key as keyof typeof spec.colors, e.target.value)}
                          className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm font-mono"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}

                  {spec.colors.exactHexCodes.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">All Extracted Colors</h4>
                      <div className="flex flex-wrap gap-2">
                        {spec.colors.exactHexCodes.map((color, i) => (
                          <div key={i} className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                            <div
                              className="w-4 h-4 rounded border border-gray-300"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Typography Tab */}
              {activeTab === 'typography' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Font families and sizes that will be used throughout the website.
                  </p>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heading Font</label>
                      <select
                        value={spec.typography.headingFont}
                        onChange={(e) => updateTypography('headingFont', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: spec.typography.headingFont }}>
                        Preview: The quick brown fox
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Body Font</label>
                      <select
                        value={spec.typography.bodyFont}
                        onChange={(e) => updateTypography('bodyFont', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {FONT_OPTIONS.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: spec.typography.bodyFont }}>
                        Preview: The quick brown fox
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base Size</label>
                      <input
                        type="text"
                        value={spec.typography.baseFontSize}
                        onChange={(e) => updateTypography('baseFontSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">H1 Size</label>
                      <input
                        type="text"
                        value={spec.typography.headingSizes.h1}
                        onChange={(e) => updateTypography('headingSizes.h1', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">H2 Size</label>
                      <input
                        type="text"
                        value={spec.typography.headingSizes.h2}
                        onChange={(e) => updateTypography('headingSizes.h2', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">H3 Size</label>
                      <input
                        type="text"
                        value={spec.typography.headingSizes.h3}
                        onChange={(e) => updateTypography('headingSizes.h3', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Layout Tab */}
              {activeTab === 'layout' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600 mb-4">
                    Layout and spacing settings for consistent design.
                  </p>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Width</label>
                      <input
                        type="text"
                        value={spec.layout.maxWidth}
                        onChange={(e) => updateLayout('maxWidth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="1200px"
                      />
                      <p className="text-xs text-gray-500 mt-1">Container maximum width</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section Padding</label>
                      <input
                        type="text"
                        value={spec.layout.sectionPadding}
                        onChange={(e) => updateLayout('sectionPadding', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="80px"
                      />
                      <p className="text-xs text-gray-500 mt-1">Vertical spacing between sections</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Grid Columns</label>
                      <input
                        type="number"
                        value={spec.layout.gridColumns}
                        onChange={(e) => updateLayout('gridColumns', parseInt(e.target.value) || 12)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        min={1}
                        max={24}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gutter Width</label>
                      <input
                        type="text"
                        value={spec.layout.gutterWidth}
                        onChange={(e) => updateLayout('gutterWidth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="24px"
                      />
                    </div>
                  </div>

                  {/* Component Styles Preview */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Component Styles</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Header:</span>
                        <span className="ml-2 font-medium">{spec.components.header.style}, logo {spec.components.header.logoPlacement}</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Hero:</span>
                        <span className="ml-2 font-medium">{spec.components.hero.height}, {spec.components.hero.alignment} aligned</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Buttons:</span>
                        <span className="ml-2 font-medium">{spec.components.buttons.style}, {spec.components.buttons.borderRadius} radius</span>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600">Cards:</span>
                        <span className="ml-2 font-medium">{spec.components.cards.borderRadius} radius, {spec.components.cards.shadow} shadow</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections Tab */}
              {activeTab === 'sections' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Sections will appear in this order. Drag to reorder or remove unwanted sections.
                  </p>

                  <div className="space-y-2">
                    {spec.content.sections.sort((a, b) => a.order - b.order).map((section, index) => (
                      <div
                        key={`${section.type}-${index}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === spec.content.sections.length - 1}
                            className="p-1 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        <div className="w-8 h-8 bg-[#D4AF37]/10 rounded-lg flex items-center justify-center text-[#D4AF37] font-bold text-sm">
                          {section.order}
                        </div>

                        <div className="flex-1">
                          <span className="font-medium text-gray-800 capitalize">{section.type}</span>
                        </div>

                        <button
                          onClick={() => removeSection(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Add Section</h4>
                    <div className="flex flex-wrap gap-2">
                      {['about', 'team', 'pricing', 'faq', 'gallery', 'stats', 'cta'].map(type => (
                        <button
                          key={type}
                          onClick={() => addSection(type)}
                          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] rounded-lg transition-colors capitalize"
                        >
                          + {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{spec.content.sections.length}</span> sections configured
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(spec)}
              className="px-6 py-2.5 bg-[#D4AF37] text-white rounded-lg hover:bg-[#C4A030] transition-colors font-medium"
            >
              Confirm & Build Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
