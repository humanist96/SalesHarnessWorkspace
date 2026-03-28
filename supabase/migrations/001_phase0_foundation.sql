-- ============================================
-- SalesHarness Phase 0: Foundation
-- 테이블: users, organizations, contacts, products, ai_logs
-- ============================================

-- ==================
-- 1. users 테이블
-- ==================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  department TEXT,
  role TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'manager', 'sales')),
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  onboarding_step INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 가입 시 자동으로 users 레코드 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    'sales'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================
-- 2. organizations 테이블
-- ==================
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT CHECK (size IN ('large', 'medium', 'small')),
  website TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 팀 전체가 읽기 가능 (소규모 팀)
CREATE POLICY "organizations_read" ON public.organizations
  FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "organizations_insert" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "organizations_update" ON public.organizations
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "organizations_delete" ON public.organizations
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE INDEX idx_organizations_created_by ON public.organizations(created_by);

-- ==================
-- 3. contacts 테이블
-- ==================
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_read" ON public.contacts
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "contacts_insert" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "contacts_update" ON public.contacts
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "contacts_delete" ON public.contacts
  FOR DELETE TO authenticated
  USING (true);

CREATE INDEX idx_contacts_organization_id ON public.contacts(organization_id);

-- ==================
-- 4. products 테이블
-- ==================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  pricing_info TEXT,
  features JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 전체 읽기 가능, admin만 쓰기
CREATE POLICY "products_read" ON public.products
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ==================
-- 5. ai_logs 테이블
-- ==================
CREATE TABLE public.ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('document', 'meeting', 'pipeline', 'intelligence', 'assistant')),
  action TEXT NOT NULL CHECK (action IN ('generate', 'analyze', 'recommend', 'summarize')),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_logs_insert_own" ON public.ai_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "ai_logs_read_own" ON public.ai_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX idx_ai_logs_created_at ON public.ai_logs(created_at);

-- ==================
-- updated_at 자동 갱신 트리거
-- ==================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
