import AppLayout from '@/components/layout/AppLayout'
import { TrendingUp, TrendingDown, DollarSign, Briefcase, Activity } from 'lucide-react'

const stats = [
  { label: 'Capital total', value: '—', icon: DollarSign, color: 'var(--accent)' },
  { label: 'Perf. aujourd\'hui', value: '—', icon: Activity, color: 'var(--green)' },
  { label: 'Perf. semaine', value: '—', icon: TrendingUp, color: 'var(--green)' },
  { label: 'Cash disponible', value: '—', icon: DollarSign, color: 'var(--yellow)' },
  { label: 'Positions ouvertes', value: '—', icon: Briefcase, color: 'var(--accent)' },
  { label: 'Perf. annuelle', value: '—', icon: TrendingDown, color: 'var(--red)' },
]

export default function DashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Vue d'ensemble de votre portefeuille</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-5 flex items-start gap-4"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}20` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</div>
                <div className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl p-5 flex items-center justify-center h-64"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>📈 Graphique du portefeuille — connectez vos données</p>
          </div>
          <div className="rounded-xl p-5 flex items-center justify-center h-64"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>🥧 Répartition par secteur</p>
          </div>
        </div>

        {/* News placeholder */}
        <div className="rounded-xl p-5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h2 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Dernières actualités importantes</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Les actualités de vos positions apparaîtront ici.</p>
        </div>
      </div>
    </AppLayout>
  )
}
