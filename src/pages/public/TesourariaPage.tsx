import { useState, useEffect } from 'react'
import { X, FileText, ExternalLink, ChevronRight, Loader2, LockKeyhole } from 'lucide-react'
import { financialReportsApi } from '@/lib/supabase'
import { FinancialReport } from '@/types'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// PDF Viewer modal
function PdfViewer({ report, onClose }: { report: FinancialReport; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 h-14 bg-gray-900 flex-shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <X size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-sm truncate">{report.title}</p>
          <p className="text-gray-400 text-xs">{MESES[report.reference_month - 1]} / {report.reference_year}</p>
        </div>
        <a
          href={report.pdf_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-300 hover:text-primary-200 py-1.5 px-3 rounded-lg border border-primary-700 hover:bg-primary-900 transition-colors"
        >
          <ExternalLink size={13} />
          Abrir
        </a>
      </div>

      {/* PDF iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`${report.pdf_url}#toolbar=0`}
          className="w-full h-full border-0"
          title={report.title}
        />
      </div>

      {/* Fallback note */}
      <div className="px-4 py-2 bg-gray-900 flex-shrink-0 text-center">
        <p className="text-xs text-gray-500">
          Problemas ao visualizar?{' '}
          <a href={report.pdf_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 underline">
            Abrir em nova aba
          </a>
        </p>
      </div>
    </div>
  )
}

// Report card
function ReportCard({ report, onClick }: { report: FinancialReport; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 w-full px-4 py-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
        <FileText size={18} className="text-primary-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-800 truncate">{report.title}</p>
        <p className="text-gray-400 text-xs mt-0.5">
          {MESES[report.reference_month - 1]} de {report.reference_year}
        </p>
        {report.description && (
          <p className="text-gray-500 text-xs mt-0.5 truncate">{report.description}</p>
        )}
      </div>
      <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
    </button>
  )
}

export default function TesourariaPage() {
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<FinancialReport | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: err } = await financialReportsApi.getPublished()
      if (err) throw err
      setReports(data ?? [])
    } catch {
      setError('Não foi possível carregar os relatórios.')
    } finally {
      setLoading(false)
    }
  }

  // Group reports by year
  const byYear = reports.reduce<Record<number, FinancialReport[]>>((acc, r) => {
    ;(acc[r.reference_year] = acc[r.reference_year] ?? []).push(r)
    return acc
  }, {})
  const years = Object.keys(byYear).map(Number).sort((a, b) => b - a)

  return (
    <div>
      <Header title="Tesouraria" />

      <div className="px-4 pt-3 pb-8 space-y-5">
        {/* Intro card */}
        <Card padding="md" className="flex items-start gap-3 bg-gradient-to-br from-primary-800 to-primary-700">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <LockKeyhole size={18} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-white text-sm">Transparência Financeira</p>
            <p className="text-primary-200 text-xs mt-0.5 leading-relaxed">
              Relatórios financeiros da Igreja Batista Canaã disponíveis para todos os membros.
            </p>
          </div>
        </Card>

        {/* Content */}
        {loading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 size={28} className="text-primary-500 animate-spin" />
            <p className="text-gray-400 text-sm">Carregando relatórios...</p>
          </div>
        )}

        {!loading && error && (
          <Card padding="md" className="text-center">
            <p className="text-red-500 text-sm">{error}</p>
            <button onClick={load} className="mt-3 text-primary-600 text-sm font-medium underline">
              Tentar novamente
            </button>
          </Card>
        )}

        {!loading && !error && reports.length === 0 && (
          <Card padding="md" className="text-center py-10">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm font-medium">Nenhum relatório disponível</p>
            <p className="text-gray-400 text-xs mt-1">Os relatórios serão publicados em breve.</p>
          </Card>
        )}

        {!loading && !error && years.map(year => (
          <div key={year}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
              {year}
            </p>
            <Card padding="none" className="divide-y divide-gray-100 overflow-hidden">
              {byYear[year].map(report => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onClick={() => setSelected(report)}
                />
              ))}
            </Card>
          </div>
        ))}
      </div>

      {/* PDF Viewer */}
      {selected && (
        <PdfViewer report={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
