-- ════════════════════════════════════════════════════════
--  TRACKING 361 — Schéma Supabase
--  Exécute ce script dans l'éditeur SQL de ton projet Supabase
-- ════════════════════════════════════════════════════════

-- ── Profils (extension de auth.users) ────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT        NOT NULL DEFAULT '',
  email       TEXT        NOT NULL DEFAULT '',
  role        TEXT        NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  hourly_rate DECIMAL(10,2),
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger : crée un profil automatiquement à chaque inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Clients ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clients (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Projets ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id  UUID        NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Entrées de temps ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.time_entries (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id        UUID        REFERENCES public.clients(id),
  project_id       UUID        REFERENCES public.projects(id),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  paused_at        TIMESTAMPTZ,
  total_paused_ms  BIGINT      NOT NULL DEFAULT 0,
  notes            TEXT,
  is_billable      BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migration : ajouter les colonnes de pause si la table existe déjà
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS paused_at       TIMESTAMPTZ;
ALTER TABLE public.time_entries ADD COLUMN IF NOT EXISTS total_paused_ms BIGINT NOT NULL DEFAULT 0;

-- ── Helper : lit le rôle sans déclencher les politiques RLS ─
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── Row Level Security ────────────────────────────────────
ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Profils : lecture de son propre profil
CREATE POLICY "own_profile_select"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own_profile_update"  ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admins : lecture et modification de tous les profils
CREATE POLICY "admin_profiles_all"  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'admin');
-- Trigger insert (service role)
CREATE POLICY "service_insert_profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- Clients : tous les authentifiés peuvent lire et créer
CREATE POLICY "auth_clients_select" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_clients_insert" ON public.clients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_clients_all"   ON public.clients FOR ALL
  USING (public.get_my_role() = 'admin');

-- Projets : idem clients
CREATE POLICY "auth_projects_select" ON public.projects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "auth_projects_insert" ON public.projects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_projects_all"   ON public.projects FOR ALL
  USING (public.get_my_role() = 'admin');

-- Entrées : employé voit/crée/modifie les siennes; admin voit/modifie/supprime tout
CREATE POLICY "own_entries_select" ON public.time_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_entries_insert" ON public.time_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_entries_update" ON public.time_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "admin_entries_all"  ON public.time_entries FOR ALL
  USING (public.get_my_role() = 'admin');
