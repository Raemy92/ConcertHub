import { Car, User } from 'lucide-react'

import { Participation } from '@/entities'

interface ParticipantListProps {
  participations: Participation[]
  onlyDrivers?: boolean
}

export const ParticipantList = ({
  participations,
  onlyDrivers
}: ParticipantListProps) => {
  const drivers = participations.filter((p) => p.isDriver)

  const getPassengersForDriver = (driverId: string) => {
    return participations.filter((p) => p.driverId === driverId)
  }

  const getDriverForPassenger = (driverId?: string) => {
    return participations.find((p) => p.userId === driverId)
  }

  return (
    <div className="space-y-6">
      {!onlyDrivers && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Alle Teilnehmer
          </h3>
          <div className="flex flex-wrap gap-2">
            {participations.length > 0 ? (
              participations.map((p) => {
                const driver = p.driverId
                  ? getDriverForPassenger(p.driverId)
                  : null

                return (
                  <div
                    key={p.userId}
                    className="group relative flex items-center gap-2 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-sm hover:border-red-500/50 transition-colors"
                  >
                    {p.isDriver ? (
                      <Car className="w-4 h-4 text-red-500" />
                    ) : (
                      <User className="w-4 h-4 text-gray-500" />
                    )}
                    <span>{p.displayName}</span>

                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-black border border-gray-700 text-xs py-2 px-3 rounded shadow-xl whitespace-nowrap">
                        {p.isDriver ? (
                          <div>
                            <p className="font-bold text-red-500 mb-1">
                              Fahrer
                            </p>
                            <p className="text-gray-400">
                              Mitfahrer:{' '}
                              {getPassengersForDriver(p.userId)
                                .map((m) => m.displayName)
                                .join(', ') || 'Keine'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-bold text-gray-300 mb-1">
                              Teilnehmer
                            </p>
                            <p className="text-gray-400">
                              {driver
                                ? `Fährt mit bei: ${driver.displayName}`
                                : 'Keinem Auto zugewiesen'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-600 text-sm italic">
                Noch keine Teilnehmer angemeldet.
              </p>
            )}
          </div>
        </div>
      )}

      {drivers.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
            Autos & Belegung
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {drivers.map((driver) => {
              const passengers = getPassengersForDriver(driver.userId)
              const freeSeats = (driver.availableSeats || 0) - passengers.length

              return (
                <div
                  key={driver.userId}
                  className="bg-gray-900 border border-gray-800 p-3 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <Car className="w-4 h-4 text-red-500" />
                      {driver.displayName}
                    </div>
                    <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded uppercase">
                      {passengers.length} / {driver.availableSeats} Plätze
                    </span>
                  </div>
                  <div className="space-y-1">
                    {passengers.map((pass) => (
                      <div
                        key={pass.userId}
                        className="text-xs text-gray-400 flex items-center gap-1"
                      >
                        <User className="w-3 h-3" />
                        {pass.displayName}
                      </div>
                    ))}
                    {Array.from({ length: freeSeats }).map((_, i) => (
                      <div key={i} className="text-[10px] text-gray-600 italic">
                        Freier Platz
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
