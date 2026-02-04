
import { GoogleGenAI, Type } from "@google/genai";
import { CanonicalEntity } from "../types";
import { ENTITY_ALIASES, REJECTED_ALIASES } from "../constants";

const API_KEY = process.env.API_KEY;

export async function extractFinancialsFromPDF(base64Data: string, mimeType: string) {
  if (!API_KEY) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const systemInstruction = `
    You are a specialized financial auditor and data extraction agent. 
    You have been trained to analyze Profit & Loss (P&L) statements with extreme precision.
    
    CRITICAL EXTRACTION RULES:
    1. REVENUE: Use ONLY "Total Revenue from operations (A)". 
       - ABSOLUTELY EXCLUDE "Other Income".
       - Map this to "Revenue".
    
    2. OPERATING EXPENSES: Use "Total expenses". 
       - Map this to "Operating Expenses".
    
    3. DEPRECIATION & AMORTIZATION: Use "Depreciation and amortisation expense".
       - If combined, map the total value to "Depreciation" and set "Amortization" to "0" (or vice versa).
       - DO NOT ignore this line.
    
    4. PROHIBITED ENTITIES:
       - NEVER extract "EBITDA", "EBIT", or "PBIT" directly from the PDF, even if they are explicitly labeled or highlighted.
       - These values are considered UNTRUSTED for raw extraction.
    
    5. MAPPING & FALLBACK:
       - Map any other identified values to the provided Canonical Names.
       - If a value is not explicitly found, return "NOT_FOUND". DO NOT INFER.
       - Return data for the LATEST available period only.
    
    6. OUTPUT:
       - Ensure the output is valid JSON matching the requested schema.
  `;

  // Filter out EBITDA and PBIT from the entities we ask Gemini to extract
  const targetEntities = Object.values(CanonicalEntity).filter(
    e => e !== CanonicalEntity.EBITDA && e !== CanonicalEntity.PBIT
  );

  const prompt = `
    Analyze the financial document and extract entities for the LATEST financial period.
    Focus on these fields:
    ${targetEntities.join(", ")}

    RECAP OF LEARNED PATTERN:
    - Operating Revenue = "Total Revenue from operations (A)"
    - Operating Expenses = "Total expenses"
    - Depreciation & Amortization = "Depreciation and amortisation expense"
    
    IGNORE EBITDA and PBIT values in the PDF.
    
    Use these aliases for mapping:
    ${JSON.stringify(ENTITY_ALIASES)}

    Explicitly avoid: ${REJECTED_ALIASES.join(", ")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: targetEntities.reduce((acc: any, entity) => {
            acc[entity] = { type: Type.STRING, description: `Extracted value for ${entity}` };
            return acc;
          }, {}),
          required: targetEntities
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Extraction failed:", error);
    throw error;
  }
}
