// Supabase 연동 후 `supabase gen types typescript`로 자동 생성 예정.
// 현재는 수동 타입 정의.

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          department: string | null
          role: 'admin' | 'manager' | 'sales'
          onboarding_completed: boolean
          onboarding_step: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      organizations: {
        Row: {
          id: string
          name: string
          industry: string | null
          size: string | null
          website: string | null
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at' | 'deleted_at'>
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          name: string
          title: string | null
          email: string | null
          phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          pricing_info: string | null
          features: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      documents: {
        Row: {
          id: string
          user_id: string
          organization_id: string | null
          deal_id: string | null
          type: 'proposal' | 'report' | 'email' | 'briefing'
          title: string
          content: string
          ai_generated: boolean
          ai_model: string | null
          ai_prompt_version: string | null
          user_feedback: 'approved' | 'edited' | 'rejected' | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
    }
  }
}
