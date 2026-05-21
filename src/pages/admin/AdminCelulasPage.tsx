import { useEffect, useState } from 'react'
import {
  Plus, Pencil, Trash2, Pin, PinOff, FileText, Megaphone,
  Bell, Mic2, MessageCircle, Eye, EyeOff, Upload, X, Save,
} from 'lucide-react'
import { celulasApi, celulaPostsApi, celulaMaterialsApi } from '@/lib/supabase'
import type { Celula, CelulaPost, CelulaPostType } from '@/types'

// --- Helpers -----------------------------------------------------------------
const POST_TYPES: { value: CelulaPostType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'comunicado', label: 'Comunicado', icon: Megaphone,     color: 'blue'   },
  { value: 'aviso',      label: 'Aviso',      icon: Bell,          color: 'amber'  },
  { value: 'pdf_curso',  label: 'PDF/Curso',  icon: FileText,      color: 'red'    },
  { value: 'pregacao',   label: 'Pregação',   icon: Mic2,          color: 'purple' },
  { value: 'interacao',  label: 'Interação',  icon: MessageCircle, color: 'green'  },
]

const TYPE_BADGE: Record<CelulaPostType, { label: string; cls: string }> = {
  comunicado: { label: 'Comunicado', cls: 'bg-blue-100 text-blue-700' },
  aviso:      { label: 'Aviso',      cls: 'bg-amber-100 text-amber-700' },
  pdf_curso:  { label: 'PDF/Curso',  cls: 'bg-red-100 text-red-700' },
  pregacao:   { label: 'Pregação',   cls: 'bg-purple-100 text-purple-700' },
  interacao:  { label: 'Interação',  cls: 'bg-green-100 text-green-700' },
}

// --- Formulário de post ------------------------------------------------------
interface PostFormState {
  id?: string
  celula_id: string
  type: CelulaPostType
  title: string
  content: string
  pdf_url: string
  video_url: string
  pinned: boolean
  status: 'published' | 'draft'
}

const emptyForm = (celulaId: string): PostFormState => ({
  celula_id: celulaId,
  type: 'comunicado',
  title: '',
  content: '',
  pdf_url: '',
  video_url: '',
  pinned: false,
  status: 'published',
})

// --- Modal -------------------------------------------------------------------
function PostModal({
  form,
  setForm,
  onSave,
  onClose,
  saving,
}: {
  form: PostFormState
  setForm: React.Dispatch<React.SetStateAction<PostFormState>>
  onSave: () => void
  onClose: () => void
  saving: boolean
}) {
  const [uploadingPdf, setUploadingPdf] = useState(false)

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingPdf(true)
    try {
      const path = `pdfs/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
      const url = await celulaMaterialsApi.uploadPdf(file, path)
      setForm(f => ({ ...f, pdf_url: url }))
    } catch (err) {
      alert('Erro ao enviar PDF: ' + (err as Error).message)
    }
    setUploadingPdf(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl pt-5 pb-8 px-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto mb-5" />

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 text-base">
            {form.id ? 'Editar post' : 'Novo post'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {POST_TYPES.map(pt => {
                const Icon = pt.icon
                const isActive = form.type === pt.value
                return (
                  <button
                    key={pt.value}
                    onClick={() => setForm(f => ({ ...f, type: pt.value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    {pt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título do post"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Conteúdo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Conteúdo</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Texto do post (opcional)"
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
            />
          </div>

          {/* Upload de PDF */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Arquivo PDF / Material
            </label>
            {form.pdf_url ? (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <FileText size={15} className="text-red-600 flex-shrink-0" />
                <span className="text-red-700 text-xs flex-1 min-w-0 truncate">PDF anexado</span>
                <button
                  onClick={() => setForm(f => ({ ...f, pdf_url: '' }))}
                  className="text-red-400 hover:text-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl px-4 py-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors ${uploadingPdf ? 'opacity-60 cursor-not-allowed' : ''}`}>
                {uploadingPdf ? (
                  <><div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /><span className="text-sm text-gray-500">Enviando...</span></>
                ) : (
                  <><Upload size={16} className="text-gray-400" /><span className="text-sm text-gray-500">Selecionar PDF</span></>
                )}
                <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploadingPdf} />
              </label>
            )}
            {/* Ou cole a URL */}
            <input
              type="url"
              value={form.pdf_url}
              onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))}
              placeholder="Ou cole a URL do PDF/material aqui"
              className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* URL de vídeo */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Link de vídeo (YouTube / outros)
            </label>
            <input
              type="url"
              value={form.video_url}
              onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Opções */}
          <div className="flex gap-3">
            <button
              onClick={() => setForm(f => ({ ...f, pinned: !f.pinned }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                form.pinned
                  ? 'border-amber-400 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              {form.pinned ? <Pin size={15} /> : <PinOff size={15} />}
              {form.pinned ? 'Fixado' : 'Fixar'}
            </button>

            <button
              onClick={() => setForm(f => ({ ...f, status: f.status === 'published' ? 'draft' : 'published' }))}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-colors ${
                form.status === 'published'
                  ? 'border-green-400 bg-green-50 text-green-700'
                  : 'border-gray-200 text-gray-500'
              }`}
            >
              {form.status === 'published' ? <Eye size={15} /> : <EyeOff size={15} />}
              {form.status === 'published' ? 'Publicado' : 'Rascunho'}
            </button>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 py-3 rounded-2xl bg-primary-700 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Salvando...</>
              : <><Save size={15} /> {form.id ? 'Atualizar' : 'Publicar'}</>
            }
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  )
}

// --- Main page ---------------------------------------------------------------
export default function AdminCelulasPage() {
  const [celulas, setCelulas]         = useState<Celula[]>([])
  const [selectedCelula, setSelectedCelula] = useState<Celula | null>(null)
  const [posts, setPosts]             = useState<CelulaPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState<PostFormState>(emptyForm(''))
  const [saving, setSaving]           = useState(false)
  const [deleting, setDeleting]       = useState<string | null>(null)

  useEffect(() => {
    celulasApi.getAll().then(({ data }) => {
      if (data) {
        setCelulas(data)
        if (data.length > 0) selectCelula(data[0])
      }
    })
  }, [])

  const selectCelula = async (celula: Celula) => {
    setSelectedCelula(celula)
    setLoadingPosts(true)
    const { data } = await celulaPostsApi.getAll(celula.id)
    if (data) setPosts(data)
    setLoadingPosts(false)
  }

  const openNew = () => {
    if (!selectedCelula) return
    setForm(emptyForm(selectedCelula.id))
    setShowModal(true)
  }

  const openEdit = (post: CelulaPost) => {
    setForm({
      id: post.id,
      celula_id: post.celula_id,
      type: post.type,
      title: post.title,
      content: post.content ?? '',
      pdf_url: post.pdf_url ?? '',
      video_url: post.video_url ?? '',
      pinned: post.pinned,
      status: post.status,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const payload = {
      celula_id: form.celula_id,
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim() || null,
      pdf_url: form.pdf_url.trim() || null,
      video_url: form.video_url.trim() || null,
      pinned: form.pinned,
      status: form.status,
    }
    if (form.id) {
      const { data } = await celulaPostsApi.update(form.id, payload)
      if (data) setPosts(prev => prev.map(p => p.id === data.id ? data : p))
    } else {
      const { data } = await celulaPostsApi.create(payload)
      if (data) setPosts(prev => [data, ...prev])
    }
    setSaving(false)
    setShowModal(false)
  }

  const handleDelete = async (post: CelulaPost) => {
    if (!confirm(`Excluir "${post.title}"?`)) return
    setDeleting(post.id)
    await celulaPostsApi.delete(post.id)
    setPosts(prev => prev.filter(p => p.id !== post.id))
    setDeleting(null)
  }

  const handleTogglePin = async (post: CelulaPost) => {
    const { data } = await celulaPostsApi.update(post.id, { pinned: !post.pinned })
    if (data) setPosts(prev => prev.map(p => p.id === data.id ? data : p))
  }

  const handleToggleStatus = async (post: CelulaPost) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published'
    const { data } = await celulaPostsApi.update(post.id, { status: newStatus })
    if (data) setPosts(prev => prev.map(p => p.id === data.id ? data : p))
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Células</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie o conteúdo dos grupos de célula</p>
        </div>
        <button
          onClick={openNew}
          disabled={!selectedCelula}
          className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          <Plus size={16} />
          Novo post
        </button>
      </div>

      {/* Seletor de célula */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {celulas.map(c => (
          <button
            key={c.id}
            onClick={() => selectCelula(c)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
              selectedCelula?.id === c.id
                ? 'bg-primary-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-primary-400'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Lista de posts */}
      {loadingPosts ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-gray-600 font-medium">Nenhum post nesta célula</p>
          <p className="text-gray-400 text-sm mt-1">Clique em "Novo post" para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const badge = TYPE_BADGE[post.type]
            const Icon = POST_TYPES.find(t => t.value === post.type)?.icon ?? MessageCircle
            return (
              <div
                key={post.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${post.pinned ? 'border-amber-300' : 'border-gray-100'}`}
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
                      {post.pinned && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          Fixado
                        </span>
                      )}
                      {post.status === 'draft' && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          Rascunho
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-800 text-sm">{post.title}</p>
                    {post.content && (
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">{post.content}</p>
                    )}
                    {post.pdf_url && (
                      <p className="text-red-500 text-xs mt-0.5">📎 PDF anexado</p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="border-t border-gray-50 px-4 py-2.5 flex items-center gap-2">
                  <button
                    onClick={() => openEdit(post)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors font-medium"
                  >
                    <Pencil size={12} />
                    Editar
                  </button>
                  <button
                    onClick={() => handleTogglePin(post)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      post.pinned
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {post.pinned ? <PinOff size={12} /> : <Pin size={12} />}
                    {post.pinned ? 'Desafixar' : 'Fixar'}
                  </button>
                  <button
                    onClick={() => handleToggleStatus(post)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {post.status === 'published' ? <Eye size={12} /> : <EyeOff size={12} />}
                    {post.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </button>
                  <button
                    onClick={() => handleDelete(post)}
                    disabled={deleting === post.id}
                    className="flex items-center gap-1.5 text-xs text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors font-medium ml-auto disabled:opacity-50"
                  >
                    {deleting === post.id
                      ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
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
        <PostModal
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
