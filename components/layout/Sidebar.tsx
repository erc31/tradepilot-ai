'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, TrendingUp, Brain,
  Newspaper, Calendar, BookOpen, BarChart2,
  MessageSquare, Bell, Settings, Zap
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portfolio', label: 'Portefeuille', icon: Briefcase },
  { href: '/analyse', label: 'Analyse IA', icon: Brain },
  { href: '/actualites', label: 'Actualités', icon: Newspaper },
  { href: '/calendrier', label: 'Calendrier', icon: Calendar },
  { href: '/journal', label: 'Journal', icon: BookOpen },
  { href: '/statistiques', label: 'Statistiques', icon: BarChart2 },
  { href: '/assistant', label: 'Assistant IA', icon: MessageSquare },
  { href: '/alertes', label: 'Alertes', icon: Bell },
  { href: '/parametres', label: 'Paramètres', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col z-40"
      style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--accent)' }}>
          <Zap size={16} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>TradePilot</div>
          <div className="text-xs" style={{ color: 'var(--accent)' }}>AI</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-all"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? 'white' : 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'
              }}
              onMouseLeave={e => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
