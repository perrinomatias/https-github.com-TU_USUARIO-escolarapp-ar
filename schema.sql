-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS & TYPES
CREATE TYPE app_role AS ENUM ('directivo', 'preceptor', 'docente', 'estudiante');
CREATE TYPE attendance_status AS ENUM ('presente', 'ausente_justificado', 'ausente_injustificado', 'tarde');

-- 2. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    dni TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    role app_role NOT NULL DEFAULT 'estudiante',
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ACADEMIC STRUCTURE
CREATE TABLE public.academic_cycles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Ciclo Lectivo 2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.years (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "1° Año", "2° Año"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.divisions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "A", "B", "C"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Matemática", "Lengua"
    year_id UUID REFERENCES public.years(id), -- Materia corresponde a un año curricular
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COURSES (The implementation of a Year+Division in a Cycle)
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    academic_cycle_id UUID REFERENCES public.academic_cycles(id) NOT NULL,
    year_id UUID REFERENCES public.years(id) NOT NULL,
    division_id UUID REFERENCES public.divisions(id) NOT NULL,
    name TEXT, -- Derived, e.g., "1° A 2024"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(academic_cycle_id, year_id, division_id)
);

-- 5. COURSE_SUBJECTS (A specific subject taught in a course by a teacher)
CREATE TABLE public.course_subjects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id), -- Can be null initially
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, subject_id)
);

-- 6. ENROLLMENTS (Students in a Course)
CREATE TABLE public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, student_id)
);

-- 7. ATTENDANCE (Daily attendance for a student in a course)
CREATE TABLE public.attendance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    recorded_by UUID REFERENCES public.profiles(id), -- Who took attendance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, course_id, date)
);

-- 8. EVALUATIONS (Exams, Assignments)
CREATE TABLE public.evaluations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_subject_id UUID REFERENCES public.course_subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- e.g. "Parcial 1"
    description TEXT,
    date DATE NOT NULL,
    weight NUMERIC DEFAULT 1.0, -- Multiplier for weighted average
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. GRADES
CREATE TABLE public.grades (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    score NUMERIC NOT NULL CHECK (score >= 1 AND score <= 10),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(evaluation_id, student_id)
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- PROFILES
CREATE POLICY "Profiles are viewable by everyone authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Directivos can edit all profiles" ON public.profiles FOR ALL USING (get_my_role() = 'directivo');

-- ACADEMIC STRUCTURE
CREATE POLICY "Academic structure viewable by authenticated" ON public.academic_cycles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.divisions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.course_subjects FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Directivos manage academic structure" ON public.academic_cycles FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage years" ON public.years FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage divisions" ON public.divisions FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage subjects" ON public.subjects FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage courses" ON public.courses FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage course_subjects" ON public.course_subjects FOR ALL USING (get_my_role() = 'directivo');

-- ENROLLMENTS
CREATE POLICY "Enrollments viewable by authenticated" ON public.enrollments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Directivos and Preceptors manage enrollments" ON public.enrollments FOR ALL
USING (get_my_role() IN ('directivo', 'preceptor'));

-- ATTENDANCE
CREATE POLICY "Staff view all attendance" ON public.attendance FOR SELECT
USING (get_my_role() IN ('directivo', 'preceptor', 'docente'));

CREATE POLICY "Students view own attendance" ON public.attendance FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Preceptors and Directivos manage attendance" ON public.attendance FOR ALL
USING (get_my_role() IN ('directivo', 'preceptor'));

CREATE POLICY "Teachers take attendance for their courses" ON public.attendance FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.course_subjects cs
        WHERE cs.course_id = attendance.course_id
        AND cs.teacher_id = auth.uid()
    )
);

-- EVALUATIONS
CREATE POLICY "Evaluations viewable by authenticated" ON public.evaluations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Directivos manage evaluations" ON public.evaluations FOR ALL USING (get_my_role() = 'directivo');

CREATE POLICY "Teachers manage evaluations for their subjects" ON public.evaluations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.course_subjects cs
        WHERE cs.id = evaluations.course_subject_id
        AND cs.teacher_id = auth.uid()
    )
);

-- GRADES
CREATE POLICY "Staff view all grades" ON public.grades FOR SELECT
USING (get_my_role() IN ('directivo', 'preceptor', 'docente'));

CREATE POLICY "Students view own grades" ON public.grades FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Directivos manage grades" ON public.grades FOR ALL USING (get_my_role() = 'directivo');

CREATE POLICY "Teachers assign grades for their evaluations" ON public.grades FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.evaluations e
        JOIN public.course_subjects cs ON e.course_subject_id = cs.id
        WHERE e.id = grades.evaluation_id
        AND cs.teacher_id = auth.uid()
    )
);

-- VIEWS
-- Calculate averages per student per course subject
CREATE OR REPLACE VIEW public.student_subject_averages AS
SELECT
    s.id as student_id,
    cs.id as course_subject_id,
    AVG(g.score) as average_score
FROM public.profiles s
JOIN public.grades g ON g.student_id = s.id
JOIN public.evaluations e ON g.evaluation_id = e.id
JOIN public.course_subjects cs ON e.course_subject_id = cs.id
GROUP BY s.id, cs.id;

-- Enable RLS for View (Propagates base table policies usually for simple views, but views can be tricky with RLS. 
-- Best practice in supabase for views is often to rely on the underlying tables' policies OR define security invoker)
ALTER VIEW public.student_subject_averages OWNER TO authenticated;
-- Note: Views in Supabase/Postgres don't have RLS enabled by default like tables. 
-- Accessing this view will run as the owner of the view unless 'security_invoker' is set.
-- Let's set security_invoker to true so it respects the RLS of the underlying tables.
ALTER VIEW public.student_subject_averages SET (security_invoker = on);
