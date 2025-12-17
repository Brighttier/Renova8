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
  // IMPORTANT: Generate a flat browser screenshot, NOT a laptop/device mockup
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
        parts: [{ text: `A professional, modern website design screenshot for: ${prompt}.

CRITICAL REQUIREMENTS:
- Generate a FLAT website screenshot showing ONLY the webpage content
- DO NOT include any laptop, computer, phone, tablet, or device frame around the website
- DO NOT show the website displayed on a screen or monitor
- Show the website as a direct browser viewport screenshot
- Full-page website view with header, hero section, and content sections visible
- Clean, high-quality UI/UX design
- Professional typography and spacing` }]
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
 * Inject the concept image as the hero background in the generated HTML
 * This ensures the generated website uses the EXACT same image as the concept
 */
const injectConceptImageAsHeroBackground = (html: string, conceptImage: string): string => {
    if (!conceptImage) return html;

    // Ensure the concept image has proper data URL format
    const imageDataUrl = conceptImage.startsWith('data:')
        ? conceptImage
        : `data:image/png;base64,${conceptImage}`;

    let modified = html;
    let replacementsMade = 0;

    // Strategy 1: Replace the specific placeholder URL we told the AI to use
    const placeholderPattern = /https:\/\/images\.unsplash\.com\/photo-hero-placeholder[^'")\s]*/gi;
    modified = modified.replace(placeholderPattern, () => {
        replacementsMade++;
        return imageDataUrl;
    });

    // Strategy 2: Replace background-image URLs in hero sections
    // Match patterns like: background-image: url('...') or background: url('...')
    const bgImagePattern = /(background(?:-image)?:\s*(?:linear-gradient\([^)]+\),\s*)?url\(['"]?)([^'")\s]+)(['"]?\))/gi;

    modified = modified.replace(bgImagePattern, (match, prefix, url, suffix) => {
        // Check if this is in a hero-related context
        const matchIndex = modified.indexOf(match);
        const contextBefore = modified.substring(Math.max(0, matchIndex - 500), matchIndex).toLowerCase();
        const contextAfter = modified.substring(matchIndex, Math.min(modified.length, matchIndex + 500)).toLowerCase();

        // Only replace if it's likely a hero background (and not already replaced)
        const isHeroContext = contextBefore.includes('hero') || contextAfter.includes('hero') ||
            contextBefore.includes('page-home') || contextAfter.includes('page-home');
        const isPlaceholder = url.includes('unsplash') || url.includes('1920') ||
            url.includes('hero') || url.includes('placeholder');

        if (isHeroContext && isPlaceholder && !url.startsWith('data:')) {
            replacementsMade++;
            return `${prefix}${imageDataUrl}${suffix}`;
        }
        return match;
    });

    // Strategy 3: If no replacements were made, inject CSS to force hero background
    if (replacementsMade === 0) {
        // Add a style block that sets the hero background using the concept image
        const heroBackgroundCSS = `
    <style>
      /* Concept Image as Hero Background - Injected */
      #page-home > section:first-child,
      .hero,
      [class*="hero"],
      main#page-home > div:first-child,
      #page-home > div:first-child,
      section:first-of-type {
        background-image: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('${imageDataUrl}') !important;
        background-size: cover !important;
        background-position: center !important;
        background-repeat: no-repeat !important;
      }
    </style>
  </head>`;

        modified = modified.replace('</head>', heroBackgroundCSS);
        replacementsMade++;
    }

    // Strategy 4: Also replace any img src in hero section that looks like a placeholder
    const heroImgPattern = /(<(?:section|div)[^>]*(?:hero|page-home)[^>]*>[\s\S]*?<img[^>]*src=["'])([^"']+)(["'][^>]*>)/gi;
    modified = modified.replace(heroImgPattern, (match, prefix, src, suffix) => {
        if ((src.includes('unsplash') || src.includes('placeholder') || src.includes('picsum')) && !src.startsWith('data:')) {
            replacementsMade++;
            return `${prefix}${imageDataUrl}${suffix}`;
        }
        return match;
    });

    console.log(`Concept image injected: ${replacementsMade} replacement(s) made`);
    return modified;
};

/**
 * Generate a multi-page website structure with strict accuracy requirements
 * Creates separate HTML files for each page with consistent header/footer
 */
export const generateWebsiteStructure = async (prompt: string, designSpec?: DesignSpecification, conceptImage?: string): Promise<string> => {
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
            // STEP 1: Analyze the image in extreme detail for multi-page website
            console.log('Step 1: Analyzing concept image for multi-page website...');
            const analysisPrompt = `Analyze this website mockup image in EXTREME detail. I need to recreate it as a MULTI-PAGE website with SEPARATE PAGES.

**** VERY IMPORTANT - IGNORE DEVICE FRAMES ****
If the image shows a website displayed on a laptop, computer monitor, phone, tablet, or any other device:
- COMPLETELY IGNORE the device frame/shell
- Focus ONLY on the actual WEBSITE CONTENT shown inside the screen
- Do NOT describe or reference the device itself
- Analyze ONLY what appears on the website, not the device displaying it
- The laptop/device is just a presentation mockup - we need the WEBSITE CONTENT ONLY

CRITICAL: This will be a multi-page website, NOT a single-page website. Each navigation item will be its own page.

VERY IMPORTANT - HERO BACKGROUND IMAGE:
Look at the hero section of the WEBSITE (not the device frame). Describe the hero background:
- What is the main subject of the hero background? (office, nature, people, abstract, food, etc.)
- What colors dominate the image?
- What is the composition/layout?
- Is there an overlay or tint?
- What mood does it convey?
- NOTE: The "background" is what's BEHIND the hero text/content, NOT the laptop/device showing the website

Describe EVERY visual element you see IN THE WEBSITE (ignore any device frame):

1. HEADER (will be shared across ALL pages):
   - Background color (exact shade/hex)
   - Logo text/image and position
   - Navigation menu items (list EACH one - these become separate pages)
   - Any buttons and their colors
   - Must be STICKY/FIXED navigation

2. HERO SECTION (for Home page):
   - BACKGROUND IMAGE: Describe in EXTREME detail what the background image shows
   - Background overlay color and opacity if any
   - Main headline text (EXACT words if visible)
   - Subheadline/description text (EXACT words)
   - CTA buttons (EXACT text, colors, shape)
   - Any images and their EXACT position
   - Layout details

3. ALL OTHER SECTIONS (describe EACH one - these may become separate pages):
   - Section type (features, services, testimonials, about, gallery, contact, etc.)
   - EXACT layout (grid columns, cards, etc.)
   - EXACT content in each card/item
   - EXACT colors and styling
   - Which page this section belongs to

4. FOOTER (will be shared across ALL pages):
   - Background color (exact hex)
   - Content layout
   - Links and text
   - Contact information if visible

5. OVERALL STYLE:
   - Primary color (exact hex)
   - Secondary color (exact hex)
   - Accent/button color (exact hex)
   - All background colors
   - Font style (identify exact Google Font if possible)
   - Overall mood

6. CONTACT INFORMATION (extract EXACTLY):
   - Phone number(s)
   - Email address(es)
   - Physical address
   - Social media links

7. HERO BACKGROUND SEARCH QUERY:
   Provide an Unsplash search query that would find a MATCHING background image.
   Format: "UNSPLASH_QUERY: [your search terms]"

Be EXTREMELY specific. Every color must be a hex code. Every text must be exact.`;

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

            const htmlPrompt = `You are an expert frontend developer. Create a MULTI-PAGE website that is PIXEL-PERFECT and 100% IDENTICAL to the concept mockup.

**** CRITICAL - IGNORE DEVICE FRAMES ****
If the mockup analysis mentions a laptop, computer, phone, tablet, or any device frame:
- DO NOT include the device frame in the website
- DO NOT use the device image as a background
- Build ONLY the website content that was shown INSIDE the device screen
- The website should be a standalone webpage, not displayed on a device

=== VISUAL ANALYSIS OF MOCKUP ===
${imageAnalysis}

=== BUSINESS CONTEXT ===
${prompt}

${buildDesignRequirements()}

=== CRITICAL REQUIREMENTS (MANDATORY - NO EXCEPTIONS) ===

1. MULTI-PAGE STRUCTURE (NOT SINGLE PAGE):
   - Create SEPARATE pages for: Home, About, Services, Contact (and any others visible)
   - Each navigation item MUST link to a SEPARATE PAGE with its own URL
   - DO NOT use anchor links (#section) - use page links (about.html, services.html)
   - Use JavaScript-based routing to simulate multi-page behavior in single HTML

2. STICKY/FIXED NAVIGATION:
   - Header must be FIXED at the top (position: fixed)
   - Navigation must be visible while scrolling
   - Must work on all screen sizes

3. 100% RESPONSIVE:
   - Must look perfect on Desktop, Tablet, and Mobile
   - Use Tailwind responsive classes (sm:, md:, lg:, xl:)
   - Mobile hamburger menu required

4. EXACT VISUAL MATCH:
   - Use EXACT colors (copy hex codes exactly)
   - Use EXACT fonts specified
   - Use EXACT text content (headlines, buttons, nav items) - NO placeholders
   - Match EXACT layout structure
   - Match EXACT spacing and sizing

5. REAL CONTENT ONLY:
   - Use ONLY real content from the mockup
   - NO placeholder text like "Lorem ipsum"
   - NO made-up contact details
   - Extract EXACT phone, email, address from mockup

=== MULTI-PAGE ROUTING IMPLEMENTATION ===

Implement client-side routing with this pattern:

<script>
// Multi-page routing system
const pages = {
  'home': document.getElementById('page-home'),
  'about': document.getElementById('page-about'),
  'services': document.getElementById('page-services'),
  'contact': document.getElementById('page-contact')
};

function showPage(pageName) {
  // Hide all pages
  Object.values(pages).forEach(page => {
    if (page) page.style.display = 'none';
  });
  // Show requested page
  if (pages[pageName]) {
    pages[pageName].style.display = 'block';
  }
  // Update URL
  history.pushState({page: pageName}, '', pageName === 'home' ? '/' : '/' + pageName);
  // Scroll to top
  window.scrollTo(0, 0);
}

// Handle browser back/forward
window.onpopstate = (e) => {
  if (e.state && e.state.page) showPage(e.state.page);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.replace('/', '') || 'home';
  showPage(path);
});
</script>

=== HTML STRUCTURE ===

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Name</title>
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
  <link href="https://fonts.googleapis.com/css2?family=${designSpec?.typography.headingFont?.replace(/ /g, '+') || 'Playfair+Display'}:wght@400;500;600;700&family=${designSpec?.typography.bodyFont?.replace(/ /g, '+') || 'Inter'}:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: '${designSpec?.typography.bodyFont || 'Inter'}', sans-serif; }
    .font-heading { font-family: '${designSpec?.typography.headingFont || 'Playfair Display'}', serif; }
  </style>
</head>
<body>
  <!-- FIXED HEADER (shared across all pages) -->
  <header class="fixed top-0 left-0 right-0 z-50 ...">
    <nav>
      <!-- Logo -->
      <!-- Navigation links with onclick="showPage('pagename')" -->
      <!-- Mobile menu button -->
    </nav>
  </header>

  <!-- PAGE: HOME -->
  <main id="page-home" class="pt-20">
    <!-- Hero section -->
    <!-- Other home content -->
  </main>

  <!-- PAGE: ABOUT -->
  <main id="page-about" class="pt-20" style="display:none;">
    <!-- About page content -->
  </main>

  <!-- PAGE: SERVICES -->
  <main id="page-services" class="pt-20" style="display:none;">
    <!-- Services page content -->
  </main>

  <!-- PAGE: CONTACT -->
  <main id="page-contact" class="pt-20" style="display:none;">
    <!-- Contact page content -->
  </main>

  <!-- FOOTER (shared across all pages) -->
  <footer>...</footer>

  <!-- Routing Script -->
  <script>/* routing code */</script>
</body>
</html>

=== NAVIGATION LINKS FORMAT ===
<a href="javascript:void(0)" onclick="showPage('home')" class="...">Home</a>
<a href="javascript:void(0)" onclick="showPage('about')" class="...">About</a>
<a href="javascript:void(0)" onclick="showPage('services')" class="...">Services</a>
<a href="javascript:void(0)" onclick="showPage('contact')" class="...">Contact</a>

=== HERO BACKGROUND IMAGE - CRITICAL ===

IMPORTANT: The concept image will be automatically injected as the hero background after generation.
For now, use this EXACT placeholder URL for the hero background:
- Hero Background: https://images.unsplash.com/photo-hero-placeholder?w=1920&h=1080&fit=crop

Apply dark overlay if the analysis indicates one:
- background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('https://images.unsplash.com/photo-hero-placeholder?w=1920&h=1080&fit=crop');

The hero section MUST have:
- class="hero" or similar identifiable class
- background-image CSS property (will be replaced with actual concept image)
- Full viewport height (min-h-screen or similar)

=== OTHER IMAGES ===
For other sections, use these Unsplash URLs:
- Team/People: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
- Business: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
- Team group: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop

=== OUTPUT ===
Return ONLY the complete HTML code starting with <!DOCTYPE html>. No markdown, no explanations.
The website MUST:
1. Have SEPARATE pages for each navigation item
2. Have FIXED/STICKY navigation
3. Be 100% RESPONSIVE
4. Match the mockup EXACTLY including the HERO BACKGROUND IMAGE
5. Use REAL content only (no placeholders)
6. Use hero image URL based on UNSPLASH_QUERY from the analysis`;

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

            // CRITICAL: Inject the actual concept image as the hero background
            text = injectConceptImageAsHeroBackground(text, conceptImage);

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

        // Inject concept image if available from designSpec
        if (designSpec.assets?.heroImage?.url) {
            text = injectConceptImageAsHeroBackground(text, designSpec.assets.heroImage.url);
        }

        return text;
    }

    // Fallback to basic multi-page generation without strict specs
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Create a complete, professional MULTI-PAGE HTML website for: ${prompt}

=== CRITICAL: MULTI-PAGE STRUCTURE (NOT SINGLE PAGE) ===

This MUST be a multi-page website with SEPARATE PAGES for each navigation item.
Use client-side JavaScript routing to simulate multi-page behavior.

STRUCTURE REQUIREMENTS:
1. Start with <!DOCTYPE html> - NO markdown code blocks
2. Include Tailwind CSS: <script src="https://cdn.tailwindcss.com"></script>
3. Configure custom colors: <script>tailwind.config = { theme: { extend: { colors: { primary: '#D4AF37', secondary: '#4A4A4A', accent: '#2E7D32' }}}}</script>
4. Import Google Fonts: Playfair Display for headings, Inter for body

NAVIGATION - CRITICAL:
- FIXED header (position: fixed) that stays visible while scrolling
- Each nav item links to a SEPARATE PAGE (NOT anchor links)
- Use onclick="showPage('pagename')" for navigation
- Include mobile hamburger menu with JavaScript toggle

MULTI-PAGE ROUTING:
Include this routing system:

<script>
const pages = {
  'home': document.getElementById('page-home'),
  'about': document.getElementById('page-about'),
  'services': document.getElementById('page-services'),
  'contact': document.getElementById('page-contact')
};

function showPage(pageName) {
  Object.values(pages).forEach(page => { if (page) page.style.display = 'none'; });
  if (pages[pageName]) pages[pageName].style.display = 'block';
  history.pushState({page: pageName}, '', pageName === 'home' ? '/' : '/' + pageName);
  window.scrollTo(0, 0);
  // Close mobile menu if open
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');
}

window.onpopstate = (e) => { if (e.state?.page) showPage(e.state.page); };
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.replace('/', '') || 'home';
  showPage(path);
});
</script>

PAGE STRUCTURE:
1. FIXED HEADER (shared across all pages):
   - Logo left, nav center/right
   - Nav links: <a href="javascript:void(0)" onclick="showPage('home')">Home</a>
   - Mobile menu toggle button

2. PAGE: HOME (id="page-home"):
   - Hero section: min-h-screen, large headline, 2 CTA buttons, background image
   - Features/highlights section

3. PAGE: ABOUT (id="page-about" style="display:none"):
   - About content, team section, testimonials

4. PAGE: SERVICES (id="page-services" style="display:none"):
   - Services grid with 3-4 columns of service cards

5. PAGE: CONTACT (id="page-contact" style="display:none"):
   - Contact form (name, email, phone, message)
   - Contact information (phone, email, address)
   - Map placeholder

6. FOOTER (shared across all pages):
   - Dark background, links, social icons, copyright

RESPONSIVE REQUIREMENTS:
- 100% responsive on Desktop, Tablet, Mobile
- Use Tailwind responsive classes (sm:, md:, lg:, xl:)
- Mobile hamburger menu that toggles visibility

SIZING:
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Hero: min-h-screen with centered content
- Sections: py-16 md:py-20 lg:py-24
- Headlines: text-4xl md:text-5xl lg:text-6xl
- Buttons: px-6 py-3 rounded-lg with hover effects

IMAGES - USE CONTEXT-APPROPRIATE URLS:

CRITICAL: Use images that MATCH the business type from the prompt.
Use Unsplash source API with relevant keywords based on the business:
- Hero: https://source.unsplash.com/1920x1080/?[business-type-keywords]
- Services: https://source.unsplash.com/800x600/?[service-keyword]
- Team: https://source.unsplash.com/400x400/?professional,portrait
- About: https://source.unsplash.com/1200x800/?[business-type],team

Example keyword substitutions:
- Restaurant → restaurant,dining,food,interior
- Spa → spa,wellness,relaxation,massage
- Law Firm → legal,office,professional,lawyer
- Gym → fitness,gym,workout,exercise
- Bakery → bakery,pastry,bread,cafe

Fallback URLs (only if source API fails):
- Hero: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
- Business: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
- Team: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
- Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop

Return ONLY complete HTML starting with <!DOCTYPE html>.
The website MUST have:
1. SEPARATE pages for Home, About, Services, Contact
2. FIXED/STICKY navigation header
3. 100% RESPONSIVE design
4. Mobile hamburger menu
5. Hero background image that MATCHES the business type`,
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

    return `Create a complete, MULTI-PAGE HTML website for: ${businessPrompt}

=== CRITICAL: MULTI-PAGE STRUCTURE REQUIRED ===

This MUST be a multi-page website with SEPARATE PAGES for each navigation item.
Use client-side JavaScript routing to simulate multi-page behavior in a single HTML file.

MULTI-PAGE ROUTING SYSTEM (MUST INCLUDE):
<script>
const pages = {
  'home': document.getElementById('page-home'),
  'about': document.getElementById('page-about'),
  'services': document.getElementById('page-services'),
  'contact': document.getElementById('page-contact')
};

function showPage(pageName) {
  Object.values(pages).forEach(page => { if (page) page.style.display = 'none'; });
  if (pages[pageName]) pages[pageName].style.display = 'block';
  history.pushState({page: pageName}, '', pageName === 'home' ? '/' : '/' + pageName);
  window.scrollTo(0, 0);
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');
}

window.onpopstate = (e) => { if (e.state?.page) showPage(e.state.page); };
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.replace('/', '') || 'home';
  showPage(path);
});
</script>

NAVIGATION FORMAT:
<a href="javascript:void(0)" onclick="showPage('home')">Home</a>
<a href="javascript:void(0)" onclick="showPage('about')">About</a>
<a href="javascript:void(0)" onclick="showPage('services')">Services</a>
<a href="javascript:void(0)" onclick="showPage('contact')">Contact</a>

PAGE STRUCTURE:
- <main id="page-home">...</main>
- <main id="page-about" style="display:none">...</main>
- <main id="page-services" style="display:none">...</main>
- <main id="page-contact" style="display:none">...</main>

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

## NAVIGATION - CRITICAL (MULTI-PAGE)
- Header must be FIXED (position: fixed, top: 0)
- Use page-based navigation with onclick="showPage('pagename')"
- DO NOT use anchor links (#section) - use separate pages
- Include mobile hamburger menu with toggle
- Navigation must be visible while scrolling on all pages

## SIZING - FULL SIZE WEBSITE
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Hero: min-h-screen or min-h-[600px]
- Sections: py-16 md:py-20 lg:py-24
- Headlines: text-4xl md:text-5xl lg:text-6xl

## IMAGES - USE CONTEXT-APPROPRIATE URLS:

IMPORTANT: Choose images that MATCH the business type described in the prompt.
Use the Unsplash source API with relevant keywords:
- Hero Background: https://source.unsplash.com/1920x1080/?[business-keywords]
  Example for restaurant: https://source.unsplash.com/1920x1080/?restaurant,dining,food
  Example for office: https://source.unsplash.com/1920x1080/?modern,office,business
  Example for spa: https://source.unsplash.com/1920x1080/?spa,wellness,relaxation

- Services/Features: https://source.unsplash.com/800x600/?[service-keyword]
- Team Members: https://source.unsplash.com/400x400/?professional,portrait
- About Section: https://source.unsplash.com/1200x800/?[business-type],team

Fallback URLs (only if source API doesn't work):
- Generic Hero: https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop
- Business: https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&h=800&fit=crop
- Team: https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=800&fit=crop
- Person 1: https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop
- Person 2: https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop
- Person 3: https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop

## STRICT RULES - VIOLATIONS ARE NOT ACCEPTABLE
- DO NOT use single-page scrolling - MUST be multi-page
- DO NOT use anchor links (#section) - use page navigation
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
- MUST include mobile hamburger menu`;
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