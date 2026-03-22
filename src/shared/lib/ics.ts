import { Concert } from '@/entities'

function formatIcsDate(dateStr: string, timeStr: string): string {
  const date = new Date(dateStr)
  const [hours, minutes] = timeStr.split(':').map(Number)
  date.setHours(hours, minutes, 0, 0)

  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `T${pad(date.getHours())}${pad(date.getMinutes())}00`
  )
}

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

export function downloadConcertIcs(concert: Concert): void {
  const dtStart = formatIcsDate(concert.date, concert.startTime)
  const dtEnd = formatIcsDate(concert.date, concert.endTime)
  const uid = `${concert.id ?? Date.now()}@concerthub`

  const descriptionParts: string[] = []
  if (concert.openingBands.length > 0) {
    descriptionParts.push(`Opening: ${concert.openingBands.join(', ')}`)
  }
  const description = escapeIcsText(descriptionParts.join('\n'))

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ConcertHub//EN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(concert.band)}`,
    `LOCATION:${escapeIcsText(concert.location)}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${concert.band.replace(/[^a-zA-Z0-9]/g, '_')}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
