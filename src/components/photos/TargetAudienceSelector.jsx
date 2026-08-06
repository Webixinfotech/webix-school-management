import { Users, Search, Check, Layers, UserCheck } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { getClassesAPI, getMyClassesAPI } from '../../api/classes';
import { useAuth } from '../../context/AuthContext';

export default function TargetAudienceSelector({ audience, value, onChange }) {
  const parents = audience?.parents || [];
  const [classes, setClasses] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        let res;
        if (user?.role === 'admin') {
          res = await getClassesAPI({ limit: 100 });
        } else {
          res = await getMyClassesAPI();
        }
        setClasses(res?.data || audience?.classes || []);
      } catch (error) {
        console.error('Error fetching classes:', error);
        setClasses(audience?.classes || []);
      }
    };
    fetchClasses();
  }, [user, audience]);

  // Fallbacks ensuring safe pre-filling during Edit mode
  const selectedClasses = value?.targetClasses || [];
  const selectedParents = value?.targetParentIds || [];

  const [classSearch, setClassSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');

  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const name = typeof cls === 'object' ? `${cls.name || ''} ${cls.section || ''}`.trim() : cls;
      return name.toLowerCase().includes(classSearch.toLowerCase());
    });
  }, [classes, classSearch]);

  const filteredParents = useMemo(() => {
    return parents.filter(p =>
      p.parentName?.toLowerCase().includes(parentSearch.toLowerCase()) ||
      p.children?.some(c => c.name?.toLowerCase().includes(parentSearch.toLowerCase()))
    );
  }, [parents, parentSearch]);

  const toggleClass = (classId) => {
    const next = selectedClasses.includes(classId)
      ? selectedClasses.filter((item) => item !== classId)
      : [...selectedClasses, classId];
    onChange({ ...value, targetClasses: next });
  };

  const toggleParent = (parentId) => {
    const next = selectedParents.includes(parentId)
      ? selectedParents.filter((item) => item !== parentId)
      : [...selectedParents, parentId];
    onChange({ ...value, targetParentIds: next });
  };

  const selectAllClasses = () => {
    const allIds = filteredClasses.map(cls => typeof cls === 'object' ? (cls._id || cls.id) : cls);
    const next = [...new Set([...selectedClasses, ...allIds])];
    onChange({ ...value, targetClasses: next });
  };

  const clearClasses = () => {
    onChange({ ...value, targetClasses: [] });
  };

  const selectAllParents = () => {
    const allIds = filteredParents.map(p => p._id);
    const next = [...new Set([...selectedParents, ...allIds])];
    onChange({ ...value, targetParentIds: next });
  };

  const clearParents = () => {
    onChange({ ...value, targetParentIds: [] });
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
      
      <div className="bg-gradient-to-r from-sky-50 to-indigo-50 p-5 border-b border-slate-200">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm border border-sky-100">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Target Audience</h4>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              Choose specific classes or individual parents to share these photos with on the parent portal.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-8">
        {/* Classes Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-slate-400" />
              <p className="text-sm font-bold uppercase tracking-wider text-slate-700">Target Classes</p>
              {selectedClasses.length > 0 && (
                <span className="bg-sky-100 text-sky-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
                  {selectedClasses.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedClasses.length > 0 && (
                <button type="button" onClick={clearClasses} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Clear</button>
              )}
              {filteredClasses.length > 0 && (
                <button type="button" onClick={selectAllClasses} className="text-xs font-bold text-sky-600 hover:text-sky-800 transition-colors">Select All</button>
              )}
            </div>
          </div>

          {classes.length > 5 && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search classes..." 
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2.5 max-h-48 overflow-y-auto p-1 custom-scroll">
            {filteredClasses.length ? filteredClasses.map((cls) => {
              const classId = typeof cls === 'object' ? (cls._id || cls.id) : cls;
              const className = typeof cls === 'object' 
                ? `${cls.name || ''} ${cls.section ? `(${cls.section})` : ''}`.trim() 
                : cls;
              const active = selectedClasses.includes(classId);
              
            return (
                <button 
                  key={classId} 
                  type="button" 
                  onClick={() => toggleClass(classId)} 
                  className={`group relative flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    active 
                      ? 'border-sky-500 bg-sky-500 text-white shadow-sky-500/20' 
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-slate-900'
                  }`}
                >
                  {active ? <Check size={16} className="text-white" /> : <div className="w-4 h-4 rounded-md border-2 border-slate-300 group-hover:border-sky-400 transition-colors" />}
                {className}
              </button>
            );
            }) : <p className="text-sm text-slate-500 italic py-2">No classes found.</p>}
          </div>
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Parents Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-slate-400" />
              <p className="text-sm font-bold uppercase tracking-wider text-slate-700">Specific Parents</p>
              {selectedParents.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2.5 rounded-full text-xs font-bold">
                  {selectedParents.length} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedParents.length > 0 && (
                <button type="button" onClick={clearParents} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Clear</button>
              )}
              {filteredParents.length > 0 && (
                <button type="button" onClick={selectAllParents} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Select All</button>
              )}
            </div>
          </div>

          {parents.length > 5 && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search parents or students..." 
                value={parentSearch}
                onChange={(e) => setParentSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto p-1 custom-scroll">
            {filteredParents.length ? filteredParents.map((parent) => {
              const active = selectedParents.includes(parent._id);
              return (
                <button 
                  key={parent._id} 
                  type="button" 
                  onClick={() => toggleParent(parent._id)} 
                  className={`group relative flex items-start gap-3 w-full rounded-2xl border p-3.5 text-left transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                    active 
                      ? 'border-indigo-500 bg-indigo-50 shadow-indigo-500/10' 
                      : 'border-slate-200 bg-white hover:border-indigo-300'
                  }`}
                >
                  <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    active ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'
                  }`}>
                    {active && <Check size={14} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${active ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {parent.parentName}
                    </p>
                    <p className={`mt-1 text-xs truncate ${active ? 'text-indigo-600 font-medium' : 'text-slate-500'}`}>
                      {parent.children?.map((child) => `${child.name} (${child.className || 'N/A'})`).join(', ') || 'No child mapping'}
                    </p>
                  </div>
                </button>
              );
            }) : <p className="text-sm text-slate-500 italic py-2">No parents found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
