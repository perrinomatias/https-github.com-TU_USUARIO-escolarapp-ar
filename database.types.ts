export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    dni: string
                    first_name: string
                    last_name: string
                    email: string | null
                    role: 'directivo' | 'preceptor' | 'docente' | 'estudiante'
                    phone: string | null
                    address: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    dni: string
                    first_name: string
                    last_name: string
                    email?: string | null
                    role?: 'directivo' | 'preceptor' | 'docente' | 'estudiante'
                    phone?: string | null
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    dni?: string
                    first_name?: string
                    last_name?: string
                    email?: string | null
                    role?: 'directivo' | 'preceptor' | 'docente' | 'estudiante'
                    phone?: string | null
                    address?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            academic_cycles: {
                Row: {
                    id: string
                    name: string
                    start_date: string
                    end_date: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    start_date: string
                    end_date: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    start_date?: string
                    end_date?: string
                    is_active?: boolean
                    created_at?: string
                }
            }
            years: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            divisions: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            subjects: {
                Row: {
                    id: string
                    name: string
                    year_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    year_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    year_id?: string | null
                    created_at?: string
                }
            }
            courses: {
                Row: {
                    id: string
                    academic_cycle_id: string
                    year_id: string
                    division_id: string
                    name: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    academic_cycle_id: string
                    year_id: string
                    division_id: string
                    name?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    academic_cycle_id?: string
                    year_id?: string
                    division_id?: string
                    name?: string | null
                    created_at?: string
                }
            }
            course_subjects: {
                Row: {
                    id: string
                    course_id: string
                    subject_id: string
                    teacher_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    subject_id: string
                    teacher_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    subject_id?: string
                    teacher_id?: string | null
                    created_at?: string
                }
            }
            enrollments: {
                Row: {
                    id: string
                    course_id: string
                    student_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    student_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    student_id?: string
                    created_at?: string
                }
            }
            attendance: {
                Row: {
                    id: string
                    course_id: string
                    student_id: string
                    date: string
                    status: 'presente' | 'ausente_justificado' | 'ausente_injustificado' | 'tarde'
                    recorded_by: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_id: string
                    student_id: string
                    date: string
                    status: 'presente' | 'ausente_justificado' | 'ausente_injustificado' | 'tarde'
                    recorded_by?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_id?: string
                    student_id?: string
                    date?: string
                    status?: 'presente' | 'ausente_justificado' | 'ausente_injustificado' | 'tarde'
                    recorded_by?: string | null
                    created_at?: string
                }
            }
            evaluations: {
                Row: {
                    id: string
                    course_subject_id: string
                    title: string
                    description: string | null
                    date: string
                    weight: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    course_subject_id: string
                    title: string
                    description?: string | null
                    date: string
                    weight?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    course_subject_id?: string
                    title?: string
                    description?: string | null
                    date?: string
                    weight?: number
                    created_at?: string
                }
            }
            grades: {
                Row: {
                    id: string
                    evaluation_id: string
                    student_id: string
                    score: number
                    feedback: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    evaluation_id: string
                    student_id: string
                    score: number
                    feedback?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    evaluation_id?: string
                    student_id?: string
                    score?: number
                    feedback?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            student_subject_averages: {
                Row: {
                    student_id: string
                    course_subject_id: string
                    average_score: number
                }
            }
        }
    }
}
