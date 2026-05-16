import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-4', lg: 'p-5' }

export default function Card({ children, padding = 'md', className = '', ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-card ${paddingMap[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
