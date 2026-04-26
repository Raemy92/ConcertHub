import { Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'

import { MainLayoutContext } from '@/app/layouts/main-layout'
import { ConcertList } from '@/widgets/concert-list'

export const Home = () => {
  const { query, setQuery, openCreate, openEdit, refreshTrigger } =
    useOutletContext<MainLayoutContext>()

  return (
    <>
      <ConcertList
        onEdit={openEdit}
        refreshTrigger={refreshTrigger}
        query={query}
        onResetQuery={() => setQuery('')}
        onCreate={openCreate}
      />

      <button
        onClick={openCreate}
        aria-label="Konzert erstellen"
        className="fixed md:hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
        style={{
          bottom: 28,
          right: 'max(16px, calc((100vw - 1024px) / 2 + 16px))',
          zIndex: 30,
          width: 56,
          height: 56,
          borderRadius: 18,
          background: 'linear-gradient(135deg, #8affc0, #5ee09a)',
          color: '#0a1220',
          border: 'none',
          boxShadow:
            '0 10px 28px rgba(124,255,178,0.35), 0 2px 6px rgba(0,0,0,0.3)'
        }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </>
  )
}
