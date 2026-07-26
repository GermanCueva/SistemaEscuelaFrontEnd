import React from 'react'

const CustomToggle = ({ checked, onChange, label, name, activeText = "ON", inactiveText = "OFF" }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && <span className="text-xs font-bold text-gray-700">{label}</span>}
      <label className="relative inline-flex items-center cursor-pointer select-none">
        <input 
          type="checkbox" 
          name={name}
          checked={checked} 
          onChange={onChange} 
          className="sr-only peer" 
        />
        {/* Fondo del Switch (Verde cuando activo, Rojo cuando inactivo) */}
        <div className={`w-20 h-9 rounded-full flex items-center justify-between px-2 text-xs font-black transition-colors duration-300 shadow-inner ${
          checked ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <span>{activeText}</span>
          <span>{inactiveText}</span>
        </div>
        
        {/* Píldora Deslizable (Círculo central) */}
        <div className={`absolute top-1 left-1 bg-white border border-gray-300 rounded-full h-7 w-8 flex items-center justify-center transition-transform duration-300 shadow-md ${
          checked ? 'transform translate-x-10' : ''
        }`}>
          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
        </div>
      </label>
    </div>
  )
}

export default CustomToggle