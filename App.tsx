
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  Heart, 
  Pill, 
  LayoutDashboard, 
  MessageSquareText, 
  AlertCircle,
  Phone,
  Leaf,
  Bell
} from 'lucide-react';
import DashboardView from './views/DashboardView';
import MedsView from './views/MedsView';
import VitalsView from './views/VitalsView';
import CompanionView from './views/CompanionView';
import CallAgentView from './views/CallAgentView';
import NaturalRemediesView from './views/NaturalRemediesView';
import { AppRoute, VitalRecord, Medication } from './types';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Home', route: AppRoute.DASHBOARD, path: '/' },
    { icon: Pill, label: 'Meds', route: AppRoute.MEDS, path: '/meds' },
    { icon: Leaf, label: 'Nature', route: AppRoute.NATURAL, path: '/natural' },
    { icon: MessageSquareText, label: 'AI Friend', route: AppRoute.COMPANION, path: '/companion' },
    { icon: Heart, label: 'Vitals', route: AppRoute.VITALS, path: '/vitals' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-1 pb-6 pt-2 flex justify-around items-center z-50">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <button
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
              isActive ? 'text-blue-600 bg-blue-50' : 'text-slate-400'
            }`}
          >
            <item.icon size={isActive ? 26 : 22} />
            <span className={`text-[10px] font-bold mt-1 ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

const Header = () => {
  const [showSOS, setShowSOS] = useState(false);

  return (
    <header className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center z-40">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
          S
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-none">SilverHealth</h1>
          <p className="text-xs text-slate-500 font-medium">Safe & Sound</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button className="relative p-2 text-slate-600 bg-slate-100 rounded-full">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <button 
          onClick={() => setShowSOS(true)}
          className="bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg shadow-red-200 transition-all active:scale-95"
        >
          <AlertCircle size={20} />
          <span>SOS</span>
        </button>
      </div>

      {showSOS && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-6">
              <AlertCircle size={48} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Emergency Help?</h2>
            <p className="text-lg text-slate-600 mb-8">We will notify your family and call emergency services immediately.</p>
            <div className="flex flex-col gap-4">
              <button 
                className="w-full bg-red-600 text-white py-6 rounded-2xl text-2xl font-bold shadow-xl active:scale-95 transition-transform"
                onClick={() => {
                  alert("Calling Emergency Services & Notifying family...");
                  setShowSOS(false);
                }}
              >
                YES, CALL NOW
              </button>
              <button 
                className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl text-xl font-semibold"
                onClick={() => setShowSOS(false)}
              >
                No, I'm okay
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

const App = () => {
  const [vitals, setVitals] = useState<VitalRecord[]>([
    { id: '1', type: 'blood-pressure', value: '120/80', unit: 'mmHg', timestamp: new Date() },
    { id: '2', type: 'heart-rate', value: '72', unit: 'bpm', timestamp: new Date() },
  ]);

  const [meds, setMeds] = useState<Medication[]>([
    { id: '1', name: 'Lisinopril', dosage: '10mg', frequency: 'Daily', time: '08:00 AM', taken: true },
    { id: '2', name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', time: '09:00 AM', taken: false },
    { id: '3', name: 'Multi-Vitamin', dosage: '1 tab', frequency: 'Daily', time: '12:00 PM', taken: false },
  ]);

  const addVital = (vital: VitalRecord) => setVitals([vital, ...vitals]);
  const toggleMed = (id: string) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  return (
    <Router>
      <div className="min-h-screen pb-24 flex flex-col max-w-md mx-auto bg-slate-50 shadow-2xl relative">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Routes>
            <Route path="/" element={<DashboardView vitals={vitals} meds={meds} onToggleMed={toggleMed} />} />
            <Route path="/meds" element={<MedsView meds={meds} onToggleMed={toggleMed} />} />
            <Route path="/vitals" element={<VitalsView vitals={vitals} onAddVital={addVital} />} />
            <Route path="/companion" element={<CompanionView />} />
            <Route path="/call" element={<CallAgentView />} />
            <Route path="/natural" element={<NaturalRemediesView />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </Router>
  );
};

export default App;
