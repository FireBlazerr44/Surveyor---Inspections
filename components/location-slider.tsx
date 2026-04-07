"use client"

import { useState, useEffect } from "react"

interface LocationSliderProps {
  value: number
  onChange: (value: number) => void
}

export function LocationSlider({ value, onChange }: LocationSliderProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    setLocalValue(newValue)
    onChange(newValue)
  }

  const getColor = () => {
    if (localValue <= 3) return "#ef4444"
    if (localValue <= 6) return "#f97316"
    return "#22c55e"
  }

  const getLabel = () => {
    if (localValue <= 3) return "Poor"
    if (localValue <= 6) return "Average"
    return "Excellent"
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Location (1-10)</span>
        <span 
          className="text-sm font-semibold"
          style={{ color: getColor() }}
        >
          {localValue} - {getLabel()}
        </span>
      </div>
      
      <div className="relative h-4 flex items-center">
        <div 
          className="absolute inset-0 h-2 rounded-full"
          style={{
            background: "linear-gradient(to right, #ef4444 0%, #ef4444 33.33%, #f97316 33.33%, #f97316 66.66%, #22c55e 66.66%, #22c55e 100%)"
          }}
        />
        
        <input
          type="range"
          min="1"
          max="10"
          value={localValue}
          onChange={handleChange}
          className="w-full h-2 appearance-none cursor-pointer relative z-10 bg-transparent"
          tabIndex={0}
        />
        
        <style jsx>{`
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            background: transparent;
          }
          input[type="range"]::-webkit-slider-runnable-track {
            height: 8px;
            border-radius: 9999px;
            background: transparent;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 2px solid ${getColor()};
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            cursor: pointer;
            margin-top: -6px;
            transition: border-color 0.15s ease;
          }
          input[type="range"]::-moz-range-track {
            height: 8px;
            border-radius: 9999px;
            background: transparent;
          }
          input[type="range"]::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 2px solid ${getColor()};
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            cursor: pointer;
          }
        `}</style>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span><span className="text-red-500 font-medium">1-3</span> Poor</span>
        <span><span className="text-orange-500 font-medium">4-6</span> Average</span>
        <span><span className="text-green-500 font-medium">7-10</span> Excellent</span>
      </div>
    </div>
  )
}
