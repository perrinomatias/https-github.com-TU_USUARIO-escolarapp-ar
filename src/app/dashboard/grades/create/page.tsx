
'use client'

import { useState, useEffect, useTransition } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BookOpen, UserCheck, Save, Award } from 'lucide-react'

// Mock types
type Subject = { id: string; name: string; course_id: string; courses: { name: string } }
type Student = { id: string; first_name: string; last_name: string }

export default function CreateGradePage() {
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [students, setStudents] = useState<Student[]>([])

    const [selectedSubject, setSelectedSubject] = useState<string>('')
    const [selectedStudent, setSelectedStudent] = useState<string>('')
    const [score, setScore] = useState<string>('')
    const [type, setType] = useState<string>('Examen')
    const [feedback, setFeedback] = useState<string>('')

    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // 1. Fetch Teacher's Subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('subjects')
                .select(`
          id, 
          name, 
          course_id,
          courses ( name )
        `)
                .eq('teacher_id', user.id)

            if (data) {
                // @ts-ignore
                setSubjects(data)
            }
        }
        fetchSubjects()
    }, [])

    // 2. Fetch Students when Subject Selected
    useEffect(() => {
        if (!selectedSubject) {
            setStudents([])
            return
        }

        const fetchStudentsForSubject = async () => {
            const subject = subjects.find(s => s.id === selectedSubject)
            if (!subject) return

            const { data } = await supabase
                .from('enrollments')
                .select(`
          student_id,
          profiles:student_id (id, first_name, last_name)
        `)
                .eq('course_id', subject.course_id)

            if (data) {
                // @ts-ignore
                setStudents(data.map(d => d.profiles))
            }
        }

        fetchStudentsForSubject()
    }, [selectedSubject, subjects])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (!selectedSubject || !selectedStudent || !score) {
            setMessage({ type: 'error', text: 'Por favor completa todos los campos obligatorios.' })
            return
        }

        startTransition(async () => {
            const { error } = await supabase.from('grades').insert({
                student_id: selectedStudent,
                subject_id: selectedSubject,
                score: parseFloat(score),
                type,
                feedback,
                created_by: (await supabase.auth.getUser()).data.user?.id
            })

            if (error) {
                setMessage({ type: 'error', text: 'Error al cargar la nota: ' + error.message })
            } else {
                setMessage({ type: 'success', text: 'Nota cargada exitosamente.' })
                // Reset form partially
                setScore('')
                setFeedback('')
                setSelectedStudent('')
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Award className="text-indigo-600" />
                    Cargar Calificaciones
                </h1>
                <p className="text-gray-500 mt-1">Selecciona una materia y un estudiante para asignar una nota.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">

                {/* Status Message */}
                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* Subject Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Materia / Curso</label>
                    <div className="relative">
                        <BookOpen className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                        >
                            <option value="">Seleccionar Materia...</option>
                            {subjects.map(s => (
                                // @ts-ignore
                                <option key={s.id} value={s.id}>{s.name} - {s.courses?.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Student Select */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
                    <div className="relative">
                        <UserCheck className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            disabled={!selectedSubject}
                        >
                            <option value="">Seleccionar Estudiante...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.last_name}, {s.first_name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Score */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota (0-10)</label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="10"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="Ej: 8.50"
                        />
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evaluación</label>
                        <select
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option>Examen</option>
                            <option>Trabajo Práctico</option>
                            <option>Participación</option>
                            <option>Final</option>
                        </select>
                    </div>
                </div>

                {/* Feedback */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios / Feedback</label>
                    <textarea
                        rows={3}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Opcional: Buen trabajo, mejorar ortografía..."
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
                    >
                        {isPending ? 'Guardando...' : 'Cargar Nota'}
                    </button>
                </div>

            </form>
        </div>
    )
}
