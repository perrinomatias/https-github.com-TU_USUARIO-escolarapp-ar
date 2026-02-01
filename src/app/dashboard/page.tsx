
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'
import DashboardLayout from '@/components/DashboardLayout'
import { UserProfile } from '@/types'
import { Loader2, Users, BookOpen, CalendarCheck, Award, MessageCircle } from 'lucide-react'

export default function DashboardPage() {
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            // Fetch Profile
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error || !profileData) {
                console.error('Error fetching profile:', error)
                // Handle no profile case (maybe redirect to setup or error)
            } else {
                setProfile(profileData as UserProfile)
            }
            setLoading(false)
        }

        checkUser()
    }, [router])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!profile) {
        return <div>No se pudo cargar el perfil del usuario.</div>
    }

    return (
        <DashboardLayout userRole={profile.role}>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    Hola, {profile.first_name || 'Usuario'}
                </h1>
                <p className="text-gray-600">
                    Bienvenido a tu panel de control ({profile.role === 'admin' ? 'Administrador' : profile.role === 'teacher' ? 'Profesor' : profile.role === 'student' ? 'Estudiante' : 'Padre/Tutor'}).
                </p>
            </div>

            {/* Role Based Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* Common Widget: Next Events */}
                {/* This is just mock UI for now */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center mb-4">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <CalendarCheck className="h-6 w-6" />
                        </div>
                        <h3 className="ml-3 text-lg font-medium text-gray-900">Próximos Eventos</h3>
                    </div>
                    <p className="text-sm text-gray-500">No hay eventos próximos programados.</p>
                </div>

                {/* Teacher Specific */}
                {profile.role === 'teacher' && (
                    <>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/courses')}>
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Mis Cursos</h3>
                            </div>
                            <p className="text-sm text-gray-500">Gestiona tus cursos asignados y material de estudio.</p>
                        </div>
                    </>
                )}

                {/* Admin Specific */}
                {profile.role === 'admin' && (
                    <>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Users className="h-6 w-6" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Usuarios</h3>
                            </div>
                            <p className="text-sm text-gray-500">Administra profesores, estudiantes y permisos.</p>
                        </div>
                    </>
                )}

                {/* Student Specific */}
                {profile.role === 'student' && (
                    <>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/dashboard/grades')}>
                            <div className="flex items-center mb-4">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                    <Award className="h-6 w-6" />
                                </div>
                                <h3 className="ml-3 text-lg font-medium text-gray-900">Mis Calificaciones</h3>
                            </div>
                            <p className="text-sm text-gray-500">Revisa tu progreso académico y promedios.</p>
                        </div>
                    </>
                )}

            </div>
        </DashboardLayout>
    )
}
