// Profile types
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'error';

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  gender: 'male' | 'female';
  country: string;
  skin_tone: string | null;
  undertone: string | null;
  body_shape_male: string | null;
  body_shape_female: string | null;
  face_image_url: string | null;
  body_image_url: string | null;
  analysis_status: AnalysisStatus;
  analysis_started_at: string | null;
  analysis_completed_at: string | null;
  analysis_error: string | null;
  ai_confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

// Analysis result types
export interface AIAnalysisResult {
  skinTone: string;
  undertone: string;
  bodyShape: string;
  confidenceScore: number;
}