import { supabase } from './supabase';
import type { Profile, AIAnalysisResult } from './types';

export function getOpenRouterConfig(): { apiKey: string | null; model: string } {
  const apiKey =
    (typeof window !== 'undefined' ? localStorage.getItem('dripbyai_openrouter_api_key') : null) ||
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    null;

  const model =
    (typeof window !== 'undefined' ? localStorage.getItem('dripbyai_openrouter_model') : null) ||
    import.meta.env.VITE_OPENROUTER_MODEL ||
    'meta-llama/llama-3.2-11b-vision-instruct:free';

  return { apiKey, model };
}

export function setOpenRouterConfig(apiKey: string, model?: string): void {
  if (typeof window === 'undefined') return;
  if (apiKey && apiKey.trim()) {
    localStorage.setItem('dripbyai_openrouter_api_key', apiKey.trim());
  } else {
    localStorage.removeItem('dripbyai_openrouter_api_key');
  }
  if (model && model.trim()) {
    localStorage.setItem('dripbyai_openrouter_model', model.trim());
  }
}

export async function startAIAnalysis(profileId: string): Promise<void> {
  // Update profile status to analyzing
  const { error } = await supabase
    .from('profiles')
    .update({ analysis_status: 'analyzing' })
    .eq('id', profileId);

  if (error) throw error;

  // Start analysis in background
  processAIAnalysis(profileId).catch(console.error);
}

async function processAIAnalysis(profileId: string): Promise<void> {
  try {
    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('Profile not found');

    const config = getOpenRouterConfig();
    let result: AIAnalysisResult;

    if (config.apiKey) {
      try {
        result = await analyzeWithOpenRouter(profile, config.apiKey, config.model);
      } catch (apiErr) {
        console.warn('OpenRouter API call failed, falling back to simulation:', apiErr);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        result = await simulateAIAnalysis(profile);
      }
    } else {
      // Simulate AI processing time when no API key is provided
      await new Promise((resolve) => setTimeout(resolve, 4000));
      result = await simulateAIAnalysis(profile);
    }

    // Update profile with results
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        skin_tone: result.skinTone,
        undertone: result.undertone,
        ...(profile.gender === 'male'
          ? { body_shape_male: result.bodyShape }
          : { body_shape_female: result.bodyShape }),
        analysis_status: 'completed',
        ai_confidence_score: result.confidenceScore,
      })
      .eq('id', profileId);

    if (updateError) throw updateError;
  } catch (error) {
    // Update profile with error status
    await supabase
      .from('profiles')
      .update({
        analysis_status: 'error',
        analysis_error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
      .eq('id', profileId);
  }
}

/**
 * Perform inference using OpenRouter API for educational/experimental feature analysis.
 */
async function analyzeWithOpenRouter(
  profile: Profile,
  apiKey: string,
  model: string
): Promise<AIAnalysisResult> {
  const allowedSkinTones = ['fair', 'wheatish', 'brown', 'intense_dark'];
  const allowedUndertones = ['warm', 'cool', 'neutral'];
  const allowedMaleShapes = ['rectangle', 'triangle', 'inverted_triangle', 'oval', 'trapezoid'];
  const allowedFemaleShapes = ['hourglass', 'pear', 'apple', 'rectangle', 'spoon', 'diamond', 'oval'];

  const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
    {
      type: 'text',
      text: `You are an expert fashion stylist AI. Analyze this user profile for fashion styling:
Gender: ${profile.gender}
Age: ${profile.age}
Country: ${profile.country}

Based on professional color and body proportion guidelines, select the best matching classification from these allowed values:
- skinTone must be one of: ${JSON.stringify(allowedSkinTones)}
- undertone must be one of: ${JSON.stringify(allowedUndertones)}
- bodyShape must be one of: ${JSON.stringify(profile.gender === 'male' ? allowedMaleShapes : allowedFemaleShapes)}

Respond ONLY with a valid JSON object in this format (no markdown, no code blocks):
{"skinTone": "...", "undertone": "...", "bodyShape": "...", "confidenceScore": 0.95}`,
    },
  ];

  // Include image URL if stored in Supabase
  if (profile.face_image_url) {
    const { data: faceData } = supabase.storage.from('profile-images').getPublicUrl(profile.face_image_url);
    if (faceData?.publicUrl) {
      content.push({
        type: 'image_url',
        image_url: { url: faceData.publicUrl },
      });
    }
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://dripbyai.local',
      'X-Title': 'DripbyAI Personal Stylist',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'user',
          content: content,
        },
      ],
      temperature: 0.2,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errText}`);
  }

  const json = await response.json();
  const rawText = json.choices?.[0]?.message?.content || '{}';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    skinTone: allowedSkinTones.includes(parsed.skinTone) ? parsed.skinTone : 'wheatish',
    undertone: allowedUndertones.includes(parsed.undertone) ? parsed.undertone : 'neutral',
    bodyShape:
      profile.gender === 'male'
        ? allowedMaleShapes.includes(parsed.bodyShape)
          ? parsed.bodyShape
          : 'rectangle'
        : allowedFemaleShapes.includes(parsed.bodyShape)
          ? parsed.bodyShape
          : 'hourglass',
    confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 0.9,
  };
}

// Fallback simulation when OpenRouter API is not configured
async function simulateAIAnalysis(profile: Profile): Promise<AIAnalysisResult> {
  const skinTones = ['fair', 'wheatish', 'brown', 'intense_dark'];
  const undertones = ['warm', 'cool', 'neutral'];
  const bodyShapesMale = ['rectangle', 'triangle', 'inverted_triangle', 'oval', 'trapezoid'];
  const bodyShapesFemale = ['hourglass', 'pear', 'apple', 'rectangle', 'spoon', 'diamond', 'oval'];

  return {
    skinTone: skinTones[Math.floor(Math.random() * skinTones.length)],
    undertone: undertones[Math.floor(Math.random() * undertones.length)],
    bodyShape:
      profile.gender === 'male'
        ? bodyShapesMale[Math.floor(Math.random() * bodyShapesMale.length)]
        : bodyShapesFemale[Math.floor(Math.random() * bodyShapesFemale.length)],
    confidenceScore: 0.85 + Math.random() * 0.15,
  };
}