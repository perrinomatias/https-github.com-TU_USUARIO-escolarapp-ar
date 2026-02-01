'use client'

import { useState, useEffect, useTransition } from 'react'
import { supabase } from '@/lib/db'
import { Users, Plus, Loader2, Mail, User, GraduationCap } from 'lucide-react'
import Modal from '@/components/ui/Modal'

type Student = {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
}

type Course = {
    id: string
    name: string
    years: { name: string } | null
}

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

    // Form state
    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Assignment state
    const [selectedStudent, setSelectedStudent] = useState<string>('')
    const [selectedCourse, setSelectedCourse] = useState<string>('')

    // Fetch students
    const fetchStudents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'estudiante') // Changed from 'student' to 'estudiante'
            .order('last_name', { ascending: true })

        if (data) setStudents(data)
        if (error) console.error('Error fetching students:', error)
        setLoading(false)
    }

    // Fetch courses
    const fetchCourses = async () => {
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                years ( name )
            `)
            .order('name', { ascending: true })

        if (data) {
            // @ts-ignore
            setCourses(data)
        }
        if (error) console.error('Error fetching courses:', error)
    }

    useEffect(() => {
        fetchStudents()
        fetchCourses()
    }, [])

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!email.trim() || !firstName.trim() || !lastName.trim()) {
            setError('Todos los campos son obligatorios')
            return
        }

        startTransition(async () => {
            // Create profile (simplified - assumes auth user exists or is created elsewhere)
            const { error: profileError } = await supabase.from('profiles').insert({
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                role: 'estudiante'
            })

            if (profileError) {
                setError('Error al agregar estudiante: ' + profileError.message)
            } else {
                setSuccess('Estudiante agregado exitosamente')
                setEmail('')
                setFirstName('')
                setLastName('')
                setTimeout(() => {
                    setIsModalOpen(false)
                    setSuccess(null)
                    fetchStudents()
                }, 1500)
            }
        })
    }

    const handleAssignToCourse = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!selectedStudent || !selectedCourse) {
            setError('Selecciona un estudiante y un curso')
            return
        }

        startTransition(async () => {
            const { error: enrollError } = await supabase.from('enrollments').insert({
                student_id: selectedStudent,
                course_id: selectedCourse
            })

            if (enrollError) {
                setError('Error al asignar: ' + enrollError.message)
            } else {
                setSuccess('Estudiante asignado exitosamente')
                setSelectedStudent('')
                setSelectedCourse('')
                setTimeout(() => {
                    setIsAssignModalOpen(false)
                    setSuccess(null)
                }, 1500)
            }
        })
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-indigo-600" />
                        Gestión de Estudiantes
                    </h1>
                    <p className="text-gray-500 mt-1">Administra los estudiantes y sus asignaciones</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAssignModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-indigo-600 rounded-md shadow-sm text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
                    >
                        <GraduationCap className="mr-2 h-4 w-4" />
                        Asignar a Curso
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Agregar Estudiante
                    </button>
                </div>
            </div>

            {/* Students Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : students.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <Users className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay estudiantes</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza agregando el primer estudiante.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {student.last_name}, {student.first_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Mail className="mr-2 h-4 w-4" />
                                            {student.email}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Student Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Agregar Estudiante"
                size="md"
            >
                <form onSubmit={handleAddStudent} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            placeholder="estudiante@ejemplo.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Agregando...
                                </>
                            ) : (
                                'Agregar'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Assign to Course Modal */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Asignar Estudiante a Curso"
                size="md"
            >
                <form onSubmit={handleAssignToCourse} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 border-l-4 border-green-400 p-4">
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            required
                        >
                            <option value="">Seleccionar estudiante...</option>
                            {students.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.last_name}, {s.first_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            required
                        >
                            <option value="">Seleccionar curso...</option>
                            {courses.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name} - {c.years?.name || 'N/A'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAssignModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Asignando...
                                </>
                            ) : (
                                'Asignar'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
