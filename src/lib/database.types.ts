export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          age: number
          gender: 'male' | 'female'
          country: string
          skin_tone: string | null
          undertone: string | null
          body_shape_male: string | null
          body_shape_female: string | null
          face_image_url: string | null
          body_image_url: string | null
          analysis_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          name: string
          age: number
          gender: 'male' | 'female'
          country: string
          skin_tone?: string | null
          undertone?: string | null
          body_shape_male?: string | null
          body_shape_female?: string | null
          face_image_url?: string | null
          body_image_url?: string | null
          analysis_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          age?: number
          gender?: 'male' | 'female'
          country?: string
          skin_tone?: string | null
          undertone?: string | null
          body_shape_male?: string | null
          body_shape_female?: string | null
          face_image_url?: string | null
          body_image_url?: string | null
          analysis_status?: string
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          affiliate_link: string
          occasion: string
          popularity: number
          created_at: string
          updated_at: string
          keywords: string[]
          skin_tones: string[]
          undertones: string[]
          body_shapes_male: string[]
          body_shapes_female: string[]
          gender: 'male' | 'female' | 'unisex'
          metadata: Record<string, any>
          source_url: string | null
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          image_url: string
          affiliate_link: string
          occasion: string
          popularity?: number
          created_at?: string
          updated_at?: string
          keywords?: string[]
          skin_tones?: string[]
          undertones?: string[]
          body_shapes_male?: string[]
          body_shapes_female?: string[]
          gender?: 'male' | 'female'
          metadata?: Record<string, any>
          source_url?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          affiliate_link?: string
          occasion?: string
          popularity?: number
          created_at?: string
          updated_at?: string
          keywords?: string[]
          skin_tones?: string[]
          undertones?: string[]
          body_shapes_male?: string[]
          body_shapes_female?: string[]
          gender?: 'male' | 'female'
          metadata?: Record<string, any>
          source_url?: string | null
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          profile_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          profile_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          profile_id?: string
          product_id?: string
          created_at?: string
        }
      }
    }
  }
}