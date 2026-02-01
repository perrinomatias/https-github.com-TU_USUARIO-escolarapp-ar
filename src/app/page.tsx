
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white">
        <h1 className="text-xl font-bold text-indigo-600">EscolarApp</h1>
        <Link
          href="/login"
          className="px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
        >
          Iniciar Sesión
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50">
        <h2 className="text-4xl sm:text-6xl font-extrabold text-slate-900 mb-6">
          Gestión Escolar <br /> <span className="text-indigo-600">Simplificada</span>
        </h2>
        <p className="max-w-2xl text-lg text-slate-600 mb-8">
          La plataforma integral para directivos, docentes, estudiantes y familias.
          Accede a notas, asistencia y comunicados en tiempo real.
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="group flex items-center gap-2 px-6 py-3 rounded-full bg-indigo-600 text-white text-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Comenzar
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </main>

      <footer className="py-6 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} EscolarApp. Todos los derechos reservados.
      </footer>
    </div>
  );
}
