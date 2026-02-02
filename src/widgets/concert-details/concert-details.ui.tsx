import { Car, Info, LucideIcon, Users } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/app/providers/auth.provider'
import { Concert, Participation } from '@/entities'
import { CarManagement } from '@/features/car-management'
import { ParticipantList } from '@/widgets/participant-list'

interface ConcertDetailsProps {
  concert: Concert
  participations: Participation[]
}

type Tab = 'info' | 'participants' | 'logistics'

interface TabButtonProps {
  tab: Tab
  activeTab: Tab
  onClick: (tab: Tab) => void
  icon: LucideIcon
  label: string
}

const TabButton = ({
  tab,
  activeTab,
  onClick,
  icon: Icon,
  label
}: TabButtonProps) => {
  const isActive = activeTab === tab
  return (
    <button
      onClick={() => onClick(tab)}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
        isActive
          ? 'border-red-600 text-red-500'
          : 'border-transparent text-gray-500 hover:text-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

export const ConcertDetails = ({
  concert,
  participations
}: ConcertDetailsProps) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const userParticipation = participations.find((p) => p.userId === user?.uid)
  const isDriver = userParticipation?.isDriver

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-800">
        <TabButton
          tab="info"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={Info}
          label="Details"
        />
        <TabButton
          tab="participants"
          activeTab={activeTab}
          onClick={setActiveTab}
          icon={Users}
          label={`Teilnehmer (${participations.length})`}
        />
        {userParticipation?.isDriver && (
          <TabButton
            tab="logistics"
            activeTab={activeTab}
            onClick={setActiveTab}
            icon={Car}
            label="Mitfahrzentrale"
          />
        )}
      </div>

      <div className="animate-in fade-in duration-300">
        {activeTab === 'info' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Lineup
              </h4>
              <p className="text-xl font-bold text-white mb-2">
                {concert.band}
              </p>
              {concert.openingBands.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {concert.openingBands.map((ob, i) => (
                    <span
                      key={i}
                      className="bg-gray-800 text-gray-300 px-3 py-1 rounded-lg text-sm"
                    >
                      {ob}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Genres
              </h4>
              <div className="flex flex-wrap gap-2">
                {concert.genres.map((g, i) => (
                  <span
                    key={i}
                    className="bg-red-900/20 text-red-400 border border-red-900/30 px-3 py-1 rounded-full text-xs font-bold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Ort
                </h4>
                <p className="text-white">{concert.location}</p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Datum
                </h4>
                <p className="text-white">
                  {new Date(concert.date).toLocaleDateString('de-CH')}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Zeit
                </h4>
                <p className="text-white">
                  {concert.startTime} - {concert.endTime}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
                  Preis
                </h4>
                <p className="text-white">{concert.price.toFixed(2)} CHF</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <ParticipantList participations={participations} />
        )}

        {activeTab === 'logistics' && (
          <div className="space-y-6">
            {isDriver && (
              <CarManagement
                concertId={concert.id!}
                driver={userParticipation!}
                allParticipations={participations}
              />
            )}

            <div className="mt-4">
              <ParticipantList
                participations={participations}
                onlyDrivers={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
