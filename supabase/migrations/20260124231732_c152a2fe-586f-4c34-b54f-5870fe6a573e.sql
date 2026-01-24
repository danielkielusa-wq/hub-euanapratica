-- =============================================
-- ENUMS
-- =============================================

-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'mentor', 'student');

-- Enum para status de sessão
CREATE TYPE public.session_status AS ENUM ('scheduled', 'live', 'completed', 'cancelled');

-- Enum para tipo de material
CREATE TYPE public.material_type AS ENUM ('pdf', 'link', 'video', 'other');

-- Enum para status de presença
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'unmarked');

-- Enum para tipo de notificação
CREATE TYPE public.notification_type AS ENUM (
    'reminder_24h', 
    'reminder_1h', 
    'recording_available', 
    'session_cancelled', 
    'new_session'
);

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- Tabela de roles (separada para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, role)
);

-- Tabela de perfis
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    profile_photo_url TEXT,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Espaços (Cohorts/Turmas)
CREATE TABLE public.espacos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de matrículas (user_espacos)
CREATE TABLE public.user_espacos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    espaco_id UUID REFERENCES public.espacos(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'paused')),
    UNIQUE (user_id, espaco_id)
);

-- Tabela de sessões
CREATE TABLE public.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    datetime TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    espaco_id UUID REFERENCES public.espacos(id) ON DELETE CASCADE NOT NULL,
    meeting_link TEXT,
    status session_status DEFAULT 'scheduled',
    recording_url TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern JSONB,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de materiais da sessão
CREATE TABLE public.session_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    material_type material_type DEFAULT 'other',
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Tabela de presença
CREATE TABLE public.session_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    status attendance_status DEFAULT 'unmarked',
    marked_at TIMESTAMPTZ,
    marked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE (session_id, user_id)
);

-- Tabela de notificações
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    sent_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_espacos_mentor_id ON public.espacos(mentor_id);
CREATE INDEX idx_espacos_status ON public.espacos(status);
CREATE INDEX idx_user_espacos_user_id ON public.user_espacos(user_id);
CREATE INDEX idx_user_espacos_espaco_id ON public.user_espacos(espaco_id);
CREATE INDEX idx_sessions_espaco_id ON public.sessions(espaco_id);
CREATE INDEX idx_sessions_datetime ON public.sessions(datetime);
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_session_materials_session_id ON public.session_materials(session_id);
CREATE INDEX idx_session_attendance_session_id ON public.session_attendance(session_id);
CREATE INDEX idx_session_attendance_user_id ON public.session_attendance(user_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_session_id ON public.notifications(session_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);

-- =============================================
-- FUNÇÕES DE SEGURANÇA (SECURITY DEFINER)
-- =============================================

-- Função para verificar role do usuário
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Função para verificar se usuário é admin ou mentor
CREATE OR REPLACE FUNCTION public.is_admin_or_mentor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role IN ('admin', 'mentor')
    )
$$;

-- Função para verificar se usuário está matriculado em um espaço
CREATE OR REPLACE FUNCTION public.is_enrolled_in_espaco(_user_id UUID, _espaco_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_espacos
        WHERE user_id = _user_id 
        AND espaco_id = _espaco_id 
        AND status = 'active'
    )
$$;

-- Função para verificar se usuário é mentor do espaço
CREATE OR REPLACE FUNCTION public.is_mentor_of_espaco(_user_id UUID, _espaco_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.espacos
        WHERE id = _espaco_id AND mentor_id = _user_id
    )
$$;

-- =============================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- =============================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_espacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- POLÍTICAS RLS - USER_ROLES
-- =============================================

-- Usuários podem ler suas próprias roles
CREATE POLICY "Users can read own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins podem ler todas as roles
CREATE POLICY "Admins can read all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem inserir roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem atualizar roles
CREATE POLICY "Admins can update roles"
ON public.user_roles FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apenas admins podem deletar roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- POLÍTICAS RLS - PROFILES
-- =============================================

-- Usuários podem ler seu próprio perfil
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admins e mentores podem ler todos os perfis
CREATE POLICY "Admins and mentors can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin_or_mentor(auth.uid()));

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Perfis são criados via trigger, mas permitir insert para o próprio usuário
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- =============================================
-- POLÍTICAS RLS - ESPACOS
-- =============================================

-- Alunos podem ler espaços em que estão matriculados
CREATE POLICY "Students can read enrolled espacos"
ON public.espacos FOR SELECT
TO authenticated
USING (
    public.is_enrolled_in_espaco(auth.uid(), id)
    OR public.is_admin_or_mentor(auth.uid())
);

-- Admins podem criar espaços
CREATE POLICY "Admins can create espacos"
ON public.espacos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins e mentores donos podem atualizar espaços
CREATE POLICY "Admins and owners can update espacos"
ON public.espacos FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    OR mentor_id = auth.uid()
);

-- Apenas admins podem deletar espaços
CREATE POLICY "Admins can delete espacos"
ON public.espacos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- POLÍTICAS RLS - USER_ESPACOS (Matrículas)
-- =============================================

-- Usuários podem ver suas próprias matrículas
CREATE POLICY "Users can read own enrollments"
ON public.user_espacos FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins e mentores podem ver todas as matrículas
CREATE POLICY "Admins and mentors can read all enrollments"
ON public.user_espacos FOR SELECT
TO authenticated
USING (public.is_admin_or_mentor(auth.uid()));

-- Admins podem criar matrículas
CREATE POLICY "Admins can create enrollments"
ON public.user_espacos FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Mentores podem criar matrículas em seus espaços
CREATE POLICY "Mentors can create enrollments in own espacos"
ON public.user_espacos FOR INSERT
TO authenticated
WITH CHECK (public.is_mentor_of_espaco(auth.uid(), espaco_id));

-- Admins podem atualizar matrículas
CREATE POLICY "Admins can update enrollments"
ON public.user_espacos FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins podem deletar matrículas
CREATE POLICY "Admins can delete enrollments"
ON public.user_espacos FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- POLÍTICAS RLS - SESSIONS
-- =============================================

-- Alunos podem ler sessões dos seus espaços
CREATE POLICY "Students can read sessions from enrolled espacos"
ON public.sessions FOR SELECT
TO authenticated
USING (
    public.is_enrolled_in_espaco(auth.uid(), espaco_id)
    OR public.is_admin_or_mentor(auth.uid())
);

-- Admins podem criar sessões
CREATE POLICY "Admins can create sessions"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Mentores podem criar sessões em seus espaços
CREATE POLICY "Mentors can create sessions in own espacos"
ON public.sessions FOR INSERT
TO authenticated
WITH CHECK (public.is_mentor_of_espaco(auth.uid(), espaco_id));

-- Admins e mentores donos podem atualizar sessões
CREATE POLICY "Admins and mentors can update sessions"
ON public.sessions FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_mentor_of_espaco(auth.uid(), espaco_id)
);

-- Admins e mentores donos podem deletar sessões
CREATE POLICY "Admins and mentors can delete sessions"
ON public.sessions FOR DELETE
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_mentor_of_espaco(auth.uid(), espaco_id)
);

-- =============================================
-- POLÍTICAS RLS - SESSION_MATERIALS
-- =============================================

-- Usuários podem ler materiais de sessões que têm acesso
CREATE POLICY "Users can read materials from accessible sessions"
ON public.session_materials FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.sessions s
        WHERE s.id = session_id
        AND (
            public.is_enrolled_in_espaco(auth.uid(), s.espaco_id)
            OR public.is_admin_or_mentor(auth.uid())
        )
    )
);

-- Admins e mentores podem criar materiais
CREATE POLICY "Admins and mentors can create materials"
ON public.session_materials FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_mentor(auth.uid()));

-- Admins e mentores podem atualizar materiais
CREATE POLICY "Admins and mentors can update materials"
ON public.session_materials FOR UPDATE
TO authenticated
USING (public.is_admin_or_mentor(auth.uid()));

-- Admins e mentores podem deletar materiais
CREATE POLICY "Admins and mentors can delete materials"
ON public.session_materials FOR DELETE
TO authenticated
USING (public.is_admin_or_mentor(auth.uid()));

-- =============================================
-- POLÍTICAS RLS - SESSION_ATTENDANCE
-- =============================================

-- Alunos podem ver apenas sua própria presença
CREATE POLICY "Students can read own attendance"
ON public.session_attendance FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins e mentores podem ver toda a presença
CREATE POLICY "Admins and mentors can read all attendance"
ON public.session_attendance FOR SELECT
TO authenticated
USING (public.is_admin_or_mentor(auth.uid()));

-- Admins e mentores podem criar registros de presença
CREATE POLICY "Admins and mentors can create attendance"
ON public.session_attendance FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_mentor(auth.uid()));

-- Admins e mentores podem atualizar presença
CREATE POLICY "Admins and mentors can update attendance"
ON public.session_attendance FOR UPDATE
TO authenticated
USING (public.is_admin_or_mentor(auth.uid()));

-- =============================================
-- POLÍTICAS RLS - NOTIFICATIONS
-- =============================================

-- Usuários podem ler suas próprias notificações
CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Sistema (service role) pode criar notificações - via edge functions
CREATE POLICY "Service can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_mentor(auth.uid()));

-- =============================================
-- TRIGGER PARA CRIAR PROFILE E ROLE AO REGISTRAR
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Criar profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
    );
    
    -- Criar role padrão (student)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'student');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- FUNÇÃO PARA ATUALIZAR updated_at
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_espacos_updated_at
    BEFORE UPDATE ON public.espacos
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();