
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/db'
import {
    Menu, X, Home, User, BookOpen, Calendar,
    LogOut, GraduationCap, FileText, Settings
} from 'lucide-react'
import clsx from 'clsx'

interface DashboardLayoutProps {
    children: React.ReactNode
    userRole?: string
}

export default function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const navigation = [
        { name: 'Inicio', href: '/dashboard', icon: Home, roles: ['admin', 'teacher', 'student', 'parent'] },
        { name: 'Cursos', href: '/dashboard/courses', icon: GraduationCap, roles: ['admin', 'teacher'] },
        { name: 'Asistencia', href: '/dashboard/attendance', icon: Calendar, roles: ['admin', 'teacher', 'parent'] },
        { name: 'Notas', href: '/dashboard/grades', icon: FileText, roles: ['teacher', 'student', 'parent'] },
        { name: 'Perfil', href: '/dashboard/profile', icon: User, roles: ['admin', 'teacher', 'student', 'parent'] },
        // { name: 'Configuración', href: '/dashboard/settings', icon: Settings, roles: ['admin'] },
    ]

    // Filter nav items based on user role (if provided, otherwise show all/common)
    const filteredNav = userRole
        ? navigation.filter(item => item.roles.includes(userRole))
        : navigation

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-700 bg-opacity-75 sm:hidden"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={clsx(
                "fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 text-white transform transition-transform duration-200 ease-in-out sm:translate-x-0 sm:static sm:inset-auto sm:h-screen sm:flex sm:flex-col",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex items-center justify-between h-16 px-4 bg-slate-900">
                    <span className="text-xl font-bold tracking-wider uppercase">EscolarApp</span>
                    <button onClick={() => setSidebarOpen(false)} className="sm:hidden text-gray-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-2 py-4 space-y-1">
                    {filteredNav.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-slate-700 hover:text-white text-gray-300 transition-colors"
                        >
                            <item.icon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-300 hover:bg-red-900/20 hover:text-red-100 rounded-md transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen sm:ml-0"> {/* sm:ml-0 because sidebar is flex in layout not fixed on desktop */}
                {/* Mobile Header */}
                <div className="sm:hidden flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
                    <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-700">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-lg font-semibold text-gray-900">EscolarApp</span>
                    <div className="w-6"></div> {/* Spacer for centering */}
                </div>

                <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
