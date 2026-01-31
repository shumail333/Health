
import React, { useState } from 'react';
import { Plus, Activity, Droplets, Heart, History, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { VitalRecord } from '../types';

interface VitalsProps {
  vitals: VitalRecord[];
  onAddVital: (vital: VitalRecord) => void;
}

const mockChartData = [
  { time: 'Mon', bp: 120, hr: 72 },
  { time: 'Tue', bp: 122, hr: 75 },
  { time: 'Wed', bp: 118, hr: 70 },
  { time: 'Thu', bp: 121, hr: 74 },
  { time: 'Fri', bp: 125, hr: 78 },
  { time: 'Sat', bp: 119, hr: 71 },
  { time: 'Sun', bp: 120, hr: 72 },
];

const VitalsView: React.FC<VitalsProps> = ({ vitals, onAddVital }) => {
  const [showAdd, setShowAdd] = useState(false);

  const vitalTypes = [
    { type: 'blood-pressure', icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50', label: 'Blood Pressure', unit: 'mmHg' },
    { type: 'heart-rate', icon: Heart, color: 'text-red-600', bg: 'bg-red-50', label: 'Heart Rate', unit: 'bpm' },
    { type: 'blood-sugar', icon: Droplets, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Blood Sugar', unit: 'mg/dL' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-900">Vitals</h2>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-2xl flex items-center gap-2 font-bold shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={24} />
          <span>New</span>
        </button>
      </div>

      {/* Mini Trend Graph */}
      <section className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-slate-800">Weekly Trend</h3>
          </div>
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">Stable</span>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="colorBp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="bp" stroke="#2563eb" fillOpacity={1} fill="url(#colorBp)" strokeWidth={4} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-xs font-bold text-slate-400 uppercase mt-4">Systolic Pressure (Last 7 Days)</p>
      </section>

      {/* Recent History */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} className="text-slate-400" />
          <h3 className="text-xl font-bold text-slate-800">History</h3>
        </div>
        
        {vitals.map((v) => {
          const config = vitalTypes.find(t => t.type === v.type);
          const Icon = config?.icon || Activity;
          return (
            <div key={v.id} className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center gap-5 shadow-sm">
              <div className={`w-14 h-14 ${config?.bg} ${config?.color} rounded-2xl flex items-center justify-center`}>
                <Icon size={32} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">{config?.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-800">{v.value}</span>
                  <span className="text-xs font-bold text-slate-500 uppercase">{v.unit}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 block">{v.timestamp.toLocaleDateString()}</span>
                <span className="text-xs font-bold text-slate-400 block">{v.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Add Modal (Simplified placeholder) */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-md p-8 animate-in slide-in-from-bottom-full duration-300">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Log New Vital</h2>
            <div className="grid grid-cols-1 gap-4 mb-8">
              {vitalTypes.map(t => (
                <button 
                  key={t.type}
                  onClick={() => {
                    const val = t.type === 'blood-pressure' ? '120/80' : '75';
                    onAddVital({
                      id: Date.now().toString(),
                      type: t.type as any,
                      value: val,
                      unit: t.unit,
                      timestamp: new Date()
                    });
                    setShowAdd(false);
                  }}
                  className="flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-500 transition-colors bg-slate-50 text-left"
                >
                  <div className={`p-3 ${t.bg} ${t.color} rounded-xl`}><t.icon size={28} /></div>
                  <div>
                    <span className="text-lg font-bold text-slate-800">{t.label}</span>
                    <p className="text-xs text-slate-500 font-medium">Add latest reading</p>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowAdd(false)}
              className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl text-xl font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VitalsView;
