import { ChevronDown } from 'lucide-react'

interface YearSelectorProps {
  value: number
  onChange: (year: number) => void
  options: number[]
}

export const YearSelector = ({
  value,
  onChange,
  options
}: YearSelectorProps) => (
  <div className="relative inline-flex items-center">
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Jahr auswählen"
      className="cursor-pointer appearance-none text-white font-semibold"
      style={{
        fontSize: 15,
        padding: '8px 34px 8px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        fontFamily: 'inherit'
      }}
    >
      {options.map((year) => (
        <option key={year} value={year} style={{ color: '#0a1220' }}>
          {year}
        </option>
      ))}
    </select>
    <ChevronDown
      size={16}
      className="pointer-events-none absolute"
      style={{ right: 12, color: 'rgba(255,255,255,0.6)' }}
    />
  </div>
)
