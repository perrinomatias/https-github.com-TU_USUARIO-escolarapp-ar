
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supaBaseClient'
import { FileText, Award, TrendingUp, AlertCircle } from 'lucide-react'
import clsx from 'clsx'

// Types
type Grade = {
    id: string
    score: number
    type: string
    feedback: string
    created_at: string
    subject_id: string
    subjects: { name: string }
}

type SubjectSummary = {
    subjectName: string
    grades: Grade[]
    average: number
}

export default function StudentGradesPage() {
    const [reportCard, setReportCard] = useState<SubjectSummary[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchGrades = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('grades')
                .select(`
          id,
          score,
          type,
          feedback,
          created_at,
          subject_id,
          subjects ( name )
        `)
                .eq('student_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                // Group by Subject and Calculate Averages
                const grouped: Record<string, Grade[]> = {}
                data.forEach((grade: any) => {
                    const subjectName = grade.subjects?.name || 'Unknown'
                    if (!grouped[subjectName]) grouped[subjectName] = []
                    grouped[subjectName].push(grade)
                })

                const summary: SubjectSummary[] = Object.entries(grouped).map(([subjectName, grades]) => {
                    const total = grades.reduce((acc, curr) => acc + curr.score, 0)
                    const average = total / grades.length
                    return {
                        subjectName,
                        grades,
                        average
                    }
                })

                setReportCard(summary)
            }
            setLoading(false)
        }

        fetchGrades()
    }, [])

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando boletín...</div>

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-indigo-600 h-8 w-8" />
                        Boletín Digital
                    </h1>
                    <p className="text-gray-500 mt-2">Resumen de tu desempeño académico actual.</p>
                </div>

                {/* Global Average Badge */}
                {reportCard.length > 0 && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-full">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-sm font-medium">Promedio General</p>
                            <p className="text-2xl font-bold">
                                {(reportCard.reduce((acc, s) => acc + s.average, 0) / reportCard.length).toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6">
                {reportCard.map((subject) => (
                    <div key={subject.subjectName} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md">

                        {/* Header: Subject + Average */}
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">{subject.subjectName}</h2>
                            <div className={clsx(
                                "px-3 py-1 rounded-full text-sm font-bold border",
                                subject.average >= 7 ? "bg-green-100 text-green-700 border-green-200"
                                    : subject.average >= 4 ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                        : "bg-red-100 text-red-700 border-red-200"
                            )}>
                                Promedio: {subject.average.toFixed(2)}
                            </div>
                        </div>

                        {/* Grades List */}
                        <div className="p-6">
                            {subject.grades.length === 0 ? (
                                <p className="text-gray-400 italic">No hay notas registradas aún.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {subject.grades.map((grade) => (
                                        <div key={grade.id} className="flex flex-col p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                    {grade.type}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(grade.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex items-end gap-2 mb-1">
                                                <span className="text-2xl font-bold text-gray-900">{grade.score}</span>
                                                <span className="text-sm text-gray-400 mb-1">/ 10</span>
                                            </div>
                                            {grade.feedback && (
                                                <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded flex gap-2 items-start">
                                                    <Award className="w-3 h-3 mt-0.5 text-indigo-400 flex-shrink-0" />
                                                    <span className="italic">"{grade.feedback}"</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {reportCard.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-300" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay calificaciones</h3>
                        <p className="mt-1 text-sm text-gray-500">Aún no se han cargado notas en tu boletín.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
