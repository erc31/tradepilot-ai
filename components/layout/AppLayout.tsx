import Sidebar from './Sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-60 p-6 min-h-screen" style={{ background: 'var(--background)' }}>
        {children}
      </main>
    </div>
  )
}
