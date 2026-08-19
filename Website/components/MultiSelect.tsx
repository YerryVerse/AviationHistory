'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}

export default function MultiSelect({ label, options, selected, onChange, placeholder }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase()) && !selected.includes(opt)
  ).slice(0, 50);

  const handleSelect = (opt: string) => {
    onChange([...selected, opt]);
    setSearch('');
  };

  const handleRemove = (opt: string) => {
    onChange(selected.filter(x => x !== opt));
  };

  return (
    <div className="flex flex-col gap-1.5 relative w-full" ref={containerRef}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</label>
      
      <div 
        className="w-full min-h-[38px] px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 text-slate-800 text-sm cursor-pointer transition-all flex flex-wrap gap-1.5 items-center"
        onClick={() => setIsOpen(true)}
      >
        {selected.map(item => (
          <span 
            key={item} 
            className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-700 font-semibold text-xs rounded px-2 py-0.5 transition-all hover:bg-blue-100/80"
          >
            {item}
            <span 
              className="cursor-pointer text-blue-400 hover:text-blue-600 font-bold ml-0.5 text-xs" 
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
            >
              &times;
            </span>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-slate-400 text-xs pl-1">
            {placeholder || 'Select options...'}
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          <input
            type="text"
            className="w-full px-3 py-2 bg-slate-50/50 border-b border-slate-100 focus:outline-none text-slate-700 text-xs font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            autoFocus
          />
          <div className="max-h-40 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 italic">
                No options found
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div
                  key={opt}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium cursor-pointer transition-colors"
                  onClick={() => handleSelect(opt)}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
