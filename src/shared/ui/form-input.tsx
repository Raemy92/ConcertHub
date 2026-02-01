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
  max
}: FormInputProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value)
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
        )}
        <input
          type={type}
          value={value}
          onChange={handleChange}
          className={`w-full bg-gray-800 border border-gray-700 rounded-lg py-3 ${
            Icon ? 'px-10' : 'px-4'
          } text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all`}
          placeholder={placeholder}
          required={required}
          min={min}
          max={max}
        />
      </div>
    </div>
  )
}
