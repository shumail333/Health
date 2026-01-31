
import React from 'react';
import { Pill, CheckCircle2, Circle, Clock, Plus, Info } from 'lucide-react';
import { Medication } from '../types';

interface MedsProps {
  meds: Medication[];
  onToggleMed: (id: string) => void;
}

const MedsView: React.FC<MedsProps> = ({ meds, onToggleMed }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">My Meds</h2>
        <button className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex items-start gap-4">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-2xl">
          <Info size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-blue-900 leading-none mb-1">Pharmacist Note</h3>
          <p className="text-blue-800/70 text-sm font-medium">Take Lisinopril on an empty stomach for better absorption.</p>
        </div>
      </div>

      <div className="space-y-4">
        {meds.map((med) => (
          <div 
            key={med.id} 
            onClick={() => onToggleMed(med.id)}
            className={`group p-6 rounded-[2rem] border-2 transition-all cursor-pointer ${
              med.taken 
                ? 'bg-slate-50 border-slate-100 opacity-60' 
                : 'bg-white border-slate-100 shadow-lg shadow-slate-100'
            }`}
          >
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                med.taken ? 'bg-slate-200 text-slate-400' : 'bg-orange-100 text-orange-600'
              }`}>
                <Pill size={36} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-2xl font-bold text-slate-800">{med.name}</h4>
                  {med.taken && <CheckCircle2 size={20} className="text-green-500" />}
                </div>
                <div className="flex items-center gap-3 text-slate-500 font-semibold mt-1">
                  <span className="flex items-center gap-1"><Clock size={16} /> {med.time}</span>
                  <span>•</span>
                  <span>{med.dosage}</span>
                </div>
              </div>

              <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${
                med.taken ? 'bg-green-500 border-green-500 text-white' : 'border-slate-200 text-slate-300 group-hover:border-blue-300'
              }`}>
                {med.taken ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>
            </div>
            
            {!med.taken && (
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{med.frequency}</span>
                <button className="text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1 rounded-full">Reminder set</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MedsView;
