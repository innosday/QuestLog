import React, { useEffect } from 'react';
import { useUserStore } from './store/userStore';
import { listenToAuth } from './firebase/auth';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import logoImg from './assets/questlog-logo.png';

const App: React.FC = () => {
  const { user, loading, setUser } = useUserStore();

  useEffect(() => {
    const unsubscribe = listenToAuth((userData) => {
      setUser(userData);
    });
    return () => unsubscribe();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-purple-500/10 border-t-purple-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 m-auto w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] p-4">
              <img src={logoImg} alt="QuestLog Logo" className="w-full h-full object-contain animate-pulse" />
            </div>
          </div>
          <div className="text-[10px] font-black text-purple-500 uppercase tracking-[0.4em] animate-pulse">
            Initializing Adventure...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      {user ? <Dashboard /> : <Login />}
    </div>
  );
};

export default App;
