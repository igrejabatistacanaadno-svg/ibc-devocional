import { useEffect, useState, useRef } from 'react'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, FileText,
  Upload, X, Loader2, ExternalLink, GraduationCap,
} from 'lucide-react'
import { cursosApi, cursosPdfsApi } from '@/lib/supabase'
import type { Curso, CursoCategory, CursoStatus } from '@/types'

// --- Helpers -----------------------------------------------------------------
const CATEGORY_OPTIONS: { value: CursoCategory; label: string }[] = [
  { value: 'curso_pdf',      label: 'Curso em PDF'      },
  { value: 'devocional',     label: 'Devocional'        },
  { value: 'estudo_biblico', label: 'Estudo Bíblico'    },
  { value: 'apostila',       label: 'Apostila'          },
  { value: 'material_apoio', label: 'Material de Apoio' },
]

const CATEGORY_BADGE: Record<CursoCategory, string> = {
  curso_pdf:      'bg-blue-100 text-blue-700',
  devocional:     'bg-purple-100 text-purple-700',
  estudo_biblico: 'bg-green-100 text-green-700',
  apostila:       'bg-amber-100 text-amber-700',
  material_apoio: 'bg-gray-100 text-gray-600',
}

const STATUS_BADGE: Record<CursoStatus, { label: string; cls: string }> = {
  published: { label: 'Publicado', cls: 'bg-green-100 text-green-700' },
  draft:     { label: 'Rascunho',  cls: 'bg-yellow-100 text-yellow-700' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// --- Estado do formulário ----------------------------------------------------
interface CursoForm {
  id?: string
  title: string
  description: string
  category: CursoCategory
  pdf_url: string
  cover_image_url: string
  status: CursoStatus
  publish_date: string
}

function emptyForm(): CursoForm {
  return {
    title: '',
    description: '',
    category: 'curso_pdf',
    pdf_url: '',
    cover_image_url: '',
    status: 'draft',
    publish_date: new Date().toISOString().slice(0, 16),
  }
}

// --- Modal de formulário -----------------------------------------------------
function CursoModal({
  form,
  setForm,
  onSave,
  onClose,
  saving,
}: {
  form: CursoForm
  setForm: React.Dispatch<React.SetStateAction<CursoForm>>
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const [uploadingPdf, setUploadingPdf]     = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const pdfRef   = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { alert('Selecione um arquivo PDF.'); return }
    setUploadingPdf(true)
    try {
      const path = `cursos/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const url = await cursosPdfsApi.uploadPdf(file, path)
      setForm(f => ({ ...f, pdf_url: url }))
    } catch (err) {
      alert('Erro ao enviar PDF: ' + (err as Error).message)
    }
    setUploadingPdf(false)
  }

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const path = `capas/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const url = await cursosPdfsApi.uploadCover(file, path)
      setForm(f => ({ ...f, cover_image_url: url }))
    } catch (err) {
      alert('Erro ao enviar capa: ' + (err as Error).message)
    }
    setUploadingCover(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-800 text-base">
            {form.id ? 'Editar Material' : 'Novo Material'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Título *</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Apostila de Discipulado"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Breve descrição do material…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria *</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value as CursoCategory }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* PDF */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Arquivo PDF</label>
            {form.pdf_url ? (
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
                <FileText size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-xs text-green-700 flex-1 truncate">PDF enviado</span>
                <a href={form.pdf_url} target="_blank" rel="noopener noreferrer"
                   className="text-green-600 hover:text-green-800">
                  <ExternalLink size={14} />
                </a>
                <button onClick={() => setForm(f => ({ ...f, pdf_url: '' }))}
                        className="text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => pdfRef.current?.click()}
                disabled={uploadingPdf}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                {uploadingPdf
                  ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
                  : <><Upload size={16} /> Selecionar PDF</>
                }
              </button>
            )}
            <input ref={pdfRef} type="file" accept="application/pdf" className="hidden" onChange={handlePdfUpload} />
          </div>

          {/* Capa */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Imagem de capa (opcional)</label>
            {form.cover_image_url ? (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-gray-200">
                <img src={form.cover_image_url} alt="Capa" className="w-full h-full object-cover" />
                <button
                  onClick={() => setForm(f => ({ ...f, cover_image_url: '' }))}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 text-sm hover:border-primary-400 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                {uploadingCover
                  ? <><Loader2 size={16} className="animate-spin" /> Enviando…</>
                  : <><Upload size={16} /> Selecionar imagem</>
                }
              </button>
            )}
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
          </div>

          {/* Data de publicação */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Data de publicação *</label>
            <input
              type="datetime-local"
              value={form.publish_date}
              onChange={e => setForm(f => ({ ...f, publish_date: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
            <div className="flex gap-2">
              {(['draft', 'published'] as CursoStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    form.status === s
                      ? s === 'published'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {STATUS_BADGE[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || uploadingPdf || uploadingCover}
            className="flex-1 py-2.5 rounded-xl bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={15} className="animate-spin" /> Salvando…</> : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Página admin principal --------------------------------------------------
export default function AdminCursosPage() {
  const [cursos, setCursos]     = useState<Curso[]>([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]         = useState<CursoForm>(emptyForm())
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data } = await cursosApi.getAll()
    if (data) setCursos(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setForm(emptyForm())
    setShowModal(true)
  }

  const openEdit = (c: Curso) => {
    setForm({
      id: c.id,
      title: c.title,
      description: c.description ?? '',
      category: c.category,
      pdf_url: c.pdf_url ?? '',
      cover_image_url: c.cover_image_url ?? '',
      status: c.status,
      publish_date: new Date(c.publish_date).toISOString().slice(0, 16),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { alert('Informe o título.'); return }
    setSaving(true)
    try {
      const payload = {
        title:           form.title.trim(),
        description:     form.description.trim() || null,
        category:        form.category,
        pdf_url:         form.pdf_url || null,
        cover_image_url: form.cover_image_url || null,
        status:          form.status,
        publish_date:    new Date(form.publish_date).toISOString(),
      }
      if (form.id) {
        await cursosApi.update(form.id, payload)
      } else {
        await cursosApi.create(payload)
      }
      setShowModal(false)
      load()
    } catch (err) {
      alert('Erro ao salvar: ' + (err as Error).message)
    }
    setSaving(false)
  }

  const handleDelete = async (curso: Curso) => {
    if (!confirm(`Excluir "${curso.title}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(curso.id)
    try {
      await cursosApi.delete(curso.id)
      setCursos(prev => prev.filter(c => c.id !== curso.id))
    } catch (err) {
      alert('Erro ao excluir: ' + (err as Error).message)
    }
    setDeleting(null)
  }

  const handleToggleStatus = async (curso: Curso) => {
    const newStatus: CursoStatus = curso.status === 'published' ? 'draft' : 'published'
    try {
      await cursosApi.update(curso.id, { status: newStatus })
      setCursos(prev => prev.map(c => c.id === curso.id ? { ...c, status: newStatus } : c))
    } catch (err) {
      alert('Erro ao atualizar status: ' + (err as Error).message)
    }
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap size={20} className="text-primary-700" />
            <h1 className="text-xl font-bold text-gray-800">Cursos e Materiais</h1>
          </div>
          <p className="text-sm text-gray-500">Gerencie PDFs, apostilas e materiais publicados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-700 text-white rounded-xl text-sm font-semibold hover:bg-primary-800 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Novo
        </button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-3">
          <Loader2 size={24} className="text-primary-700 animate-spin" />
          <span className="text-gray-500 text-sm">Carregando…</span>
        </div>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum material cadastrado</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo" para adicionar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cursos.map(curso => {
            const catLabel = CATEGORY_OPTIONS.find(c => c.value === curso.category)?.label ?? curso.category
            const catCls   = CATEGORY_BADGE[curso.category]
            const stBadge  = STATUS_BADGE[curso.status]
            return (
              <div key={curso.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start gap-3">
                  {/* Miniatura */}
                  {curso.cover_image_url ? (
                    <img
                      src={curso.cover_image_url}
                      alt=""
                      className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={22} className="text-primary-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catCls}`}>
                        {catLabel}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stBadge.cls}`}>
                        {stBadge.label}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-800 text-sm truncate">{curso.title}</p>
                    {curso.description && (
                      <p className="text-gray-400 text-xs truncate mt-0.5">{curso.description}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-0.5">{fmtDate(curso.publish_date)}</p>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                  <button
                    onClick={() => openEdit(curso)}
                    className="flex items-center gap-1.5 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleToggleStatus(curso)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      curso.status === 'published'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {curso.status === 'published'
                      ? <><Eye size={12} /> Publicado</>
                      : <><EyeOff size={12} /> Rascunho</>
                    }
                  </button>
                  {curso.pdf_url && (
                    <a
                      href={curso.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <ExternalLink size={12} /> PDF
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(curso)}
                    disabled={deleting === curso.id}
                    className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium ml-auto disabled:opacity-50"
                  >
                    {deleting === curso.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Trash2 size={12} />
                    }
                    Excluir
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CursoModal
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
          saving={saving}
        />
      )}
    </div>
  )
}
