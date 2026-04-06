import Anthropic from '@anthropic-ai/sdk';
import type { CaseCategory, Severity } from './database.types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are HomeFixAI, an expert home maintenance triage assistant. You classify home repair issues, assess severity, identify safety hazards, and provide actionable guidance.

When analyzing an issue:
1. Determine the category from: PLUMBING, ELECTRICAL, HVAC, APPLIANCE, ROOFING, PEST_CONTROL, LOCKSMITH, GENERAL
2. Assess severity: EMERGENCY (immediate danger/major damage), URGENT (needs attention within 24h), NORMAL (can be scheduled)
3. Check for safety hazards: gas leaks, electrical hazards, structural danger, water damage risk, fire risk
4. Provide a clear diagnosis
5. If it's a DIY-fixable issue (NORMAL severity), provide step-by-step playbook instructions

Always respond in valid JSON format.`;

const CLASSIFICATION_PROMPT = `Analyze this home maintenance issue and respond ONLY with valid JSON:

Issue description: "{description}"
{photoContext}

Respond with this exact JSON structure:
{
  "category": "PLUMBING|ELECTRICAL|HVAC|APPLIANCE|ROOFING|PEST_CONTROL|LOCKSMITH|GENERAL",
  "severity": "EMERGENCY|URGENT|NORMAL",
  "confidence": 0.0-1.0,
  "diagnosis": "Clear explanation of the likely issue",
  "safetyFlags": ["list of any safety concerns, empty array if none"],
  "playbook": ["Step 1...", "Step 2...", "Step 3..."] or null if not DIY-appropriate
}`;

export interface TriageResult {
  category: CaseCategory;
  severity: Severity;
  confidence: number;
  diagnosis: string;
  safetyFlags: string[];
  playbook: string[] | null;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  triggers: string[];
  emergencyAction: string | null;
}

export async function classifyIssue(
  description: string,
  photoUrl?: string
): Promise<TriageResult> {
  const photoContext = photoUrl
    ? `Photo provided: ${photoUrl} (analyze visual indicators if possible)`
    : 'No photo provided.';

  const prompt = CLASSIFICATION_PROMPT
    .replace('{description}', description)
    .replace('{photoContext}', photoContext);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const result = JSON.parse(content.text) as TriageResult;
    return result;
  } catch (error) {
    console.error('Claude classification error:', error);
    // Return a safe default
    return {
      category: 'GENERAL',
      severity: 'NORMAL',
      confidence: 0,
      diagnosis: 'Unable to classify the issue automatically. A property manager will review your request.',
      safetyFlags: [],
      playbook: null,
    };
  }
}

export async function checkSafety(
  description: string
): Promise<SafetyCheckResult> {
  const safetyKeywords = [
    { keyword: 'gas leak', trigger: 'Possible gas leak detected', action: 'Call 911 and your gas utility company immediately. Evacuate the premises.' },
    { keyword: 'gas smell', trigger: 'Gas odor reported', action: 'Call 911 and your gas utility company immediately. Evacuate the premises.' },
    { keyword: 'sparking', trigger: 'Electrical sparking', action: 'Turn off the circuit breaker immediately. Do not touch the affected area. Call an electrician.' },
    { keyword: 'flooding', trigger: 'Active flooding', action: 'Shut off the main water valve. Call an emergency plumber. Move valuables to higher ground.' },
    { keyword: 'fire', trigger: 'Fire hazard', action: 'Call 911 immediately. Evacuate and do not re-enter until cleared by fire department.' },
    { keyword: 'carbon monoxide', trigger: 'CO poisoning risk', action: 'Evacuate immediately. Call 911. Do not re-enter until cleared.' },
    { keyword: 'structural', trigger: 'Structural damage', action: 'Evacuate the area. Do not enter until inspected by a structural engineer.' },
    { keyword: 'collapse', trigger: 'Collapse risk', action: 'Evacuate immediately. Call 911.' },
    { keyword: 'exposed wire', trigger: 'Exposed electrical wiring', action: 'Do not touch. Turn off circuit breaker for that area. Call an electrician immediately.' },
  ];

  const lowerDesc = description.toLowerCase();
  const triggers: string[] = [];
  let emergencyAction: string | null = null;

  for (const item of safetyKeywords) {
    if (lowerDesc.includes(item.keyword)) {
      triggers.push(item.trigger);
      if (!emergencyAction) {
        emergencyAction = item.action;
      }
    }
  }

  return {
    isSafe: triggers.length === 0,
    triggers,
    emergencyAction,
  };
}
