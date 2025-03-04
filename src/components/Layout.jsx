import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-4 max-w-4xl">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}

export default Layout
