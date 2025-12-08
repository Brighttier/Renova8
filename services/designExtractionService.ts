import { GoogleGenAI, Type } from "@google/genai";
import { DesignSpecification } from "../types";

const getClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
};

// Schema for structured design specification extraction
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
            logoPlacement: { type: Type.STRING, description: "left or center" }
          },
          required: ["style", "logoPlacement"]
        },
        hero: {
          type: Type.OBJECT,
          properties: {
            height: { type: Type.STRING, description: "Hero section height" },
            alignment: { type: Type.STRING, description: "left, center, or right" }
          },
          required: ["height", "alignment"]
        },
        buttons: {
          type: Type.OBJECT,
          properties: {
            borderRadius: { type: Type.STRING, description: "Button border radius" },
            style: { type: Type.STRING, description: "solid, outline, or ghost" }
          },
          required: ["borderRadius", "style"]
        },
        cards: {
          type: Type.OBJECT,
          properties: {
            borderRadius: { type: Type.STRING, description: "Card border radius" },
            shadow: { type: Type.STRING, description: "Card shadow style" }
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
          order: { type: Type.NUMBER, description: "Order in page (1-based)" }
        },
        required: ["type", "order"]
      },
      description: "List of sections in order"
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
    Analyze this website concept mockup for "${businessName}" and extract PRECISE design specifications.

    CRITICAL: Extract EXACT values - do not approximate or generalize. Be as specific as possible.

    Context:
    - Brand colors provided: ${initialBrandGuidelines?.colors?.join(', ') || 'Not specified'}
    - Brand tone: ${initialBrandGuidelines?.tone || 'Professional'}

    Required Analysis:

    1. COLORS: Identify ALL hex color codes visible in the design.
       - Primary: The main brand color used for headers, important elements
       - Secondary: Supporting color for backgrounds, secondary elements
       - Accent: Call-to-action buttons, links, highlights
       - Background: Main page background color
       - Text: Primary text color
       - List ALL unique hex codes found in the design

    2. TYPOGRAPHY: Identify the font styles used.
       - Heading font: The font family used for headings (or best match from Google Fonts)
       - Body font: The font family used for body text
       - Base font size: Estimated base font size (e.g., "16px")
       - H1, H2, H3 sizes: Estimated sizes for each heading level

    3. LAYOUT: Analyze the layout structure.
       - Max width: Container maximum width
       - Section padding: Vertical spacing between sections
       - Grid columns: Number of columns used in grid layouts
       - Gutter width: Spacing between grid items

    4. COMPONENTS: Describe specific component styles.
       - Header: fixed/sticky/static, logo placement left/center
       - Hero: Height estimate, text alignment left/center/right
       - Buttons: Border radius, style (solid/outline/ghost)
       - Cards: Border radius, shadow style

    5. SECTIONS: List ALL visible sections in order from top to bottom.
       Types include: header, hero, features, services, about, testimonials, team, pricing, contact, footer, cta, gallery, faq, stats

    Return the extracted data as a JSON object matching the required schema.
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

  // Build the full DesignSpecification object
  const designSpec: DesignSpecification = {
    colors: {
      primary: extracted.colors?.primary || initialBrandGuidelines?.colors?.[0] || '#D4AF37',
      secondary: extracted.colors?.secondary || initialBrandGuidelines?.colors?.[1] || '#4A4A4A',
      accent: extracted.colors?.accent || initialBrandGuidelines?.colors?.[2] || '#F9F6F0',
      background: extracted.colors?.background || '#FFFFFF',
      text: extracted.colors?.text || '#1a1a1a',
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
      }
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
        logoPlacement: (extracted.components?.header?.logoPlacement as 'left' | 'center') || 'left'
      },
      hero: {
        height: extracted.components?.hero?.height || '100vh',
        alignment: (extracted.components?.hero?.alignment as 'left' | 'center' | 'right') || 'center'
      },
      buttons: {
        borderRadius: extracted.components?.buttons?.borderRadius || '8px',
        style: (extracted.components?.buttons?.style as 'solid' | 'outline' | 'ghost') || 'solid'
      },
      cards: {
        borderRadius: extracted.components?.cards?.borderRadius || '12px',
        shadow: extracted.components?.cards?.shadow || 'lg'
      }
    },
    content: {
      sections: (extracted.sections || []).map((s: any, idx: number) => ({
        type: s.type,
        order: s.order || idx + 1,
        requiredContent: []
      })),
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
