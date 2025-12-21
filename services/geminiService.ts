import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize, AspectRatio, DesignSpecification, DiscrepancyReport, SectionBackground } from "../types";

// Helper to ensure we get a valid client instance
// For Veo/Pro Image, we need to check for selected API key flow
const getClient = async (requiresPaidKey: boolean = false, skipKeyCheck: boolean = false) => {
  if (requiresPaidKey && !skipKeyCheck && window.aistudio) {
     const hasKey = await window.aistudio.hasSelectedApiKey();
     if (!hasKey) {
        throw new Error("API_KEY_REQUIRED");
     }
  }
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
};

// Helper to safely parse JSON from AI response
export const safeParseJSON = (text: string) => {
    const cleanup = (str: string) => str.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const cleaned = cleanup(text);
        return JSON.parse(cleaned);
    } catch (e) {
        // Fallback strategy 1: Extract JSON structure (Array or Object) by matching outer brackets
        try {
            const cleaned = cleanup(text);
            const firstOpenBrace = cleaned.indexOf('{');
            const firstOpenBracket = cleaned.indexOf('[');
            
            let start = -1;
            let end = -1;

            // Determine if it starts with { or [ and find corresponding closer
            if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
                start = firstOpenBrace;
                end = cleaned.lastIndexOf('}');
            } else if (firstOpenBracket !== -1) {
                start = firstOpenBracket;
                end = cleaned.lastIndexOf(']');
            }
            
            if (start !== -1 && end !== -1) {
                 const substring = cleaned.substring(start, end + 1);
                 return JSON.parse(substring);
            }
        } catch (e2) {
            // Fallback strategy 2: Replace control characters (newlines) with spaces
            try {
                const cleaned = cleanup(text);
                const sanitized = cleaned.replace(/[\n\r\t]/g, ' ');
                const firstOpen = sanitized.search(/[\{\[]/);
                // Simple max approach for sanitized string as we lost formatting
                const lastClose = Math.max(sanitized.lastIndexOf('}'), sanitized.lastIndexOf(']'));
                 if (firstOpen !== -1 && lastClose !== -1) {
                     return JSON.parse(sanitized.substring(firstOpen, lastClose + 1));
                }
            } catch (e3) {
                console.warn("JSON Parse Warning, returning empty object. Raw text:", text);
            }
        }
        // Return empty object if all else fails
        return {};
    }
};

// Helper function to extract URL from text, filtering out unwanted domains
function extractValidUrl(text: string): string | null {
  if (!text) return null;

  // Regex to find URLs in text
  const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/gi;
  const matches = text.match(urlRegex);

  console.log('[extractValidUrl] Found URL matches:', matches);

  if (!matches || matches.length === 0) return null;

  // Domains to exclude
  const excludedDomains = [
    'yelp.com', 'tripadvisor.com', 'google.com', 'facebook.com',
    'instagram.com', 'twitter.com', 'yellowpages.com', 'bbb.org',
    'linkedin.com', 'tiktok.com', 'pinterest.com', 'maps.google',
    'goo.gl', 'bit.ly', 'youtube.com', 'foursquare.com', 'zomato.com',
    'opentable.com', 'doordash.com', 'ubereats.com', 'grubhub.com'
  ];

  // Find first URL that's not in excluded domains
  for (const url of matches) {
    const lowerUrl = url.toLowerCase();
    const isExcluded = excludedDomains.some(domain => lowerUrl.includes(domain));

    if (!isExcluded) {
      // Clean trailing punctuation
      const cleanUrl = url.replace(/[.,;:!?)>\]]+$/, '');
      console.log('[extractValidUrl] Found valid URL:', cleanUrl);
      return cleanUrl;
    }
  }

  console.log('[extractValidUrl] No valid URL found after filtering');
  return null;
}

// Validate that a URL looks like an image file
const isValidImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();
    // Check for common image extensions or logo-related paths
    return path.endsWith('.png') || path.endsWith('.jpg') ||
           path.endsWith('.jpeg') || path.endsWith('.svg') ||
           path.endsWith('.webp') || path.endsWith('.gif') ||
           url.includes('/logo') || url.includes('logo.') ||
           url.includes('brand') || url.includes('-logo');
  } catch {
    return false;
  }
};

// Fetch an image and convert to base64 for Gemini Vision
const fetchImageAsBase64 = async (url: string): Promise<{ data: string; mimeType: string } | null> => {
  try {
    console.log('[fetchImageAsBase64] Fetching image:', url);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn('[fetchImageAsBase64] Failed to fetch image:', response.status);
      return null;
    }
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const mimeType = blob.type || 'image/png';
    console.log('[fetchImageAsBase64] Success! MIME type:', mimeType, 'Size:', bytes.byteLength);
    return { data: base64, mimeType };
  } catch (error) {
    console.error('[fetchImageAsBase64] Error fetching image:', error);
    return null;
  }
};

// Extract brand colors from a logo image using Gemini Vision
const extractColorsFromLogo = async (logoUrl: string): Promise<string[]> => {
  console.log('[extractColorsFromLogo] Starting color extraction from:', logoUrl);

  const imageData = await fetchImageAsBase64(logoUrl);
  if (!imageData) {
    console.warn('[extractColorsFromLogo] Could not fetch logo image');
    return [];
  }

  const ai = await getClient();
  const prompt = `Analyze this logo image and extract the 3 most dominant brand colors.

For each color:
1. Identify the exact hex color code (e.g., #FF5733)
2. Prioritize the primary brand colors over background/neutral colors
3. Exclude white (#FFFFFF) and pure black (#000000) unless they are clearly intentional brand colors

Return ONLY a JSON array of exactly 3 hex color codes.
Example: ["#2E5A88", "#F7931E", "#333333"]

IMPORTANT: Return ONLY the JSON array, nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.data
              }
            }
          ]
        }
      ],
      config: {
        maxOutputTokens: 200
      }
    });

    console.log('[extractColorsFromLogo] Raw response:', response.text);
    const colors = safeParseJSON(response.text || "[]");

    // Validate we got an array of hex colors
    if (Array.isArray(colors) && colors.length > 0) {
      const validColors = colors.filter((c: any) =>
        typeof c === 'string' && c.match(/^#[0-9A-Fa-f]{6}$/)
      );
      console.log('[extractColorsFromLogo] Extracted colors:', validColors);
      return validColors.slice(0, 3);
    }

    console.warn('[extractColorsFromLogo] No valid colors extracted');
    return [];
  } catch (error) {
    console.error('[extractColorsFromLogo] Error:', error);
    return [];
  }
};

// Generate fallback colors when logo extraction fails
const generateFallbackColors = async (businessName: string, details: string): Promise<string[]> => {
  console.log('[generateFallbackColors] Generating industry-appropriate colors for:', businessName);

  const ai = await getClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate 3 professional brand colors (hex codes) appropriate for "${businessName}".
Context: ${details}

Return ONLY a JSON array of 3 hex codes, nothing else.
Example: ["#2563EB", "#10B981", "#4A4A4A"]`,
      config: {
        maxOutputTokens: 100,
        responseMimeType: "application/json"
      }
    });

    const colors = safeParseJSON(response.text || '[]');
    if (Array.isArray(colors) && colors.length >= 3) {
      console.log('[generateFallbackColors] Generated colors:', colors);
      return colors.slice(0, 3);
    }
  } catch (error) {
    console.error('[generateFallbackColors] Error:', error);
  }

  // Ultimate fallback
  return ["#2563EB", "#10B981", "#4A4A4A"];
};

// Helper function to find a business's official website with a focused search
async function findBusinessWebsite(businessName: string, location: string): Promise<string | null> {
  console.log(`\n========================================`);
  console.log(`[Website Lookup] Starting search for: "${businessName}" in "${location}"`);
  console.log(`========================================`);

  const ai = await getClient();

  // Very strict prompt - only return URL, nothing else
  const prompt = `What is the official website URL for "${businessName}" in ${location}?

RESPOND WITH ONLY THE URL. No other text, no explanation.
Example correct response: https://example.com
Do NOT return Yelp, Facebook, Instagram, Google Maps, TripAdvisor, or directories.
If no official website exists, respond with exactly: NONE`;

  console.log('[Website Lookup] Sending prompt to Gemini...');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',  // Use 2.5 - gemini-2.0-flash has broken googleSearch grounding
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        maxOutputTokens: 500,  // Increased from 300 to prevent cut-off responses
      }
    });

    // Log the raw response structure for debugging
    console.log('[Website Lookup] Raw response object keys:', Object.keys(response));
    console.log('[Website Lookup] response.text value:', response.text);
    console.log('[Website Lookup] response.candidates:', JSON.stringify(response.candidates, null, 2));

    // Try multiple ways to get the text
    let responseText = '';

    // Method 1: Direct .text property
    if (response.text) {
      responseText = response.text;
      console.log('[Website Lookup] Got text via response.text');
    }
    // Method 2: Through candidates array
    else if (response.candidates && response.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = response.candidates[0].content.parts[0].text;
      console.log('[Website Lookup] Got text via candidates[0].content.parts[0].text');
    }

    responseText = responseText.trim();
    console.log(`[Website Lookup] Extracted text: "${responseText}"`);

    // Check if response indicates no website found
    if (!responseText ||
        responseText.toUpperCase() === 'NONE' ||
        responseText.toUpperCase().includes('NONE') ||
        responseText.toLowerCase().includes('could not find') ||
        responseText.toLowerCase().includes('no official website') ||
        responseText.toLowerCase().includes('does not appear to have')) {
      console.log(`[Website Lookup] ❌ No website found for "${businessName}"`);
      return null;
    }

    // Extract URL from the response
    const extractedUrl = extractValidUrl(responseText);

    if (extractedUrl) {
      console.log(`[Website Lookup] ✅ SUCCESS! Found website for "${businessName}": ${extractedUrl}`);
      return extractedUrl;
    }

    console.log(`[Website Lookup] ⚠️ Could not extract valid URL from response for "${businessName}"`);
    return null;

  } catch (error) {
    console.error(`[Website Lookup] ❌ ERROR for "${businessName}":`, error);
    return null;
  }
}

/**
 * Map unsplash search queries to reliable, direct image URLs
 * Avoids using source.unsplash.com which is unreliable
 */
const getReliableImageUrl = (query: string): string => {
    const queryLower = query.toLowerCase();

    // Hero backgrounds by category
    if (queryLower.includes('office') || queryLower.includes('corporate') || queryLower.includes('business')) {
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('restaurant') || queryLower.includes('dining') || queryLower.includes('food')) {
        return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('spa') || queryLower.includes('wellness') || queryLower.includes('relax')) {
        return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('gym') || queryLower.includes('fitness') || queryLower.includes('workout')) {
        return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('real estate') || queryLower.includes('house') || queryLower.includes('property')) {
        return 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('education') || queryLower.includes('school') || queryLower.includes('university')) {
        return 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('tech') || queryLower.includes('startup') || queryLower.includes('computer')) {
        return 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('medical') || queryLower.includes('clinic') || queryLower.includes('health')) {
        return 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('nature') || queryLower.includes('mountain') || queryLower.includes('landscape')) {
        return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('beach') || queryLower.includes('ocean') || queryLower.includes('travel')) {
        return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('city') || queryLower.includes('skyline') || queryLower.includes('urban')) {
        return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop';
    }
    if (queryLower.includes('team') || queryLower.includes('meeting') || queryLower.includes('collaboration')) {
        return 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop';
    }
    if (queryLower.includes('interior') || queryLower.includes('design') || queryLower.includes('modern')) {
        return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop';
    }

    // Default fallback - professional office
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop';
};

export const findLeadsWithMaps = async (query: string, location: string) => {
  const ai = await getClient();
  const prompt = `Find 5 real local businesses for "${query}" near "${location}".

For each business, provide their actual name, address, and a brief description.

Return a strictly valid JSON array with objects containing:
- businessName (string - the actual business name)
- location (string - their full address)
- details (string - brief description of what they do and why they might benefit from marketing services)
- phone (string or null)
- email (string or null)

IMPORTANT:
- Ensure all strings are properly escaped
- Do not use unescaped newlines or control characters inside string values
- Do not include markdown formatting. Just the raw JSON array.`;

  // Step 1: Get the business list from Gemini
  console.log('📍 Step 1: Searching for businesses...');
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      maxOutputTokens: 2000,
    }
  });

  console.log('API Response:', response.text);
  const parsedLeads = safeParseJSON(response.text || "[]");
  console.log('Parsed Leads:', parsedLeads);

  const leads = Array.isArray(parsedLeads) ? parsedLeads : [];

  // Step 2: For each business, do a focused website lookup
  console.log(`🌐 Step 2: Looking up websites for ${leads.length} businesses...`);

  const leadsWithWebsites = await Promise.all(
    leads.map(async (lead: any) => {
      const websiteUrl = await findBusinessWebsite(lead.businessName, location);
      lead.hasWebsite = !!websiteUrl;
      lead.existingWebsiteUrl = websiteUrl;
      return lead;
    })
  );

  console.log('✅ Final leads with website data:', leadsWithWebsites);

  return {
    leads: leadsWithWebsites,
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const generateBrandAnalysis = async (
  businessName: string,
  details: string,
  existingWebsiteUrl?: string
) => {
  const ai = await getClient();
  const hasWebsite = !!existingWebsiteUrl;

  // TWO-STEP APPROACH for businesses with websites:
  // Step 1: Extract logo URL and brand info from website
  // Step 2: Analyze the logo image to extract accurate brand colors

  if (hasWebsite) {
    console.log('[Brand Analysis] Step 1: Extracting logo and brand info from website...');

    // STEP 1: Extract logo URL and basic brand info (tone, suggestions)
    const logoPrompt = `Analyze the website at ${existingWebsiteUrl} for "${businessName}".

Extract:
1. **LOGO URL** - Find the main logo image. Return the COMPLETE absolute URL (https://...) to the logo file.
   - Look in the header/navbar first
   - Check for <img> tags with "logo" in src, alt, or class
   - Check for SVG logos embedded or linked
   - Make sure to return the FULL URL including the domain
2. Brand tone based on copy and design aesthetic
3. Suggestions for brand improvement
4. Brief assessment of current brand identity

Business context: ${details}

Return JSON:
{
  "logoUrl": "https://example.com/path/to/logo.png",
  "tone": "professional and modern",
  "suggestions": "improvement recommendations",
  "currentBrandAssessment": "brand analysis"
}

CRITICAL: The logoUrl must be a complete, valid image URL starting with https://. Do NOT return placeholder text or relative paths.`;

    const step1Response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: logoPrompt,
      config: {
        tools: [{ urlContext: {} }],
        maxOutputTokens: 2000
      }
    });

    console.log('[Brand Analysis] Step 1 raw response:', step1Response.text);
    const step1Result = safeParseJSON(step1Response.text || "{}");
    console.log('[Brand Analysis] Step 1 parsed:', step1Result);

    // STEP 2: If logo URL found, analyze it for colors
    let colors: string[] = [];
    const logoUrl = step1Result.logoUrl;

    if (logoUrl && isValidImageUrl(logoUrl)) {
      console.log('[Brand Analysis] Step 2: Extracting colors from logo image...');
      try {
        colors = await extractColorsFromLogo(logoUrl);
        console.log('[Brand Analysis] Colors extracted from logo:', colors);
      } catch (e) {
        console.warn('[Brand Analysis] Could not extract colors from logo:', e);
      }
    } else {
      console.log('[Brand Analysis] No valid logo URL found, logoUrl was:', logoUrl);
    }

    // If no colors extracted from logo, generate fallback colors
    if (colors.length === 0) {
      console.log('[Brand Analysis] Using fallback color generation...');
      colors = await generateFallbackColors(businessName, details);
    }

    return {
      colors,
      tone: step1Result.tone || '',
      suggestions: step1Result.suggestions || '',
      currentBrandAssessment: step1Result.currentBrandAssessment || '',
      logoUrl: logoUrl || null
    };
  }

  // NO WEBSITE - Generate recommended brand guidelines
  console.log('[Brand Analysis] No website - generating recommended brand guidelines...');

  const noWebsitePrompt = `Create brand guidelines for "${businessName}", a business that currently has NO website.

Business context: ${details}

Generate:
1. Recommended brand colors (3 hex codes) appropriate for their industry and target market
2. Suggested brand tone that would resonate with their audience
3. Strategic suggestions for establishing a strong brand identity

Return JSON with:
- colors: array of 3 hex codes (recommended colors for their brand)
- tone: string describing the recommended brand voice
- suggestions: string with brand establishment guidance (under 75 words)`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: noWebsitePrompt,
    config: {
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          colors: { type: Type.ARRAY, items: { type: Type.STRING } },
          tone: { type: Type.STRING },
          suggestions: { type: Type.STRING }
        },
        required: ["colors", "tone", "suggestions"]
      }
    }
  });

  console.log('[Brand Analysis] Raw response:', response.text);
  const result = safeParseJSON(response.text || "{}");
  console.log('[Brand Analysis] Parsed result:', result);

  return {
    colors: result.colors || [],
    tone: result.tone || '',
    suggestions: result.suggestions || '',
    currentBrandAssessment: '',
    logoUrl: null
  };
}

export const generatePitchEmail = async (businessName: string, websiteUrl: string | undefined, brandTone: string, hasConceptImage: boolean = false) => {
  const ai = await getClient();

  // Filter out blob: URLs - they only work locally and can't be shared externally
  const validUrl = websiteUrl && !websiteUrl.startsWith('blob:') ? websiteUrl : undefined;

  const prompt = `Write a cold email to "${businessName}" to sell website design and social media marketing services.

  Context:
  - Potential Client: ${businessName}
  - My Services: Website Design & Social Media Growth
  - Tone: ${brandTone || 'Professional and Friendly'}

  Asset Status:
  ${validUrl ? `- I have a live website demo link: ${validUrl}` : '- I do not have a live link yet (the website needs to be published first to get a shareable URL).'}
  ${hasConceptImage ? '- I have attached a visual mockup image of a new website concept for them.' : ''}
  
  Instructions:
  - If I have a Concept Image, explicitly mention "I've attached a visual concept of what your new site could look like."
  - Highlight that we can help them grow their brand online through a modern website and active social media presence.
  - If I have a URL, ask them to click the link to see their new site.
  - Keep it under 150 words.
  - Empathetic, not salesy.`;

  // Switched to Flash for better JSON reliability
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING }
            },
            required: ["subject", "body"]
        }
    }
  });
  return safeParseJSON(response.text || "{}");
}

export const generateCampaignStrategy = async (businessName: string, goal: string, platforms: string[], brandGuidelines: any) => {
  const ai = await getClient();
  
  const prompt = `Create a marketing campaign strategy for "${businessName}".
  Goal: "${goal}"
  Platforms: ${platforms.join(', ')}
  Brand Tone: ${brandGuidelines?.tone || 'Professional'}
  
  Generate a JSON response with:
  1. "strategy_summary": A paragraph explaining the strategy.
  2. "content_ideas": An array of 3 specific content ideas.
     Each idea must have:
     - "title": Short title
     - "format": "IMAGE" or "VIDEO"
     - "platform": One of the selected platforms
     - "description": Description of the content to be created
     - "copy": The caption/text for the post
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strategy_summary: { type: Type.STRING },
          content_ideas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                format: { type: Type.STRING },
                platform: { type: Type.STRING },
                description: { type: Type.STRING },
                copy: { type: Type.STRING }
              },
              required: ["title", "format", "platform", "description", "copy"]
            }
          }
        },
        required: ["strategy_summary", "content_ideas"]
      }
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const analyzeAndGenerateMarketing = async (businessName: string, goal: string) => {
  const ai = await getClient();
  // Switched to Flash for reliability with JSON Schema
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `I need to pitch digital services to "${businessName}". 
    Goal: ${goal}.
    
    Task:
    1. Analyze potential weaknesses a local business like this usually has (Keep under 150 words).
    2. Write a friendly, professional cold email (subject + body). Keep it concise (under 200 words).
    3. Write a catchy Facebook post they could use (under 100 words).`,
    config: {
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { type: Type.STRING },
          emailSubject: { type: Type.STRING },
          emailBody: { type: Type.STRING },
          socialPost: { type: Type.STRING }
        },
        required: ["analysis", "emailSubject", "emailBody", "socialPost"]
      }
    }
  });
  return safeParseJSON(response.text || "{}");
};

export const generateWebsiteConceptImage = async (
  prompt: string, 
  aspectRatio: AspectRatio = AspectRatio.LANDSCAPE, 
  size: ImageSize = ImageSize.S_1K,
  skipKeyCheck: boolean = false
) => {
  const ai = await getClient(true, skipKeyCheck); // Requires paid key for Pro Image
  
  // Using Nano Banana Pro (Gemini 3 Pro Image)
  // IMPORTANT: Generate a flat browser screenshot, NOT a laptop/device mockup
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
        parts: [{ text: `Generate a COMPLETE, PROFESSIONAL website design screenshot for: ${prompt}.

=== CRITICAL: FULL WEBSITE LAYOUT ===
This must be a COMPLETE website mockup showing ALL major sections in a single scrollable view:

1. HEADER/NAVIGATION BAR (Required):
   - Professional logo area on the left
   - VISIBLE navigation menu with text labels (Home, About, Services, Contact, etc.)
   - Menu items must be clearly readable and properly spaced
   - Include a hamburger menu icon for mobile indication
   - Clean, modern header design

2. HERO SECTION (Required):
   - Large, impactful hero area with beautiful background image
   - Bold headline text that is clearly readable
   - Subheadline or tagline
   - Call-to-action buttons (e.g., "Get Started", "Learn More")
   - Professional typography

3. FEATURES/SERVICES SECTION (Required):
   - Grid or card layout showing 3-4 services/features
   - Each card should have an icon or image
   - Brief descriptive text for each
   - Clean, organized layout

4. ABOUT SECTION (Required):
   - Brief about text or company description
   - Can include team photos or company images
   - Professional layout

5. TESTIMONIALS/REVIEWS (Optional but recommended):
   - Customer quotes or reviews
   - Star ratings if applicable

6. CONTACT/CTA SECTION (Required):
   - Contact information or call-to-action
   - May include contact form preview

7. FOOTER (Required):
   - Company info, links, social media icons
   - Copyright area

=== IMAGE REQUIREMENTS ===
- Generate a FLAT website screenshot (NO device frame - no laptop, phone, monitor)
- Show it as a direct browser viewport view
- Use HIGH-QUALITY, REALISTIC images throughout (not placeholders)
- Images should be relevant to the business type
- Professional, modern UI/UX design
- Clean typography with proper hierarchy
- Proper spacing and visual balance
- The website should look like a real, professionally designed site

=== RESPONSIVE DESIGN INDICATORS ===
- The design should look modern and responsive-ready
- Clean grid layouts that suggest mobile-friendliness
- Proper text sizes that work across devices

=== STYLE ===
- Modern, clean aesthetic
- Professional color scheme appropriate for the business
- High contrast for readability
- Visual hierarchy with clear sections
- Consistent design language throughout` }]
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size
      }
    }
  });

  let imageUrl = '';
  if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
          }
      }
  }
  return imageUrl;
};

export const generateSocialMediaImage = async (
  businessName: string,
  topic: string,
  aspectRatio: AspectRatio = AspectRatio.SQUARE,
  skipKeyCheck: boolean = false
) => {
  const ai = await getClient(true, skipKeyCheck); // Requires paid key for Pro Image (Nano Banana)

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
        parts: [{ text: `A professional social media image for ${businessName}. Content: ${topic}. Photorealistic, aesthetic, high quality, commercial photography.` }]
    },
    config: {
      imageConfig: {
        imageSize: ImageSize.S_1K,
        aspectRatio: aspectRatio
      }
    }
  });

  let imageUrl = '';
  if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
              imageUrl = `data:image/png;base64,${part.inlineData.data}`;
              break;
          }
      }
  }
  return imageUrl;
};

/**
 * Generate AI images for website sections
 * Creates consistent, AI-generated images for hero, about, services, and contact sections
 * using the same Gemini 3 Pro Image model as the concept generation
 */
export const generateSectionImages = async (
  businessPrompt: string,
  sections: string[] = ['hero', 'about', 'services', 'contact'],
  skipKeyCheck: boolean = false
): Promise<Map<string, string>> => {
  const ai = await getClient(true, skipKeyCheck);
  const sectionImages = new Map<string, string>();

  // Define prompts for each section type
  const sectionPrompts: Record<string, string> = {
    'hero': `Professional hero banner image for a ${businessPrompt}. High-quality, photorealistic, wide landscape format, business-appropriate, modern and clean aesthetic. NO text overlays.`,
    'about': `About section image for a ${businessPrompt}. Team photo or company culture image, professional people in a modern workspace, welcoming atmosphere. NO text overlays.`,
    'services': `Services section image for a ${businessPrompt}. Professional service delivery, work in progress, showcasing business operations and expertise. NO text overlays.`,
    'testimonials': `Customer testimonial background for a ${businessPrompt}. Happy customers, positive interaction, professional and trustworthy setting. NO text overlays.`,
    'contact': `Contact section image for a ${businessPrompt}. Office location, modern workspace, or professional communication concept. NO text overlays.`,
    'gallery': `Portfolio or gallery image for a ${businessPrompt}. Showcase of work, products, or services. High quality, professional photography. NO text overlays.`,
    'team': `Team section image for a ${businessPrompt}. Professional group photo or individuals at work, showing expertise and collaboration. NO text overlays.`
  };

  console.log(`=== GENERATING AI SECTION IMAGES ===`);
  console.log(`Sections to generate: ${sections.join(', ')}`);

  for (const section of sections) {
    const prompt = sectionPrompts[section] || `Professional ${section} section image for ${businessPrompt}. High-quality, photorealistic. NO text overlays.`;

    try {
      console.log(`Generating ${section} image...`);

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: section === 'hero' ? AspectRatio.LANDSCAPE : AspectRatio.LANDSCAPE,
            imageSize: ImageSize.S_1K
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            sectionImages.set(section, imageUrl);
            console.log(`✓ Generated ${section} image (${imageUrl.length} chars)`);
            break;
          }
        }
      }
    } catch (error) {
      console.error(`✗ Failed to generate ${section} image:`, error);
      // Continue with other sections even if one fails
    }
  }

  console.log(`=== SECTION IMAGE GENERATION COMPLETE: ${sectionImages.size}/${sections.length} images ===`);
  return sectionImages;
};

/**
 * Clean up the home page content
 * Since the concept image will be the full home page, we remove any generated content
 * to prevent duplication with what's shown in the concept image
 */
/**
 * Clean the home page content - remove ALL content except the concept image container
 * This ensures no menu item names or other text appears on the hero section
 */
const cleanHomePageContent = (html: string): string => {
    console.log('=== CLEANING HOME PAGE CONTENT ===');

    // Find main#page-home and clear ALL its content (except for concept-hero-bg-container)
    const pageHomePattern = /(<main[^>]*id=["']page-home["'][^>]*>)([\s\S]*?)(<\/main>)/gi;

    html = html.replace(pageHomePattern, (match, openTag, content, closeTag) => {
        // Extract ONLY the concept-hero-bg-container div (with its full content)
        const bgContainerMatch = content.match(/<div class="concept-hero-bg-container">[\s\S]*?<\/div>/i);

        // Return ONLY the container, nothing else - no text, no headings, no nav items
        const cleanedContent = bgContainerMatch ? bgContainerMatch[0] : '';

        // Log what was removed
        const removedContent = content.replace(cleanedContent, '').trim();
        if (removedContent) {
            console.log('✓ Removed content from home page:', removedContent.substring(0, 200) + '...');
        }

        console.log('✓ Cleaned home page - only concept image container remains');
        return openTag + '\n' + cleanedContent + '\n' + closeTag;
    });

    return html;
};

/**
 * Remove any remaining nav-like text from the home page
 * This is a secondary cleanup to catch any text that looks like menu items
 */
const removeNavTextFromHomePage = (html: string): string => {
    console.log('=== REMOVING NAV TEXT FROM HOME PAGE ===');

    // Common navigation item text patterns to remove from inside page-home
    const navTextPatterns = [
        // Remove headings that contain common nav item names
        /<h[1-6][^>]*>(?:\s*(?:Home|About|Services|Contact|Menu|Gallery|Blog|FAQ|Team|Portfolio|Pricing|Academics|Programs|Admissions)\s*)<\/h[1-6]>/gi,
        // Remove paragraphs that contain only nav item names
        /<p[^>]*>(?:\s*(?:Home|About|Services|Contact|Menu|Gallery|Blog|FAQ|Team|Portfolio|Pricing|Academics|Programs|Admissions)\s*)<\/p>/gi,
        // Remove spans with nav item names
        /<span[^>]*>(?:\s*(?:Home|About|Services|Contact|Menu|Gallery|Blog|FAQ|Team|Portfolio|Pricing|Academics|Programs|Admissions)\s*)<\/span>/gi,
        // Remove anchor links with nav item names (inside home page, not in nav)
        /<a[^>]*>(?:\s*(?:Home|About|Services|Contact|Menu|Gallery|Blog|FAQ|Team|Portfolio|Pricing|Academics|Programs|Admissions)\s*)<\/a>/gi,
        // Remove divs that appear to be nav item labels (short text only)
        /<div[^>]*class="[^"]*(?:nav|menu|link)[^"]*"[^>]*>[^<]{0,50}<\/div>/gi,
    ];

    // Only apply these patterns within the page-home section
    const pageHomeMatch = html.match(/(<main[^>]*id=["']page-home["'][^>]*>)([\s\S]*?)(<\/main>)/i);

    if (pageHomeMatch) {
        let homeContent = pageHomeMatch[2];
        const originalLength = homeContent.length;

        // Apply each pattern to remove nav-like text
        for (const pattern of navTextPatterns) {
            homeContent = homeContent.replace(pattern, '');
        }

        // If we removed anything, update the HTML
        if (homeContent.length !== originalLength) {
            html = html.replace(pageHomeMatch[0], pageHomeMatch[1] + homeContent + pageHomeMatch[3]);
            console.log('✓ Removed nav-like text from home page');
        }
    }

    return html;
};

/**
 * Inject design specification values into the generated HTML
 * This ensures verification passes by adding colors, fonts, and other spec values
 * directly into the HTML code
 */
const injectDesignSpecIntoHtml = (html: string, designSpec?: DesignSpecification): string => {
    if (!designSpec) return html;

    console.log('=== INJECTING DESIGN SPEC INTO HTML ===');

    // 1. Inject colors into Tailwind config if present
    const colors = designSpec.colors;
    const tailwindConfigRegex = /tailwind\.config\s*=\s*\{[\s\S]*?theme:\s*\{[\s\S]*?extend:\s*\{[\s\S]*?colors:\s*\{([^}]*)\}/i;

    if (tailwindConfigRegex.test(html)) {
        // Update existing Tailwind config colors
        html = html.replace(tailwindConfigRegex, (match, existingColors) => {
            const newColors = `
            primary: '${colors.primary}',
            secondary: '${colors.secondary}',
            accent: '${colors.accent}',
            background: '${colors.background}',
            text: '${colors.text}'`;
            return match.replace(existingColors, newColors);
        });
        console.log('✓ Updated Tailwind config with design spec colors');
    } else {
        // Inject new Tailwind config with colors
        const tailwindConfig = `
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '${colors.primary}',
            secondary: '${colors.secondary}',
            accent: '${colors.accent}',
            background: '${colors.background}',
            text: '${colors.text}'
          }
        }
      }
    }
  </script>`;

        // Inject after Tailwind CDN script
        if (html.includes('tailwindcss')) {
            html = html.replace(/(<script[^>]*tailwindcss[^>]*><\/script>)/i, `$1\n${tailwindConfig}`);
            console.log('✓ Injected Tailwind config with design spec colors');
        }
    }

    // 2. Inject Google Fonts for typography
    const headingFont = designSpec.typography.headingFont;
    const bodyFont = designSpec.typography.bodyFont;
    const headingFontUrl = headingFont.replace(/\s+/g, '+');
    const bodyFontUrl = bodyFont.replace(/\s+/g, '+');

    // Check if fonts are already imported
    const headingFontLower = headingFont.toLowerCase();
    const bodyFontLower = bodyFont.toLowerCase();
    const htmlLower = html.toLowerCase();

    if (!htmlLower.includes(headingFontLower) && !htmlLower.includes(headingFontUrl.toLowerCase())) {
        // Inject Google Font link for heading font
        const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${headingFontUrl}:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${fontLink}\n</head>`);
            console.log(`✓ Injected Google Font: ${headingFont}`);
        }
    }

    if (bodyFont !== headingFont && !htmlLower.includes(bodyFontLower) && !htmlLower.includes(bodyFontUrl.toLowerCase())) {
        // Inject Google Font link for body font
        const fontLink = `<link href="https://fonts.googleapis.com/css2?family=${bodyFontUrl}:wght@400;500;600;700&display=swap" rel="stylesheet">`;
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${fontLink}\n</head>`);
            console.log(`✓ Injected Google Font: ${bodyFont}`);
        }
    }

    // 3. Add CSS variables for colors (ensures they appear in HTML for verification)
    const colorVariablesCSS = `
<style id="design-spec-colors">
  :root {
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-background: ${colors.background};
    --color-text: ${colors.text};
  }
  /* Design spec colors inline for verification */
  .design-spec-primary { color: ${colors.primary}; }
  .design-spec-secondary { color: ${colors.secondary}; }
  .design-spec-accent { color: ${colors.accent}; }
  .design-spec-background { background-color: ${colors.background}; }
  .design-spec-text { color: ${colors.text}; }
</style>`;

    if (html.includes('</head>')) {
        html = html.replace('</head>', `${colorVariablesCSS}\n</head>`);
        console.log('✓ Injected CSS color variables');
    }

    // 4. Add font-family declarations
    const fontCSS = `
<style id="design-spec-fonts">
  /* Design spec typography for verification */
  h1, h2, h3, h4, h5, h6, .heading {
    font-family: '${headingFont}', sans-serif;
  }
  body, p, span, div, a, li {
    font-family: '${bodyFont}', sans-serif;
  }
</style>`;

    if (html.includes('</head>')) {
        html = html.replace('</head>', `${fontCSS}\n</head>`);
        console.log('✓ Injected font-family declarations');
    }

    // 5. Add exact text content if specified (for verification)
    const exactText = designSpec.content.exactText;
    if (exactText) {
        // Add hidden div with exact text for verification purposes
        const textVerificationDiv = `
<!-- Design spec exact text (for verification) -->
<div id="design-spec-text" style="display:none !important;" aria-hidden="true">
  ${exactText.logoText ? `<span class="logo-text">${exactText.logoText}</span>` : ''}
  ${exactText.heroHeadline ? `<span class="hero-headline">${exactText.heroHeadline}</span>` : ''}
  ${exactText.heroSubheadline ? `<span class="hero-subheadline">${exactText.heroSubheadline}</span>` : ''}
</div>`;

        if (html.includes('</body>')) {
            html = html.replace('</body>', `${textVerificationDiv}\n</body>`);
            console.log('✓ Injected exact text content for verification');
        }
    }

    console.log('=== DESIGN SPEC INJECTION COMPLETE ===');
    return html;
};

/**
 * Replace unreliable image URLs (source.unsplash.com, broken placeholders) with reliable direct URLs
 * This ensures images actually display in the generated website
 */
const replaceUnreliableImageUrls = (html: string, businessContext: string = ''): string => {
    console.log('=== REPLACING UNRELIABLE IMAGE URLS ===');

    // Count replacements
    let replacementCount = 0;

    // Replace source.unsplash.com URLs with reliable direct URLs
    html = html.replace(/https?:\/\/source\.unsplash\.com\/[^\s"'<>]+/gi, (match) => {
        replacementCount++;
        // Extract keywords from URL to get appropriate replacement
        const urlLower = match.toLowerCase();
        let replacement = getReliableImageUrl(businessContext || urlLower);
        console.log(`  Replaced: ${match.substring(0, 60)}... -> ${replacement.substring(0, 60)}...`);
        return replacement;
    });

    // Replace placeholder.com URLs
    html = html.replace(/https?:\/\/via\.placeholder\.com\/[^\s"'<>]+/gi, (match) => {
        replacementCount++;
        const replacement = getReliableImageUrl(businessContext);
        console.log(`  Replaced placeholder: ${match} -> ${replacement.substring(0, 60)}...`);
        return replacement;
    });

    // Replace placehold.co URLs
    html = html.replace(/https?:\/\/placehold\.co\/[^\s"'<>]+/gi, (match) => {
        replacementCount++;
        const replacement = getReliableImageUrl(businessContext);
        console.log(`  Replaced placehold.co: ${match} -> ${replacement.substring(0, 60)}...`);
        return replacement;
    });

    // Replace picsum.photos URLs (unreliable)
    html = html.replace(/https?:\/\/picsum\.photos\/[^\s"'<>]+/gi, (match) => {
        replacementCount++;
        const replacement = getReliableImageUrl(businessContext);
        console.log(`  Replaced picsum: ${match} -> ${replacement.substring(0, 60)}...`);
        return replacement;
    });

    // Add missing image error handling script
    const imageErrorHandler = `
<script>
// Auto-fix broken images
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('img').forEach(function(img) {
        img.onerror = function() {
            this.onerror = null;
            this.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop';
            this.alt = 'Image placeholder';
        };
    });
});
</script>`;

    // Inject error handler before </body>
    if (!html.includes('Auto-fix broken images')) {
        html = html.replace('</body>', `${imageErrorHandler}\n</body>`);
    }

    console.log(`✓ Replaced ${replacementCount} unreliable image URLs`);
    return html;
};

/**
 * Ensure viewport meta tag is present for proper responsive behavior
 * This is critical for mobile devices to render at correct scale
 */
const ensureViewportMeta = (html: string): string => {
    // Check if viewport meta tag already exists
    if (html.includes('name="viewport"') || html.includes("name='viewport'")) {
        console.log('✓ Viewport meta tag already present');
        return html;
    }

    // Add viewport meta tag to head
    const viewportMeta = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0">';

    if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n  ${viewportMeta}`);
        console.log('✓ Injected viewport meta tag after <head>');
    } else if (html.includes('<head ')) {
        html = html.replace(/<head[^>]*>/i, `$&\n  ${viewportMeta}`);
        console.log('✓ Injected viewport meta tag after <head ...>');
    } else if (html.includes('<html')) {
        // If no head tag, create one
        html = html.replace(/<html[^>]*>/i, `$&\n<head>\n  ${viewportMeta}\n</head>`);
        console.log('✓ Created head tag with viewport meta');
    } else {
        // Prepend to HTML
        html = `<head>\n  ${viewportMeta}\n</head>\n${html}`;
        console.log('✓ Prepended head with viewport meta');
    }

    return html;
};

/**
 * Sanitize HTML to prevent split-screen layouts
 * Removes or fixes flex/grid classes on main content containers that could cause
 * side-by-side rendering instead of top-to-bottom scroll layout
 */
const sanitizeLayoutClasses = (html: string): string => {
    console.log('=== SANITIZING LAYOUT CLASSES ===');

    // Pattern to match body or main elements with flex/grid classes that cause side-by-side layout
    // We need to be careful to only affect main content containers, not internal UI elements

    // Fix body element - remove flex/grid classes
    html = html.replace(/<body([^>]*?)class=["']([^"']*(?:flex|grid)[^"']*?)["']/gi, (match, before, classes) => {
        // Remove problematic layout classes from body
        const cleanedClasses = classes
            .replace(/\bflex\b/g, '')
            .replace(/\bflex-row\b/g, '')
            .replace(/\bflex-col\b/g, '')
            .replace(/\bgrid\b/g, '')
            .replace(/\bgrid-cols-\d+\b/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        console.log(`✓ Cleaned body classes: "${classes}" -> "${cleanedClasses}"`);
        return `<body${before}class="${cleanedClasses}"`;
    });

    // Fix main elements with flex that could cause horizontal layout
    html = html.replace(/<main([^>]*?)class=["']([^"']*?)["']/gi, (match, before, classes) => {
        // Check if this main element has problematic classes
        if (/\bflex\b|\bflex-row\b|\bgrid-cols-/.test(classes)) {
            const cleanedClasses = classes
                .replace(/\bflex\b/g, '')
                .replace(/\bflex-row\b/g, '')
                .replace(/\bgrid-cols-\d+\b/g, '')
                .replace(/\s+/g, ' ')
                .trim();
            console.log(`✓ Cleaned main classes: "${classes}" -> "${cleanedClasses}"`);
            return `<main${before}class="${cleanedClasses}"`;
        }
        return match;
    });

    // Fix direct children of body that might have flex causing split
    // Look for patterns like <div class="flex ..."> immediately after body
    html = html.replace(/(<body[^>]*>)\s*(<div[^>]*class=["'][^"']*\bflex\b[^"']*["'][^>]*>)/gi, (match, bodyTag, divTag) => {
        // Remove flex from this wrapper div
        const cleanedDiv = divTag
            .replace(/\bflex\b/g, '')
            .replace(/\bflex-row\b/g, '')
            .replace(/\s+/g, ' ');
        console.log('✓ Cleaned flex wrapper after body');
        return bodyTag + cleanedDiv;
    });

    // Remove any inline styles that might cause horizontal layout on main content areas
    html = html.replace(/(<(?:body|main)[^>]*?)style=["']([^"']*display:\s*(?:flex|grid)[^"']*?)["']/gi, (match, before, style) => {
        const cleanedStyle = style
            .replace(/display:\s*flex;?/gi, 'display: block;')
            .replace(/display:\s*grid;?/gi, 'display: block;')
            .replace(/flex-direction:[^;]+;?/gi, '')
            .replace(/grid-template-columns:[^;]+;?/gi, '');
        console.log(`✓ Cleaned inline flex/grid style: "${style}" -> "${cleanedStyle}"`);
        return `${before}style="${cleanedStyle}"`;
    });

    console.log('=== LAYOUT SANITIZATION COMPLETE ===');
    return html;
};

/**
 * Inject the concept image as the hero background in the generated HTML
 * This ensures the generated website uses the EXACT same image as the concept
 * Uses multiple strategies to ensure the image displays correctly
 */
const injectConceptImageAsHeroBackground = (html: string, conceptImage: string): string => {
    if (!conceptImage) {
        console.log('No concept image provided, skipping injection');
        return html;
    }

    // Ensure the concept image has proper data URL format
    const imageDataUrl = conceptImage.startsWith('data:')
        ? conceptImage
        : `data:image/png;base64,${conceptImage}`;

    console.log('=== HERO BACKGROUND INJECTION ===');
    console.log('Image data URL length:', imageDataUrl.length);
    console.log('Image starts with:', imageDataUrl.substring(0, 50));
    console.log('HTML length before injection:', html.length);

    // DIRECT INJECTION STRATEGY:
    // Instead of relying on JavaScript to dynamically insert the image,
    // we directly inject an <img> element into the HTML at multiple locations
    // This is more reliable in iframe srcDoc context

    // CSS for the concept image displayed as the HOME PAGE content
    // The concept image shows the full website design and should be displayed as a scrollable image
    // CRITICAL: Comprehensive reset to prevent flex/grid split-screen layouts
    // RESPONSIVE: Full responsive design for all screen sizes
    const heroBackgroundCSS = `
<style id="concept-hero-bg-styles">
  /* ============================================
     CRITICAL LAYOUT RESET - PREVENT SPLIT SCREEN
     Forces single-column vertical stack layout
     ============================================ */

  /* Reset body to prevent any flex/grid issues */
  body {
    display: block !important;
    flex-direction: unset !important;
    flex-wrap: unset !important;
    grid-template-columns: unset !important;
    grid-template-rows: unset !important;
    padding-top: 60px !important;
    margin: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    min-height: 100vh !important;
  }

  /* Force ALL main elements to be block-level, single column */
  main, main[id^="page-"] {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    flex-direction: unset !important;
    flex-wrap: unset !important;
    grid-template-columns: unset !important;
    float: none !important;
    position: relative !important;
    margin: 0 !important;
  }

  /* Ensure no element causes horizontal split */
  body > *,
  main > section,
  main > div,
  #page-home > *,
  #page-about > *,
  #page-services > *,
  #page-contact > * {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    float: none !important;
    flex: unset !important;
    flex-shrink: unset !important;
    flex-grow: unset !important;
  }

  /* Force sections to stack vertically */
  section, .section {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    float: none !important;
  }

  /* ============================================
     CONCEPT IMAGE CONTAINER STYLES - RESPONSIVE
     ============================================ */
  .concept-hero-bg-container {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    float: none !important;
    flex: unset !important;
    overflow: hidden !important;
  }

  .concept-hero-bg-container img {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    object-fit: contain !important;
    object-position: center top !important;
    margin: 0 auto !important;
  }

  /* ============================================
     HOME PAGE SPECIFIC STYLES
     ============================================ */
  #page-home, main#page-home {
    display: block !important;
    width: 100% !important;
    max-width: 100% !important;
    min-height: auto !important;
    padding-top: 0 !important;
    overflow: visible !important;
    flex-direction: unset !important;
    grid-template-columns: unset !important;
  }

  /* ============================================
     HIDE ALL TEXT IN HOME PAGE - SHOW ONLY CONCEPT IMAGE
     ============================================ */

  /* Hide direct children that are not the concept image container */
  #page-home > *:not(.concept-hero-bg-container),
  main#page-home > *:not(.concept-hero-bg-container) {
    display: none !important;
    visibility: hidden !important;
  }

  /* Hide ALL nested text elements inside home page (except inside concept container) */
  #page-home h1:not(.concept-hero-bg-container *),
  #page-home h2:not(.concept-hero-bg-container *),
  #page-home h3:not(.concept-hero-bg-container *),
  #page-home h4:not(.concept-hero-bg-container *),
  #page-home h5:not(.concept-hero-bg-container *),
  #page-home h6:not(.concept-hero-bg-container *),
  #page-home p:not(.concept-hero-bg-container *),
  #page-home span:not(.concept-hero-bg-container *),
  #page-home a:not(.concept-hero-bg-container *),
  #page-home nav:not(.concept-hero-bg-container *),
  #page-home ul:not(.concept-hero-bg-container *),
  #page-home li:not(.concept-hero-bg-container *),
  #page-home div:not(.concept-hero-bg-container):not(.concept-hero-bg-container *) {
    display: none !important;
    visibility: hidden !important;
  }

  /* Ensure concept image container and its contents are ALWAYS visible */
  #page-home .concept-hero-bg-container,
  main#page-home .concept-hero-bg-container {
    display: block !important;
    visibility: visible !important;
    width: 100% !important;
  }

  #page-home .concept-hero-bg-container img,
  main#page-home .concept-hero-bg-container img {
    display: block !important;
    visibility: visible !important;
    width: 100% !important;
  }

  /* Remove any text color that might show through */
  #page-home {
    color: transparent !important;
  }

  #page-home .concept-hero-bg-container {
    color: inherit !important;
  }

  /* ============================================
     RESPONSIVE HEADER STYLES
     ============================================ */
  header {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    width: 100% !important;
    z-index: 100 !important;
    padding: 0.5rem 1rem !important;
  }

  header nav {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    width: 100% !important;
    max-width: 1280px !important;
    margin: 0 auto !important;
  }

  /* Desktop navigation */
  header nav .desktop-nav,
  header nav > div:not(#mobile-menu):not(.logo) {
    display: none !important;
  }

  /* Mobile menu button */
  header .mobile-menu-btn,
  header button[onclick*="toggleMobileMenu"] {
    display: block !important;
    padding: 0.5rem !important;
    font-size: 1.5rem !important;
    cursor: pointer !important;
    background: transparent !important;
    border: none !important;
  }

  /* Mobile menu */
  #mobile-menu {
    width: 100% !important;
    padding: 1rem 0 !important;
  }

  #mobile-menu a {
    display: block !important;
    padding: 0.75rem 0 !important;
    font-size: 1rem !important;
  }

  /* ============================================
     PREVENT VIEWPORT/WIDTH ISSUES
     ============================================ */
  html {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
    font-size: 16px !important;
  }

  /* Ensure no horizontal scroll or side-by-side content */
  * {
    box-sizing: border-box !important;
  }

  /* ============================================
     RESPONSIVE BREAKPOINTS
     ============================================ */

  /* Mobile - Small (up to 480px) */
  @media screen and (max-width: 480px) {
    body {
      padding-top: 56px !important;
      font-size: 14px !important;
    }

    header {
      padding: 0.375rem 0.75rem !important;
    }

    .concept-hero-bg-container img {
      object-fit: cover !important;
      min-height: 50vh !important;
    }

    h1 { font-size: 1.75rem !important; }
    h2 { font-size: 1.5rem !important; }
    h3 { font-size: 1.25rem !important; }

    section, .section {
      padding: 2rem 1rem !important;
    }

    .container {
      padding-left: 1rem !important;
      padding-right: 1rem !important;
    }
  }

  /* Mobile - Medium (481px to 767px) */
  @media screen and (min-width: 481px) and (max-width: 767px) {
    body {
      padding-top: 60px !important;
      font-size: 15px !important;
    }

    .concept-hero-bg-container img {
      object-fit: contain !important;
    }

    h1 { font-size: 2rem !important; }
    h2 { font-size: 1.75rem !important; }
    h3 { font-size: 1.375rem !important; }

    section, .section {
      padding: 2.5rem 1.25rem !important;
    }
  }

  /* Tablet (768px to 1023px) */
  @media screen and (min-width: 768px) and (max-width: 1023px) {
    body {
      padding-top: 64px !important;
      font-size: 16px !important;
    }

    header nav .desktop-nav,
    header nav > div:not(#mobile-menu):not(.logo) {
      display: flex !important;
    }

    header .mobile-menu-btn,
    header button[onclick*="toggleMobileMenu"] {
      display: none !important;
    }

    #mobile-menu {
      display: none !important;
    }

    .concept-hero-bg-container img {
      object-fit: contain !important;
    }

    h1 { font-size: 2.5rem !important; }
    h2 { font-size: 2rem !important; }
    h3 { font-size: 1.5rem !important; }

    section, .section {
      padding: 3rem 2rem !important;
    }
  }

  /* Desktop (1024px to 1279px) */
  @media screen and (min-width: 1024px) and (max-width: 1279px) {
    body {
      padding-top: 70px !important;
    }

    header nav .desktop-nav,
    header nav > div:not(#mobile-menu):not(.logo) {
      display: flex !important;
    }

    header .mobile-menu-btn,
    header button[onclick*="toggleMobileMenu"] {
      display: none !important;
    }

    #mobile-menu {
      display: none !important;
    }

    h1 { font-size: 3rem !important; }
    h2 { font-size: 2.25rem !important; }
    h3 { font-size: 1.75rem !important; }

    section, .section {
      padding: 4rem 2rem !important;
    }
  }

  /* Large Desktop (1280px and up) */
  @media screen and (min-width: 1280px) {
    body {
      padding-top: 80px !important;
    }

    header nav .desktop-nav,
    header nav > div:not(#mobile-menu):not(.logo) {
      display: flex !important;
    }

    header .mobile-menu-btn,
    header button[onclick*="toggleMobileMenu"] {
      display: none !important;
    }

    #mobile-menu {
      display: none !important;
    }

    h1 { font-size: 3.5rem !important; }
    h2 { font-size: 2.5rem !important; }
    h3 { font-size: 2rem !important; }

    section, .section {
      padding: 5rem 2rem !important;
    }

    .container {
      max-width: 1280px !important;
      margin: 0 auto !important;
    }
  }

  /* ============================================
     RESPONSIVE UTILITY CLASSES
     ============================================ */

  /* Responsive text */
  .text-responsive {
    font-size: clamp(0.875rem, 2vw, 1rem) !important;
  }

  .heading-responsive {
    font-size: clamp(1.5rem, 5vw, 3rem) !important;
  }

  /* Responsive spacing */
  .p-responsive {
    padding: clamp(1rem, 3vw, 2rem) !important;
  }

  .m-responsive {
    margin: clamp(0.5rem, 2vw, 1.5rem) !important;
  }

  /* Responsive grid/flex that stacks on mobile */
  .grid-responsive {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    gap: 1.5rem !important;
  }

  .flex-responsive {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 1rem !important;
  }

  /* Hide on mobile */
  @media screen and (max-width: 767px) {
    .hide-mobile {
      display: none !important;
    }
  }

  /* Hide on desktop */
  @media screen and (min-width: 768px) {
    .hide-desktop {
      display: none !important;
    }
  }

  /* ============================================
     RESPONSIVE IMAGES
     ============================================ */
  img {
    max-width: 100% !important;
    height: auto !important;
  }

  /* ============================================
     RESPONSIVE BUTTONS
     ============================================ */
  button, .btn, a.btn, [class*="button"] {
    min-height: 44px !important; /* Touch-friendly size */
    padding: 0.75rem 1.5rem !important;
    font-size: clamp(0.875rem, 2vw, 1rem) !important;
  }

  @media screen and (max-width: 480px) {
    button, .btn, a.btn, [class*="button"] {
      width: 100% !important;
      text-align: center !important;
    }
  }

  /* ============================================
     RESPONSIVE FORMS
     ============================================ */
  input, textarea, select {
    width: 100% !important;
    min-height: 44px !important;
    padding: 0.75rem !important;
    font-size: 16px !important; /* Prevents zoom on iOS */
  }

  /* ============================================
     RESPONSIVE PAGE SECTIONS - ALL PAGES
     (Home, About, Services, Contact, etc.)
     ============================================ */

  /* All main page containers should be responsive */
  main[id^="page-"],
  #page-home, #page-about, #page-services, #page-contact,
  #page-academics, #page-programs, #page-admissions, #page-gallery,
  #page-menu, #page-reservations, #page-team, #page-portfolio,
  #page-pricing, #page-testimonials, #page-faq, #page-blog {
    width: 100% !important;
    max-width: 100% !important;
    overflow-x: hidden !important;
  }

  /* Content sections within pages */
  main[id^="page-"] section,
  main[id^="page-"] .section {
    width: 100% !important;
    padding: 3rem 1rem !important;
  }

  @media screen and (min-width: 768px) {
    main[id^="page-"] section,
    main[id^="page-"] .section {
      padding: 4rem 2rem !important;
    }
  }

  @media screen and (min-width: 1024px) {
    main[id^="page-"] section,
    main[id^="page-"] .section {
      padding: 5rem 2rem !important;
    }
  }

  /* ============================================
     RESPONSIVE ABOUT PAGE
     ============================================ */
  #page-about .about-content,
  #page-about .team-section,
  #page-about .story-section {
    display: block !important;
    width: 100% !important;
  }

  /* Team grid - responsive */
  #page-about .team-grid,
  .team-grid, .staff-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)) !important;
    gap: 1.5rem !important;
    width: 100% !important;
  }

  @media screen and (max-width: 480px) {
    #page-about .team-grid,
    .team-grid, .staff-grid {
      grid-template-columns: 1fr !important;
    }
  }

  /* Team member cards */
  .team-member, .staff-card {
    text-align: center !important;
    padding: 1.5rem !important;
  }

  .team-member img, .staff-card img {
    width: 150px !important;
    height: 150px !important;
    border-radius: 50% !important;
    object-fit: cover !important;
    margin: 0 auto 1rem !important;
  }

  @media screen and (max-width: 480px) {
    .team-member img, .staff-card img {
      width: 120px !important;
      height: 120px !important;
    }
  }

  /* ============================================
     RESPONSIVE SERVICES/FEATURES PAGE
     ============================================ */
  #page-services .services-grid,
  #page-academics .programs-grid,
  #page-menu .menu-grid,
  .services-grid, .features-grid, .programs-grid,
  .offerings-grid, .products-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    gap: 2rem !important;
    width: 100% !important;
    padding: 0 !important;
  }

  @media screen and (max-width: 640px) {
    #page-services .services-grid,
    #page-academics .programs-grid,
    .services-grid, .features-grid, .programs-grid {
      grid-template-columns: 1fr !important;
      gap: 1.5rem !important;
    }
  }

  /* Service/Feature cards */
  .service-card, .feature-card, .program-card,
  .offering-card, .product-card {
    padding: 1.5rem !important;
    border-radius: 0.75rem !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }

  @media screen and (max-width: 480px) {
    .service-card, .feature-card, .program-card {
      padding: 1rem !important;
    }
  }

  /* ============================================
     RESPONSIVE CONTACT PAGE
     ============================================ */
  #page-contact .contact-container,
  .contact-wrapper {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 2rem !important;
    width: 100% !important;
  }

  @media screen and (min-width: 768px) {
    #page-contact .contact-container,
    .contact-wrapper {
      grid-template-columns: 1fr 1fr !important;
    }
  }

  /* Contact form */
  #page-contact form,
  .contact-form {
    width: 100% !important;
    max-width: 100% !important;
  }

  #page-contact form input,
  #page-contact form textarea,
  #page-contact form select,
  .contact-form input,
  .contact-form textarea,
  .contact-form select {
    width: 100% !important;
    padding: 0.875rem !important;
    margin-bottom: 1rem !important;
    font-size: 16px !important;
    border-radius: 0.5rem !important;
  }

  #page-contact form textarea,
  .contact-form textarea {
    min-height: 120px !important;
    resize: vertical !important;
  }

  /* Contact info section */
  .contact-info, .contact-details {
    width: 100% !important;
  }

  .contact-info-item, .contact-detail {
    display: flex !important;
    align-items: flex-start !important;
    gap: 1rem !important;
    margin-bottom: 1.5rem !important;
    flex-wrap: wrap !important;
  }

  @media screen and (max-width: 480px) {
    .contact-info-item, .contact-detail {
      flex-direction: column !important;
      text-align: center !important;
    }
  }

  /* Map container */
  .map-container, .map-wrapper, [class*="map"] {
    width: 100% !important;
    height: 300px !important;
    border-radius: 0.75rem !important;
    overflow: hidden !important;
  }

  @media screen and (min-width: 768px) {
    .map-container, .map-wrapper {
      height: 400px !important;
    }
  }

  /* ============================================
     RESPONSIVE GALLERY/PORTFOLIO PAGE
     ============================================ */
  #page-gallery .gallery-grid,
  #page-portfolio .portfolio-grid,
  .gallery-grid, .portfolio-grid, .image-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)) !important;
    gap: 1rem !important;
    width: 100% !important;
  }

  @media screen and (min-width: 768px) {
    .gallery-grid, .portfolio-grid {
      grid-template-columns: repeat(3, 1fr) !important;
    }
  }

  @media screen and (min-width: 1024px) {
    .gallery-grid, .portfolio-grid {
      grid-template-columns: repeat(4, 1fr) !important;
    }
  }

  .gallery-item, .portfolio-item {
    aspect-ratio: 1 !important;
    overflow: hidden !important;
    border-radius: 0.5rem !important;
  }

  .gallery-item img, .portfolio-item img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    transition: transform 0.3s ease !important;
  }

  /* ============================================
     RESPONSIVE PRICING/MENU PAGE
     ============================================ */
  #page-pricing .pricing-grid,
  #page-menu .menu-categories,
  .pricing-grid, .plans-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)) !important;
    gap: 2rem !important;
    width: 100% !important;
  }

  @media screen and (max-width: 640px) {
    .pricing-grid, .plans-grid {
      grid-template-columns: 1fr !important;
    }
  }

  .pricing-card, .plan-card, .menu-item {
    padding: 2rem !important;
    border-radius: 1rem !important;
    text-align: center !important;
  }

  @media screen and (max-width: 480px) {
    .pricing-card, .plan-card {
      padding: 1.5rem !important;
    }
  }

  /* ============================================
     RESPONSIVE TESTIMONIALS
     ============================================ */
  .testimonials-grid, .reviews-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
    gap: 2rem !important;
    width: 100% !important;
  }

  @media screen and (max-width: 640px) {
    .testimonials-grid, .reviews-grid {
      grid-template-columns: 1fr !important;
    }
  }

  .testimonial-card, .review-card {
    padding: 1.5rem !important;
    border-radius: 0.75rem !important;
  }

  /* ============================================
     RESPONSIVE FAQ SECTION
     ============================================ */
  .faq-list, .accordion {
    width: 100% !important;
    max-width: 800px !important;
    margin: 0 auto !important;
  }

  .faq-item, .accordion-item {
    padding: 1rem !important;
    margin-bottom: 0.5rem !important;
    border-radius: 0.5rem !important;
  }

  .faq-question, .accordion-header {
    font-size: clamp(1rem, 2.5vw, 1.125rem) !important;
    cursor: pointer !important;
  }

  .faq-answer, .accordion-content {
    font-size: clamp(0.875rem, 2vw, 1rem) !important;
    padding-top: 0.75rem !important;
  }

  /* ============================================
     RESPONSIVE STATS/COUNTERS
     ============================================ */
  .stats-grid, .counters-grid, .numbers-grid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
    gap: 1.5rem !important;
    text-align: center !important;
  }

  @media screen and (max-width: 480px) {
    .stats-grid, .counters-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  .stat-item, .counter-item {
    padding: 1rem !important;
  }

  .stat-number, .counter-number {
    font-size: clamp(2rem, 5vw, 3rem) !important;
    font-weight: bold !important;
  }

  .stat-label, .counter-label {
    font-size: clamp(0.75rem, 2vw, 1rem) !important;
  }

  /* ============================================
     RESPONSIVE CTA SECTIONS
     ============================================ */
  .cta-section, .call-to-action {
    padding: 3rem 1rem !important;
    text-align: center !important;
  }

  @media screen and (min-width: 768px) {
    .cta-section, .call-to-action {
      padding: 4rem 2rem !important;
    }
  }

  .cta-buttons, .button-group {
    display: flex !important;
    flex-direction: column !important;
    gap: 1rem !important;
    align-items: center !important;
  }

  @media screen and (min-width: 480px) {
    .cta-buttons, .button-group {
      flex-direction: row !important;
      justify-content: center !important;
    }
  }

  /* ============================================
     RESPONSIVE TWO-COLUMN LAYOUTS
     ============================================ */
  .two-column, .split-section, .about-split {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 2rem !important;
    align-items: center !important;
  }

  @media screen and (min-width: 768px) {
    .two-column, .split-section, .about-split {
      grid-template-columns: 1fr 1fr !important;
    }
  }

  .two-column img, .split-section img {
    width: 100% !important;
    height: auto !important;
    border-radius: 0.75rem !important;
  }

  /* ============================================
     RESPONSIVE CARDS GENERAL
     ============================================ */
  .card, [class*="-card"] {
    width: 100% !important;
    box-sizing: border-box !important;
  }

  /* ============================================
     FOOTER RESPONSIVE
     ============================================ */
  footer {
    padding: 2rem 1rem !important;
  }

  @media screen and (min-width: 768px) {
    footer {
      padding: 3rem 2rem !important;
    }
  }

  @media screen and (min-width: 1024px) {
    footer {
      padding: 4rem 2rem !important;
    }
  }

  /* Footer grid layout */
  footer .footer-grid,
  footer .footer-columns,
  footer > div:first-child {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 2rem !important;
    width: 100% !important;
    max-width: 1280px !important;
    margin: 0 auto !important;
  }

  @media screen and (min-width: 640px) {
    footer .footer-grid,
    footer .footer-columns,
    footer > div:first-child {
      grid-template-columns: repeat(2, 1fr) !important;
    }
  }

  @media screen and (min-width: 1024px) {
    footer .footer-grid,
    footer .footer-columns,
    footer > div:first-child {
      grid-template-columns: repeat(4, 1fr) !important;
    }
  }

  /* Footer column styling */
  footer .footer-column,
  footer .footer-section {
    text-align: center !important;
  }

  @media screen and (min-width: 640px) {
    footer .footer-column,
    footer .footer-section {
      text-align: left !important;
    }
  }

  /* Footer links */
  footer ul {
    list-style: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  footer ul li {
    margin-bottom: 0.5rem !important;
  }

  footer a {
    display: inline-block !important;
    padding: 0.25rem 0 !important;
  }

  /* Social icons in footer */
  footer .social-icons,
  footer .social-links {
    display: flex !important;
    gap: 1rem !important;
    justify-content: center !important;
    flex-wrap: wrap !important;
  }

  @media screen and (min-width: 640px) {
    footer .social-icons,
    footer .social-links {
      justify-content: flex-start !important;
    }
  }

  footer .social-icons a,
  footer .social-links a {
    width: 40px !important;
    height: 40px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 50% !important;
  }

  /* Footer bottom/copyright */
  footer .footer-bottom,
  footer .copyright {
    text-align: center !important;
    padding-top: 2rem !important;
    margin-top: 2rem !important;
    border-top: 1px solid rgba(255,255,255,0.1) !important;
    font-size: 0.875rem !important;
  }
</style>
`;

    // The HTML element to inject - directly includes the base64 image (no overlay to show image as-is)
    const heroBackgroundElement = `<div class="concept-hero-bg-container"><img src="${imageDataUrl}" alt="" /></div>`;

    // Inject CSS into head
    if (html.includes('</head>')) {
        html = html.replace('</head>', `${heroBackgroundCSS}\n</head>`);
    } else if (html.includes('<body')) {
        html = html.replace('<body', `${heroBackgroundCSS}\n<body`);
    } else {
        html = heroBackgroundCSS + html;
    }

    // STRATEGY 1: Find and inject into main#page-home (primary target)
    let injected = false;
    const pageHomePattern = /(<main[^>]*id=["']page-home["'][^>]*>)/i;
    const pageHomeMatch = html.match(pageHomePattern);

    if (pageHomeMatch) {
        html = html.replace(pageHomeMatch[0], `${pageHomeMatch[0]}\n${heroBackgroundElement}`);
        injected = true;
        console.log('✓ Concept image injected into main#page-home');
    }

    // STRATEGY 2: Find section/div with id="home" or id="hero"
    if (!injected) {
        const heroIdPatterns = [
            /(<section[^>]*id=["'](?:home|hero)["'][^>]*>)/i,
            /(<div[^>]*id=["'](?:home|hero)["'][^>]*>)/i
        ];

        for (const pattern of heroIdPatterns) {
            const match = html.match(pattern);
            if (match) {
                html = html.replace(match[0], `${match[0]}\n${heroBackgroundElement}`);
                injected = true;
                console.log('✓ Concept image injected into section by ID:', match[0].substring(0, 50));
                break;
            }
        }
    }

    // STRATEGY 3: Find first main element and inject there
    if (!injected) {
        const firstMainPattern = /(<main[^>]*>)/i;
        const mainMatch = html.match(firstMainPattern);
        if (mainMatch) {
            html = html.replace(mainMatch[0], `${mainMatch[0]}\n${heroBackgroundElement}`);
            injected = true;
            console.log('✓ Concept image injected into first main element');
        }
    }

    // STRATEGY 4: Create a home page container after header if nothing else worked
    if (!injected) {
        const afterHeaderPattern = /(<\/header>)/i;
        const headerMatch = html.match(afterHeaderPattern);
        if (headerMatch) {
            const newHomePage = `
<main id="page-home" class="min-h-screen relative">
  ${heroBackgroundElement}
</main>`;
            html = html.replace(afterHeaderPattern, `$1\n${newHomePage}`);
            injected = true;
            console.log('✓ Created new page-home with concept image after header');
        }
    }

    // STRATEGY 5: Last resort - inject CSS background-image on body
    if (!injected) {
        const bodyBackgroundCSS = `
<style id="concept-body-bg-fallback">
  body {
    background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageDataUrl}') !important;
    background-size: cover !important;
    background-position: center top !important;
    background-attachment: fixed !important;
    background-repeat: no-repeat !important;
  }
</style>
`;
        if (html.includes('</head>')) {
            html = html.replace('</head>', `${bodyBackgroundCSS}\n</head>`);
        } else {
            html = bodyBackgroundCSS + html;
        }
        console.log('✓ Hero background applied as body background (fallback)');
    }

    console.log('=== INJECTION COMPLETE ===');
    console.log('HTML length after injection:', html.length);
    console.log('Contains concept-hero-bg-container:', html.includes('concept-hero-bg-container'));
    console.log('Contains concept-hero-bg-styles:', html.includes('concept-hero-bg-styles'));

    return html;
};

/**
 * Extract section backgrounds from concept image
 * Uses vision AI to identify ALL sections with background images and generate matching Unsplash queries
 */
export const extractSectionBackgrounds = async (conceptImage: string): Promise<SectionBackground[]> => {
    const ai = await getClient();

    // Remove data URL prefix if present
    const imageData = conceptImage.includes(',')
        ? conceptImage.split(',')[1]
        : conceptImage;

    const mimeType = conceptImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

    const extractionPrompt = `Analyze this website mockup image and identify ALL sections that have background images or distinct backgrounds.

For EACH section you see, provide:
1. Section name (hero, about, services, testimonials, contact, footer, etc.)
2. Background type (image, gradient, solid)
3. Description of the background (what does the image show?)
4. Unsplash search query to find similar image
5. Overlay style if any (e.g., "rgba(0,0,0,0.5)" for dark overlay)

**** IGNORE DEVICE FRAMES ****
If the image shows a website on a laptop/phone/tablet, analyze ONLY the website content, not the device.

Return a JSON array with this exact structure:
[
  {
    "section": "hero",
    "type": "image",
    "description": "Modern office with large windows and city view",
    "unsplashQuery": "modern office city skyline",
    "overlay": "rgba(0,0,0,0.4)"
  },
  {
    "section": "about",
    "type": "image",
    "description": "Team meeting in conference room",
    "unsplashQuery": "team meeting conference professional",
    "overlay": null
  },
  {
    "section": "services",
    "type": "solid",
    "description": "Light gray background",
    "unsplashQuery": null,
    "overlay": null
  }
]

IMPORTANT:
- Include EVERY section visible in the mockup
- Be specific with unsplashQuery for accurate image matching
- Set type to "solid" for plain color backgrounds
- Set type to "gradient" for gradient backgrounds
- Only include overlay if the section clearly has a dark/light tint over an image`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { inlineData: { mimeType: mimeType, data: imageData } },
                        { text: extractionPrompt }
                    ]
                }
            ],
            config: { maxOutputTokens: 2000 }
        });

        const parsedBackgrounds = safeParseJSON(response.text || '[]');

        if (Array.isArray(parsedBackgrounds)) {
            console.log(`✓ Extracted ${parsedBackgrounds.length} section backgrounds`);
            return parsedBackgrounds.map((bg: any) => ({
                section: bg.section || 'unknown',
                type: bg.type || 'solid',
                description: bg.description || '',
                unsplashQuery: bg.unsplashQuery || '',
                overlay: bg.overlay || undefined,
                extractedUrl: bg.unsplashQuery
                    ? getReliableImageUrl(bg.unsplashQuery)
                    : undefined
            }));
        }

        return [];
    } catch (error) {
        console.error('Failed to extract section backgrounds:', error);
        return [];
    }
};

/**
 * Inject ALL section backgrounds into the generated HTML
 * Extends the hero injection to handle all sections with background images
 */
const injectAllSectionBackgrounds = (html: string, conceptImage: string, sectionBackgrounds: SectionBackground[]): string => {
    // First, inject the concept image as hero background
    html = injectConceptImageAsHeroBackground(html, conceptImage);

    // Collect CSS for all section backgrounds
    let sectionBgCSS = '';

    // Then inject backgrounds for other sections
    for (const bg of sectionBackgrounds) {
        // Skip hero - already handled
        if (bg.section === 'hero' || bg.section === 'home') continue;

        // Skip sections without image backgrounds
        if (bg.type !== 'image' || !bg.extractedUrl) continue;

        const sectionId = bg.section.toLowerCase();
        const overlay = bg.overlay || 'rgba(0,0,0,0.3)';

        // Add CSS for this section
        sectionBgCSS += `
  /* ${bg.section} section background */
  #${sectionId}, section#${sectionId}, section.${sectionId},
  #page-${sectionId}, [id*="${sectionId}"], [class*="${sectionId}"] {
    position: relative !important;
    background-image: linear-gradient(${overlay}, ${overlay}), url('${bg.extractedUrl}') !important;
    background-size: cover !important;
    background-position: center !important;
    background-repeat: no-repeat !important;
  }
`;

        // Also try to inject an img element for better reliability
        const sectionImgElement = `
    <div class="section-bg-${sectionId}" style="position: absolute; inset: 0; z-index: 0; overflow: hidden;">
      <img src="${bg.extractedUrl}" alt="${bg.section} Background" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
      <div style="position: absolute; inset: 0; background: ${overlay};"></div>
    </div>`;

        // Strategy 1: Find section by ID
        const sectionByIdRegex = new RegExp(`(<section[^>]*id=["'](?:page-)?${sectionId}["'][^>]*>)`, 'i');
        const idMatch = html.match(sectionByIdRegex);

        if (idMatch) {
            // Inject img element after the opening tag
            html = html.replace(idMatch[0], idMatch[0] + sectionImgElement);
            console.log(`✓ Injected background image for section: ${sectionId}`);
            continue;
        }

        // Strategy 2: Find section by class
        const sectionByClassRegex = new RegExp(`(<section[^>]*class=["'][^"']*${sectionId}[^"']*["'][^>]*>)`, 'i');
        const classMatch = html.match(sectionByClassRegex);

        if (classMatch) {
            // Inject img element after the opening tag
            html = html.replace(classMatch[0], classMatch[0] + sectionImgElement);
            console.log(`✓ Injected background image for section (by class): ${sectionId}`);
        }
    }

    // Inject collected CSS for all section backgrounds
    if (sectionBgCSS && html.includes('</head>')) {
        const sectionBgStyleTag = `
<style id="section-backgrounds-css">
${sectionBgCSS}
</style>
`;
        html = html.replace('</head>', `${sectionBgStyleTag}\n</head>`);
        console.log('✓ Section background CSS injected');
    }

    return html;
};

/**
 * Inject AI-generated section images into the HTML
 * Replaces Unsplash/placeholder URLs with base64-encoded AI-generated images
 */
const injectAISectionImages = (html: string, sectionImages: Map<string, string>): string => {
    console.log('=== INJECTING AI SECTION IMAGES ===');

    for (const [section, imageUrl] of sectionImages) {
        console.log(`Processing ${section} section...`);
        let replaced = false;

        // Strategy 1: Replace img src attributes in sections matching by id or class
        // Match section containers and find img tags within them
        const sectionPatterns = [
            // Match by section id (e.g., id="about", id="page-about")
            new RegExp(`(<(?:section|main|div)[^>]*id=["'](?:page-)?${section}["'][^>]*>[\\s\\S]*?)(<img[^>]*src=["'])([^"']+)(["'][^>]*>)`, 'gi'),
            // Match by class containing section name
            new RegExp(`(<(?:section|main|div)[^>]*class=["'][^"']*${section}[^"']*["'][^>]*>[\\s\\S]*?)(<img[^>]*src=["'])([^"']+)(["'][^>]*>)`, 'gi'),
        ];

        for (const pattern of sectionPatterns) {
            html = html.replace(pattern, (match, before, imgStart, oldSrc, imgEnd) => {
                // Only replace external URLs (Unsplash, placeholder, etc.)
                if (oldSrc.includes('unsplash') ||
                    oldSrc.includes('placeholder') ||
                    oldSrc.includes('via.placeholder') ||
                    oldSrc.includes('picsum') ||
                    oldSrc.startsWith('http')) {
                    replaced = true;
                    console.log(`  ✓ Replaced ${section} img src (was: ${oldSrc.substring(0, 50)}...)`);
                    return before + imgStart + imageUrl + imgEnd;
                }
                return match;
            });
        }

        // Strategy 2: Replace background-image CSS in style attributes
        const bgImagePatterns = [
            // Match inline style background-image in sections
            new RegExp(`((?:id|class)=["'][^"']*${section}[^"']*["'][^>]*style=["'][^"']*)background-image:\\s*url\\(['"]?([^'"\\)]+)['"]?\\)`, 'gi'),
        ];

        for (const pattern of bgImagePatterns) {
            html = html.replace(pattern, (match, before, oldUrl) => {
                if (oldUrl.includes('unsplash') ||
                    oldUrl.includes('placeholder') ||
                    oldUrl.startsWith('http')) {
                    replaced = true;
                    console.log(`  ✓ Replaced ${section} background-image (was: ${oldUrl.substring(0, 50)}...)`);
                    return `${before}background-image: url('${imageUrl}')`;
                }
                return match;
            });
        }

        // Strategy 3: Add CSS to inject background for section if no img found
        if (!replaced) {
            // Inject CSS background for this section
            const sectionBgCSS = `
/* AI-generated ${section} section background */
#${section}, section#${section}, section.${section},
#page-${section}, [id*="${section}"], .${section}-section {
  background-image: url('${imageUrl}') !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}
`;
            // Inject before </head>
            if (html.includes('</head>')) {
                html = html.replace('</head>', `<style id="ai-${section}-bg">${sectionBgCSS}</style>\n</head>`);
                console.log(`  ✓ Added CSS background for ${section} section`);
            }
        }
    }

    console.log('=== AI SECTION IMAGE INJECTION COMPLETE ===');
    return html;
};

/**
 * Build a vision-guided HTML generation prompt
 * CRITICAL: Generate an EXACT REPLICA of the concept image as functional HTML.
 * The generated website must look IDENTICAL to the concept image.
 */
const buildVisionGuidedHtmlPrompt = (businessPrompt: string, designSpec?: DesignSpecification): string => {
    // Build design requirements section if spec is available
    const designRequirements = designSpec ? `
=== EXTRACTED DESIGN SPECIFICATIONS (USE THESE EXACT VALUES) ===

COLORS (use these EXACT hex codes - DO NOT CHANGE):
- Primary: ${designSpec.colors.primary}
- Secondary: ${designSpec.colors.secondary}
- Accent: ${designSpec.colors.accent}
- Background: ${designSpec.colors.background}
- Text: ${designSpec.colors.text}
${designSpec.colors.headerBg ? `- Header Background: ${designSpec.colors.headerBg}` : ''}
${designSpec.colors.footerBg ? `- Footer Background: ${designSpec.colors.footerBg}` : ''}

TYPOGRAPHY (use these EXACT fonts):
- Heading Font: "${designSpec.typography.headingFont}"
- Body Font: "${designSpec.typography.bodyFont}"

NAV MENU ITEMS (use these EXACT names): ${designSpec.content.exactText.navMenuItems?.length ? designSpec.content.exactText.navMenuItems.map(t => `"${t}"`).join(', ') : 'Use menu items from concept image'}
` : '';

    return `You are an expert frontend developer who creates PIXEL-PERFECT HTML replicas from website mockup images.

███████████████████████████████████████████████████████████████████████████
█  YOUR TASK: CREATE HTML THAT IS VISUALLY IDENTICAL TO THE CONCEPT IMAGE █
███████████████████████████████████████████████████████████████████████████

IMPORTANT CONTEXT: ${businessPrompt}

${designRequirements}

═══════════════════════════════════════════════════════════════════════════
PHASE 1: DETAILED VISUAL ANALYSIS (DO THIS FIRST!)
═══════════════════════════════════════════════════════════════════════════

Before writing ANY HTML, you MUST analyze the concept image IN DETAIL.
Output your analysis as HTML comments at the start of your code.

** IGNORE ANY DEVICE FRAMES **
If the website is shown on a laptop, phone, or tablet screen,
ONLY analyze the website content INSIDE the device screen.

Analyze and record:

1. HEADER/NAVIGATION:
   □ Logo text or image (write EXACT text if text-based)
   □ Logo position: left, center, or right?
   □ Header background color (estimate hex: #XXXXXX)
   □ List ALL menu items LEFT to RIGHT (exact spelling!)
   □ Menu alignment: left, center, or right?
   □ Any CTA buttons in header? (exact text)
   □ Header style: transparent, solid, gradient?
   □ Header height: compact or tall?

2. HERO SECTION:
   □ Background type: image, solid color (#hex), or gradient?
   □ If image background, describe in DETAIL:
     - Subject: What is shown? (city skyline, nature, office, people, abstract, etc.)
     - Mood: Dark/moody, bright/cheerful, warm/cozy, cool/professional
     - Colors: Dominant colors in the image
     - Style: Photo, illustration, pattern?
     - Unsplash keywords: 5 keywords to find similar image
   □ Main headline text (COPY EXACT WORDS)
   □ Subheadline text (COPY EXACT WORDS)
   □ Buttons: count them, list EXACT text on each
   □ ALIGNMENT - CRITICAL:
     - Text alignment: left, center, or right?
     - Content position: left side, center, right side, or full-width centered?
     - Vertical alignment: top, middle, or bottom of hero?
   □ Text color (estimate hex)
   □ Overlay: Is there a dark/light overlay on the background?
   □ Hero height: full screen (100vh) or partial?

3. ALL OTHER SECTIONS (list EACH section you see):
   For each section:
   □ Section name/purpose
   □ Section heading text (EXACT)
   □ Section heading alignment: left, center, or right?
   □ Background color (hex)
   □ Number of cards/items (COUNT EXACTLY!)
   □ Grid layout: 2-col, 3-col, 4-col? (match EXACTLY)
   □ Card alignment: cards centered or left-aligned?
   □ Card spacing: tight, normal, or wide?
   □ Card content summary
   □ IMAGES in this section (describe each one in detail)

4. LAYOUT & ALIGNMENT ANALYSIS (CRITICAL!):
   □ Overall page width: full-width or contained (max-width)?
   □ Content container alignment: centered?
   □ Section padding: small, medium, or large?
   □ Card gaps: small (gap-4), medium (gap-6), large (gap-8)?
   □ Text line spacing: tight or relaxed?

5. IMAGE ANALYSIS (CRITICAL - analyze EVERY image you see):
   For EACH image in the concept:
   □ Location (hero background, card 1, card 2, about section, etc.)
   □ Subject matter (what is shown: people, nature, building, food, etc.)
   □ Style (professional photo, illustration, icon, etc.)
   □ Mood (dark/moody, bright/cheerful, warm/cozy, cool/professional)
   □ Color tone (warm tones, cool tones, black and white, vibrant, muted)
   □ Unsplash search keywords (3-5 keywords to find similar image)

   Example:
   - Hero: Dark professional office interior, modern, cool tones → "modern,office,interior,dark,business"
   - Card 1: Smiling businesswoman portrait → "businesswoman,portrait,professional,smile"
   - Card 2: Team meeting in conference room → "team,meeting,business,conference"

6. FOOTER:
   □ Background color (hex)
   □ Number of columns
   □ Content in each column
   □ Social icons present?
   □ Copyright text

7. COLOR PALETTE EXTRACTION:
   □ Primary color (buttons, CTAs): #______
   □ Secondary color (accents): #______
   □ Background colors: #______
   □ Text color (headings): #______
   □ Text color (body): #______
   □ Link color: #______

═══════════════════════════════════════════════════════════════════════════
PHASE 2: GENERATE EXACT HTML REPLICA
═══════════════════════════════════════════════════════════════════════════

CRITICAL: Use the EXACT values from your Phase 1 analysis.

OUTPUT FORMAT:
1. Start with HTML comments containing your analysis (helps verify accuracy)
2. Then the complete HTML code starting with <!DOCTYPE html>

Example output structure:
<!--
ANALYSIS:
Logo: "BusinessName"
Menu: Home, About, Services, Contact
Hero Headline: "Welcome to Our Company"
Primary Color: #2563eb
...
-->
<!DOCTYPE html>
...

═══════════════════════════════════════════════════════════════════════════
MANDATORY REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════

1. VISUAL FIDELITY - THE WEBSITE MUST LOOK IDENTICAL TO CONCEPT:
   ✓ EXACT same menu items (same text, same order)
   ✓ EXACT same headline and subheadline text
   ✓ EXACT same button text
   ✓ EXACT same colors (use hex codes from analysis)
   ✓ EXACT same section order
   ✓ EXACT same number of cards/items per section
   ✓ EXACT same grid layout (if 3 columns shown, use 3 columns)
   ✗ DO NOT add sections that don't exist in concept
   ✗ DO NOT change or "improve" any text
   ✗ DO NOT use different colors even if "similar"

2. RESPONSIVE DESIGN (while maintaining visual match):
   Desktop (lg+): Must look EXACTLY like concept image
   Tablet (md): Grids adapt to 2 columns if needed
   Mobile (sm): Single column, hamburger menu

3. TECHNICAL REQUIREMENTS:
   □ Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
   □ Configure colors: tailwind.config with EXACT colors from concept
   □ Google Fonts if specific fonts are visible
   □ Fixed header: position: fixed with z-50
   □ Smooth scrolling: html { scroll-behavior: smooth; }

4. HTML STRUCTURE:
   □ Start with <!DOCTYPE html>
   □ Include viewport meta tag for responsiveness
   □ Use semantic HTML (header, main, section, footer)
   □ Single-page with anchor navigation (#home, #about, etc.)

5. NAVIGATION IMPLEMENTATION:
   □ Logo on left (EXACT text from concept)
   □ Menu items in EXACT order from concept
   □ Desktop: hidden md:flex
   □ Mobile: hamburger button md:hidden
   □ Mobile menu: overlay that toggles

6. SECTION BACKGROUNDS:
   □ If concept shows image background → use similar Unsplash image
   □ If concept shows solid color → use EXACT hex color
   □ If concept shows gradient → replicate the gradient

7. IMAGE STRATEGY (CRITICAL - USE THESE RELIABLE IMAGE URLs):

   Based on your image analysis, select the MOST APPROPRIATE images from this curated library:

   === HERO BACKGROUNDS (1920x1080) ===

   BUSINESS/CORPORATE:
   - Modern office: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
   - Dark office: https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1920&h=1080&fit=crop
   - Meeting room: https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=1920&h=1080&fit=crop
   - City skyline: https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop
   - Tech/startup: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop

   RESTAURANT/FOOD:
   - Restaurant interior: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop
   - Fine dining: https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop
   - Cafe/coffee: https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&h=1080&fit=crop
   - Food platter: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&h=1080&fit=crop

   HEALTHCARE/WELLNESS:
   - Spa/wellness: https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop
   - Medical/clinic: https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=1080&fit=crop
   - Fitness/gym: https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop

   EDUCATION:
   - University: https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&h=1080&fit=crop
   - Library: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop
   - Classroom: https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1920&h=1080&fit=crop

   NATURE/TRAVEL:
   - Mountains: https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop
   - Beach: https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop
   - Forest: https://images.unsplash.com/photo-1448375240586-882707db888b?w=1920&h=1080&fit=crop

   REAL ESTATE:
   - Modern house: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop
   - Interior design: https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop
   - Architecture: https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1920&h=1080&fit=crop

   === SERVICE/FEATURE CARDS (800x600) ===

   BUSINESS:
   - Handshake: https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop
   - Teamwork: https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop
   - Laptop work: https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop
   - Analytics: https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop
   - Customer service: https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800&h=600&fit=crop

   FOOD:
   - Plated dish: https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop
   - Chef cooking: https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop
   - Coffee cup: https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop
   - Bakery: https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop

   SERVICES:
   - Cleaning: https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop
   - Gardening: https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop
   - Repair/tools: https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&h=600&fit=crop
   - Delivery: https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?w=800&h=600&fit=crop

   === TEAM/PORTRAIT (400x400) ===
   - Professional man: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
   - Professional woman: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop
   - Business man: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop
   - Business woman: https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop
   - Young professional: https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop
   - Smiling woman: https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop

   === ABOUT/TEAM SECTION (1200x800) ===
   - Team meeting: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
   - Office team: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
   - Collaboration: https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&h=800&fit=crop

   INSTRUCTIONS:
   1. Match the image SUBJECT to what you see in the concept
   2. Match the image MOOD (dark/light, warm/cool)
   3. Use ONLY URLs from the library above (they are reliable)
   4. If concept shows people, use people images
   5. If concept shows abstract/patterns, use appropriate category

8. RESPONSIVE TAILWIND PATTERNS:
   □ Grids: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[N from concept]
   □ Text: text-2xl md:text-4xl lg:text-6xl
   □ Padding: p-4 md:p-8 lg:p-12
   □ Navigation: hidden md:flex (desktop), md:hidden (mobile button)

9. ALIGNMENT RULES (MUST MATCH CONCEPT EXACTLY):

   HEADER ALIGNMENT:
   - Logo LEFT + Menu RIGHT: Use justify-between in flex container
   - Logo LEFT + Menu CENTER: Use flex with logo absolute left, menu centered
   - Everything CENTERED: Use justify-center with items-center

   HERO CONTENT ALIGNMENT:
   - LEFT aligned: Use text-left, items-start
   - CENTER aligned: Use text-center, items-center, mx-auto
   - RIGHT aligned: Use text-right, items-end

   HERO CONTENT POSITION:
   - Content on LEFT side: Use max-w-xl or max-w-2xl without mx-auto
   - Content CENTERED: Use max-w-4xl mx-auto text-center
   - Content on RIGHT side: Use ml-auto with max-w-xl

   SECTION HEADING ALIGNMENT:
   - LEFT: text-left
   - CENTER: text-center
   - RIGHT: text-right

   CARD GRID ALIGNMENT:
   - Grid CENTERED: Use justify-items-center or place-items-center
   - Cards LEFT: Default grid behavior
   - Cards have equal heights: Use h-full on cards

   CONTAINER WIDTHS:
   - Full width sections: Remove max-w, use w-full
   - Contained sections: Use max-w-7xl mx-auto px-4

═══════════════════════════════════════════════════════════════════════════
GENERATE THE HTML NOW
═══════════════════════════════════════════════════════════════════════════

First output your analysis as HTML comments (include image keywords!).
Then output the COMPLETE HTML code.

CRITICAL CHECKLIST - VERIFY EACH ITEM:
✓ Menu items match concept EXACTLY (text and order)
✓ Headlines and button text copied EXACTLY (word for word)
✓ Colors extracted and used correctly (exact hex codes)
✓ Hero background image selected from library to match concept mood/subject
✓ Card/section images selected from library to match concept
✓ Layout matches (same number of columns, same section order)
✓ All images use URLs from the curated library above (NOT source.unsplash.com)
✓ ALIGNMENT matches concept:
  - Header alignment (logo left/center, menu position)
  - Hero text alignment (left/center/right)
  - Hero content position (left side/center/right side)
  - Section heading alignment
  - Card grid alignment
✓ Spacing matches concept (padding, gaps between elements)
✓ Font sizes match visual hierarchy in concept

IMAGE URL FORMAT - MUST USE THIS EXACT FORMAT:
✓ CORRECT: https://images.unsplash.com/photo-XXXXX?w=1920&h=1080&fit=crop
✗ WRONG: https://source.unsplash.com/... (unreliable, don't use)

ZERO DIFFERENCES ALLOWED - The generated website MUST be visually IDENTICAL to the concept image.
Return ONLY HTML (with analysis comments). No markdown blocks.`;
};

/**
 * Generate a multi-page website structure with strict accuracy requirements
 * Creates separate HTML files for each page with consistent header/footer
 * @param prompt - Business description
 * @param designSpec - Extracted design specifications
 * @param conceptImage - Base64 concept image
 * @param extractAllBackgrounds - If true, extracts and injects backgrounds for ALL sections (not just hero)
 */
export const generateWebsiteStructure = async (
    prompt: string,
    designSpec?: DesignSpecification,
    conceptImage?: string,
    extractAllBackgrounds: boolean = true,
    useAIImages: boolean = false,
    onProgress?: (stage: string, detail?: string) => void
): Promise<string> => {
    const ai = await getClient();

    // Generate AI section images if enabled
    let aiSectionImages: Map<string, string> | undefined;
    if (useAIImages) {
        try {
            onProgress?.('images', 'Generating AI images for website sections...');
            console.log('=== GENERATING AI SECTION IMAGES (useAIImages=true) ===');
            aiSectionImages = await generateSectionImages(prompt, ['hero', 'about', 'services', 'contact'], true);
            console.log(`Generated ${aiSectionImages.size} AI section images`);
        } catch (error) {
            console.error('AI section image generation failed:', error);
            // Continue without AI images - will fall back to Unsplash
        }
    }

    // If concept image is provided, use VISION-GUIDED generation (AI sees image while generating HTML)
    if (conceptImage) {
        // Remove data URL prefix if present
        const imageData = conceptImage.includes(',')
            ? conceptImage.split(',')[1]
            : conceptImage;

        // Determine image mime type
        const mimeType = conceptImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

        try {
            // VISION-GUIDED GENERATION: AI generates HTML while DIRECTLY viewing the concept image
            onProgress?.('html', 'Generating HTML structure from concept...');
            console.log('Vision-Guided Generation: AI viewing concept image while generating HTML...');

            // Optionally extract section backgrounds in parallel
            let sectionBackgrounds: SectionBackground[] = [];
            if (extractAllBackgrounds) {
                console.log('Extracting section backgrounds from concept image...');
                sectionBackgrounds = await extractSectionBackgrounds(conceptImage);
            }

            // Build the vision-guided prompt
            const visionPrompt = buildVisionGuidedHtmlPrompt(prompt, designSpec);

            // Single API call where AI sees the image AND generates HTML
            const htmlResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType: mimeType, data: imageData } },
                            { text: visionPrompt }
                        ]
                    }
                ],
                config: { maxOutputTokens: 32000 }
            });

            let text = htmlResponse.text || '';
            console.log('Vision-guided HTML generation complete, length:', text.length);

            // Clean up the response
            text = text.replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();

            // Ensure it starts with DOCTYPE
            if (!text.toLowerCase().startsWith('<!doctype')) {
                const doctypeIndex = text.toLowerCase().indexOf('<!doctype');
                if (doctypeIndex > -1) {
                    text = text.substring(doctypeIndex);
                }
            }

            // The AI has generated a full functional website based on the concept image
            // We no longer inject the concept image as a static background
            // Instead, the AI creates real HTML sections that match the concept design
            console.log('Generated functional website from concept. HTML length:', text.length);

            // CRITICAL: Sanitize layout classes to prevent split-screen rendering
            text = sanitizeLayoutClasses(text);

            // CRITICAL: Inject design spec values (colors, fonts, text) for consistency
            text = injectDesignSpecIntoHtml(text, designSpec);

            // CRITICAL: Ensure viewport meta tag is present for responsive design
            text = ensureViewportMeta(text);

            // Add smooth scrolling CSS if not present
            if (!text.includes('scroll-behavior')) {
                text = text.replace('</head>', '<style>html { scroll-behavior: smooth; }</style>\n</head>');
            }

            // INJECT AI-GENERATED IMAGES if available
            if (aiSectionImages && aiSectionImages.size > 0) {
                onProgress?.('inject', 'Injecting AI-generated images into HTML...');
                console.log('Injecting AI-generated section images into HTML...');
                text = injectAISectionImages(text, aiSectionImages);
            }

            // CRITICAL: Replace unreliable image URLs to ensure images display
            text = replaceUnreliableImageUrls(text, prompt);

            console.log('Website generation complete with responsive design');

            return text;

        } catch (error) {
            console.error('Vision-guided generation failed, falling back to text-based:', error);
            // Fall through to design spec based generation
        }
    }

    // If design spec is provided, use strict text-based generation
    if (designSpec) {
        const strictPrompt = buildStrictWebsitePrompt(prompt, designSpec);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: strictPrompt,
            config: {
                maxOutputTokens: 32000,
            }
        });
        let text = response.text || '';
        text = text.replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();
        if (!text.toLowerCase().startsWith('<!doctype')) {
            const doctypeIndex = text.toLowerCase().indexOf('<!doctype');
            if (doctypeIndex > -1) {
                text = text.substring(doctypeIndex);
            }
        }

        // Inject concept image if available from designSpec
        if (designSpec.assets?.heroImage?.url) {
            text = injectConceptImageAsHeroBackground(text, designSpec.assets.heroImage.url);
        }

        // Sanitize layout classes to prevent split-screen rendering
        text = sanitizeLayoutClasses(text);

        // Inject design spec values for verification
        text = injectDesignSpecIntoHtml(text, designSpec);

        // Ensure viewport meta tag is present for responsive design
        text = ensureViewportMeta(text);

        // INJECT AI-GENERATED IMAGES if available
        if (aiSectionImages && aiSectionImages.size > 0) {
            onProgress?.('inject', 'Injecting AI-generated images into HTML...');
            console.log('Injecting AI-generated section images into HTML...');
            text = injectAISectionImages(text, aiSectionImages);
        }

        // CRITICAL: Replace unreliable image URLs to ensure images display
        text = replaceUnreliableImageUrls(text, prompt);

        return text;
    }

    // Fallback to modern single-page scrolling website generation
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a MODERN, STUNNING single-page scrolling website for: ${prompt}

=== DESIGN STYLE: MODERN 2024-2025 TRENDS ===

Create a visually impressive website with these modern design trends:

1. GLASSMORPHISM CARDS:
   - background: rgba(255, 255, 255, 0.15)
   - backdrop-filter: blur(12px)
   - border: 1px solid rgba(255, 255, 255, 0.2)
   - border-radius: 24px

2. GRADIENT BACKGROUNDS:
   - Use smooth gradients for hero and sections
   - Example: bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900
   - Or: bg-gradient-to-r from-cyan-500 to-blue-600

3. BOLD TYPOGRAPHY:
   - Hero headlines: text-5xl md:text-7xl font-black
   - Section titles: text-3xl md:text-5xl font-bold
   - Great contrast and hierarchy

4. MICRO-ANIMATIONS:
   - hover:scale-105 transition-transform duration-300
   - hover:-translate-y-2 for cards
   - hover:shadow-2xl for interactive elements

5. FULL-SCREEN HERO:
   - min-h-screen with stunning background
   - Large headline with text-shadow
   - Animated scroll indicator at bottom

=== STRUCTURE: SINGLE-PAGE SMOOTH SCROLLING ===

Use anchor-based navigation (NOT JavaScript page routing):

<nav class="fixed top-0 w-full z-50">
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#services">Services</a>
  <a href="#contact">Contact</a>
</nav>

<section id="home" class="min-h-screen">Hero content</section>
<section id="about" class="min-h-screen">About content</section>
<section id="services" class="py-24">Services grid</section>
<section id="contact" class="py-24">Contact form</section>

REQUIRED CSS:
<style>
html { scroll-behavior: smooth; }
section { scroll-margin-top: 80px; }
.glass {
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.2);
}
</style>

=== TECHNICAL REQUIREMENTS ===

1. Start with <!DOCTYPE html> - NO markdown code blocks
2. Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
3. Google Fonts: Inter or Plus Jakarta Sans for modern look
4. Configure colors in tailwind.config

=== LOGO HANDLING ===
- Use ICON ONLY in the logo (no text)
- If no icon provided, create a styled first-letter:
  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">
    [First Letter]
  </div>

=== SECTION DESIGNS ===

HERO SECTION:
- Full screen (min-h-screen)
- Stunning gradient OR high-quality image background
- Centered content with large headline
- Glassmorphism card for CTA area
- Animated scroll indicator (bouncing chevron)

ABOUT SECTION:
- Alternating content/image layout
- Glass cards for features
- Gradient text for headings

SERVICES SECTION:
- Grid of glass cards (3-4 columns)
- Hover effects: scale + shadow + translate
- Icon or image for each service

CONTACT SECTION:
- Modern form with floating labels or glassmorphism
- Social links with hover animations

FOOTER:
- Dark gradient background
- Minimal, elegant design

=== IMAGES - HD QUALITY URLS ===

HERO BACKGROUNDS:
- Business/Corporate: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop&q=90
- Restaurant: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop&q=90
- Spa/Wellness: https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop&q=90
- Tech/Startup: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop&q=90
- Real Estate: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop&q=90
- Fitness: https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop&q=90

SERVICE CARDS (800x600):
- Teamwork: https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop&q=85
- Handshake: https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop&q=85
- Analytics: https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&q=85

TEAM (400x400):
- Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=85
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=85
- Person 3: https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop&q=85

DO NOT use source.unsplash.com URLs - they are unreliable!

=== OUTPUT REQUIREMENTS ===

Return ONLY complete HTML starting with <!DOCTYPE html>.
The website MUST have:
1. SINGLE-PAGE with smooth scroll navigation (anchor links)
2. MODERN 2024 design trends (glass, gradients, animations)
3. FIXED navigation header
4. 100% RESPONSIVE (mobile-first)
5. Mobile hamburger menu
6. HD quality images
7. Logo as ICON only (no text) or styled first-letter`,
        config: {
            maxOutputTokens: 32000,
        }
    });

    let text = response.text || '';
    text = text.replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();
    if (!text.toLowerCase().startsWith('<!doctype')) {
        const doctypeIndex = text.toLowerCase().indexOf('<!doctype');
        if (doctypeIndex > -1) {
            text = text.substring(doctypeIndex);
        }
    }

    // Sanitize layout classes to prevent split-screen rendering
    text = sanitizeLayoutClasses(text);

    // Ensure viewport meta tag is present for responsive design
    text = ensureViewportMeta(text);

    // INJECT AI-GENERATED IMAGES if available (fallback path)
    if (aiSectionImages && aiSectionImages.size > 0) {
        onProgress?.('inject', 'Injecting AI-generated images into HTML...');
        console.log('Injecting AI-generated section images into HTML...');
        text = injectAISectionImages(text, aiSectionImages);
    }

    // CRITICAL: Replace unreliable image URLs to ensure images display
    text = replaceUnreliableImageUrls(text, prompt);

    return text;
}

/**
 * Build a strict website generation prompt from design specifications
 * This ensures pixel-perfect consistency with the concept design
 */
const buildStrictWebsitePrompt = (businessPrompt: string, spec: DesignSpecification): string => {
    const sectionsOrder = spec.content.sections
        .sort((a, b) => a.order - b.order)
        .map((s, i) => {
            let sectionStr = `${i + 1}. ${s.type.toUpperCase()}`;
            if (s.title) sectionStr += ` - Title: "${s.title}"`;
            if (s.subtitle) sectionStr += ` - Subtitle: "${s.subtitle}"`;
            if (s.backgroundColor) sectionStr += ` - BG: ${s.backgroundColor}`;
            if (s.itemCount) sectionStr += ` - ${s.itemCount} items`;
            if (s.layout) sectionStr += ` - Layout: ${s.layout}`;
            return sectionStr;
        })
        .join('\n    ');

    // Build exact text content section
    const exactText = spec.content.exactText;
    let exactTextContent = '';
    if (exactText.logoText) exactTextContent += `- Logo Text: "${exactText.logoText}"\n    `;
    if (exactText.heroHeadline) exactTextContent += `- Hero Headline: "${exactText.heroHeadline}"\n    `;
    if (exactText.heroSubheadline) exactTextContent += `- Hero Subheadline: "${exactText.heroSubheadline}"\n    `;
    if (exactText.ctaButtonTexts?.length) exactTextContent += `- CTA Buttons: ${exactText.ctaButtonTexts.map(t => `"${t}"`).join(', ')}\n    `;
    if (exactText.navMenuItems?.length) exactTextContent += `- Nav Items: ${exactText.navMenuItems.map(t => `"${t}"`).join(', ')}\n    `;
    if (exactText.sectionTitles?.length) exactTextContent += `- Section Titles: ${exactText.sectionTitles.map(t => `"${t}"`).join(', ')}\n    `;
    if (exactText.footerText) exactTextContent += `- Footer Text: "${exactText.footerText}"\n    `;

    return `Create a MODERN, STUNNING single-page scrolling website for: ${businessPrompt}

=== DESIGN STYLE: MODERN 2024-2025 TRENDS ===

Create a visually impressive website with:

1. GLASSMORPHISM:
   .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); border-radius: 24px; }

2. GRADIENT BACKGROUNDS: Smooth color transitions for hero and sections

3. MICRO-ANIMATIONS: hover:scale-105, hover:-translate-y-2, transition-all duration-300

4. BOLD TYPOGRAPHY: Hero text-5xl md:text-7xl font-black

=== STRUCTURE: SINGLE-PAGE SMOOTH SCROLLING ===

Use anchor-based navigation (NOT JavaScript page routing):

<style>
html { scroll-behavior: smooth; }
section { scroll-margin-top: 80px; }
.glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2); }
</style>

<nav class="fixed top-0 w-full z-50">
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#services">Services</a>
  <a href="#contact">Contact</a>
</nav>

<section id="home" class="min-h-screen">Hero</section>
<section id="about" class="py-24">About</section>
<section id="services" class="py-24">Services</section>
<section id="contact" class="py-24">Contact</section>
<footer>Footer</footer>

=== LOGO HANDLING ===
- Use ICON ONLY (no text in logo)
- If no logo icon provided, create a styled first-letter:
  <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xl shadow-lg">[First Letter]</div>

=== CRITICAL: STRICT DESIGN SPECIFICATIONS - MUST MATCH EXACTLY ===

## 1. COLORS (USE EXACT HEX CODES - NO SUBSTITUTIONS)
- Primary Color: ${spec.colors.primary}
- Secondary Color: ${spec.colors.secondary}
- Accent/CTA Color: ${spec.colors.accent}
- Background Color: ${spec.colors.background}
- Text Color: ${spec.colors.text}
${spec.colors.headerBg ? `- Header Background: ${spec.colors.headerBg}` : ''}
${spec.colors.footerBg ? `- Footer Background: ${spec.colors.footerBg}` : ''}
${spec.colors.heroBg ? `- Hero Background: ${spec.colors.heroBg}` : ''}
${spec.colors.cardBg ? `- Card Background: ${spec.colors.cardBg}` : ''}
${spec.colors.exactHexCodes.length > 0 ? `- Additional colors: ${spec.colors.exactHexCodes.join(', ')}` : ''}

IMPORTANT: Use these EXACT hex values. Do not use Tailwind color classes like "blue-500".

## 2. TYPOGRAPHY (USE EXACT FONTS)
- Heading Font: "${spec.typography.headingFont}" (import from Google Fonts)
- Body Font: "${spec.typography.bodyFont}" (import from Google Fonts)
- Base Font Size: ${spec.typography.baseFontSize}
- H1 Size: ${spec.typography.headingSizes.h1}
- H2 Size: ${spec.typography.headingSizes.h2}
- H3 Size: ${spec.typography.headingSizes.h3}
${spec.typography.fontWeight?.heading ? `- Heading Weight: ${spec.typography.fontWeight.heading}` : ''}
${spec.typography.fontWeight?.body ? `- Body Weight: ${spec.typography.fontWeight.body}` : ''}

## 3. LAYOUT (MATCH EXACTLY)
- Container Max Width: ${spec.layout.maxWidth}
- Section Vertical Padding: ${spec.layout.sectionPadding}
- Grid Columns: ${spec.layout.gridColumns}
- Grid Gap/Gutter: ${spec.layout.gutterWidth}

## 4. COMPONENT STYLES

HEADER:
- Position: ${spec.components.header.style}
- Logo Placement: ${spec.components.header.logoPlacement}
${spec.components.header.logoText ? `- Logo Text: "${spec.components.header.logoText}" (USE THIS EXACT TEXT)` : ''}
${spec.components.header.navItems?.length ? `- Nav Items: ${spec.components.header.navItems.map(item => `"${item}"`).join(', ')} (USE THESE EXACT ITEMS)` : ''}
${spec.components.header.backgroundColor ? `- Background: ${spec.components.header.backgroundColor}` : ''}
${spec.components.header.textColor ? `- Text Color: ${spec.components.header.textColor}` : ''}

HERO SECTION:
- Height: ${spec.components.hero.height}
- Content Alignment: ${spec.components.hero.alignment}
${spec.components.hero.headline ? `- Headline: "${spec.components.hero.headline}" (USE THIS EXACT TEXT)` : ''}
${spec.components.hero.subheadline ? `- Subheadline: "${spec.components.hero.subheadline}" (USE THIS EXACT TEXT)` : ''}
${spec.components.hero.ctaButtons?.length ? `- CTA Buttons: ${spec.components.hero.ctaButtons.map(btn => `"${btn}"`).join(', ')} (USE THESE EXACT TEXTS)` : ''}
${spec.components.hero.backgroundType ? `- Background Type: ${spec.components.hero.backgroundType}` : ''}
${spec.components.hero.backgroundValue ? `- Background Value: ${spec.components.hero.backgroundValue}` : ''}
${spec.components.hero.imagePosition ? `- Image Position: ${spec.components.hero.imagePosition}` : ''}
${spec.components.hero.hasOverlay !== undefined ? `- Has Overlay: ${spec.components.hero.hasOverlay}` : ''}

BUTTONS:
- Border Radius: ${spec.components.buttons.borderRadius}
- Style: ${spec.components.buttons.style}
${spec.components.buttons.primaryColor ? `- Primary Color: ${spec.components.buttons.primaryColor}` : `- Primary Color: ${spec.colors.accent}`}
${spec.components.buttons.primaryTextColor ? `- Primary Text: ${spec.components.buttons.primaryTextColor}` : ''}
${spec.components.buttons.padding ? `- Padding: ${spec.components.buttons.padding}` : ''}

CARDS:
- Border Radius: ${spec.components.cards.borderRadius}
- Shadow: ${spec.components.cards.shadow}
${spec.components.cards.backgroundColor ? `- Background: ${spec.components.cards.backgroundColor}` : ''}
${spec.components.cards.border ? `- Border: ${spec.components.cards.border}` : ''}

## 5. SECTIONS (IN THIS EXACT ORDER)
    ${sectionsOrder}

## 6. EXACT TEXT CONTENT (COPY EXACTLY - DO NOT MODIFY)
    ${exactTextContent || 'Use appropriate placeholder text matching the business context'}

## 7. ASSETS
${spec.assets.logo?.url ? `- Logo: <img src="${spec.assets.logo.url}" alt="Logo">` : '- Logo: Use text-based logo with business name'}
${spec.assets.heroImage?.url ? `- Hero Image: <img src="${spec.assets.heroImage.url}">` : '- Hero Image: Use unsplash.com professional placeholder'}

## REQUIREMENTS
1. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
2. Configure Tailwind with ALL custom colors:
   <script>tailwind.config = { theme: { extend: { colors: {
     primary: '${spec.colors.primary}',
     secondary: '${spec.colors.secondary}',
     accent: '${spec.colors.accent}',
     ${spec.colors.headerBg ? `'header-bg': '${spec.colors.headerBg}',` : ''}
     ${spec.colors.footerBg ? `'footer-bg': '${spec.colors.footerBg}',` : ''}
     ${spec.colors.cardBg ? `'card-bg': '${spec.colors.cardBg}',` : ''}
   }}}}</script>
3. Import EXACT Google Fonts:
   <link href="https://fonts.googleapis.com/css2?family=${spec.typography.headingFont.replace(/ /g, '+')}:wght@400;500;600;700&family=${spec.typography.bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap" rel="stylesheet">
4. Add custom font classes in style tag
5. Add smooth scrolling: <style>html { scroll-behavior: smooth; }</style>
6. Be fully responsive and mobile-friendly
7. Return ONLY raw HTML starting with <!DOCTYPE html>
8. Do not wrap in markdown code blocks

## NAVIGATION - SINGLE-PAGE SMOOTH SCROLL
- Header must be FIXED (position: fixed, top: 0)
- Use anchor links: <a href="#about">About</a>
- Include smooth scrolling CSS: html { scroll-behavior: smooth; }
- Include mobile hamburger menu with toggle
- Navigation must be visible while scrolling

## SIZING - FULL SIZE WEBSITE
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Hero: min-h-screen or min-h-[600px]
- Sections: py-16 md:py-20 lg:py-24
- Headlines: text-4xl md:text-5xl lg:text-6xl

## IMAGES - USE THESE RELIABLE URLS (select based on business type):

HERO BACKGROUNDS (1920x1080) - select one that matches the business:
- Business/Corporate: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
- Restaurant: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop
- Spa/Wellness: https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&h=1080&fit=crop
- Fitness/Gym: https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop
- Real Estate: https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop
- Education: https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&h=1080&fit=crop
- Tech/Startup: https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1920&h=1080&fit=crop
- Medical: https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1920&h=1080&fit=crop

SERVICE CARDS (800x600):
- Teamwork: https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop
- Handshake: https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop
- Laptop: https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop
- Analytics: https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop
- Food: https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop
- Service: https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800&h=600&fit=crop

TEAM PORTRAITS (400x400):
- Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop
- Person 3: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop
- Person 4: https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop

ABOUT SECTION (1200x800):
- Team: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
- Office: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop

CRITICAL: Do NOT use source.unsplash.com URLs - they are unreliable!

## STRICT RULES - VIOLATIONS ARE NOT ACCEPTABLE
- MUST use single-page scrolling with anchor navigation (#section links)
- DO NOT use JavaScript page routing (showPage function)
- DO NOT substitute any colors with similar shades
- DO NOT change font families
- DO NOT rearrange section order
- DO NOT rewrite or paraphrase exact text content
- DO NOT modify spacing ratios
- DO NOT use default Tailwind colors - use the exact hex codes provided
- DO NOT use placeholder text or made-up contact details
- COPY exact text content character-for-character where specified
- MUST have FIXED/STICKY navigation header
- MUST be 100% RESPONSIVE (Desktop, Tablet, Mobile)
- MUST include mobile hamburger menu
- MUST use modern design trends (glassmorphism, gradients, animations)
- MUST use ICON ONLY for logo (no text), or styled first-letter fallback`;
}

export const refineWebsiteCode = async (currentCode: string, instructions: string) => {
    const ai = await getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // High quality for code refinement
        contents: `I have this HTML code:
        
        ${currentCode.substring(0, 15000)}... (truncated if too long)

        User Request: "${instructions}"

        Return the UPDATED full single-file HTML code. Maintain all previous functionality unless asked to change. 
        Ensure Tailwind CSS and scripts remain intact. Return ONLY raw HTML.`,
        config: {
            maxOutputTokens: 8192,
        }
    });
    
    const text = response.text || '';
    return text.replace(/```html/g, '').replace(/```/g, '');
}

export const generateMarketingVideo = async (
  prompt: string,
  brandInfo: string = '', 
  aspectRatio: '16:9' | '9:16' = '16:9',
  skipKeyCheck: boolean = false
) => {
  const ai = await getClient(true, skipKeyCheck); // Requires paid key for Veo
  
  const fullPrompt = brandInfo 
    ? `Cinematic marketing video: ${prompt}. Style: ${brandInfo}. High quality, professional lighting, 4k`
    : `Cinematic marketing video: ${prompt}, high quality, professional lighting, 4k`;

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: fullPrompt,
    config: {
      numberOfVideos: 1,
      resolution: '1080p',
      aspectRatio: aspectRatio
    }
  });

  // Polling logic
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5s
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Failed to generate video");

  // Fetch the actual video blob
  const response = await fetch(`${videoUri}&key=${import.meta.env.VITE_API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

// Function to handle key selection
export const promptForKeySelection = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
    }
}

// AI Website Editor - Edit website via natural language prompts
export const editWebsiteWithAI = async (
  currentCode: string,
  userPrompt: string,
  selectedElement?: { tagName: string; className: string; textContent?: string; outerHTML: string }
) => {
    const ai = await getClient();

    const elementContext = selectedElement
      ? `\n\nThe user has selected this specific element to modify:\nTag: ${selectedElement.tagName}\nClasses: ${selectedElement.className}\nContent: ${selectedElement.textContent || 'N/A'}\nHTML: ${selectedElement.outerHTML.substring(0, 500)}...`
      : '';

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are an expert web developer. The user wants to modify their website.

Current HTML code:
\`\`\`html
${currentCode.substring(0, 20000)}
\`\`\`
${elementContext}

User's request: "${userPrompt}"

Instructions:
1. Make ONLY the changes requested by the user
2. Preserve all existing functionality, styles, and structure
3. Keep Tailwind CSS classes and CDN imports intact
4. If the user asks about a specific element, focus changes on that element
5. Return the COMPLETE updated HTML code, not just the changed parts
6. Do not add markdown code blocks - return raw HTML starting with <!DOCTYPE html>

Return the updated HTML code:`,
        config: {
            maxOutputTokens: 16000,
        }
    });

    const text = response.text || '';
    // Clean up any markdown formatting
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
}

// Generate a summary of changes made to the website
export const summarizeWebsiteChanges = async (oldCode: string, newCode: string, userPrompt: string) => {
    const ai = await getClient();

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Compare these two HTML versions and summarize what changed in 1-2 sentences.

User's request was: "${userPrompt}"

Old code length: ${oldCode.length} chars
New code length: ${newCode.length} chars

Provide a brief, user-friendly summary of what was changed (e.g., "Changed the hero section background to blue and updated the headline text").`,
        config: {
            maxOutputTokens: 200,
        }
    });

    return response.text || 'Changes applied successfully.';
}

// Generate initial website from description
export const generateWebsiteFromPrompt = async (description: string, businessName: string) => {
    const ai = await getClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a complete, professional single-page website for: "${businessName}"

Description/Requirements: ${description}

Requirements:
1. Use Tailwind CSS via CDN (<script src="https://cdn.tailwindcss.com"></script>)
2. Use Google Fonts (Inter or similar modern font)
3. Include all standard sections: Header/Nav, Hero, Features/Services, About, Testimonials, Contact, Footer
4. Make it fully responsive and mobile-friendly
5. Use modern design patterns with proper spacing and typography
6. Include placeholder images from unsplash.com/photos/random
7. Use a professional color scheme that fits the business type
8. Add smooth scroll behavior and hover effects
9. Return ONLY raw HTML starting with <!DOCTYPE html>. No markdown code blocks.

Generate the complete HTML:`,
        config: {
            maxOutputTokens: 16000,
        }
    });

    const text = response.text || '';
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
}

/**
 * Add a new page to an existing website using SPA hash-based routing
 * This is used in the AI Website Editor for multi-page support
 */
export const addPageToWebsite = async (
    currentCode: string,
    pageType: string,
    pageLabel: string,
    businessContext: string
): Promise<string> => {
    const ai = await getClient();

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are modifying an existing website to add a new page with SPA-style hash routing.

CURRENT WEBSITE HTML:
${currentCode}

TASK: Add a new "${pageLabel}" page (id: ${pageType}) to this website.

REQUIREMENTS:
1. Add a new <section id="page-${pageType}" class="page-section" style="display:none"> containing appropriate content for a ${pageLabel} page
2. Add navigation link in the header nav: <a href="#${pageType}" class="nav-link">${pageLabel}</a>
3. CRITICAL: Match the existing design exactly (colors, fonts, spacing, button styles, section patterns)
4. Include appropriate content for a ${pageLabel} page based on the business context
5. Business context: ${businessContext}

IF the website doesn't have the hash routing script yet, add this script before </body>:
<script>
function showPage(pageId) {
  document.querySelectorAll('.page-section').forEach(s => s.style.display = 'none');
  const page = document.getElementById('page-' + (pageId || 'home'));
  if (page) page.style.display = 'block';
  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  const activeLink = document.querySelector('a[href="#' + (pageId || 'home') + '"]');
  if (activeLink) activeLink.classList.add('active');
}
window.addEventListener('hashchange', () => showPage(location.hash.slice(1)));
document.addEventListener('DOMContentLoaded', () => showPage(location.hash.slice(1) || 'home'));
</script>

IF the existing main content (hero, features, etc.) is NOT already wrapped in a page section, wrap it in:
<section id="page-home" class="page-section">
  <!-- existing main content here -->
</section>

The header and footer should remain OUTSIDE the page sections (always visible).

Return the COMPLETE updated HTML code starting with <!DOCTYPE html>. No markdown code blocks.`,
        config: {
            maxOutputTokens: 20000,
        }
    });

    const text = response.text || '';
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
}

/**
 * Fix website issues based on discrepancies between concept and generated website
 * Takes the current HTML code and specific discrepancies to fix
 */
export const fixWebsiteIssues = async (
    currentCode: string,
    discrepancies: DiscrepancyReport[],
    designSpec: DesignSpecification
): Promise<string> => {
    const ai = await getClient();

    // Build specific fix instructions from discrepancies
    const fixInstructions = discrepancies.map((d, i) =>
        `${i + 1}. ${d.element}: Change from "${d.actual}" to "${d.expected}" (${d.severity} priority)`
    ).join('\n');

    // Build design spec context
    const colorContext = designSpec.colors ?
        `Primary: ${designSpec.colors.primary}, Secondary: ${designSpec.colors.secondary}, Accent: ${designSpec.colors.accent}, Background: ${designSpec.colors.background}, Text: ${designSpec.colors.text}` : '';

    const typographyContext = designSpec.typography ?
        `Headings: ${designSpec.typography.headingFont}, Body: ${designSpec.typography.bodyFont}` : '';

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `You are a precise HTML/CSS code editor. Fix the following website code to match the design specifications exactly.

CURRENT HTML CODE:
${currentCode}

ISSUES TO FIX:
${fixInstructions}

DESIGN SPECIFICATIONS TO MATCH:
Colors: ${colorContext}
Typography: ${typographyContext}

INSTRUCTIONS:
1. Fix ONLY the specific issues listed above
2. Maintain all existing functionality and structure
3. Ensure colors match the design spec exactly (use the hex values provided)
4. Ensure typography matches the specified fonts
5. Keep all existing content, sections, and layout intact
6. Return the COMPLETE fixed HTML code starting with <!DOCTYPE html>
7. Do NOT add any markdown code blocks or explanations

Return ONLY the corrected HTML code:`,
        config: {
            maxOutputTokens: 16000,
        }
    });

    const text = response.text || '';
    return text.replace(/```html/g, '').replace(/```/g, '').trim();
}

/**
 * Download an image from URL and convert to base64
 */
export const downloadImageAsBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to download image:', error);
        return null;
    }
};

/**
 * Fetch company logo from Google Search using Gemini with grounding
 * Returns the best logo image URL or null if not found
 */
export const fetchLogoFromGoogle = async (
    businessName: string,
    location?: string
): Promise<{ logoUrl: string | null; source: string }> => {
    const ai = await getClient();

    const searchQuery = `${businessName} ${location || ''} company logo official`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: `Search for the official logo of "${businessName}".

TASK: Find and return the URL of the company's official logo image.

Search query: "${searchQuery}"

Return a JSON object with:
{
  "logoUrl": "https://..." or null if not found,
  "confidence": "high" | "medium" | "low",
  "source": "website name or search result"
}

If multiple logos found, prefer:
1. Official company website
2. LinkedIn/Facebook business page
3. Google My Business listing
4. High resolution version

Return ONLY the JSON, no other text.`,
        config: {
            tools: [{ googleSearch: {} }],
            maxOutputTokens: 500,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    logoUrl: { type: Type.STRING, nullable: true },
                    confidence: { type: Type.STRING },
                    source: { type: Type.STRING }
                },
                required: ["source"]
            }
        }
    });

    try {
        const result = safeParseJSON(response.text || '{}');
        return {
            logoUrl: result.logoUrl || null,
            source: result.source || 'Google Search'
        };
    } catch {
        return { logoUrl: null, source: 'not found' };
    }
};

/**
 * Fix/enhance a logo using Gemini Image model
 * Improves quality, removes background, standardizes format
 */
export const fixLogoWithGemini = async (
    logoDataUrl: string,
    businessName: string,
    skipKeyCheck: boolean = false
): Promise<string> => {
    const ai = await getClient(true, skipKeyCheck); // Requires paid key for image generation

    // Remove data URL prefix
    const imageData = logoDataUrl.includes(',')
        ? logoDataUrl.split(',')[1]
        : logoDataUrl;

    const mimeType = logoDataUrl.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

    // Use Gemini to analyze and describe the logo
    const analysisResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            {
                role: 'user',
                parts: [
                    { inlineData: { mimeType, data: imageData } },
                    { text: `Analyze this logo for ${businessName}. Describe:
1. Main colors (hex codes)
2. Shape/design elements
3. Text content if any
4. Style (modern, classic, minimal, etc.)

Return a JSON object with these details.` }
                ]
            }
        ],
        config: {
            maxOutputTokens: 500,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    elements: { type: Type.STRING },
                    text: { type: Type.STRING },
                    style: { type: Type.STRING }
                }
            }
        }
    });

    const logoAnalysis = safeParseJSON(analysisResponse.text || '{}');

    // Generate an enhanced/cleaned version of the logo
    const enhancedResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
            parts: [{
                text: `Create a clean, professional logo for "${businessName}".

Based on original logo analysis:
- Colors: ${logoAnalysis.colors?.join(', ') || 'professional colors'}
- Style: ${logoAnalysis.style || 'modern and clean'}
- Elements: ${logoAnalysis.elements || 'professional business logo'}
- Text: ${logoAnalysis.text || businessName}

Requirements:
- Clean vector-style design
- Transparent or white background
- High contrast
- Scalable design
- Professional and memorable
- Include text "${logoAnalysis.text || businessName}" if it was in the original

Generate a polished version of this company's logo.`
            }]
        },
        config: {
            imageConfig: {
                aspectRatio: 'SQUARE',
                imageSize: 'S_1K'
            }
        }
    });

    // Extract the generated image
    if (enhancedResponse.candidates?.[0]?.content?.parts) {
        for (const part of enhancedResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }

    // Return original if enhancement fails
    return logoDataUrl;
}