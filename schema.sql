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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Ciclo Lectivo 2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.years (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "1° Año", "2° Año"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.divisions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "A", "B", "C"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., "Matemática", "Lengua"
    year_id UUID REFERENCES public.years(id), -- Materia corresponde a un año curricular
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. COURSES (The implementation of a Year+Division in a Cycle)
CREATE TABLE public.courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_cycle_id UUID REFERENCES public.academic_cycles(id) NOT NULL,
    year_id UUID REFERENCES public.years(id) NOT NULL,
    division_id UUID REFERENCES public.divisions(id) NOT NULL,
    name TEXT, -- Derived, e.g., "1° A 2024"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(academic_cycle_id, year_id, division_id)
);

-- 5. COURSE_SUBJECTS (A specific subject taught in a course by a teacher)
CREATE TABLE public.course_subjects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    subject_id UUID REFERENCES public.subjects(id) NOT NULL,
    teacher_id UUID REFERENCES public.profiles(id), -- Can be null initially
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, subject_id)
);

-- 6. ENROLLMENTS (Students in a Course)
CREATE TABLE public.enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(course_id, student_id)
);

-- 7. ATTENDANCE (Daily attendance for a student in a course)
CREATE TABLE public.attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_subject_id UUID REFERENCES public.course_subjects(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL, -- e.g. "Parcial 1"
    description TEXT,
    date DATE NOT NULL,
    weight NUMERIC DEFAULT 1.0, -- Multiplier for weighted average
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. GRADES
CREATE TABLE public.grades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
-- View: Directivos, Preceptors see all. Teachers/Students see limited (implemented via app logic often, but for RLS lets allow read for auth users to find names).
-- Strict Mode: Everyone can read basic info to resolve names.
CREATE POLICY "Profiles are viewable by everyone authenticated" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
-- Edit: Users can edit their own. Directivos can edit anyone.
CREATE POLICY "Users can edit own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Directivos can edit all profiles" ON public.profiles FOR ALL USING (get_my_role() = 'directivo');

-- ACADEMIC STRUCTURE (Cycles, Years, Divisions, Subjects, Courses)
-- All authenticated can view.
CREATE POLICY "Academic structure viewable by authenticated" ON public.academic_cycles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.years FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.divisions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.subjects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Academic structure viewable by authenticated" ON public.course_subjects FOR SELECT USING (auth.role() = 'authenticated');

-- Manage: Only Directivos (and maybe Preceptors for some).
CREATE POLICY "Directivos manage academic structure" ON public.academic_cycles FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage years" ON public.years FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage divisions" ON public.divisions FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage subjects" ON public.subjects FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage courses" ON public.courses FOR ALL USING (get_my_role() = 'directivo');
CREATE POLICY "Directivos manage course_subjects" ON public.course_subjects FOR ALL USING (get_my_role() = 'directivo');

-- ENROLLMENTS
-- View: Directivos, Preceptos, Teachers (of that course? or all? Let's say all for simplicity in finding students), Students (see their own classmates? or just own).
-- Let's allow all authenticated to read enrollments to see who is in a course.
CREATE POLICY "Enrollments viewable by authenticated" ON public.enrollments FOR SELECT USING (auth.role() = 'authenticated');
-- Manage: Directivos and Preceptors.
CREATE POLICY "Directivos and Preceptors manage enrollments" ON public.enrollments FOR ALL
USING (get_my_role() IN ('directivo', 'preceptor'));

-- ATTENDANCE
-- View: Directivos, Preceptors. Teachers (their courses? or all?). Students (own only).
CREATE POLICY "Staff view all attendance" ON public.attendance FOR SELECT
USING (get_my_role() IN ('directivo', 'preceptor', 'docente'));

CREATE POLICY "Students view own attendance" ON public.attendance FOR SELECT
USING (auth.uid() = student_id);

-- Manage: Preceptors (primary), Directivos. (Maybe teachers if they take roll call).
CREATE POLICY "Preceptors and Directivos manage attendance" ON public.attendance FOR ALL
USING (get_my_role() IN ('directivo', 'preceptor'));
-- If Teachers take attendance:
CREATE POLICY "Teachers take attendance for their courses" ON public.attendance FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.course_subjects cs
        WHERE cs.course_id = attendance.course_id
        AND cs.teacher_id = auth.uid()
    )
);

-- EVALUATIONS
-- View: All (Students need to see what exams they have).
CREATE POLICY "Evaluations viewable by authenticated" ON public.evaluations FOR SELECT USING (auth.role() = 'authenticated');

-- Manage: Teachers (own subjects), Directivos.
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
-- View: Staff. Students (own only).
CREATE POLICY "Staff view all grades" ON public.grades FOR SELECT
USING (get_my_role() IN ('directivo', 'preceptor', 'docente'));

CREATE POLICY "Students view own grades" ON public.grades FOR SELECT
USING (auth.uid() = student_id);

-- Manage: Teachers (own evaluations), Directivos.
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
