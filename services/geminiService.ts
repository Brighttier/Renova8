import { GoogleGenAI, Type } from "@google/genai";
import { ImageSize, AspectRatio, DesignSpecification, DiscrepancyReport } from "../types";

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

/**
 * Injects the approved concept image into the hero section of generated HTML.
 * Replaces placeholder Unsplash URLs with the actual base64 concept image.
 */
const injectConceptImageIntoHero = (html: string, conceptImage: string): string => {
    if (!conceptImage) return html;

    // Ensure concept image has proper data URL format
    const imageDataUrl = conceptImage.startsWith('data:')
        ? conceptImage
        : `data:image/png;base64,${conceptImage}`;

    let modifiedHtml = html;

    // Pattern 1: Replace background-image in hero section (inline styles)
    // Matches: style="background-image: url('...')" or style="background-image: url(...)"
    const heroSectionRegex = /(id=["'](?:home|hero)["'][^>]*>[\s\S]*?)(background-image:\s*url\(['"]?)([^'")\s]+)(['"]?\))/gi;
    modifiedHtml = modifiedHtml.replace(heroSectionRegex, (match, before, urlStart, oldUrl, urlEnd) => {
        // Only replace Unsplash or placeholder URLs
        if (oldUrl.includes('unsplash.com') || oldUrl.includes('placeholder') || oldUrl.includes('via.placeholder')) {
            return `${before}${urlStart}${imageDataUrl}${urlEnd}`;
        }
        return match;
    });

    // Pattern 2: Replace first hero background-image URL after id="home" or id="hero"
    // This catches cases where the regex above might miss
    const heroBackgroundRegex = /((?:id=["'](?:home|hero)["']|class=["'][^"']*hero[^"']*["'])[^>]*(?:>|style=["'][^"']*))background-image:\s*url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/gi;
    modifiedHtml = modifiedHtml.replace(heroBackgroundRegex, (match, prefix, oldUrl) => {
        if (oldUrl.includes('unsplash.com') || oldUrl.includes('placeholder')) {
            return `${prefix}background-image: url('${imageDataUrl}')`;
        }
        return match;
    });

    // Pattern 3: Replace img src in hero section
    // Look for img tags within the first major section (hero)
    const heroImgRegex = /(<section[^>]*(?:id=["'](?:home|hero)["']|class=["'][^"']*hero[^"']*["'])[^>]*>[\s\S]*?<img[^>]*src=["'])([^"']+)(["'][^>]*>)/gi;
    modifiedHtml = modifiedHtml.replace(heroImgRegex, (match, before, src, after) => {
        if (src.includes('unsplash.com') || src.includes('placeholder')) {
            return `${before}${imageDataUrl}${after}`;
        }
        return match;
    });

    // Pattern 4: Replace the very first large background image URL in the document
    // (in case hero section isn't clearly marked)
    let firstImageReplaced = false;
    modifiedHtml = modifiedHtml.replace(
        /background-image:\s*url\(['"]?(https:\/\/images\.unsplash\.com\/[^'")\s]+)['"]?\)/i,
        (match, oldUrl) => {
            if (!firstImageReplaced) {
                firstImageReplaced = true;
                return `background-image: url('${imageDataUrl}')`;
            }
            return match;
        }
    );

    console.log('Concept image injected into hero section');
    return modifiedHtml;
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

export const findLeadsWithMaps = async (query: string, location: string) => {
  const ai = await getClient();
  const prompt = `Find 5 real local businesses for "${query}" near "${location}".
  For each business, provide their actual name, address, a short description of what they do, and why they might need a new website or marketing.

  Please also extract their Phone Number and Email address if available in the listing or context.

  You MUST return a strictly valid JSON array with objects containing:
  - businessName (string - the actual business name)
  - location (string - their address or area)
  - details (string - brief description)
  - phone (string or null)
  - email (string or null)

  IMPORTANT: Ensure all strings are properly escaped. Do not use unescaped newlines or control characters inside string values.
  Do not include markdown formatting. Just the raw JSON array.`;

  // Using gemini-2.0-flash with Google Search grounding for discovery
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

  return {
    leads: Array.isArray(parsedLeads) ? parsedLeads : [],
    grounding: response.candidates?.[0]?.groundingMetadata?.groundingChunks
  };
};

export const generateBrandAnalysis = async (businessName: string, details: string) => {
  const ai = await getClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze this business: "${businessName}" (${details}).
    Generate branding guidelines for them.
    
    Requirements:
    - colors: array of 3 hex codes
    - tone: string (e.g. Friendly, Corporate, Luxury)
    - suggestions: string (Short paragraph on how to improve their brand, under 50 words)
    `,
    config: {
        maxOutputTokens: 1000,
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
  return safeParseJSON(response.text || "{}");
}

export const generatePitchEmail = async (businessName: string, websiteUrl: string | undefined, brandTone: string, hasConceptImage: boolean = false) => {
  const ai = await getClient();
  
  const prompt = `Write a cold email to "${businessName}" to sell website design and social media marketing services.
  
  Context:
  - Potential Client: ${businessName}
  - My Services: Website Design & Social Media Growth
  - Tone: ${brandTone || 'Professional and Friendly'}
  
  Asset Status:
  ${websiteUrl ? `- I have a live website demo link: ${websiteUrl}` : '- I do not have a live link yet.'}
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
        parts: [{ text: `A professional, modern website design mockup for: ${prompt}. High quality, UI/UX design, photorealistic laptop screen mockup.` }]
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

export const generateWebsiteStructure = async (prompt: string, designSpec?: DesignSpecification, conceptImage?: string) => {
    const ai = await getClient();

    // If concept image is provided, use TWO-STEP process for better replication
    if (conceptImage) {
        // Remove data URL prefix if present
        const imageData = conceptImage.includes(',')
            ? conceptImage.split(',')[1]
            : conceptImage;

        // Determine image mime type
        const mimeType = conceptImage.includes('image/jpeg') ? 'image/jpeg' : 'image/png';

        try {
            // STEP 1: Analyze the image in extreme detail
            console.log('Step 1: Analyzing concept image...');
            const analysisPrompt = `Analyze this website mockup image in EXTREME detail. I need to recreate it exactly in HTML/CSS.

Describe EVERY visual element you see:

1. HEADER:
   - Background color (exact shade)
   - Logo text/image and position
   - Navigation menu items (list each one)
   - Any buttons and their colors
   - Is it sticky/fixed?

2. HERO SECTION:
   - Background (color, gradient, or image description)
   - Main headline text (exact words if visible)
   - Subheadline/description text
   - CTA buttons (text, colors, shape)
   - Any images and their position (left/right/background)
   - Layout (text left with image right? centered? etc.)

3. OTHER SECTIONS (describe each one you see):
   - Section type (features, services, testimonials, about, gallery, etc.)
   - Layout (grid columns, cards, etc.)
   - Content in each card/item
   - Colors and styling

4. FOOTER:
   - Background color
   - Content layout
   - Links and text

5. OVERALL STYLE:
   - Primary color (hex estimate)
   - Secondary color (hex estimate)
   - Accent/button color (hex estimate)
   - Background colors
   - Font style (serif, sans-serif, modern, elegant, etc.)
   - Overall mood (professional, playful, luxury, minimal, etc.)

Be extremely specific about colors, layout positions, and visual hierarchy.`;

            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { inlineData: { mimeType: mimeType, data: imageData } },
                            { text: analysisPrompt }
                        ]
                    }
                ],
                config: { maxOutputTokens: 4000 }
            });

            const imageAnalysis = analysisResponse.text || '';
            console.log('Image analysis complete, length:', imageAnalysis.length);

            // STEP 2: Generate HTML based on the detailed analysis
            console.log('Step 2: Generating HTML from analysis...');
            const htmlPrompt = `You are an expert frontend developer. Create a pixel-perfect HTML website based on this detailed design analysis:

=== DESIGN ANALYSIS ===
${imageAnalysis}

=== BUSINESS CONTEXT ===
${prompt}

${designSpec ? `
=== EXTRACTED COLORS ===
Primary: ${designSpec.colors.primary}
Secondary: ${designSpec.colors.secondary}
Accent: ${designSpec.colors.accent}
Background: ${designSpec.colors.background}
Text: ${designSpec.colors.text}
Fonts: ${designSpec.typography.headingFont} (headings), ${designSpec.typography.bodyFont} (body)
` : ''}

=== REQUIREMENTS ===
Create a COMPLETE single-file HTML website that matches the description above EXACTLY.

1. Start with <!DOCTYPE html>
2. Include Tailwind CSS:
   <script src="https://cdn.tailwindcss.com"></script>
   <script>
   tailwind.config = {
     theme: {
       extend: {
         colors: {
           primary: '${designSpec?.colors.primary || '#D4AF37'}',
           secondary: '${designSpec?.colors.secondary || '#4A4A4A'}',
           accent: '${designSpec?.colors.accent || '#2E7D32'}',
         }
       }
     }
   }
   </script>

3. Import Google Fonts that match the style described

4. Add smooth scrolling:
   <style>html { scroll-behavior: smooth; }</style>

5. NAVIGATION: Add id to each section, use anchor links (href="#services")

6. SIZING:
   - Hero: min-h-[600px] or min-h-screen
   - Sections: py-16 md:py-20 lg:py-24
   - Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

7. IMAGES - USE THESE EXACT WORKING URLs (choose appropriate ones):
   Hero backgrounds:
   - https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop (modern office)
   - https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=1920&h=1080&fit=crop (workspace)
   - https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&h=1080&fit=crop (business meeting)

   Restaurant/Food:
   - https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop (restaurant interior)
   - https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop (food platter)
   - https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop (pizza)

   Services/Business:
   - https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop (team working)
   - https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop (collaboration)
   - https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop (professional)

   People/Testimonials:
   - https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop (man portrait)
   - https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop (woman portrait)
   - https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop (professional man)

   Icons/Features - use emoji or SVG icons instead of images

8. Match the EXACT layout, colors, and structure from the analysis

Return ONLY the complete HTML code starting with <!DOCTYPE html>. No markdown.`;

            const htmlResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: htmlPrompt,
                config: { maxOutputTokens: 32000 }
            });

            let text = htmlResponse.text || '';

            // Clean up the response
            text = text.replace(/```html\s*/gi, '').replace(/```\s*/g, '').trim();

            // Ensure it starts with DOCTYPE
            if (!text.toLowerCase().startsWith('<!doctype')) {
                const doctypeIndex = text.toLowerCase().indexOf('<!doctype');
                if (doctypeIndex > -1) {
                    text = text.substring(doctypeIndex);
                }
            }

            console.log('HTML generated successfully, length:', text.length);

            // Inject the approved concept image into the hero section
            text = injectConceptImageIntoHero(text, conceptImage);

            return text;

        } catch (error) {
            console.error('Two-step generation failed, falling back to text-based:', error);
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
        return text;
    }

    // Fallback to basic generation without strict specs
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a complete, professional single-page HTML website for: ${prompt}

STRUCTURE REQUIREMENTS:
1. Start with <!DOCTYPE html> - NO markdown code blocks
2. Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
3. Configure custom colors: <script>tailwind.config = { theme: { extend: { colors: { primary: '#D4AF37', secondary: '#4A4A4A', accent: '#2E7D32' }}}}</script>
4. Import Google Fonts: Playfair Display for headings, Inter for body
5. Add smooth scrolling: <style>html { scroll-behavior: smooth; }</style>

NAVIGATION - CRITICAL:
- Fixed header with navigation links
- Each section needs an id: id="home", id="services", id="about", id="contact"
- Nav links use anchors: <a href="#services">Services</a>
- Include mobile menu toggle with JavaScript

SECTIONS (FULL SIZE):
1. HEADER: Fixed nav, logo left, menu center/right, CTA button
2. HERO (id="home"): min-h-screen, large headline (text-5xl), subtext, 2 CTA buttons, background image
3. SERVICES (id="services"): py-20, 3-4 column grid of service cards
4. ABOUT/TESTIMONIALS (id="about"): py-20, customer reviews or about content
5. CONTACT (id="contact"): py-20, contact form with name, email, message fields
6. FOOTER: Dark background, links, social icons, copyright

SIZING:
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Hero: min-h-screen with centered content
- Sections: py-16 md:py-20 lg:py-24
- Headlines: text-4xl md:text-5xl lg:text-6xl
- Buttons: px-6 py-3 rounded-lg with hover effects

IMAGES - USE THESE EXACT WORKING URLS:
- Hero: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
- Business: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
- Team: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
- Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop
- Person 3: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop

Return ONLY complete HTML starting with <!DOCTYPE html>`,
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
    return text;
}

/**
 * Build a strict website generation prompt from design specifications
 * This ensures pixel-perfect consistency with the concept design
 */
const buildStrictWebsitePrompt = (businessPrompt: string, spec: DesignSpecification): string => {
    const sectionsOrder = spec.content.sections
        .sort((a, b) => a.order - b.order)
        .map((s, i) => `${i + 1}. ${s.type.toUpperCase()}`)
        .join('\n    ');

    const exactTextEntries = Object.entries(spec.content.exactText || {})
        .map(([key, value]) => `- ${key}: "${value}"`)
        .join('\n    ');

    return `Create a complete, single-file HTML website for: ${businessPrompt}

=== CRITICAL: STRICT DESIGN SPECIFICATIONS - DO NOT DEVIATE ===

## 1. COLORS (USE EXACT HEX CODES - NO SUBSTITUTIONS)
- Primary Color: ${spec.colors.primary}
- Secondary Color: ${spec.colors.secondary}
- Accent/CTA Color: ${spec.colors.accent}
- Background Color: ${spec.colors.background}
- Text Color: ${spec.colors.text}
${spec.colors.exactHexCodes.length > 0 ? `- Additional colors found in design: ${spec.colors.exactHexCodes.join(', ')}` : ''}

IMPORTANT: Use these EXACT hex values. Do not use Tailwind color classes like "blue-500" - use custom colors with these exact hex codes.

## 2. TYPOGRAPHY (USE EXACT FONTS)
- Heading Font: "${spec.typography.headingFont}" (import from Google Fonts)
- Body Font: "${spec.typography.bodyFont}" (import from Google Fonts)
- Base Font Size: ${spec.typography.baseFontSize}
- H1 Size: ${spec.typography.headingSizes.h1}
- H2 Size: ${spec.typography.headingSizes.h2}
- H3 Size: ${spec.typography.headingSizes.h3}

## 3. LAYOUT (MATCH EXACTLY)
- Container Max Width: ${spec.layout.maxWidth}
- Section Vertical Padding: ${spec.layout.sectionPadding}
- Grid Columns: ${spec.layout.gridColumns}
- Grid Gap/Gutter: ${spec.layout.gutterWidth}

## 4. COMPONENT STYLES
Header:
- Position: ${spec.components.header.style}
- Logo Placement: ${spec.components.header.logoPlacement}

Hero Section:
- Height: ${spec.components.hero.height}
- Content Alignment: ${spec.components.hero.alignment}

Buttons:
- Border Radius: ${spec.components.buttons.borderRadius}
- Style: ${spec.components.buttons.style}
- Use accent color (${spec.colors.accent}) for primary buttons

Cards:
- Border Radius: ${spec.components.cards.borderRadius}
- Shadow: ${spec.components.cards.shadow}

## 5. SECTIONS (IN THIS EXACT ORDER)
    ${sectionsOrder}

## 6. EXACT CONTENT (DO NOT PARAPHRASE OR REWRITE)
${exactTextEntries || '    - Use appropriate placeholder text that matches the business context'}

## 7. ASSETS
${spec.assets.logo?.url ? `- Logo: <img src="${spec.assets.logo.url}" alt="Logo">` : '- Logo: Use text-based logo with business name'}
${spec.assets.heroImage?.url ? `- Hero Image: <img src="${spec.assets.heroImage.url}">` : '- Hero Image: Use a professional placeholder from unsplash.com matching the business type'}

## REQUIREMENTS
1. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
2. Configure Tailwind with custom colors:
   <script>tailwind.config = { theme: { extend: { colors: { primary: '${spec.colors.primary}', secondary: '${spec.colors.secondary}', accent: '${spec.colors.accent}' }}}}</script>
3. Import the exact Google Fonts specified above
4. Add smooth scrolling: <style>html { scroll-behavior: smooth; }</style>
5. Be fully responsive and mobile-friendly
6. Return ONLY the raw HTML string, starting with <!DOCTYPE html>
7. Do not wrap in markdown code blocks

## NAVIGATION - CRITICAL
- Add id attributes to sections: id="home", id="about", id="services", id="contact"
- Navigation links must use anchor hrefs: <a href="#services">Services</a>
- Include mobile menu toggle with JavaScript

## SIZING - FULL SIZE WEBSITE
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Hero: min-h-screen or min-h-[600px]
- Sections: py-16 md:py-20 lg:py-24 for proper spacing
- Headlines: text-4xl md:text-5xl lg:text-6xl

## IMAGES - USE THESE EXACT WORKING URLS:
- Hero: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
- Business: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
- Team: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
- Food: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop
- Restaurant: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop
- Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop
- Person 3: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop

## STRICT RULES - VIOLATIONS ARE NOT ACCEPTABLE
- DO NOT substitute any colors with similar shades
- DO NOT change font families
- DO NOT rearrange section order
- DO NOT rewrite or paraphrase exact text content
- DO NOT modify spacing ratios
- DO NOT use default Tailwind colors - use the exact hex codes provided`;
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