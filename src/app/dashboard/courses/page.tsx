'use client'

import { useState, useEffect, useTransition } from 'react'
import { supabase } from '@/lib/db'
import { GraduationCap, Plus, Loader2, Calendar } from 'lucide-react'
import Modal from '@/components/ui/Modal'

type Course = {
    id: string
    name: string
    years: { name: string } | null
    created_at: string
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form state
    const [courseName, setCourseName] = useState('')
    const [courseYear, setCourseYear] = useState(new Date().getFullYear())
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    // Fetch courses
    const fetchCourses = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('courses')
            .select(`
                *,
                years (
                    name
                )
            `)
            .order('name', { ascending: true })

        if (data) {
            // @ts-ignore
            setCourses(data)
        }
        if (error) console.error('Error fetching courses:', error)
        setLoading(false)
    }

    useEffect(() => {
        fetchCourses()
    }, [])

    const handleCreateCourse = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // TODO: Update creation logic to match new schema (requires strict year/division selection)
        setError('La creación de cursos requiere seleccionar Ciclo, Año y División (Funcionalidad en desarrollo)')
        return;
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap className="text-indigo-600" />
                        Gestión de Cursos
                    </h1>
                    <p className="text-gray-500 mt-1">Administra los cursos de la institución</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Curso
                </button>
            </div>

            {/* Courses Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <GraduationCap className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay cursos</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza creando el primer curso.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                        <div
                            key={course.id}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <GraduationCap className="h-5 w-5 text-indigo-600" />
                                    </div>
                                </div>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {course.years?.name || 'N/A'}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{course.name}</h3>
                            <p className="text-sm text-gray-500">Ciclo Lectivo 2026</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Course Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Crear Nuevo Curso"
                size="md"
            >
                <form onSubmit={handleCreateCourse} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Curso
                        </label>
                        <input
                            type="text"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            placeholder="Ej: 5to A, 1er año, etc."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Año Lectivo
                        </label>
                        <input
                            type="number"
                            value={courseYear}
                            onChange={(e) => setCourseYear(parseInt(e.target.value))}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            min="2020"
                            max="2030"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                                    Creando...
                                </>
                            ) : (
                                'Crear Curso'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
