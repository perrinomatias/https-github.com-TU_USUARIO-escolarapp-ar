'use client'

import { useState, useEffect, useTransition } from 'react'
import { supabase } from '@/lib/db'
import { UserCog, Plus, Loader2, Mail, User } from 'lucide-react'
import Modal from '@/components/ui/Modal'

type StaffMember = {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    role: string
}

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Form state
    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [role, setRole] = useState<'docente' | 'directivo' | 'preceptor'>('docente')
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Fetch staff members
    const fetchStaff = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .in('role', ['docente', 'directivo', 'preceptor'])
            .order('last_name', { ascending: true })

        if (data) setStaff(data)
        if (error) console.error('Error fetching staff:', error)
        setLoading(false)
    }

    useEffect(() => {
        fetchStaff()
    }, [])

    const handleAddStaff = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!email.trim() || !firstName.trim() || !lastName.trim()) {
            setError('Todos los campos son obligatorios')
            return
        }

        startTransition(async () => {
            // In a real app, you'd use Supabase Admin API to createAuth users
            // For this demo, we'll create a profile directly (assumes user exists in auth)
            // NOTE: This is simplified - in production you need proper user creation flow

            // Simulated: Create user via Supabase Admin or invite link
            // For now, just create profile entry
            const { error: profileError } = await supabase.from('profiles').insert({
                email: email.trim(),
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                role
            })

            if (profileError) {
                setError('Error al agregar personal. Nota: El usuario debe existir en Auth primero.')
            } else {
                setSuccess('Personal agregado exitosamente')
                setEmail('')
                setFirstName('')
                setLastName('')
                setRole('docente')
                setTimeout(() => {
                    setIsModalOpen(false)
                    setSuccess(null)
                    fetchStaff()
                }, 1500)
            }
        })
    }

    const getRoleBadge = (role: string) => {
        const styles = {
            docente: 'bg-blue-100 text-blue-700 border-blue-200',
            directivo: 'bg-purple-100 text-purple-700 border-purple-200',
            preceptor: 'bg-orange-100 text-orange-700 border-orange-200'
        }
        const labels = {
            docente: 'Docente',
            directivo: 'Directivo',
            preceptor: 'Preceptor'
        }
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[role as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
                {labels[role as keyof typeof labels] || role}
            </span>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <UserCog className="text-indigo-600" />
                        Gestión de Personal
                    </h1>
                    <p className="text-gray-500 mt-1">Administra profesores y directivos</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Personal
                </button>
            </div>

            {/* Staff Table */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                </div>
            ) : staff.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <UserCog className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay personal</h3>
                    <p className="mt-1 text-sm text-gray-500">Comienza agregando el primer miembro del personal.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {staff.map((member) => (
                                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <User className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {member.last_name}, {member.first_name}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-sm text-gray-500">
                                            <Mail className="mr-2 h-4 w-4" />
                                            {member.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRoleBadge(member.role)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Add Staff Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Agregar Personal"
                size="md"
            >
                <form onSubmit={handleAddStaff} className="space-y-4">
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            placeholder="email@ejemplo.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            placeholder="Juan"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellido
                        </label>
                        <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                            placeholder="Pérez"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rol
                        </label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value as 'docente' | 'directivo' | 'preceptor')}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 border"
                        >
                            <option value="docente">Docente</option>
                            <option value="preceptor">Preceptor</option>
                            <option value="directivo">Directivo</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
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
        </div>
    )
}
