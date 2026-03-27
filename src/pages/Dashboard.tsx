import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../store/userStore';
import { useQuestStore } from '../store/questStore';
import { logout } from '../firebase/auth';
import { db } from '../firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import CreateQuestModal from '../components/quest/CreateQuestModal';
import VerifyQuestModal from '../components/quest/VerifyQuestModal';
import logoImg from '../assets/questlog-logo.png';
import bgPlayer from '../assets/background-player.png';
import bgSceneryDay from '../assets/background-scenery-day.png';
import bgSceneryMoon from '../assets/background-scenery-moon.png';
import { WEAPON_DATABASE } from '../data/items';
import type { Item } from '../data/items';
import { equipWeapon } from '../firebase/userService';
import { translations } from '../i18n/translations';
import { 
  LogOut, 
  Plus, 
  Calendar as CalendarIcon,
  RotateCw,
  ArrowRight,
  Shield,
  Zap,
  Sword,
  Target,
  Flame,
  Box,
  Swords,
  Skull,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import type { Stats, Category, Quest } from '../types';

const Dashboard: React.FC = () => {
  const { user, language, setLanguage } = useUserStore();
  const { quests, setQuests } = useQuestStore();
  const [date, setDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verifyingQuest, setVerifyingQuest] = useState<Quest | null>(null);
  const [isDay, setIsDay] = useState(true);

  const t = translations[language];

  useEffect(() => {
    const hour = new Date().getHours();
    const dayMode = hour >= 6 && hour < 18;
    setIsDay(dayMode);
    if (dayMode) {
      document.documentElement.classList.add('day-mode');
    } else {
      document.documentElement.classList.remove('day-mode');
    }
  }, []);

  const toggleTheme = () => {
    setIsDay(!isDay);
    document.documentElement.classList.toggle('day-mode');
  };

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'quests'),
        where('authorId', '==', user.uid),
        orderBy('deadline', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedQuests = snapshot.docs.map(doc => ({
          qid: doc.id,
          ...doc.data()
        })) as Quest[];
        setQuests(fetchedQuests);
      });
      return () => unsubscribe();
    }
  }, [user, setQuests]);

  if (!user) return null;

  const filteredQuests = quests.filter((q) => {
    const d = new Date(q.deadline);
    return d.toDateString() === date.toDateString();
  });

  const equippedWeapon = WEAPON_DATABASE.find(w => w.id === user.equippedWeaponId);
  const userInventory = (user.inventory || [])
    .map(id => WEAPON_DATABASE.find(item => item.id === id))
    .filter((item): item is Item => !!item);

  const handleEquip = async (itemId: string) => {
    if (user.equippedWeaponId === itemId) {
      await equipWeapon(user.uid, null);
    } else {
      await equipWeapon(user.uid, itemId);
    }
  };

  const statsList: { label: string; full: string; desc: string; value: number; key: keyof Stats; color: string; icon: any }[] = [
    { label: 'STR', full: t.stats.str, desc: t.stat_desc.str, value: user.stats.str, key: 'str', color: 'text-red-500', icon: Flame },
    { label: 'INT', full: t.stats.int, desc: t.stat_desc.int, value: user.stats.int, key: 'int', color: 'text-blue-500', icon: Target },
    { label: 'DEX', full: t.stats.dex, desc: t.stat_desc.dex, value: user.stats.dex, key: 'dex', color: 'text-green-500', icon: Zap },
    { label: 'CHA', full: t.stats.cha, desc: t.stat_desc.cha, value: user.stats.cha, key: 'cha', color: 'text-purple-500', icon: Swords },
    { label: 'ECO', full: t.stats.eco, desc: t.stat_desc.eco, value: user.stats.eco, key: 'eco', color: 'text-emerald-500', icon: Shield },
  ];

  const level = Math.floor(user.totalScore / 100) + 1;
  const expPercentage = user.totalScore % 100;

  return (
    <div className="min-h-screen lg:h-screen bg-[var(--bg-deep)] text-[var(--text-main)] font-sans p-4 lg:p-6 overflow-x-hidden lg:overflow-hidden relative transition-colors duration-1000 flex flex-col lg:flex-row gap-6 lg:gap-8">
      
      {!isDay && <div className="absolute inset-0 night-stars pointer-events-none z-0"></div>}

      {/* 🛡️ Column 1: SIDEBAR (Profile) */}
      <section className="w-full lg:w-[30%] xl:w-[25%] h-full min-h-[500px] lg:min-h-0 relative z-10 shrink-0">
        <div className={`h-full rounded-[2.5rem] lg:rounded-[3rem] p-6 lg:p-8 border-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between transition-all duration-1000 ${isDay ? 'border-orange-400/30' : 'border-indigo-500/30'}`}>
          <div className="absolute inset-0 z-0">
            <img src={isDay ? bgSceneryDay : bgSceneryMoon} alt="" className="w-full h-full object-cover transition-opacity duration-1000" />
            <div className={`absolute inset-0 ${isDay ? 'bg-orange-50/10' : 'bg-slate-900/40'}`}></div>
          </div>
          <div className="absolute bottom-0 left-0 w-full pointer-events-none opacity-100 translate-y-4 lg:translate-y-6 z-10">
            <img src={bgPlayer} alt="" className="w-full h-auto object-cover" />
          </div>
          <div className="relative z-20 flex flex-col items-center text-center w-full">
            <div className="relative mb-6 lg:mb-8">
              <div className={`absolute -inset-8 lg:-inset-10 rounded-full blur-3xl opacity-60 animate-pulse transition-colors duration-1000 ${isDay ? 'bg-yellow-400 shadow-[0_0_80px_rgba(251,191,36,0.8)]' : 'bg-blue-300 shadow-[0_0_80px_rgba(147,197,253,0.8)]'}`}></div>
              <div className={`relative w-28 h-28 lg:w-36 lg:h-36 rounded-full border-4 overflow-hidden bg-white shadow-2xl transition-colors duration-1000 ${isDay ? 'border-orange-400' : 'border-indigo-300'}`}>
                {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-5xl lg:text-6xl text-purple-200 italic">?</div>}
              </div>
              <div className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 bg-slate-900 text-white px-4 lg:px-6 py-1.5 lg:py-2 rounded-2xl font-black text-xs lg:text-sm shadow-xl border-2 border-white z-20">LV. {level}</div>
            </div>
            <h2 className={`text-2xl lg:text-3xl font-black mb-1 leading-none drop-shadow-md transition-colors duration-1000 ${isDay ? 'text-slate-900' : 'text-white'}`}>{user.nickname}</h2>
            <p className={`text-[10px] lg:text-[11px] font-black uppercase tracking-[0.4em] mb-6 lg:mb-8 drop-shadow-sm transition-colors duration-1000 ${isDay ? 'text-slate-500' : 'text-slate-300'}`}>{t.hero_rank}</p>
            <div className={`w-full space-y-4 lg:space-y-5 text-left backdrop-blur-md p-5 lg:p-6 rounded-[2rem] border shadow-lg transition-all duration-1000 overflow-y-auto max-h-[300px] lg:max-h-none custom-scrollbar ${isDay ? 'bg-white/70 border-white' : 'bg-slate-900/60 border-slate-700'}`}>
              <div className="space-y-2">
                <div className={`flex justify-between text-[9px] lg:text-[10px] font-black uppercase px-1 tracking-widest ${isDay ? 'text-slate-500' : 'text-slate-300'}`}><span>{t.mastery_exp}</span><span>{expPercentage}%</span></div>
                <div className={`h-2.5 lg:h-3 rounded-full overflow-hidden border p-0.5 shadow-inner ${isDay ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${expPercentage}%` }} className={`h-full rounded-full ${isDay ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}></motion.div></div>
              </div>
              <div className="space-y-3 lg:space-y-4">
                {statsList.map((stat) => (
                  <motion.div key={stat.key} className={`group p-3 lg:p-4 rounded-[1.5rem] lg:rounded-3xl transition-colors cursor-help border border-transparent ${isDay ? 'hover:bg-white/80 hover:border-orange-100 hover:shadow-md' : 'hover:bg-white/10 hover:border-white/10'}`}>
                    <div className="flex justify-between items-center mb-1 px-1">
                      <div className="flex items-center gap-2 lg:gap-3"><stat.icon className={`w-3.5 h-3.5 lg:w-4 h-4 ${stat.color}`} /><div className="flex flex-col"><span className={`text-[9px] lg:text-[10px] font-black tracking-widest ${isDay ? stat.color : 'text-white'}`}>{stat.label}</span></div></div>
                      <span className={`text-xs lg:text-sm font-black ${isDay ? 'text-slate-900' : 'text-white'}`}>{stat.value}</span>
                    </div>
                    <div className={`h-1 lg:h-1.5 rounded-full overflow-hidden ${isDay ? 'bg-slate-200/50' : 'bg-white/10'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(stat.value, 100)}%` }} className={`h-full ${stat.color} bg-current opacity-60 rounded-full`}></motion.div></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🚀 MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="mb-6 flex items-center justify-between bg-[var(--bg-card)] backdrop-blur-xl p-4 lg:p-5 rounded-[2rem] border border-[var(--border-glass)] shadow-2xl relative z-20 shrink-0">
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="relative w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl flex items-center justify-center p-2 lg:p-2.5 shadow-lg overflow-hidden border border-slate-100"><img src={logoImg} alt="QuestLog" className="w-full h-full object-contain" /></div>
            <div><h1 className="text-2xl lg:text-3xl font-black tracking-tighter italic uppercase leading-none mb-1 text-[var(--text-main)]">QuestLog</h1><p className="text-[9px] lg:text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{t.protocol_active}</p></div>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <button onClick={toggleTheme} className={`p-2.5 lg:p-3 rounded-2xl transition-all border ${isDay ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>{isDay ? <Sun className="w-4 h-4 lg:w-5 lg:h-5" /> : <Moon className="w-4 h-4 lg:w-5 lg:h-5" />}</button>
            <div className="hidden md:flex bg-slate-100/10 p-1 rounded-2xl border border-white/5">
              <button onClick={() => setLanguage('ko')} className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-black transition-all ${language === 'ko' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>KO</button>
              <button onClick={() => setLanguage('en')} className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-black transition-all ${language === 'en' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500'}`}>EN</button>
            </div>
            <button onClick={logout} className="p-3 lg:p-4 hover:bg-red-500/10 rounded-[1.2rem] lg:rounded-[1.5rem] text-slate-500 hover:text-red-500 transition-all border border-transparent"><LogOut className="w-5 h-5 lg:w-6 lg:h-6" /></button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 relative z-10 flex-1 min-h-0">
          {/* ⚔️ Column 2: ARSENAL & COMBAT (Center) */}
          <section className="h-full flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            {/* Gear & Inventory Section */}
            <div className="glass-card rounded-[2.5rem] p-6 lg:p-8 border-white shadow-xl shrink-0">
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.active_gear}</h3>
                <span className="text-[9px] lg:text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">{userInventory.length} Slots</span>
              </div>
              
              <div className="flex flex-col gap-6">
                {/* Equipped Weapon Card */}
                <div className="flex items-center gap-4 lg:gap-6 bg-slate-900 text-white p-4 lg:p-5 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-16 h-16 lg:w-20 lg:h-20 bg-white/10 rounded-3xl flex items-center justify-center p-3 lg:p-4 shadow-inner border border-white/10 shrink-0 relative z-10">
                    {equippedWeapon ? <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${equippedWeapon.id}&backgroundColor=transparent`} alt="" className="w-full h-full object-contain" /> : <Sword className="w-8 h-8 lg:w-10 lg:h-10 text-white/20" />}
                  </div>
                  <div className="min-w-0 relative z-10">
                    <h4 className="text-base lg:text-lg font-black truncate uppercase italic leading-none mb-2">{equippedWeapon?.name || t.unarmed}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] lg:text-[10px] font-black text-purple-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10 uppercase tracking-widest">{equippedWeapon?.grade || 'Basic'}</span>
                      {equippedWeapon && <span className="text-[9px] lg:text-[10px] font-black text-emerald-400">+{equippedWeapon.bonusValue} Power</span>}
                    </div>
                  </div>
                </div>

                {/* Inventory Grid */}
                <div className="grid grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const item = userInventory[i];
                    return (
                      <div key={i} onClick={() => item && handleEquip(item.id)} className={`aspect-square rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center p-2 relative group ${item ? (user.equippedWeaponId === item.id ? 'border-purple-500 bg-purple-50 shadow-inner' : 'border-slate-100 bg-white hover:border-purple-200 shadow-md') : 'border-slate-100 bg-slate-50/50 border-dashed cursor-default'}`}>
                        {item && <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=transparent`} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />}
                        {item && user.equippedWeaponId === item.id && <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-1 border-2 border-white shadow-md"><Check className="w-2 h-2 text-white" strokeWidth={5} /></div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Combat Queue Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 bg-red-50 border border-red-100 rounded-xl text-[9px] font-black text-red-600 uppercase tracking-widest animate-pulse">Live Combat</div>
                  <h3 className="text-lg lg:text-xl font-black text-[var(--text-main)] uppercase italic tracking-tighter">{t.quest_queue}</h3>
                </div>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white p-3 lg:p-4 rounded-2xl shadow-xl hover:bg-slate-800 flex items-center"><Plus className="w-4 h-4 lg:w-5 lg:h-5" strokeWidth={4} /></motion.button>
              </div>

              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredQuests.length > 0 ? (
                    filteredQuests.map((quest, index) => (
                      <motion.div layout initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ x: -100, opacity: 0 }} transition={{ delay: index * 0.05 }} key={quest.qid} onClick={() => quest.status === 'pending' && setVerifyingQuest(quest)} className={`relative p-6 lg:p-8 rounded-[2.5rem] border transition-all cursor-pointer group glass-card ${quest.status === 'success' ? 'opacity-40 grayscale border-transparent' : 'border-white hover:border-purple-200 shadow-lg'}`}>
                        <div className="flex items-center gap-4 lg:gap-6 relative z-10">
                          <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-[1.2rem] flex items-center justify-center border-2 bg-white shrink-0 ${quest.status === 'success' ? 'border-slate-100' : 'border-slate-100 shadow-sm'}`}><Skull className={`w-6 h-6 lg:w-8 lg:h-8 ${quest.category === 'STR' ? 'text-red-500' : quest.category === 'INT' ? 'text-blue-500' : 'text-purple-500'}`} /></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1"><span className={`text-[7px] lg:text-[8px] font-black px-1.5 py-0.5 rounded-md border uppercase tracking-widest ${quest.category === 'STR' ? 'border-red-100 text-red-500 bg-red-50' : quest.category === 'INT' ? 'border-blue-100 text-blue-500 bg-blue-50' : 'border-purple-100 text-purple-500 bg-purple-50'}`}>{quest.category}</span>{quest.level && <span className="text-[7px] lg:text-[8px] font-black text-slate-400 uppercase">LV.{quest.level}</span>}</div>
                            <h4 className="text-base lg:text-lg font-black text-slate-900 truncate tracking-tight uppercase italic leading-none mb-2 lg:mb-3">{quest.monsterName || quest.title}</h4>
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden"><div className={`h-full transition-all duration-1000 ${quest.status === 'success' ? 'w-0' : 'w-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'}`}></div></div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="py-12 lg:py-16 text-center glass-card rounded-[3rem] border-dashed border-slate-200"><p className="text-slate-400 font-black text-base lg:text-lg uppercase tracking-widest">{t.sector_clear}</p></div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* 📅 Column 3: ADVENTURE LOG (Right) */}
          <section className="h-full flex flex-col min-h-0">
            <div className="glass-card rounded-[3rem] p-6 lg:p-8 border-white shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 px-2 flex items-center gap-2 shrink-0">
                <CalendarIcon className="w-3.5 h-3.5 lg:w-4 h-4" /> {t.adventure_log}
              </h3>
              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200 p-4 lg:p-8 shadow-inner relative overflow-y-auto custom-scrollbar flex-1 flex items-start justify-center">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-100/30 to-transparent pointer-events-none"></div>
                <div className="relative z-10 w-full">
                  <Calendar 
                    onChange={(d) => setDate(d as Date)} 
                    value={date} 
                    locale={language === 'ko' ? 'ko-KR' : 'en-US'} 
                    className="compact-calendar full-calendar" 
                    showNeighboringMonth={false} 
                  />
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <CreateQuestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedDate={date} />
      <VerifyQuestModal quest={verifyingQuest} onClose={() => setVerifyingQuest(null)} />
      <InventoryModal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />

      <style>{`
        .compact-calendar { border: none !important; font-family: inherit !important; width: 100% !important; background: transparent !important; }
        .compact-calendar .react-calendar__navigation { display: flex !important; margin-bottom: 2rem !important; height: 48px !important; }
        .compact-calendar .react-calendar__navigation button { 
          min-width: 48px !important; height: 48px !important; 
          font-size: 1.1rem !important; font-weight: 900 !important; color: #1e293b !important;
          background: transparent !important; border: none !important; border-radius: 1rem !important; transition: all 0.2s !important;
        }
        .compact-calendar .react-calendar__navigation button:enabled:hover { background: #f1f5f9 !important; color: #9333ea !important; }
        .compact-calendar .react-calendar__tile { 
          aspect-ratio: 1 / 1; display: flex !important; align-items: center !important; justify-content: center !important;
          font-size: 1rem !important; font-weight: 900; border-radius: 1.2rem !important; color: #94a3b8; background: transparent !important; border: 2px solid transparent !important; transition: all 0.2s ease;
        }
        .compact-calendar .react-calendar__tile:enabled:hover { background: #f1f5f9 !important; color: #9333ea !important; border-color: #e9d5ff !important; }
        .compact-calendar .react-calendar__tile--active { background: #9333ea !important; color: white !important; box-shadow: 0 8px 20px rgba(147,51,234,0.3); border-color: transparent !important; }
        .compact-calendar .react-calendar__tile--now { background: #f3e8ff !important; color: #9333ea !important; border-color: #e9d5ff !important; }
        .compact-calendar .react-calendar__month-view__weekdays { font-weight: 900; text-transform: uppercase; font-size: 0.75rem; color: #64748b; margin-bottom: 1rem; }
        .compact-calendar .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none; border: none; }
        .compact-calendar .react-calendar__month-view__days__day--neighboringMonth { visibility: hidden !important; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
