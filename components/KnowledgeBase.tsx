/**
 * KnowledgeBase Component
 *
 * A searchable help center with categorized articles covering all platform features.
 * Provides search filtering, category navigation, and full article viewing.
 */

import React, { useState, useMemo } from 'react';
import {
  helpArticles,
  categoryInfo,
  searchArticles,
  getArticlesByCategory,
  getArticleById,
  type HelpArticle,
  type HelpCategory,
} from '../data/helpArticles';

interface KnowledgeBaseProps {
  /** Initial article to display (optional) */
  initialArticleId?: string;
  /** Callback when user wants to contact support */
  onContactSupport?: () => void;
}

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({
  initialArticleId,
  onContactSupport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    initialArticleId ? getArticleById(initialArticleId) || null : null
  );
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({});

  // Filter articles based on search and category
  const filteredArticles = useMemo(() => {
    let articles = searchQuery ? searchArticles(searchQuery) : helpArticles;
    if (selectedCategory !== 'all') {
      articles = articles.filter(a => a.category === selectedCategory);
    }
    return articles;
  }, [searchQuery, selectedCategory]);

  // Get all categories
  const categories = Object.keys(categoryInfo) as HelpCategory[];

  // Handle article selection
  const handleSelectArticle = (article: HelpArticle) => {
    setSelectedArticle(article);
  };

  // Handle back to list
  const handleBackToList = () => {
    setSelectedArticle(null);
  };

  // Handle feedback
  const handleFeedback = (articleId: string, helpful: boolean) => {
    setFeedbackGiven(prev => ({ ...prev, [articleId]: helpful ? 'yes' : 'no' }));
    // In a real app, this would send feedback to the server
  };

  // Render markdown content (simple implementation)
  const renderMarkdown = (content: string) => {
    // Simple markdown rendering - convert headers, bold, links, lists, tables
    let html = content
      // Headers
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-[#4A4A4A] mt-4 mb-2" style="font-family: Playfair Display, serif">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-[#4A4A4A] mt-6 mb-3" style="font-family: Playfair Display, serif">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-[#4A4A4A] mt-6 mb-4" style="font-family: Playfair Display, serif">$1</h1>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#D4AF37] hover:underline">$1</a>')
      // Unordered lists
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Ordered lists
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      // Paragraphs (lines with content)
      .replace(/^(?!<[hl]|<li)(.+)$/gm, '<p class="mb-2">$1</p>')
      // Wrap consecutive li elements
      .replace(/(<li[^>]*>.*?<\/li>\n?)+/g, '<ul class="mb-4 space-y-1">$&</ul>');

    // Handle tables (simple implementation)
    const tableRegex = /\|(.+)\|\n\|[-|\s]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (_, header, rows) => {
      const headers = header.split('|').filter((h: string) => h.trim()).map((h: string) =>
        `<th class="px-3 py-2 text-left border-b border-[#EFEBE4] font-semibold">${h.trim()}</th>`
      ).join('');
      const bodyRows = rows.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) =>
          `<td class="px-3 py-2 border-b border-[#EFEBE4]">${c.trim()}</td>`
        ).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<table class="w-full mb-4 text-sm"><thead><tr>${headers}</tr></thead><tbody>${bodyRows}</tbody></table>`;
    });

    return html;
  };

  return (
    <div className="h-full flex flex-col bg-[#F9F6F0]">
      {/* Header */}
      <div className="bg-white border-b border-[#EFEBE4] px-6 py-4">
        <h1 className="text-2xl font-bold text-[#4A4A4A]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Knowledge Base
        </h1>
        <p className="text-gray-500 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Find answers to your questions about RenovateMySite
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Categories */}
        <div className="w-64 bg-white border-r border-[#EFEBE4] p-4 overflow-y-auto">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-[#EFEBE4] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedArticle(null);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white'
                  : 'hover:bg-[#F9F6F0] text-[#4A4A4A]'
              }`}
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              <span className="mr-2">📚</span>
              All Articles
              <span className="ml-auto text-xs opacity-75">({helpArticles.length})</span>
            </button>

            {categories.map((category) => {
              const info = categoryInfo[category];
              const count = getArticlesByCategory(category).length;
              return (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category);
                    setSelectedArticle(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white'
                      : 'hover:bg-[#F9F6F0] text-[#4A4A4A]'
                  }`}
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  <span className="mr-2">{info.icon}</span>
                  {info.label}
                  <span className="ml-auto text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Contact Support */}
          {onContactSupport && (
            <div className="mt-8 pt-4 border-t border-[#EFEBE4]">
              <p className="text-sm text-gray-500 mb-3">Can't find what you need?</p>
              <button
                onClick={onContactSupport}
                className="w-full px-4 py-2 bg-[#4A4A4A] text-white rounded-xl hover:bg-[#3A3A3A] transition-colors text-sm font-semibold"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Contact Support
              </button>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedArticle ? (
            // Article View
            <div className="max-w-3xl mx-auto">
              {/* Back button */}
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#B8962E] mb-4 text-sm font-semibold"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to articles
              </button>

              {/* Article content */}
              <div className="bg-white rounded-2xl border border-[#EFEBE4] p-8">
                {/* Category badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-[#F9F6F0] rounded-full text-xs font-semibold text-[#4A4A4A]">
                    {categoryInfo[selectedArticle.category].icon} {categoryInfo[selectedArticle.category].label}
                  </span>
                  <span className="text-xs text-gray-400">
                    Updated {selectedArticle.updatedAt}
                  </span>
                </div>

                {/* Article body */}
                <div
                  className="prose prose-sm max-w-none"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedArticle.content) }}
                />

                {/* Tags */}
                <div className="mt-8 pt-4 border-t border-[#EFEBE4]">
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[#F9F6F0] rounded-md text-xs text-gray-500"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <div className="mt-6 pt-4 border-t border-[#EFEBE4]">
                  {feedbackGiven[selectedArticle.id] ? (
                    <p className="text-sm text-gray-500">
                      Thanks for your feedback!
                    </p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">Was this article helpful?</span>
                      <button
                        onClick={() => handleFeedback(selectedArticle.id, true)}
                        className="px-3 py-1 border border-green-300 text-green-600 rounded-lg hover:bg-green-50 text-sm"
                      >
                        👍 Yes
                      </button>
                      <button
                        onClick={() => handleFeedback(selectedArticle.id, false)}
                        className="px-3 py-1 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                      >
                        👎 No
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Article List View
            <div>
              {/* Category header */}
              {selectedCategory !== 'all' && (
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-[#4A4A4A] flex items-center gap-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {categoryInfo[selectedCategory].icon}
                    {categoryInfo[selectedCategory].label}
                  </h2>
                  <p className="text-gray-500 mt-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {categoryInfo[selectedCategory].description}
                  </p>
                </div>
              )}

              {/* Search results info */}
              {searchQuery && (
                <div className="mb-4 text-sm text-gray-500">
                  Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''} for "{searchQuery}"
                </div>
              )}

              {/* Article grid */}
              {filteredArticles.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => handleSelectArticle(article)}
                      className="text-left bg-white rounded-xl border border-[#EFEBE4] p-5 hover:shadow-md hover:border-[#D4AF37] transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <span className="text-xs text-gray-400 mb-1 block">
                            {categoryInfo[article.category].icon} {categoryInfo[article.category].label}
                          </span>
                          <h3 className="font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                            {article.title}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                            {article.content.replace(/[#*`]/g, '').substring(0, 120)}...
                          </p>
                        </div>
                        <svg className="w-5 h-5 text-[#D4AF37] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-bold text-[#4A4A4A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                    No articles found
                  </h3>
                  <p className="text-gray-500" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Try adjusting your search or category filter
                  </p>
                  {onContactSupport && (
                    <button
                      onClick={onContactSupport}
                      className="mt-4 px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-white rounded-xl hover:shadow-md transition-all text-sm font-semibold"
                    >
                      Contact Support
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
