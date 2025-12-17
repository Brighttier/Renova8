import { GoogleGenAI, Type } from "@google/genai";
import { DesignSpecification, VerificationResult, DiscrepancyReport } from "../types";

const getClient = () => {
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
};

// Schema for verification result
const verificationResultSchema = {
  type: Type.OBJECT,
  properties: {
    overallMatchScore: { type: Type.NUMBER, description: "Overall match percentage 0-100" },
    colorMatchScore: { type: Type.NUMBER, description: "Color accuracy percentage 0-100" },
    layoutMatchScore: { type: Type.NUMBER, description: "Layout accuracy percentage 0-100" },
    typographyMatchScore: { type: Type.NUMBER, description: "Typography accuracy percentage 0-100" },
    discrepancies: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          element: { type: Type.STRING, description: "Element with discrepancy" },
          expected: { type: Type.STRING, description: "Expected value" },
          actual: { type: Type.STRING, description: "Actual value found" },
          severity: { type: Type.STRING, description: "critical, major, or minor" }
        },
        required: ["element", "expected", "actual", "severity"]
      }
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of recommendations to fix discrepancies"
    },
    missingAssets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          placement: { type: Type.STRING },
          required: { type: Type.BOOLEAN }
        },
        required: ["type", "description", "placement", "required"]
      }
    }
  },
  required: ["overallMatchScore", "colorMatchScore", "layoutMatchScore", "typographyMatchScore", "discrepancies", "recommendations", "missingAssets"]
};

/**
 * Verify generated HTML against design specifications
 * Compares the output with the original concept image
 */
export const verifyWebsiteAgainstSpec = async (
  generatedHtml: string,
  designSpec: DesignSpecification,
  conceptImageBase64?: string
): Promise<VerificationResult> => {
  const ai = getClient();

  // If we have a concept image, do visual comparison
  if (conceptImageBase64) {
    return await verifyWithVisualComparison(ai, generatedHtml, designSpec, conceptImageBase64);
  }

  // Otherwise, do code-based verification
  return await verifyWithCodeAnalysis(ai, generatedHtml, designSpec);
};

/**
 * Visual comparison using Gemini Vision
 */
const verifyWithVisualComparison = async (
  ai: any,
  generatedHtml: string,
  designSpec: DesignSpecification,
  conceptImageBase64: string
): Promise<VerificationResult> => {
  const imageData = conceptImageBase64.includes(',')
    ? conceptImageBase64.split(',')[1]
    : conceptImageBase64;

  const verificationPrompt = `
    You are a design QA specialist. Analyze this website concept mockup and compare it against these design specifications.

    **** CRITICAL - IGNORE DEVICE FRAMES ****
    If the concept image shows a website displayed on a laptop, computer, phone, or tablet:
    - COMPLETELY IGNORE the device frame/shell
    - Compare ONLY the actual WEBSITE CONTENT shown inside the screen
    - Do NOT flag discrepancies related to the device itself (laptop body, keyboard, etc.)
    - The device is just a presentation mockup - verify the WEBSITE CONTENT ONLY

    ## DESIGN SPECIFICATIONS TO VERIFY:

    ### Colors:
    - Primary: ${designSpec.colors.primary}
    - Secondary: ${designSpec.colors.secondary}
    - Accent: ${designSpec.colors.accent}
    - Background: ${designSpec.colors.background}
    - Text: ${designSpec.colors.text}

    ### Typography:
    - Heading Font: ${designSpec.typography.headingFont}
    - Body Font: ${designSpec.typography.bodyFont}
    - H1 Size: ${designSpec.typography.headingSizes.h1}

    ### Layout:
    - Max Width: ${designSpec.layout.maxWidth}
    - Section Padding: ${designSpec.layout.sectionPadding}

    ### Components:
    - Header Style: ${designSpec.components.header.style}
    - Hero Alignment: ${designSpec.components.hero.alignment}
    - Button Border Radius: ${designSpec.components.buttons.borderRadius}

    ### Expected Sections (in order):
    ${designSpec.content.sections.map((s, i) => `${i + 1}. ${s.type}`).join('\n')}

    ## GENERATED HTML CODE TO VERIFY:
    ${generatedHtml.substring(0, 8000)}

    ## YOUR TASK:
    1. Analyze the concept image to understand the intended design
    2. Compare it against the specifications above
    3. Check if the HTML code would produce a matching result
    4. Score each category from 0-100
    5. List any discrepancies found
    6. Provide recommendations to fix issues
    7. Identify any missing assets

    Return your analysis as a JSON object with:
    - overallMatchScore (0-100)
    - colorMatchScore (0-100)
    - layoutMatchScore (0-100)
    - typographyMatchScore (0-100)
    - discrepancies (array of {element, expected, actual, severity})
    - recommendations (array of strings)
    - missingAssets (array of {type, description, placement, required})
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'image/png', data: imageData } },
            { text: verificationPrompt }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: verificationResultSchema,
        maxOutputTokens: 4000
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      overallMatchScore: result.overallMatchScore || 0,
      colorMatchScore: result.colorMatchScore || 0,
      layoutMatchScore: result.layoutMatchScore || 0,
      typographyMatchScore: result.typographyMatchScore || 0,
      discrepancies: result.discrepancies || [],
      recommendations: result.recommendations || [],
      missingAssets: result.missingAssets || [],
      approved: (result.overallMatchScore || 0) >= 85
    };
  } catch (error) {
    console.error('Visual verification failed:', error);
    return await verifyWithCodeAnalysis(ai, generatedHtml, designSpec);
  }
};

/**
 * Code-based verification without visual comparison
 */
const verifyWithCodeAnalysis = async (
  ai: any,
  generatedHtml: string,
  designSpec: DesignSpecification
): Promise<VerificationResult> => {
  const discrepancies: DiscrepancyReport[] = [];
  const recommendations: string[] = [];
  const missingAssets: { type: string; description: string; placement: string; required: boolean }[] = [];

  // Check for color usage
  const colorChecks = [
    { name: 'primary', expected: designSpec.colors.primary },
    { name: 'secondary', expected: designSpec.colors.secondary },
    { name: 'accent', expected: designSpec.colors.accent },
    { name: 'background', expected: designSpec.colors.background },
    { name: 'text', expected: designSpec.colors.text }
  ];

  let colorMatches = 0;
  for (const check of colorChecks) {
    if (generatedHtml.toLowerCase().includes(check.expected.toLowerCase())) {
      colorMatches++;
    } else {
      discrepancies.push({
        element: `${check.name} color`,
        expected: check.expected,
        actual: 'Not found in HTML',
        severity: 'major'
      });
      recommendations.push(`Add the ${check.name} color (${check.expected}) to the website`);
    }
  }
  const colorMatchScore = Math.round((colorMatches / colorChecks.length) * 100);

  // Check for font usage
  const headingFontLower = designSpec.typography.headingFont.toLowerCase();
  const bodyFontLower = designSpec.typography.bodyFont.toLowerCase();
  const htmlLower = generatedHtml.toLowerCase();

  let fontMatches = 0;
  if (htmlLower.includes(headingFontLower) || htmlLower.includes(headingFontLower.replace(' ', '+'))) {
    fontMatches++;
  } else {
    discrepancies.push({
      element: 'Heading font',
      expected: designSpec.typography.headingFont,
      actual: 'Not found',
      severity: 'major'
    });
    recommendations.push(`Import and use "${designSpec.typography.headingFont}" for headings`);
  }

  if (htmlLower.includes(bodyFontLower) || htmlLower.includes(bodyFontLower.replace(' ', '+'))) {
    fontMatches++;
  } else {
    discrepancies.push({
      element: 'Body font',
      expected: designSpec.typography.bodyFont,
      actual: 'Not found',
      severity: 'major'
    });
    recommendations.push(`Import and use "${designSpec.typography.bodyFont}" for body text`);
  }
  const typographyMatchScore = Math.round((fontMatches / 2) * 100);

  // Check for sections
  let sectionMatches = 0;
  const sectionKeywords: Record<string, string[]> = {
    header: ['<header', '<nav', 'navbar'],
    hero: ['hero', 'banner', 'jumbotron'],
    features: ['feature', 'benefit'],
    services: ['service', 'offering'],
    testimonials: ['testimonial', 'review', 'quote'],
    contact: ['contact', 'form', 'email'],
    footer: ['<footer', 'copyright']
  };

  for (const section of designSpec.content.sections) {
    const keywords = sectionKeywords[section.type.toLowerCase()] || [section.type.toLowerCase()];
    const found = keywords.some(kw => htmlLower.includes(kw));
    if (found) {
      sectionMatches++;
    } else {
      discrepancies.push({
        element: `${section.type} section`,
        expected: `Section at position ${section.order}`,
        actual: 'Not found',
        severity: 'minor'
      });
    }
  }
  const layoutMatchScore = designSpec.content.sections.length > 0
    ? Math.round((sectionMatches / designSpec.content.sections.length) * 100)
    : 100;

  // Check for missing assets
  if (!designSpec.assets.logo?.url) {
    missingAssets.push({
      type: 'logo',
      description: 'Business logo image',
      placement: 'header',
      required: true
    });
  }

  if (!designSpec.assets.heroImage?.url) {
    missingAssets.push({
      type: 'hero-image',
      description: 'Hero section background or featured image',
      placement: 'hero section',
      required: false
    });
  }

  // Check for exact text content matching
  const exactTextChecks = [
    { field: 'Hero Headline', expected: designSpec.content.exactText?.heroHeadline },
    { field: 'Hero Subheadline', expected: designSpec.content.exactText?.heroSubheadline },
    { field: 'Logo Text', expected: designSpec.content.exactText?.logoText }
  ];

  let textMatches = 0;
  let totalTextChecks = 0;

  for (const check of exactTextChecks) {
    if (check.expected && typeof check.expected === 'string' && check.expected.trim()) {
      totalTextChecks++;
      if (generatedHtml.includes(check.expected)) {
        textMatches++;
      } else {
        discrepancies.push({
          element: check.field,
          expected: check.expected,
          actual: 'Text not found in HTML',
          severity: 'major'
        });
        recommendations.push(`Add exact text: "${check.expected}" to ${check.field}`);
      }
    }
  }

  const textMatchScore = totalTextChecks > 0
    ? Math.round((textMatches / totalTextChecks) * 100)
    : 100;

  // Calculate overall score with text matching included
  const overallMatchScore = Math.round(
    (colorMatchScore * 0.25) +
    (typographyMatchScore * 0.20) +
    (layoutMatchScore * 0.30) +
    (textMatchScore * 0.25)  // 25% weight for exact text
  );

  return {
    overallMatchScore,
    colorMatchScore,
    layoutMatchScore,
    typographyMatchScore,
    discrepancies,
    recommendations,
    missingAssets,
    approved: overallMatchScore >= 85
  };
};

/**
 * Quick verification - checks only critical elements
 */
export const quickVerify = (
  generatedHtml: string,
  designSpec: DesignSpecification
): { passed: boolean; issues: string[] } => {
  const issues: string[] = [];
  const htmlLower = generatedHtml.toLowerCase();

  // Check primary color
  if (!htmlLower.includes(designSpec.colors.primary.toLowerCase())) {
    issues.push(`Primary color ${designSpec.colors.primary} not found`);
  }

  // Check accent color (for buttons)
  if (!htmlLower.includes(designSpec.colors.accent.toLowerCase())) {
    issues.push(`Accent color ${designSpec.colors.accent} not found`);
  }

  // Check heading font
  const headingFont = designSpec.typography.headingFont.toLowerCase().replace(' ', '+');
  if (!htmlLower.includes(headingFont) && !htmlLower.includes(designSpec.typography.headingFont.toLowerCase())) {
    issues.push(`Heading font "${designSpec.typography.headingFont}" not imported`);
  }

  // Check Tailwind CDN
  if (!htmlLower.includes('tailwindcss') && !htmlLower.includes('tailwind')) {
    issues.push('Tailwind CSS CDN not found');
  }

  return {
    passed: issues.length === 0,
    issues
  };
};
