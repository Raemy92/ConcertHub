import { Check, Ticket, X } from 'lucide-react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, Participation } from '@/entities'
import { concertService } from '@/entities/concert'

interface TicketListProps {
  concert: Concert
  participations: Participation[]
}

export const TicketList = ({ concert, participations }: TicketListProps) => {
  const { user } = useAuth()

  const isCreator = user?.uid === concert.createdBy

  const handleTicketToggle = async (participation: Participation) => {
    const canToggle = isCreator || participation.userId === user?.uid
    if (!canToggle || !concert.id) return

    const newStatus = !participation.hasTicket
    await concertService.updateTicketStatus(
      concert.id,
      participation.userId,
      newStatus
    )
  }

  const getName = (p: Participation) =>
    p.displayName?.trim() || 'Unbekannter Benutzer'

  const ticketCount = participations.filter((p) => p.hasTicket).length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
          Ticket-Status
        </h3>
        <span className="text-sm text-gray-400">
          {ticketCount} / {participations.length} haben ein Ticket
        </span>
      </div>

      {participations.length === 0 ? (
        <p className="text-gray-600 text-sm italic">
          Noch keine Teilnehmer angemeldet.
        </p>
      ) : (
        <div className="space-y-2">
          {participations.map((participation) => {
            const isCurrentUser = participation.userId === user?.uid
            const canToggle = isCreator || isCurrentUser

            return (
              <div
                key={participation.userId}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  participation.hasTicket
                    ? 'bg-green-900/20 border-green-800/50'
                    : 'bg-gray-900 border-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Ticket
                    className={`w-5 h-5 ${
                      participation.hasTicket
                        ? 'text-green-500'
                        : 'text-gray-600'
                    }`}
                  />
                  <span
                    className={`${isCurrentUser ? 'font-bold text-white' : 'text-gray-300'}`}
                  >
                    {getName(participation)}
                    {isCurrentUser && ' (Du)'}
                  </span>
                </div>

                <button
                  onClick={() => handleTicketToggle(participation)}
                  disabled={!canToggle}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    participation.hasTicket
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${!canToggle ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {participation.hasTicket ? (
                    <>
                      <Check className="w-4 h-4" />
                      Hat Ticket
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      Kein Ticket
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {isCreator && (
        <p className="text-xs text-gray-500 mt-4">
          Als Ersteller dieses Konzerts kannst du den Ticket-Status aller
          Teilnehmer verwalten.
        </p>
      )}
    </div>
  )
}
