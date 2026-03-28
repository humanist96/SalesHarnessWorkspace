-- ============================================
-- SalesHarness Phase 1: Document Generator
-- 테이블: documents
-- ============================================

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  deal_id UUID, -- Phase 3에서 deals 테이블 생성 후 FK 추가
  type TEXT NOT NULL CHECK (type IN ('proposal', 'report', 'email', 'briefing')),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  ai_model TEXT,
  ai_prompt_version TEXT,
  user_feedback TEXT CHECK (user_feedback IN ('approved', 'edited', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- 자신의 문서만 접근
CREATE POLICY "documents_read_own" ON public.documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_organization_id ON public.documents(organization_id);
CREATE INDEX idx_documents_type ON public.documents(type);

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
