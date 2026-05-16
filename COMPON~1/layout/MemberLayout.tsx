import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function MemberLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
