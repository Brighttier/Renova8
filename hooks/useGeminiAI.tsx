/**
 * useGeminiAI Hook
 *
 * Provides credit-enforced AI operations via Cloud Functions.
 * All calls go through the backend which deducts credits and tracks usage.
 *
 * Benefits:
 * - Credits are enforced server-side (can't be bypassed)
 * - Usage is tracked per feature
 * - Works with authentication
 * - Handles rate limiting and quota
 */

import { useState, useCallback } from 'react';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';
import { functions, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './useAuth';
import { useCredits } from './useCredits';

// Request types
interface GeminiChatRequest {
  prompt: string;
  modelKey?: 'gemini-3-pro-preview' | 'gemini-2.5-flash' | 'gemini-2.5-flash-preview';
  feature?: string;
  systemInstruction?: string;
  maxOutputTokens?: number;
}

// Response types
interface GeminiChatResponse {
  text: string;
  tokensUsed: number;
  tokenBalance: number;
}

interface UseGeminiAIReturn {
  // Main function to call Gemini
  generateText: (request: GeminiChatRequest) => Promise<GeminiChatResponse>;

  // Loading state
  loading: boolean;

  // Error state
  error: string | null;

  // Clear error
  clearError: () => void;

  // Check if AI is available (user authenticated + Firebase configured)
  isAvailable: boolean;

  // Last tokens used
  lastTokensUsed: number | null;
}

// Create the callable
const geminiChatCallable = isFirebaseConfigured() && functions
  ? httpsCallable<GeminiChatRequest, GeminiChatResponse>(functions, 'geminiChat')
  : null;

export function useGeminiAI(): UseGeminiAIReturn {
  const { user } = useAuth();
  const { refreshCredits } = useCredits();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTokensUsed, setLastTokensUsed] = useState<number | null>(null);

  const isAvailable = !!user && isFirebaseConfigured() && !!geminiChatCallable;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generateText = useCallback(async (request: GeminiChatRequest): Promise<GeminiChatResponse> => {
    if (!user) {
      throw new Error('You must be logged in to use AI features.');
    }

    if (!geminiChatCallable) {
      throw new Error('Firebase is not configured. AI features are unavailable.');
    }

    setLoading(true);
    setError(null);

    try {
      const result: HttpsCallableResult<GeminiChatResponse> = await geminiChatCallable(request);
      const response = result.data;

      // Update last tokens used
      setLastTokensUsed(response.tokensUsed);

      // Refresh credits to get updated balance
      refreshCredits();

      return response;
    } catch (err: any) {
      // Handle Firebase callable errors
      let errorMessage = 'Failed to generate AI response.';

      if (err.code === 'functions/resource-exhausted') {
        errorMessage = 'Insufficient credits. Please purchase more tokens to continue.';
      } else if (err.code === 'functions/unauthenticated') {
        errorMessage = 'Please sign in to use AI features.';
      } else if (err.code === 'functions/invalid-argument') {
        errorMessage = err.message || 'Invalid request. Please check your input.';
      } else if (err.code === 'functions/internal') {
        errorMessage = 'AI service is temporarily unavailable. Please try again.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, refreshCredits]);

  return {
    generateText,
    loading,
    error,
    clearError,
    isAvailable,
    lastTokensUsed,
  };
}

// ============================================
// Helper functions for specific features
// ============================================

/**
 * Feature-specific prompt generators for common operations.
 * These help standardize how we call the AI for different features.
 */

export interface LeadSearchParams {
  businessType: string;
  location: string;
  additionalCriteria?: string;
}

export interface BrandAnalysisParams {
  businessName: string;
  industry: string;
  websiteUrl?: string;
  existingColors?: string[];
}

export interface WebsiteGenerationParams {
  businessName: string;
  businessType: string;
  designStyle: string;
  pages: string[];
  brandColors?: string[];
}

export interface PitchEmailParams {
  businessName: string;
  ownerName?: string;
  industry: string;
  painPoints?: string[];
  yourCompanyName: string;
}

/**
 * Create a prompt for lead search with Google Maps grounding
 * Note: This is for text-only results. For actual map grounding,
 * use the direct Gemini API with the Maps tool.
 */
export function createLeadSearchPrompt(params: LeadSearchParams): string {
  return `Find local ${params.businessType} businesses in ${params.location}.
${params.additionalCriteria ? `Additional criteria: ${params.additionalCriteria}` : ''}

For each business, provide:
- Business name
- Address
- Phone number (if available)
- Brief description
- Whether they might need a website or digital services

Return as JSON array with this structure:
[
  {
    "businessName": "string",
    "address": "string",
    "phone": "string or null",
    "description": "string",
    "needsWebsite": boolean,
    "reason": "why they might need digital services"
  }
]`;
}

/**
 * Create a prompt for brand analysis
 */
export function createBrandAnalysisPrompt(params: BrandAnalysisParams): string {
  return `Analyze the brand for "${params.businessName}" in the ${params.industry} industry.
${params.websiteUrl ? `Website: ${params.websiteUrl}` : ''}
${params.existingColors?.length ? `Existing brand colors: ${params.existingColors.join(', ')}` : ''}

Provide a comprehensive brand analysis including:
1. Recommended color palette (primary, secondary, accent colors with hex codes)
2. Typography recommendations
3. Brand voice and tone
4. Visual style direction
5. Target audience insights

Return as JSON:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex"
  },
  "typography": {
    "headingFont": "font name",
    "bodyFont": "font name",
    "style": "modern/classic/playful/etc"
  },
  "brandVoice": {
    "tone": "professional/friendly/etc",
    "personality": ["trait1", "trait2"],
    "keywords": ["word1", "word2"]
  },
  "visualStyle": "description",
  "targetAudience": "description"
}`;
}

/**
 * Create a prompt for pitch email generation
 */
export function createPitchEmailPrompt(params: PitchEmailParams): string {
  return `Write a professional but friendly pitch email for ${params.businessName}${params.ownerName ? ` (owner: ${params.ownerName})` : ''} in the ${params.industry} industry.

${params.painPoints?.length ? `Address these pain points: ${params.painPoints.join(', ')}` : ''}

The email should:
1. Be personalized and show research about their business
2. Highlight how ${params.yourCompanyName} can help them
3. Include a clear call to action
4. Be concise (under 200 words)

Return as JSON:
{
  "subject": "email subject line",
  "body": "email body with paragraphs",
  "callToAction": "the specific ask"
}`;
}

/**
 * Create a prompt for website structure generation
 */
export function createWebsiteStructurePrompt(params: WebsiteGenerationParams): string {
  return `Generate a complete, production-ready HTML website for "${params.businessName}" (${params.businessType}).

Design style: ${params.designStyle}
Pages to include: ${params.pages.join(', ')}
${params.brandColors?.length ? `Brand colors: ${params.brandColors.join(', ')}` : ''}

Requirements:
1. Use Tailwind CSS for styling (via CDN)
2. Mobile-responsive design
3. Modern, professional layout
4. Include placeholder images (use via.placeholder.com)
5. Include navigation header
6. Include footer with contact info placeholder

Return ONLY the complete HTML code, starting with <!DOCTYPE html>.`;
}
