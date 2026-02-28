/**
 * Robust JSON parser for LLM responses.
 *
 * Handles common LLM output quirks:
 * - Markdown code fences (```json ... ```)
 * - Wrapper objects ({"insights": [...]} → extracts array)
 * - Trailing commas before } or ]
 * - Single-line // comments
 * - Truncated responses (tries to salvage complete items)
 */

/**
 * Parse an LLM response that should contain a JSON array.
 * Tries multiple strategies to extract valid data.
 *
 * @param raw - Raw LLM response text
 * @param wrapperKey - Optional key if array is wrapped in object (e.g. "insights")
 * @returns Parsed array
 * @throws Error with diagnostic details if parsing fails
 */
export function parseJsonArray(raw: string, wrapperKey?: string): any[] {
  let text = raw.trim();

  // 1. Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // 2. Try direct parse first (best case — valid JSON)
  try {
    const obj = JSON.parse(text);
    const arr = extractArray(obj, wrapperKey);
    if (arr) return arr;
  } catch {
    // Continue to fallback strategies
  }

  // 3. Extract JSON structure with regex and clean up
  const jsonMatch = text.match(/[\[{][\s\S]*[\]}]/);
  if (!jsonMatch) {
    throw new Error(`No JSON found in LLM response. Preview: ${text.slice(0, 300)}`);
  }

  let cleaned = jsonMatch[0];

  // Fix trailing commas: ,] or ,}
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  // Remove single-line // comments (outside strings — best-effort)
  cleaned = cleaned.replace(/\/\/[^\n"]*/g, "");

  try {
    const obj = JSON.parse(cleaned);
    const arr = extractArray(obj, wrapperKey);
    if (arr) return arr;
  } catch {
    // Continue to truncation repair
  }

  // 4. Handle truncated responses — try to close open brackets
  const repaired = repairTruncatedJson(cleaned);
  if (repaired) {
    try {
      const obj = JSON.parse(repaired);
      const arr = extractArray(obj, wrapperKey);
      if (arr && arr.length > 0) {
        console.warn(`[jsonParser] Repaired truncated JSON — salvaged ${arr.length} items`);
        return arr;
      }
    } catch {
      // Fall through to error
    }
  }

  throw new Error(`Failed to parse LLM response as JSON. Preview: ${text.slice(0, 300)}`);
}

/**
 * Parse an LLM response that should contain a JSON object.
 */
export function parseJsonObject(raw: string): any {
  let text = raw.trim();

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // Direct parse
  try {
    return JSON.parse(text);
  } catch {
    // Continue
  }

  // Extract and clean
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in LLM response. Preview: ${text.slice(0, 300)}`);
  }

  let cleaned = jsonMatch[0];
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  cleaned = cleaned.replace(/\/\/[^\n"]*/g, "");

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try truncation repair
  }

  const repaired = repairTruncatedJson(cleaned);
  if (repaired) {
    try {
      return JSON.parse(repaired);
    } catch {
      // Fall through
    }
  }

  throw new Error(`Failed to parse LLM response as JSON. Preview: ${text.slice(0, 300)}`);
}

// ── Helpers ──────────────────────────────────────────────────

function extractArray(obj: any, wrapperKey?: string): any[] | null {
  if (Array.isArray(obj)) return obj;
  if (wrapperKey && Array.isArray(obj?.[wrapperKey])) return obj[wrapperKey];
  // Try to find any array property in the object
  if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (Array.isArray(obj[key])) return obj[key];
    }
  }
  return null;
}

/**
 * Attempt to repair truncated JSON by removing the last incomplete item
 * and closing all open brackets.
 */
function repairTruncatedJson(text: string): string | null {
  // Find the last complete object (ends with })
  const lastCompleteObj = text.lastIndexOf("}");
  if (lastCompleteObj === -1) return null;

  let truncated = text.slice(0, lastCompleteObj + 1);

  // Count open/close brackets to determine what needs closing
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escape = false;

  for (const ch of truncated) {
    if (escape) { escape = false; continue; }
    if (ch === "\\") { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") openBraces++;
    if (ch === "}") openBraces--;
    if (ch === "[") openBrackets++;
    if (ch === "]") openBrackets--;
  }

  // Remove trailing comma if present
  truncated = truncated.replace(/,\s*$/, "");

  // Close open brackets
  for (let i = 0; i < openBrackets; i++) truncated += "]";
  for (let i = 0; i < openBraces; i++) truncated += "}";

  return truncated;
}
