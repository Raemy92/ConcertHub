import { useOutletContext } from 'react-router-dom'

import { MainLayoutContext } from '@/app/layouts/main-layout'
import { ConcertList } from '@/widgets/concert-list'

export const Archive = () => {
  const { query, setQuery, openEdit, refreshTrigger } =
    useOutletContext<MainLayoutContext>()

  return (
    <ConcertList
      variant="past"
      onEdit={openEdit}
      refreshTrigger={refreshTrigger}
      query={query}
      onResetQuery={() => setQuery('')}
    />
  )
}
