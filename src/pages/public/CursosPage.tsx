import { useEffect, useState } from 'react'
import { GraduationCap, FileText, ExternalLink, X, Loader2 } from 'lucide-react'
import { cursosApi } from '@/lib/supabase'
import type { Curso, CursoCategory } from '@/types'
import Header from '@/components/layout/Header'

// --- Categorias ---------------------------------------------------------------
const CATEGORIES: { value: 'all' | CursoCategory; label: string }[] = [
  { value: 'all',            label: 'Todos'           },
  { value: 'curso_pdf',      label: 'Curso em PDF'    },
  { value: 'devocional',     label: 'Devocional'      },
  { value: 'estudo_biblico', label: 'Estudo Bíblico'  },
  { value: 'apostila',       label: 'Apostila'        },
  { value: 'material_apoio', label: 'Material de Apoio' },
]

const CATEGORY_BADGE: Record<CursoCategory, { label: string; cls: string }> = {
  curso_pdf:      { label: 'Curso em PDF',      cls: 'bg-blue-100 text-blue-700'    },
  devocional:     { label: 'Devocional',        cls: 'bg-purple-100 text-purple-700' },
  estudo_biblico: { label: 'Estudo Bíblico',    cls: 'bg-green-100 text-green-700'  },
  apostila:       { label: 'Apostila',          cls: 'bg-amber-100 text-amber-700'  },
  material_apoio: { label: 'Material de Apoio', cls: 'bg-gray-100 text-gray-600'    },
}

// Detecta iOS para abrir PDF externamente (iframes não funcionam bem no iOS)
function isIOS() {
  return /iP(hone|ad|od)/.test(navigator.userAgent)
}

// --- Viewer modal -------------------------------------------------------------
function PdfViewerModal({ curso, onClose }: { curso: Curso; onClose: () => void }) {
  const badge = CATEGORY_BADGE[curso.category]

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-white shadow-md flex-shrink-0"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-sm truncate">{curso.title}</p>
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
            {badge.label}
          </span>
        </div>
        {curso.pdf_url && (
          <a
            href={curso.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary-700 font-medium px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors flex-shrink-0"
          >
            <ExternalLink size={14} />
            Abrir
          </a>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden" onClick={e => e.stopPropagation()}>
        {!curso.pdf_url ? (
          <div className="flex items-center justify-center h-full text-white">
            <p>PDF não disponível.</p>
          </div>
        ) : isIOS() ? (
          // iOS: iframe geralmente falha — mostra botão de abrir externamente
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
            <FileText size={56} className="text-white/60" />
            <p className="text-white font-semibold text-lg">{curso.title}</p>
            <p className="text-white/70 text-sm">
              No iOS, o PDF precisa ser aberto no navegador.
            </p>
            <a
              href={curso.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white text-primary-700 font-semibold rounded-xl shadow-lg"
            >
              <ExternalLink size={18} />
              Abrir PDF
            </a>
          </div>
        ) : (
          <iframe
            src={curso.pdf_url}
            title={curso.title}
            className="w-full h-full border-0"
          />
        )}
      </div>
    </div>
  )
}

// --- Card de curso -----------------------------------------------------------
function CursoCard({ curso, onOpen }: { curso: Curso; onOpen: (c: Curso) => void }) {
  const badge = CATEGORY_BADGE[curso.category]
  const date = new Date(curso.publish_date).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Capa */}
      {curso.cover_image_url ? (
        <div
          className="h-36 bg-gray-100"
          style={{
            backgroundImage: `url(${curso.cover_image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <div className="h-36 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
          <FileText size={40} className="text-primary-300" />
        </div>
      )}

      {/* Conteúdo */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>
            {badge.label}
          </span>
          <span className="text-xs text-gray-400 flex-shrink-0">{date}</span>
        </div>

        <h3 className="font-bold text-gray-800 text-sm leading-snug mb-1">{curso.title}</h3>

        {curso.description && (
          <p className="text-gray-500 text-xs leading-relaxed mb-3 line-clamp-2">
            {curso.description}
          </p>
        )}

        <button
          onClick={() => onOpen(curso)}
          disabled={!curso.pdf_url}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary-700 text-white text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText size={15} />
          {curso.pdf_url ? 'Abrir PDF' : 'PDF indisponível'}
        </button>
      </div>
    </div>
  )
}

// --- Página principal --------------------------------------------------------
export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<'all' | CursoCategory>('all')
  const [viewing, setViewing] = useState<Curso | null>(null)

  useEffect(() => {
    cursosApi.getPublished().then(({ data }) => {
      if (data) setCursos(data)
      setLoading(false)
    })
  }, [])

  const filtered = activeCategory === 'all'
    ? cursos
    : cursos.filter(c => c.category === activeCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Cursos e Materiais" />

      <div className="px-4 pt-4 pb-28">

        {/* Introdução */}
        <div className="text-center py-2 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={26} className="text-primary-700" />
          </div>
          <h2 className="text-gray-800 font-bold text-lg">Cursos e Materiais</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
            Acesse PDFs, apostilas, estudos bíblicos e materiais de apoio da Igreja
          </p>
        </div>

        {/* Filtros de categoria (scroll horizontal) */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeCategory === cat.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="text-primary-700 animate-spin" />
            <p className="text-gray-500 text-sm">Carregando materiais…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-gray-600 font-semibold">Nenhum material encontrado</p>
            <p className="text-gray-400 text-sm mt-1">
              {activeCategory === 'all'
                ? 'Em breve novos materiais serão publicados'
                : 'Não há materiais nessa categoria ainda'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map(curso => (
              <CursoCard key={curso.id} curso={curso} onOpen={setViewing} />
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      {viewing && (
        <PdfViewerModal curso={viewing} onClose={() => setViewing(null)} />
      )}
    </div>
  )
}
