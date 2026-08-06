import React, { useState, useRef, useEffect } from 'react';

export default function ItemSearchSelect({ items, value, onChange, placeholder = "Search and select item..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  const selectedItem = items.find(i => i._id === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    (i.category?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus-within:border-indigo-500 bg-white flex justify-between items-center cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="truncate font-medium text-slate-800">
          {selectedItem ? `${selectedItem.name} ${selectedItem.unit ? `(${selectedItem.unit})` : ''}` : <span className="text-slate-400">{placeholder}</span>}
        </div>
        <svg className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-slate-100 shrink-0">
            <input 
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to search..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-0 text-sm font-medium outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredItems.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-500 font-medium">No items found</div>
            ) : (
              filteredItems.map(item => (
                <div 
                  key={item._id}
                  className={`px-4 py-2.5 cursor-pointer flex flex-col hover:bg-slate-50 transition-colors ${value === item._id ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => {
                    onChange(item._id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span className="font-bold text-slate-800">{item.name} {item.unit ? <span className="text-slate-400 text-xs font-normal">({item.unit})</span> : ''}</span>
                  {item.category?.name && <span className="text-xs font-medium text-slate-500">{item.category.name}</span>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
