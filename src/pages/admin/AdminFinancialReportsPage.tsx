import { useState, useEffect, useRef } from 'react'
import {
  Plus, Trash2, Eye, EyeOff, FileText, Upload,
  Loader2, ExternalLink, Pencil, X, Check,
} from 'lucide-react'
import { financialReportsApi, storageApi } from '@/lib/supabase'
import { FinancialReport, FinancialReportStatus } from '@/types'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const STATUS_LABELS: Record<FinancialReportStatus, string> = {
  draft:     'Rascunho',
  published: 'Publicado',
  hidden:    'Oculto',
}

const STATUS_CLASSES: Record<FinancialReportStatus, string> = {
  draft:     'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  hidden:    'bg-gray-100 text-gray-600',
}

// ---- Modal: novo / editar relatório ----------------------------------------
interface ReportFormProps {
  initial?: FinancialReport | null
  onClose: () => void
  onSaved: () => void
}

function ReportFormModal({ initial, onClose, onSaved }: ReportFormProps) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [title, setTitle]       = useState(initial?.title ?? '')
  const [desc, setDesc]         = useState(initial?.description ?? '')
  const [month, setMonth]       = useState(initial?.reference_month ?? currentMonth)
  const [year, setYear]         = useState(initial?.reference_year ?? currentYear)
  const [status, setStatus]     = useState<FinancialReportStatus>(initial?.status ?? 'draft')
  const [pdfFile, setPdfFile]   = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [err, setErr]           = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const isEdit = !!initial

  async function handleSave() {
    if (!title.trim()) { setErr('Informe o título do relatório.'); return }
    if (!isEdit && !pdfFile) { setErr('Selecione um arquivo PDF.'); return }
    if (pdfFile && pdfFile.type !== 'application/pdf') { setErr('O arquivo deve ser um PDF.'); return }

    setSaving(true)
    setErr(null)
    try {
      let pdf_url = initial?.pdf_url ?? ''

      // Upload do PDF se foi selecionado
      if (pdfFile) {
        setUploading(true)
        const path = `${year}/${String(month).padStart(2, '0')}_${Date.now()}.pdf`
        pdf_url = await storageApi.uploadPdf(pdfFile, path)
        setUploading(false)
      }

      const payload = {
        title: title.trim(),
        description: desc.trim() || null,
        reference_month: month,
        reference_year: year,
        pdf_url,
        status,
      }

      if (isEdit) {
        const { error } = await financialReportsApi.update(initial!.id, payload)
        if (error) throw error
      } else {
        const { error } = await financialReportsApi.create(payload)
        if (error) throw error
      }

      // Send push notification when publishing
      if (status === 'published' && (!isEdit || initial?.status !== 'published')) {
        try {
          const { supabase } = await import('@/lib/supabase')
          await supabase.functions.invoke('send-push', {
            body: {
              title: '📊 Novo Relatório Financeiro',
              body: `${title.trim()} — ${MESES[month - 1]} / ${year}`,
              url: '/app/tesouraria',
            },
          })
        } catch {
          // Notificação é opcional — não bloqueia o salvamento
        }
      }

      onSaved()
      onClose()
    } catch (e: unknown) {
      setUploading(false)
      setErr(e instanceof Error ? e.message : 'Erro ao salvar relatório.')
    } finally {
      setSaving(false)
    }
  }

  const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 text-base">
            {isEdit ? 'Editar Relatório' : 'Novo Relatório Financeiro'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Relatório Financeiro — Maio 2025"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Mês / Ano */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mês de referência *</label>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ano *</label>
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Descrição (opcional)</label>
            <input
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ex: Inclui dízimos, ofertas e despesas de manutenção"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
            <div className="flex gap-2">
              {(['draft', 'published', 'hidden'] as FinancialReportStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    status === s
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {status === 'published' && !isEdit && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <Check size={11} /> Uma notificação push será enviada aos membros.
              </p>
            )}
            {status === 'published' && isEdit && initial?.status !== 'published' && (
              <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                <Check size={11} /> Notificação push será enviada ao publicar.
              </p>
            )}
          </div>

          {/* Upload PDF */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Arquivo PDF {isEdit ? '(opcional — substituir atual)' : '*'}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={e => setPdfFile(e.target.files?.[0] ?? null)}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 px-3 flex flex-col items-center gap-2 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-colors"
            >
              <Upload size={20} />
              {pdfFile ? (
                <span className="text-sm text-primary-600 font-medium">{pdfFile.name}</span>
              ) : (
                <span className="text-xs">Clique para selecionar o PDF</span>
              )}
            </button>
            {isEdit && initial?.pdf_url && !pdfFile && (
              <a
                href={initial.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary-500 mt-1.5 hover:underline"
              >
                <ExternalLink size={11} /> Ver PDF atual
              </a>
            )}
          </div>

          {/* Error */}
          {err && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{err}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {uploading ? 'Enviando PDF...' : 'Salvando...'}
              </>
            ) : (
              isEdit ? 'Salvar alterações' : 'Criar relatório'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ---- Main page ---------------------------------------------------------------
export default function AdminFinancialReportsPage() {
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FinancialReport | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await financialReportsApi.getAll()
    setReports(data ?? [])
    setLoading(false)
  }

  async function handleDelete(report: FinancialReport) {
    if (!confirm(`Excluir "${report.title}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(report.id)
    try {
      await financialReportsApi.delete(report.id)
      setReports(prev => prev.filter(r => r.id !== report.id))
    } catch {
      alert('Erro ao excluir relatório.')
    } finally {
      setDeleting(null)
    }
  }

  async function handleToggleStatus(report: FinancialReport) {
    const next: FinancialReportStatus =
      report.status === 'published' ? 'hidden' : 'published'
    await financialReportsApi.update(report.id, { status: next })
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: next } : r))
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Tesouraria</h1>
          <p className="text-gray-500 text-sm mt-0.5">Relatórios financeiros da igreja</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-primary-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} />
          Novo relatório
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Nenhum relatório cadastrado</p>
            <p className="text-gray-400 text-xs mt-1">Clique em "Novo relatório" para começar.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Relatório</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Período</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reports.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-primary-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate max-w-[180px]">{r.title}</p>
                        {r.description && (
                          <p className="text-xs text-gray-400 truncate max-w-[180px]">{r.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-gray-600">
                      {MESES[r.reference_month - 1]} / {r.reference_year}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_CLASSES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {/* Abrir PDF */}
                      <a
                        href={r.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver PDF"
                        className="p-2 rounded-xl text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      >
                        <ExternalLink size={15} />
                      </a>

                      {/* Publicar / Ocultar */}
                      <button
                        onClick={() => handleToggleStatus(r)}
                        title={r.status === 'published' ? 'Ocultar' : 'Publicar'}
                        className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        {r.status === 'published' ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>

                      {/* Editar */}
                      <button
                        onClick={() => { setEditing(r); setShowModal(true) }}
                        title="Editar"
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Pencil size={15} />
                      </button>

                      {/* Excluir */}
                      <button
                        onClick={() => handleDelete(r)}
                        disabled={deleting === r.id}
                        title="Excluir"
                        className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deleting === r.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Legenda de status */}
      {reports.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {(['draft', 'published', 'hidden'] as FinancialReportStatus[]).map(s => (
            <div key={s} className="flex items-center gap-1.5 text-xs text-gray-400">
              <span className={`inline-block w-2 h-2 rounded-full ${
                s === 'published' ? 'bg-green-500' :
                s === 'draft'     ? 'bg-yellow-400' : 'bg-gray-400'
              }`} />
              {STATUS_LABELS[s]}: {reports.filter(r => r.status === s).length}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ReportFormModal
          initial={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={load}
        />
      )}
    </div>
  )
}
