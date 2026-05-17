import { useState } from 'react'
import { Copy, Check, Share2, QrCode } from 'lucide-react'
import Header from '@/components/layout/Header'
import Card from '@/components/ui/Card'

const PIX_KEY = '04.206.874/0001-50'
const BANK_DATA = `Igreja Batista Canaã - IBC\nBanco: 748 - Sicredi\nAgência: 0911\nConta Corrente: 85372-7\nPIX: 04.206.874/0001-50`

export default function PixPage() {
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopyPix = async () => {
    await navigator.clipboard.writeText(PIX_KEY)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 2000)
  }

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(BANK_DATA)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 2000)
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Dados Bancários - Igreja Batista Canaã', text: BANK_DATA })
    } else {
      await navigator.clipboard.writeText(BANK_DATA)
      setCopiedAll(true)
      setTimeout(() => setCopiedAll(false), 2000)
    }
  }

  return (
    <div>
      <Header title="PIX / Dados Bancários" />
      <div className="px-4 pt-3 pb-6 space-y-4">
        <Card padding="md" className="bg-gradient-to-r from-primary-800 to-primary-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <QrCode size={20} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Contribua com a Igreja</p>
              <p className="text-primary-300 text-xs">Use o PIX ou transferência bancária</p>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Chave PIX (CNPJ)</p>
          <div className="flex items-center justify-between gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <p className="font-mono font-semibold text-gray-800 text-sm">{PIX_KEY}</p>
            <button onClick={handleCopyPix} className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0">
              {copiedPix ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              {copiedPix ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </Card>

        <Card padding="md">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dados Bancários</p>
          <div className="space-y-2 mb-4">
            {[
              { label: 'Beneficiário', value: 'Igreja Batista Canaã - IBC' },
              { label: 'Banco', value: '748 - Sicredi' },
              { label: 'Agência', value: '0911' },
              { label: 'Conta Corrente', value: '85372-7' },
              { label: 'PIX / CNPJ', value: PIX_KEY },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 text-xs w-28 flex-shrink-0">{label}</span>
                <span className="text-gray-800 text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleCopyAll} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl py-2.5 transition-colors">
              {copiedAll ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
              {copiedAll ? 'Copiado!' : 'Copiar tudo'}
            </button>
            <button onClick={handleShare} className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors">
              <Share2 size={15} />
              Compartilhar
            </button>
          </div>
        </Card>

        <p className="text-center text-gray-400 text-xs px-4">
          Sua oferta é fundamental para o avanço do reino de Deus através da Igreja Batista Canaã.
        </p>
      </div>
    </div>
  )
}
