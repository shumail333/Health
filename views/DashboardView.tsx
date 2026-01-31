
import React, { useState, useEffect } from 'react';
import { Pill, Activity, Thermometer, Phone, ChevronRight, CheckCircle2, Leaf } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Medication, VitalRecord } from '../types';
import { getHealthAdvice } from '../services/geminiService';

interface DashboardProps {
  vitals: VitalRecord[];
  meds: Medication[];
  onToggleMed: (id: string) => void;
}

const DashboardView: React.FC<DashboardProps> = ({ vitals, meds, onToggleMed }) => {
  const [advice, setAdvice] = useState<string>("Loading your health summary...");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdvice = async () => {
      const res = await getHealthAdvice(vitals, meds);
      setAdvice(res);
    };
    fetchAdvice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const medsTaken = meds.filter(m => m.taken).length;
  const nextMed = meds.find(m => !m.taken);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Greeting */}
      <section>
        <h2 className="text-3xl font-bold text-slate-900">Hello, Robert!</h2>
        <p className="text-lg text-slate-500 font-medium mt-1">Today is Monday, Oct 24</p>
      </section>

      {/* Health AI Summary */}
      <section className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-6 text-white shadow-xl shadow-blue-100">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={20} className="text-blue-200" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-blue-100">Health Companion AI</h3>
        </div>
        <p className="text-xl font-medium leading-relaxed">
          {advice}
        </p>
        <button 
          onClick={() => navigate('/companion')}
          className="mt-4 text-sm font-bold bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors"
        >
          Ask for details →
        </button>
      </section>

      {/* PANTRY DOCTOR - NATURAL RECOMMENDATIONS */}
      <section 
        onClick={() => navigate('/natural')}
        className="bg-emerald-50 border-2 border-emerald-200 rounded-[2rem] p-6 flex items-center justify-between shadow-lg shadow-emerald-100/50 cursor-pointer active:scale-95 transition-transform"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Leaf size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-emerald-900">Pantry Doctor</h3>
            <p className="text-emerald-700/70 font-medium">Natural pain & energy tips</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center">
          <ChevronRight size={24} />
        </div>
      </section>

      {/* CALL AGENT FOR TIPS */}
      <section className="bg-white border-2 border-blue-500 rounded-[2rem] p-6 flex items-center justify-between shadow-lg shadow-blue-50 cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('/call')}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <Phone size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Call Agent</h3>
            <p className="text-slate-500 font-medium">Get live health tips now</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center">
          <ChevronRight size={24} />
        </div>
      </section>

      {/* Quick Medication Card */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h3 className="text-2xl font-bold text-slate-800">Medications</h3>
          <span className="text-sm font-bold text-blue-600">{medsTaken}/{meds.length} Done</span>
        </div>
        
        {nextMed ? (
          <div className="bg-white border border-slate-200 rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <Pill size={32} />
              </div>
              <div className="flex-1">
                <h4 className="text-xl font-bold text-slate-800">{nextMed.name}</h4>
                <p className="text-slate-500 font-medium">{nextMed.dosage} • {nextMed.time}</p>
              </div>
              <button 
                onClick={() => onToggleMed(nextMed.id)}
                className="bg-blue-600 text-white p-3 rounded-full shadow-lg shadow-blue-100 active:scale-90 transition-transform"
              >
                <CheckCircle2 size={24} />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-[1.5rem] p-5 text-center">
            <p className="text-green-700 font-bold text-lg">All medications taken! 🎉</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardView;
