
'use client'

import { useState, useEffect, useTransition } from 'react'
import { supabase } from '@/lib/db'
import { Calendar, Save, CheckCircle2, XCircle } from 'lucide-react'
import clsx from 'clsx'

// Types (Ideally move to /types)
// Types (Ideally move to /types)
type Course = { id: string; name: string }
type Student = { id: string; first_name: string; last_name: string }
// Update type to match Schema
type AttendanceStatus = 'presente' | 'ausente_injustificado' | 'ausente_justificado' | 'tarde'

export default function AttendancePage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [selectedCourse, setSelectedCourse] = useState<string>('')
    const [students, setStudents] = useState<Student[]>([])
    // Update state type
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})
    const [isPending, startTransition] = useTransition()
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    // 1. Load Courses
    useEffect(() => {
        const fetchCourses = async () => {
            const { data } = await supabase.from('courses').select('id, name')
            if (data) setCourses(data)
        }
        fetchCourses()
    }, [])

    // 2. Load Students when Course Selected
    useEffect(() => {
        if (!selectedCourse) return

        const fetchStudents = async () => {
            // Join enrollments -> profiles
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
              student_id,
              profiles:student_id (id, first_name, last_name)
            `)
                .eq('course_id', selectedCourse)

            if (data) {
                // @ts-ignore: complex join typing
                const mappedStudents = data.map(item => item.profiles).flat() as unknown as Student[]
                setStudents(mappedStudents)

                // Reset attendance draft
                const initialAttendance: Record<string, AttendanceStatus> = {}
                // Default to 'ausente_injustificado' or 'presente'? Usually present.
                // Let's default to 'ausente_injustificado' as per previous code logic (which seemed to default to absent?)
                // Previous code: mappedStudents.forEach((s: any) => initialAttendance[s.id] = 'absent')
                mappedStudents.forEach((s: any) => initialAttendance[s.id] = 'ausente_injustificado')
                setAttendance(initialAttendance)
            }
        }

        fetchStudents()
    }, [selectedCourse])

    const toggleAttendance = (studentId: string) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'presente' ? 'ausente_injustificado' : 'presente'
        }))
    }

    const handleSave = () => {
        startTransition(async () => {
            // Format for DB insert
            const updates = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: studentId,
                course_id: selectedCourse,
                date: new Date().toISOString().split('T')[0],
                status
            }))

            // In real app: Upsert logic (checking if record exists for today)
            // For demo: Insert
            const { error } = await supabase.from('attendance').upsert(updates, { onConflict: 'student_id, course_id, date' })

            if (!error) {
                setLastSaved(new Date())
            } else {
                console.error('Save failed', error)
                alert('Error al guardar asistencia')
            }
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Calendar className="text-indigo-600" />
                    Control de Asistencia
                </h1>
                {lastSaved && (
                    <span className="text-sm text-green-600 flex items-center gap-1 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4" /> Guardado {lastSaved.toLocaleTimeString()}
                    </span>
                )}
            </div>

            {/* Course Selector */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Curso</label>
                <select
                    className="w-full md:w-1/3 p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                >
                    <option value="">-- Elige un curso --</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Students List */}
            {selectedCourse && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Presente</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={2} className="px-6 py-4 text-center text-gray-500">No hay estudiantes inscritos.</td>
                                </tr>
                            ) : (
                                students.map((student) => (
                                    <tr key={student.id} className={clsx("transition-colors", attendance[student.id] === 'presente' ? 'bg-indigo-50/50' : '')}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {student.last_name}, {student.first_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => toggleAttendance(student.id)}
                                                className={clsx(
                                                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                    attendance[student.id] === 'presente' ? 'bg-indigo-600' : 'bg-gray-200'
                                                )}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={clsx(
                                                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                        attendance[student.id] === 'presente' ? 'translate-x-5' : 'translate-x-0'
                                                    )}
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                        <button
                            onClick={handleSave}
                            disabled={isPending || students.length === 0}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
                        >
                            {isPending ? (
                                <>Guardando...</>
                            ) : (
                                <><Save className="mr-2 h-4 w-4" /> Guardar Asistencia</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
