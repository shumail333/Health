
import React, { useState, useEffect } from 'react';
import { Leaf, Zap, HeartPulse, Info, Loader2, ChevronRight, Apple } from 'lucide-react';
import { getNaturalRemedies } from '../services/geminiService';

interface Remedy {
  food: string;
  benefit: string;
  usage: string;
}

const NaturalRemediesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pain' | 'energy'>('pain');
  const [remedies, setRemedies] = useState<Remedy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRemedies = async (category: 'pain' | 'energy') => {
    setLoading(true);
    const data = await getNaturalRemedies(category);
    setRemedies(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRemedies(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Pantry Doctor</h2>
        <p className="text-lg text-slate-500 font-medium">Nature's way to feel better</p>
      </div>

      {/* Toggle Buttons */}
      <div className="flex bg-slate-100 p-1.5 rounded-[2rem] gap-1 shadow-inner">
        <button 
          onClick={() => setActiveTab('pain')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.75rem] text-lg font-bold transition-all ${
            activeTab === 'pain' 
              ? 'bg-emerald-600 text-white shadow-lg' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <HeartPulse size={24} />
          Pain Relief
        </button>
        <button 
          onClick={() => setActiveTab('energy')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.75rem] text-lg font-bold transition-all ${
            activeTab === 'energy' 
              ? 'bg-amber-500 text-white shadow-lg' 
              : 'text-slate-500 hover:bg-slate-200'
          }`}
        >
          <Zap size={24} />
          Energy Boost
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            <Loader2 size={48} className="animate-spin text-emerald-500" />
            <p className="text-xl font-bold animate-pulse">Checking nature's pantry...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {remedies.map((item, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-[2.5rem] border-2 transition-all shadow-sm flex gap-5 items-start ${
                  activeTab === 'pain' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
                }`}
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  activeTab === 'pain' ? 'bg-emerald-200 text-emerald-700' : 'bg-amber-200 text-amber-700'
                }`}>
                  <Apple size={36} />
                </div>
                <div className="flex-1 space-y-2">
                  <h4 className={`text-2xl font-black ${activeTab === 'pain' ? 'text-emerald-900' : 'text-amber-900'}`}>
                    {item.food}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-slate-700 font-semibold leading-snug">
                      <span className="text-xs uppercase font-bold tracking-wider opacity-60 block mb-0.5">Why it works</span>
                      {item.benefit}
                    </p>
                    <p className="text-slate-600 italic font-medium leading-snug pt-1">
                       <span className="text-xs uppercase font-bold tracking-wider opacity-60 block mb-0.5">Best usage</span>
                      {item.usage}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Safety Note */}
      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
          <Info size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-900 leading-none mb-1">Dietary Note</h3>
          <p className="text-blue-800/70 text-sm font-medium">These natural tips complement your treatment. Always consult your doctor before making major dietary changes.</p>
        </div>
      </div>
    </div>
  );
};

export default NaturalRemediesView;
