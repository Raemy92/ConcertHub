import { LucideIcon } from 'lucide-react'
import { ChangeEvent } from 'react'

interface FormInputProps {
  label: string
  type: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  icon?: LucideIcon
  min?: string
  max?: string
  step?: string
}

export const FormInput = ({
  label,
  type,
  value,
  onChange,
  placeholder,
  required = false,
  icon: Icon,
  min,
  max,
  step
}: FormInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div>
      <label
        className="block uppercase font-semibold mb-2"
        style={{
          fontSize: 11,
          letterSpacing: 0.5,
          color: 'rgba(255,255,255,0.55)'
        }}
      >
        {label}
      </label>
      <div
        className="flex items-center gap-2"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '0.5px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '0 14px',
          transition: 'border-color 0.15s'
        }}
      >
        {Icon && (
          <Icon
            className="flex-shrink-0"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            size={18}
          />
        )}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder-white/40"
          style={{
            padding: '14px 4px',
            fontSize: 14.5,
            fontWeight: 500,
            fontFamily: 'inherit'
          }}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
          step={step}
        />
      </div>
    </div>
  )
}
