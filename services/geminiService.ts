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

            // Build comprehensive design requirements from extracted spec
            const buildDesignRequirements = () => {
                if (!designSpec) return '';

                const { colors, typography, layout, components, content } = designSpec;

                return `
=== MANDATORY DESIGN SPECIFICATIONS (MUST MATCH EXACTLY) ===

COLORS (use these EXACT hex codes):
- Primary: ${colors.primary}
- Secondary: ${colors.secondary}
- Accent: ${colors.accent}
- Background: ${colors.background}
- Text: ${colors.text}
${colors.headerBg ? `- Header Background: ${colors.headerBg}` : ''}
${colors.footerBg ? `- Footer Background: ${colors.footerBg}` : ''}
${colors.heroBg ? `- Hero Background: ${colors.heroBg}` : ''}
${colors.cardBg ? `- Card Background: ${colors.cardBg}` : ''}

TYPOGRAPHY:
- Heading Font: "${typography.headingFont}" (MUST use this exact Google Font)
- Body Font: "${typography.bodyFont}" (MUST use this exact Google Font)
- H1 Size: ${typography.headingSizes.h1}
- H2 Size: ${typography.headingSizes.h2}
- H3 Size: ${typography.headingSizes.h3}
${typography.fontWeight?.heading ? `- Heading Weight: ${typography.fontWeight.heading}` : ''}

LAYOUT:
- Max Width: ${layout.maxWidth}
- Section Padding: ${layout.sectionPadding}
- Grid Columns: ${layout.gridColumns}
- Gutter Width: ${layout.gutterWidth}

HEADER COMPONENT:
- Style: ${components.header.style}
- Logo Placement: ${components.header.logoPlacement}
${components.header.logoText ? `- Logo Text: "${components.header.logoText}" (USE THIS EXACT TEXT)` : ''}
${components.header.navItems?.length ? `- Navigation Items: ${components.header.navItems.map(item => `"${item}"`).join(', ')} (USE THESE EXACT ITEMS)` : ''}
${components.header.backgroundColor ? `- Background Color: ${components.header.backgroundColor}` : ''}
${components.header.textColor ? `- Text Color: ${components.header.textColor}` : ''}

HERO SECTION:
- Height: ${components.hero.height}
- Alignment: ${components.hero.alignment}
${components.hero.headline ? `- Headline: "${components.hero.headline}" (USE THIS EXACT TEXT)` : ''}
${components.hero.subheadline ? `- Subheadline: "${components.hero.subheadline}" (USE THIS EXACT TEXT)` : ''}
${components.hero.ctaButtons?.length ? `- CTA Buttons: ${components.hero.ctaButtons.map(btn => `"${btn}"`).join(', ')} (USE THESE EXACT TEXTS)` : ''}
${components.hero.backgroundType ? `- Background Type: ${components.hero.backgroundType}` : ''}
${components.hero.backgroundValue ? `- Background Value: ${components.hero.backgroundValue}` : ''}
${components.hero.imagePosition ? `- Image Position: ${components.hero.imagePosition}` : ''}
${components.hero.hasOverlay !== undefined ? `- Has Overlay: ${components.hero.hasOverlay}` : ''}

BUTTONS:
- Border Radius: ${components.buttons.borderRadius}
- Style: ${components.buttons.style}
${components.buttons.primaryColor ? `- Primary Button Color: ${components.buttons.primaryColor}` : ''}
${components.buttons.primaryTextColor ? `- Primary Button Text: ${components.buttons.primaryTextColor}` : ''}
${components.buttons.padding ? `- Padding: ${components.buttons.padding}` : ''}

CARDS:
- Border Radius: ${components.cards.borderRadius}
- Shadow: ${components.cards.shadow}
${components.cards.backgroundColor ? `- Background: ${components.cards.backgroundColor}` : ''}
${components.cards.border ? `- Border: ${components.cards.border}` : ''}

SECTIONS (in exact order):
${content.sections.map((s, i) => `${i + 1}. ${s.type.toUpperCase()}${s.title ? ` - Title: "${s.title}"` : ''}${s.subtitle ? ` - Subtitle: "${s.subtitle}"` : ''}${s.backgroundColor ? ` - BG: ${s.backgroundColor}` : ''}${s.itemCount ? ` - ${s.itemCount} items` : ''}${s.layout ? ` - Layout: ${s.layout}` : ''}`).join('\n')}

EXACT TEXT CONTENT TO USE:
${content.exactText.logoText ? `- Logo: "${content.exactText.logoText}"` : ''}
${content.exactText.heroHeadline ? `- Hero Headline: "${content.exactText.heroHeadline}"` : ''}
${content.exactText.heroSubheadline ? `- Hero Subheadline: "${content.exactText.heroSubheadline}"` : ''}
${content.exactText.ctaButtonTexts?.length ? `- CTA Buttons: ${content.exactText.ctaButtonTexts.map(t => `"${t}"`).join(', ')}` : ''}
${content.exactText.navMenuItems?.length ? `- Nav Items: ${content.exactText.navMenuItems.map(t => `"${t}"`).join(', ')}` : ''}
${content.exactText.sectionTitles?.length ? `- Section Titles: ${content.exactText.sectionTitles.map(t => `"${t}"`).join(', ')}` : ''}
${content.exactText.footerText ? `- Footer: "${content.exactText.footerText}"` : ''}
`;
            };

            const htmlPrompt = `You are an expert frontend developer. Your task is to create a PIXEL-PERFECT HTML website that is 100% IDENTICAL to the concept mockup.

=== VISUAL ANALYSIS OF MOCKUP ===
${imageAnalysis}

=== BUSINESS CONTEXT ===
${prompt}

${buildDesignRequirements()}

=== CRITICAL REQUIREMENTS ===

YOU MUST CREATE A WEBSITE THAT IS VISUALLY IDENTICAL TO THE MOCKUP. Every detail matters:
- Use the EXACT colors specified (copy hex codes exactly)
- Use the EXACT fonts specified
- Use the EXACT text content (headlines, buttons, nav items)
- Match the EXACT layout structure
- Match the EXACT number of sections and their order
- Match the EXACT spacing and sizing

=== HTML STRUCTURE ===

1. Start with <!DOCTYPE html>

2. Include Tailwind CSS with EXACT color configuration:
<script src="https://cdn.tailwindcss.com"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '${designSpec?.colors.primary || '#D4AF37'}',
        secondary: '${designSpec?.colors.secondary || '#4A4A4A'}',
        accent: '${designSpec?.colors.accent || '#2E7D32'}',
        ${designSpec?.colors.headerBg ? `'header-bg': '${designSpec.colors.headerBg}',` : ''}
        ${designSpec?.colors.footerBg ? `'footer-bg': '${designSpec.colors.footerBg}',` : ''}
        ${designSpec?.colors.heroBg ? `'hero-bg': '${designSpec.colors.heroBg}',` : ''}
        ${designSpec?.colors.cardBg ? `'card-bg': '${designSpec.colors.cardBg}',` : ''}
      }
    }
  }
}
</script>

3. Import the EXACT Google Fonts:
<link href="https://fonts.googleapis.com/css2?family=${designSpec?.typography.headingFont?.replace(/ /g, '+') || 'Playfair+Display'}:wght@400;500;600;700&family=${designSpec?.typography.bodyFont?.replace(/ /g, '+') || 'Inter'}:wght@300;400;500;600&display=swap" rel="stylesheet">

4. Add smooth scrolling and font styles:
<style>
  html { scroll-behavior: smooth; }
  .font-heading { font-family: '${designSpec?.typography.headingFont || 'Playfair Display'}', serif; }
  .font-body { font-family: '${designSpec?.typography.bodyFont || 'Inter'}', sans-serif; }
  body { font-family: '${designSpec?.typography.bodyFont || 'Inter'}', sans-serif; }
</style>

5. NAVIGATION: Add id to each section, use anchor links

6. IMAGES - USE THESE EXACT WORKING URLS:
   Hero: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
   Business: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
   Team: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
   Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
   Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop
   Restaurant: https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop
   Food: https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=800&fit=crop

=== OUTPUT ===
Return ONLY the complete HTML code starting with <!DOCTYPE html>. No markdown, no explanations.
The website MUST be visually identical to the mockup.`;

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

    return `Create a complete, single-file HTML website for: ${businessPrompt}

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

## NAVIGATION - CRITICAL
- Add id attributes to sections: id="home", id="about", id="services", id="contact"
- Navigation links must use anchor hrefs: <a href="#services">Services</a>
- Include mobile menu toggle with JavaScript

## SIZING - FULL SIZE WEBSITE
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Hero: min-h-screen or min-h-[600px]
- Sections: py-16 md:py-20 lg:py-24
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
- DO NOT use default Tailwind colors - use the exact hex codes provided
- COPY exact text content character-for-character where specified`;
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