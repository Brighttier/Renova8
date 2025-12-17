import { GoogleGenAI, Type } from "@google/genai";
import { DesignSpecification } from "../types";

const getClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
};

// Enhanced schema for EXACT design specification extraction
const designSpecSchema = {
  type: Type.OBJECT,
  properties: {
    colors: {
      type: Type.OBJECT,
      properties: {
        primary: { type: Type.STRING, description: "Primary brand color hex code" },
        secondary: { type: Type.STRING, description: "Secondary color hex code" },
        accent: { type: Type.STRING, description: "Accent/CTA color hex code" },
        background: { type: Type.STRING, description: "Main background color hex code" },
        text: { type: Type.STRING, description: "Primary text color hex code" },
        headerBg: { type: Type.STRING, description: "Header background color" },
        footerBg: { type: Type.STRING, description: "Footer background color" },
        heroBg: { type: Type.STRING, description: "Hero section background color or gradient" },
        cardBg: { type: Type.STRING, description: "Card background color" },
        exactHexCodes: { type: Type.ARRAY, items: { type: Type.STRING }, description: "All hex codes found in design" }
      },
      required: ["primary", "secondary", "accent", "background", "text", "exactHexCodes"]
    },
    typography: {
      type: Type.OBJECT,
      properties: {
        headingFont: { type: Type.STRING, description: "Font family for headings" },
        bodyFont: { type: Type.STRING, description: "Font family for body text" },
        baseFontSize: { type: Type.STRING, description: "Base font size e.g. 16px" },
        headingSizes: {
          type: Type.OBJECT,
          properties: {
            h1: { type: Type.STRING },
            h2: { type: Type.STRING },
            h3: { type: Type.STRING }
          },
          required: ["h1", "h2", "h3"]
        },
        fontWeight: {
          type: Type.OBJECT,
          properties: {
            heading: { type: Type.STRING, description: "Heading font weight e.g. bold, 700" },
            body: { type: Type.STRING, description: "Body font weight e.g. normal, 400" }
          }
        }
      },
      required: ["headingFont", "bodyFont", "baseFontSize", "headingSizes"]
    },
    layout: {
      type: Type.OBJECT,
      properties: {
        maxWidth: { type: Type.STRING, description: "Container max width e.g. 1200px" },
        sectionPadding: { type: Type.STRING, description: "Vertical padding between sections" },
        gridColumns: { type: Type.NUMBER, description: "Number of grid columns" },
        gutterWidth: { type: Type.STRING, description: "Gap between grid items" }
      },
      required: ["maxWidth", "sectionPadding", "gridColumns", "gutterWidth"]
    },
    components: {
      type: Type.OBJECT,
      properties: {
        header: {
          type: Type.OBJECT,
          properties: {
            style: { type: Type.STRING, description: "fixed, sticky, or static" },
            logoPlacement: { type: Type.STRING, description: "left or center" },
            backgroundColor: { type: Type.STRING, description: "Header background color" },
            textColor: { type: Type.STRING, description: "Header text/link color" },
            logoText: { type: Type.STRING, description: "Logo text if visible" },
            navItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Navigation menu items" }
          },
          required: ["style", "logoPlacement"]
        },
        hero: {
          type: Type.OBJECT,
          properties: {
            height: { type: Type.STRING, description: "Hero section height" },
            alignment: { type: Type.STRING, description: "left, center, or right" },
            headline: { type: Type.STRING, description: "Main headline text" },
            subheadline: { type: Type.STRING, description: "Subheadline/description text" },
            ctaButtons: { type: Type.ARRAY, items: { type: Type.STRING }, description: "CTA button texts" },
            backgroundType: { type: Type.STRING, description: "image, gradient, solid color" },
            backgroundValue: { type: Type.STRING, description: "Background color/gradient CSS" },
            imagePosition: { type: Type.STRING, description: "left, right, background, none" },
            hasOverlay: { type: Type.BOOLEAN, description: "Has dark overlay on background" }
          },
          required: ["height", "alignment"]
        },
        buttons: {
          type: Type.OBJECT,
          properties: {
            borderRadius: { type: Type.STRING, description: "Button border radius" },
            style: { type: Type.STRING, description: "solid, outline, or ghost" },
            primaryColor: { type: Type.STRING, description: "Primary button background color" },
            primaryTextColor: { type: Type.STRING, description: "Primary button text color" },
            secondaryColor: { type: Type.STRING, description: "Secondary button background color" },
            padding: { type: Type.STRING, description: "Button padding e.g. 12px 24px" }
          },
          required: ["borderRadius", "style"]
        },
        cards: {
          type: Type.OBJECT,
          properties: {
            borderRadius: { type: Type.STRING, description: "Card border radius" },
            shadow: { type: Type.STRING, description: "Card shadow style" },
            backgroundColor: { type: Type.STRING, description: "Card background color" },
            border: { type: Type.STRING, description: "Card border style" }
          },
          required: ["borderRadius", "shadow"]
        }
      },
      required: ["header", "hero", "buttons", "cards"]
    },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Section type: header, hero, features, services, testimonials, contact, footer, etc." },
          order: { type: Type.NUMBER, description: "Order in page (1-based)" },
          title: { type: Type.STRING, description: "Section title/heading if visible" },
          subtitle: { type: Type.STRING, description: "Section subtitle if visible" },
          backgroundColor: { type: Type.STRING, description: "Section background color" },
          itemCount: { type: Type.NUMBER, description: "Number of items/cards in section" },
          layout: { type: Type.STRING, description: "grid, flex, single-column, two-column" },
          items: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Text content of each item/card" }
        },
        required: ["type", "order"]
      },
      description: "List of sections in order with their content"
    },
    exactContent: {
      type: Type.OBJECT,
      properties: {
        logoText: { type: Type.STRING, description: "Exact logo text" },
        heroHeadline: { type: Type.STRING, description: "Exact hero headline" },
        heroSubheadline: { type: Type.STRING, description: "Exact hero subheadline" },
        ctaButtonTexts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exact CTA button texts" },
        navMenuItems: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Exact navigation menu items" },
        sectionTitles: { type: Type.ARRAY, items: { type: Type.STRING }, description: "All section titles in order" },
        footerText: { type: Type.STRING, description: "Footer copyright/text" }
      }
    }
  },
  required: ["colors", "typography", "layout", "components", "sections"]
};

/**
 * Extract design specifications from a concept image using Gemini Vision
 */
export const extractDesignSpecFromImage = async (
  conceptImageBase64: string,
  businessName: string,
  initialBrandGuidelines?: { colors: string[]; tone: string }
): Promise<DesignSpecification> => {
  const ai = getClient();

  const extractionPrompt = `
    Analyze this website concept mockup for "${businessName}" and extract PIXEL-PERFECT design specifications.

    **** CRITICAL - IGNORE DEVICE FRAMES ****
    If the image shows a website displayed on a laptop, computer monitor, phone, tablet, or any other device:
    - COMPLETELY IGNORE the device frame/shell/bezel
    - Focus ONLY on the actual WEBSITE CONTENT shown inside the screen
    - Do NOT extract colors or elements from the device itself (laptop body, keyboard, etc.)
    - Analyze ONLY what appears ON the website, not the device displaying it
    - The device is just a presentation mockup - we need the WEBSITE CONTENT ONLY

    YOUR TASK: The generated website MUST be 100% IDENTICAL to the website shown in this mockup. Extract EVERY detail FROM THE WEBSITE.

    CRITICAL: Extract EXACT values - do not approximate or generalize. Be extremely precise.

    Context:
    - Brand colors provided: ${initialBrandGuidelines?.colors?.join(', ') || 'Not specified'}
    - Brand tone: ${initialBrandGuidelines?.tone || 'Professional'}

    Required Analysis:

    1. COLORS: Identify ALL hex color codes visible in the design.
       - Primary: The main brand color (buttons, accents, highlights)
       - Secondary: Supporting color for backgrounds, secondary elements
       - Accent: CTA buttons, links, important highlights
       - Background: Main page background color
       - Text: Primary text color
       - headerBg: Header background color (can be transparent, solid, or gradient)
       - footerBg: Footer background color
       - heroBg: Hero section background (color, gradient, or "image")
       - cardBg: Card/box background color
       - List ALL unique hex codes found anywhere in the design

    2. TYPOGRAPHY: Identify the EXACT font styles used.
       - Heading font: Font family for headings (match to Google Fonts: Playfair Display, Montserrat, Poppins, Inter, Roboto, etc.)
       - Body font: Font family for body text
       - Base font size: e.g., "16px"
       - H1, H2, H3 sizes: Exact sizes for each heading level
       - Font weights: bold/700 for headings, normal/400 for body

    3. LAYOUT: Analyze the layout structure precisely.
       - Max width: Container maximum width (e.g., "1200px", "1400px")
       - Section padding: Vertical spacing between sections (e.g., "80px", "100px")
       - Grid columns: Number of columns in feature/service grids (3, 4, etc.)
       - Gutter width: Spacing between grid items

    4. COMPONENTS: Extract EXACT component styles.

       HEADER:
       - style: fixed/sticky/static
       - logoPlacement: left/center
       - backgroundColor: exact color or "transparent"
       - textColor: nav link colors
       - logoText: EXACT text of the logo if visible
       - navItems: EXACT list of navigation menu items ["Home", "Services", "About", "Contact"]

       HERO:
       - height: "100vh", "80vh", or specific height
       - alignment: left/center/right (where is the text positioned?)
       - headline: EXACT main headline text visible
       - subheadline: EXACT subheadline/description text
       - ctaButtons: EXACT text of CTA buttons ["Get Started", "Learn More"]
       - backgroundType: "image", "gradient", "solid"
       - backgroundValue: color/gradient CSS value
       - imagePosition: "left", "right", "background", "none"
       - hasOverlay: true/false (dark overlay on background image?)

       BUTTONS:
       - borderRadius: exact value ("8px", "full", "0")
       - style: solid/outline/ghost
       - primaryColor: primary button background color
       - primaryTextColor: primary button text color
       - secondaryColor: secondary/outline button color
       - padding: approximate padding

       CARDS:
       - borderRadius: card corner radius
       - shadow: "none", "sm", "md", "lg", "xl"
       - backgroundColor: card background color
       - border: "none" or border style

    5. SECTIONS: List ALL visible sections from top to bottom with FULL DETAILS.
       For EACH section include:
       - type: header, hero, features, services, about, testimonials, team, pricing, contact, cta, gallery, faq, stats, footer
       - order: position (1, 2, 3...)
       - title: EXACT section heading text if visible
       - subtitle: EXACT section subtitle/description if visible
       - backgroundColor: section background color
       - itemCount: number of cards/items in the section
       - layout: "grid", "flex", "single-column", "two-column"
       - items: content of each card/item as array of strings

    6. EXACT CONTENT: Extract ALL visible text.
       - logoText: Exact logo text
       - heroHeadline: Exact hero headline
       - heroSubheadline: Exact hero description
       - ctaButtonTexts: All button texts as array
       - navMenuItems: All nav items as array
       - sectionTitles: All section titles in order
       - footerText: Footer copyright text

    Return the extracted data as a JSON object. BE EXTREMELY DETAILED - the generated website must match this mockup exactly.
  `;

  // Remove data URL prefix if present
  const imageData = conceptImageBase64.includes(',')
    ? conceptImageBase64.split(',')[1]
    : conceptImageBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageData } },
          { text: extractionPrompt }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: designSpecSchema,
      maxOutputTokens: 4000
    }
  });

  const extracted = JSON.parse(response.text || '{}');

  // Build the full DesignSpecification object with ALL extracted details
  const designSpec: DesignSpecification = {
    colors: {
      primary: extracted.colors?.primary || initialBrandGuidelines?.colors?.[0] || '#D4AF37',
      secondary: extracted.colors?.secondary || initialBrandGuidelines?.colors?.[1] || '#4A4A4A',
      accent: extracted.colors?.accent || initialBrandGuidelines?.colors?.[2] || '#F9F6F0',
      background: extracted.colors?.background || '#FFFFFF',
      text: extracted.colors?.text || '#1a1a1a',
      headerBg: extracted.colors?.headerBg,
      footerBg: extracted.colors?.footerBg,
      heroBg: extracted.colors?.heroBg,
      cardBg: extracted.colors?.cardBg,
      exactHexCodes: extracted.colors?.exactHexCodes || []
    },
    typography: {
      headingFont: extracted.typography?.headingFont || 'Playfair Display',
      bodyFont: extracted.typography?.bodyFont || 'Inter',
      baseFontSize: extracted.typography?.baseFontSize || '16px',
      headingSizes: {
        h1: extracted.typography?.headingSizes?.h1 || '48px',
        h2: extracted.typography?.headingSizes?.h2 || '36px',
        h3: extracted.typography?.headingSizes?.h3 || '24px'
      },
      fontWeight: extracted.typography?.fontWeight
    },
    layout: {
      maxWidth: extracted.layout?.maxWidth || '1200px',
      sectionPadding: extracted.layout?.sectionPadding || '80px',
      gridColumns: extracted.layout?.gridColumns || 12,
      gutterWidth: extracted.layout?.gutterWidth || '24px'
    },
    components: {
      header: {
        style: (extracted.components?.header?.style as 'fixed' | 'sticky' | 'static') || 'fixed',
        logoPlacement: (extracted.components?.header?.logoPlacement as 'left' | 'center') || 'left',
        backgroundColor: extracted.components?.header?.backgroundColor,
        textColor: extracted.components?.header?.textColor,
        logoText: extracted.components?.header?.logoText,
        navItems: extracted.components?.header?.navItems || []
      },
      hero: {
        height: extracted.components?.hero?.height || '100vh',
        alignment: (extracted.components?.hero?.alignment as 'left' | 'center' | 'right') || 'center',
        headline: extracted.components?.hero?.headline,
        subheadline: extracted.components?.hero?.subheadline,
        ctaButtons: extracted.components?.hero?.ctaButtons || [],
        backgroundType: extracted.components?.hero?.backgroundType,
        backgroundValue: extracted.components?.hero?.backgroundValue,
        imagePosition: extracted.components?.hero?.imagePosition,
        hasOverlay: extracted.components?.hero?.hasOverlay
      },
      buttons: {
        borderRadius: extracted.components?.buttons?.borderRadius || '8px',
        style: (extracted.components?.buttons?.style as 'solid' | 'outline' | 'ghost') || 'solid',
        primaryColor: extracted.components?.buttons?.primaryColor,
        primaryTextColor: extracted.components?.buttons?.primaryTextColor,
        secondaryColor: extracted.components?.buttons?.secondaryColor,
        padding: extracted.components?.buttons?.padding
      },
      cards: {
        borderRadius: extracted.components?.cards?.borderRadius || '12px',
        shadow: extracted.components?.cards?.shadow || 'lg',
        backgroundColor: extracted.components?.cards?.backgroundColor,
        border: extracted.components?.cards?.border
      }
    },
    content: {
      sections: (extracted.sections || []).map((s: any, idx: number) => ({
        type: s.type,
        order: s.order || idx + 1,
        title: s.title,
        subtitle: s.subtitle,
        backgroundColor: s.backgroundColor,
        itemCount: s.itemCount,
        layout: s.layout,
        items: s.items || [],
        requiredContent: s.items || []
      })),
      exactText: {
        logoText: extracted.exactContent?.logoText || extracted.components?.header?.logoText,
        heroHeadline: extracted.exactContent?.heroHeadline || extracted.components?.hero?.headline,
        heroSubheadline: extracted.exactContent?.heroSubheadline || extracted.components?.hero?.subheadline,
        ctaButtonTexts: extracted.exactContent?.ctaButtonTexts || extracted.components?.hero?.ctaButtons,
        navMenuItems: extracted.exactContent?.navMenuItems || extracted.components?.header?.navItems,
        sectionTitles: extracted.exactContent?.sectionTitles || (extracted.sections || []).map((s: any) => s.title).filter(Boolean),
        footerText: extracted.exactContent?.footerText
      }
    },
    assets: {
      logo: undefined,
      // Store the concept image as the hero image - this is the ACTUAL image from the concept
      heroImage: {
        id: 'hero-concept',
        type: 'image',
        source: 'ai-generated',
        url: conceptImageBase64, // Store the full base64 data URL
        placement: 'hero section background',
        required: true
      },
      images: []
    },
    verification: {
      missingAssets: ['logo'], // Hero image is now provided from concept
      discrepancies: []
    }
  };

  return designSpec;
};

/**
 * Create default design specification from brand guidelines (without image analysis)
 */
export const createDefaultDesignSpec = (
  brandGuidelines: { colors: string[]; tone: string; suggestions: string }
): DesignSpecification => {
  const isLuxury = brandGuidelines.tone?.toLowerCase().includes('luxury') ||
                   brandGuidelines.tone?.toLowerCase().includes('elegant');
  const isModern = brandGuidelines.tone?.toLowerCase().includes('modern') ||
                   brandGuidelines.tone?.toLowerCase().includes('minimal');
  const isFriendly = brandGuidelines.tone?.toLowerCase().includes('friendly') ||
                     brandGuidelines.tone?.toLowerCase().includes('warm');

  return {
    colors: {
      primary: brandGuidelines.colors?.[0] || '#D4AF37',
      secondary: brandGuidelines.colors?.[1] || '#4A4A4A',
      accent: brandGuidelines.colors?.[2] || '#F9F6F0',
      background: '#FFFFFF',
      text: '#1a1a1a',
      exactHexCodes: brandGuidelines.colors || []
    },
    typography: {
      headingFont: isLuxury ? 'Playfair Display' : isModern ? 'Inter' : 'Poppins',
      bodyFont: isModern ? 'Inter' : isFriendly ? 'Open Sans' : 'Lato',
      baseFontSize: '16px',
      headingSizes: {
        h1: isLuxury ? '56px' : '48px',
        h2: '36px',
        h3: '24px'
      }
    },
    layout: {
      maxWidth: '1200px',
      sectionPadding: isLuxury ? '100px' : '80px',
      gridColumns: 12,
      gutterWidth: '24px'
    },
    components: {
      header: {
        style: 'fixed',
        logoPlacement: isLuxury ? 'center' : 'left'
      },
      hero: {
        height: '100vh',
        alignment: isLuxury ? 'center' : 'left'
      },
      buttons: {
        borderRadius: isModern ? '4px' : isFriendly ? '24px' : '8px',
        style: 'solid'
      },
      cards: {
        borderRadius: isModern ? '8px' : '12px',
        shadow: isLuxury ? 'xl' : 'lg'
      }
    },
    content: {
      sections: [
        { type: 'header', order: 1, requiredContent: [] },
        { type: 'hero', order: 2, requiredContent: [] },
        { type: 'features', order: 3, requiredContent: [] },
        { type: 'services', order: 4, requiredContent: [] },
        { type: 'testimonials', order: 5, requiredContent: [] },
        { type: 'contact', order: 6, requiredContent: [] },
        { type: 'footer', order: 7, requiredContent: [] }
      ],
      exactText: {}
    },
    assets: {
      logo: undefined,
      heroImage: undefined,
      images: []
    },
    verification: {
      missingAssets: ['logo', 'hero-image'],
      discrepancies: []
    }
  };
};
