import { Car, UserPlus, X } from 'lucide-react'

import { Participation } from '@/entities'
import { concertService } from '@/entities/concert/api/concert.service'

interface CarManagementProps {
  concertId: string
  driver: Participation
  allParticipations: Participation[]
}

export const CarManagement = ({
  concertId,
  driver,
  allParticipations
}: CarManagementProps) => {
  const passengers = allParticipations.filter(
    (p) => p.driverId === driver.userId
  )
  const availableUsers = allParticipations.filter(
    (p) => !p.isDriver && !p.driverId && p.userId !== driver.userId
  )
  const freeSeats = (driver.availableSeats || 0) - passengers.length

  const handleAddPassenger = async (passengerId: string) => {
    if (freeSeats <= 0) return
    await concertService.assignPassenger(concertId, driver.userId, passengerId)
  }

  const handleRemovePassenger = async (passengerId: string) => {
    await concertService.removePassenger(concertId, passengerId)
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 shadow-inner">
      <div className="flex items-center gap-3 mb-6 text-red-500">
        <div className="p-3 bg-red-600/10 rounded-xl">
          <Car className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-lg leading-tight">Dein Auto</h3>
          <p className="text-xs text-gray-400">{driver.displayName}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xl font-black text-white">
            {passengers.length} / {driver.availableSeats}
          </p>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">
            Plätze besetzt
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2">
            Passagiere
          </p>
          <div className="space-y-2">
            {passengers.length > 0 ? (
              passengers.map((p) => (
                <div
                  key={p.userId}
                  className="flex items-center justify-between bg-gray-900/50 px-4 py-3 rounded-xl border border-gray-800 group hover:border-red-500/30 transition-colors"
                >
                  <span className="text-sm font-medium">{p.displayName}</span>
                  <button
                    onClick={() => handleRemovePassenger(p.userId)}
                    className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Entfernen"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-600 italic py-2">
                Noch keine Passagiere im Auto
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-700 pb-2">
            Verfügbare Mitfahrer
          </p>
          <div className="flex flex-wrap gap-2">
            {freeSeats > 0 ? (
              availableUsers.length > 0 ? (
                availableUsers.map((u) => (
                  <button
                    key={u.userId}
                    onClick={() => handleAddPassenger(u.userId)}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-red-600 px-4 py-2 rounded-full text-xs font-bold transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    {u.displayName}
                  </button>
                ))
              ) : (
                <p className="text-xs text-gray-600 italic py-2">
                  Keine verfügbaren Teilnehmer
                </p>
              )
            ) : (
              <div className="w-full p-4 bg-gray-900/50 rounded-xl border border-dashed border-gray-700 text-center">
                <p className="text-xs text-gray-500 font-medium">
                  Dein Auto ist voll besetzt!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
