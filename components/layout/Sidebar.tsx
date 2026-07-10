'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, Briefcase, Brain,
  Newspaper, Calendar, BookOpen, BarChart2,
  MessageSquare, Bell, Settings, Zap, LogOut
} from 'lucide-react'

function useMarketStatus() {
  const [status, setStatus] = useState<{ open: boolean; label: string; time: string }>({ open: false, label: '', time: '' })

  function compute() {
    const now = new Date()
    const ny = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    const day = ny.getDay() // 0=Sun, 6=Sat
    const h = ny.getHours()
    const m = ny.getMinutes()
    const minutes = h * 60 + m
    const open = day >= 1 && day <= 5 && minutes >= 570 && minutes < 960 // 9h30=570, 16h00=960
    const timeStr = ny.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    setStatus({ open, label: open ? 'US Ouvert' : 'US Fermé', time: timeStr })
  }

  useEffect(() => {
    compute()
    const id = setInterval(compute, 30000)
    return () => clearInterval(id)
  }, [])

  return status
}

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
  const router = useRouter()
  const market = useMarketStatus()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

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

      {/* Market status */}
      {market.label && (
        <div className="px-4 py-3 mx-3 mb-2 rounded-lg flex items-center gap-2"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: market.open ? 'var(--green)' : 'var(--red)', boxShadow: market.open ? '0 0 6px var(--green)' : 'none' }} />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium" style={{ color: market.open ? 'var(--green)' : 'var(--red)' }}>
              {market.label}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>NY {market.time}</div>
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm transition-all"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,77,106,0.1)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </aside>
  )
}
