import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title?: string
  showBack?: boolean
  right?: React.ReactNode
  transparent?: boolean
}

export default function Header({ title, showBack, right, transparent }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header
      className={`sticky top-0 z-40 flex items-center px-4 h-14 pt-safe ${
        transparent ? 'bg-transparent' : 'bg-white border-b border-gray-100 shadow-sm'
      }`}
    >
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      {title && (
        <h1 className="flex-1 text-center font-semibold text-gray-800 text-base ml-2 mr-2 truncate">
          {title}
        </h1>
      )}
      <div className="ml-auto">{right}</div>
    </header>
  )
}
