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
import InventoryModal from '../components/inventory/InventoryModal';
import logoImg from '../assets/questlog-logo.png';
import bgPlayer from '../assets/background-player.png';
import bgSceneryDay from '../assets/background-scenery-day.png';
import bgSceneryMoon from '../assets/background-scenery-moon.png';
import bgRanking from '../assets/background-ranking.png';
import bgSmithy from '../assets/background-smithy.png';
import { WEAPON_DATABASE } from '../data/items';
import type { Item } from '../data/items';
import { equipWeapon, listenToRankings, enhanceWeapon, synthesizeItems } from '../firebase/userService';
import { translations } from '../i18n/translations';
import { 
  LogOut, 
  Plus, 
  Calendar as CalendarIcon,
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
  Moon,
  Trophy,
  Crown,
  Medal,
  Hammer,
  Sparkles,
  TrendingUp,
  ArrowRight,
  X,
  type LucideIcon
} from 'lucide-react';
import type { Stats, Quest, User, Difficulty } from '../types';

const Dashboard: React.FC = () => {
  const { user, language, setLanguage } = useUserStore();
  const { quests, setQuests } = useQuestStore();
  const [date, setDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [verifyingQuest, setVerifyingQuest] = useState<Quest | null>(null);
  const [isDay, setIsDay] = useState(() => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18;
  });
  const [rightTab, setRightTab] = useState<'inventory' | 'calendar' | 'ranking' | 'forge'>('calendar');
  const [rankings, setRankings] = useState<User[]>([]);
  const [selectedForgeItem, setSelectedForgeItem] = useState<Item | null>(null);
  const [synthSelection, setSynthSelection] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const t = translations[language];

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'quests'), where('authorId', '==', user.uid), orderBy('deadline', 'asc'));
      const unsubscribeQuests = onSnapshot(q, (snapshot) => {
        const fetchedQuests = snapshot.docs.map(doc => ({ qid: doc.id, ...doc.data() })) as Quest[];
        setQuests(fetchedQuests);
      });
      const unsubscribeRankings = listenToRankings(setRankings);
      return () => { unsubscribeQuests(); unsubscribeRankings(); };
    }
  }, [user, setQuests]);

  const toggleTheme = () => setIsDay(!isDay);

  if (!user) return null;

  const filteredQuests = quests.filter((q) => new Date(q.deadline).toDateString() === date.toDateString());
  const equippedWeapon = WEAPON_DATABASE.find(w => w.id === user.equippedWeaponId);
  const userInventory = (user.inventory || []).map(id => WEAPON_DATABASE.find(item => item.id === id)).filter((item): item is Item => !!item);

  const handleEquip = async (itemId: string) => await equipWeapon(user.uid, user.equippedWeaponId === itemId ? null : itemId);

  const handleEnhance = async () => {
    if (!selectedForgeItem || actionLoading) return;
    const currentLevel = user.itemLevels?.[selectedForgeItem.id] || 0;
    const cost = (currentLevel + 1) * 50;
    if (user.totalScore < cost) { alert(language === 'ko' ? '점수가 부족합니다!' : 'Not enough points!'); return; }
    setActionLoading(true);
    try { await enhanceWeapon(user.uid, selectedForgeItem.id, cost); } finally { setActionLoading(false); }
  };

  const handleSynthesize = async () => {
    if (synthSelection.length !== 3 || actionLoading) return;
    const firstItem = WEAPON_DATABASE.find(i => i.id === synthSelection[0])!;
    const grades: Difficulty[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    const targetGrade = grades[Math.min(grades.indexOf(firstItem.grade) + 1, grades.length - 1)];
    setActionLoading(true);
    try { await synthesizeItems(user.uid, synthSelection, targetGrade); setSynthSelection([]); } finally { setActionLoading(false); }
  };

  const toggleSynthSelection = (id: string) => {
    if (synthSelection.includes(id)) setSynthSelection(synthSelection.filter(sid => sid !== id));
    else if (synthSelection.length < 3) {
      const item = userInventory.find(i => i.id === id);
      const firstSelected = userInventory.find(i => i.id === synthSelection[0]);
      if (firstSelected && item?.grade !== firstSelected.grade) return;
      setSynthSelection([...synthSelection, id]);
    }
  };

  const statsList: { label: string; full: string; desc: string; value: number; key: keyof Stats; color: string; icon: LucideIcon }[] = [
    { label: 'STR', full: t.stats.str, desc: t.stat_desc.str, value: user.stats.str, key: 'str', color: 'text-red-500', icon: Flame },
    { label: 'INT', full: t.stats.int, desc: t.stat_desc.int, value: user.stats.int, key: 'int', color: 'text-blue-500', icon: Target },
    { label: 'DEX', full: t.stats.dex, desc: t.stat_desc.dex, value: user.stats.dex, key: 'dex', color: 'text-green-500', icon: Zap },
    { label: 'CHA', full: t.stats.cha, desc: t.stat_desc.cha, value: user.stats.cha, key: 'cha', color: 'text-purple-500', icon: Swords },
    { label: 'ECO', full: t.stats.eco, desc: t.stat_desc.eco, value: user.stats.eco, key: 'eco', color: 'text-emerald-500', icon: Shield },
  ];

  const level = Math.floor(user.totalScore / 100) + 1;
  const expPercentage = user.totalScore % 100;

  return (
    <div className={`min-h-screen lg:h-screen transition-colors duration-1000 flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 lg:p-6 overflow-hidden ${isDay ? 'bg-slate-50' : 'bg-[#020617]'}`}>
      
      {!isDay && <div className="absolute inset-0 night-stars pointer-events-none z-0 opacity-20"></div>}

      {/* 🛡️ Sidebar: Profile & Animated Stats */}
      <section className="w-full lg:w-[25%] h-full shrink-0 z-10">
        <div className={`h-full rounded-[2.5rem] border-4 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between transition-all duration-1000 ${isDay ? 'border-orange-400/30' : 'border-indigo-500/30'}`}>
          <div className="absolute inset-0 z-0">
            <img src={isDay ? bgSceneryDay : bgSceneryMoon} alt="" className="w-full h-full object-cover transition-opacity duration-1000" />
            <div className={`absolute inset-0 ${isDay ? 'bg-white/10' : 'bg-black/40'}`}></div>
          </div>
          <div className="absolute bottom-0 left-0 w-full pointer-events-none z-10 translate-y-4">
            <img src={bgPlayer} alt="" className="w-full h-auto object-cover" />
          </div>

          <div className="relative z-20 flex flex-col items-center text-center w-full h-full p-6 lg:p-8">
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div 
                  onClick={() => {
                    const randomCat = `https://cataas.com/cat?width=300&height=300&timestamp=${Date.now()}`;
                    useUserStore.getState().setUser({...user, photoURL: randomCat});
                  }}
                  className={`relative w-28 h-28 lg:w-36 lg:h-36 rounded-full border-4 overflow-hidden bg-white shadow-2xl cursor-pointer hover:scale-105 z-30 transition-all ${isDay ? 'border-orange-400' : 'border-indigo-400'}`}
                >
                  {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-5xl text-purple-200 italic">?</div>}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-slate-900 text-white px-4 py-1.5 rounded-2xl font-black text-xs shadow-xl border-2 border-white z-40">LV. {level}</div>
              </div>
              <h2 className={`text-2xl lg:text-3xl font-black mb-1 drop-shadow-md transition-colors duration-1000 ${isDay ? 'text-slate-900' : 'text-white'}`}>{user.nickname}</h2>
            </div>
            
            {/* 📊 Animated Stats - Fixed to bottom with 75px gap */}
            <div className={`w-full mt-auto mb-[75px] space-y-4 backdrop-blur-md p-5 rounded-[2.5rem] border shadow-xl transition-all duration-1000 overflow-y-auto max-h-[300px] lg:max-h-none custom-scrollbar ${isDay ? 'bg-white/80 border-white text-slate-900' : 'bg-black/40 border-white/5 text-white'}`}>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60"><span>{t.mastery_exp}</span><span>{expPercentage}%</span></div>
                <div className={`h-3 rounded-full border p-0.5 ${isDay ? 'bg-slate-100' : 'bg-slate-800'}`}><motion.div initial={{ width: 0 }} animate={{ width: `${expPercentage}%` }} className={`h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]`}></motion.div></div>
              </div>
              <div className="space-y-3">
                {statsList.map((stat) => (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    key={stat.key} 
                    className={`group relative p-3.5 rounded-2xl border transition-all cursor-help shadow-sm ${isDay ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'}`}
                  >
                    <div className="flex justify-between items-center relative z-10 h-5 overflow-hidden">
                      <div className="flex items-center gap-3">
                        <stat.icon className={`w-4 h-4 ${stat.color} transition-transform group-hover:scale-110`} />
                        <div className="relative h-4 w-32">
                          <span className={`absolute inset-0 text-[10px] font-black tracking-widest uppercase transition-all duration-300 group-hover:-translate-y-full group-hover:opacity-0 flex items-center ${isDay ? 'text-slate-600' : 'text-slate-300'}`}>{stat.label}</span>
                          <span className={`absolute inset-0 text-[9px] font-bold transition-all duration-300 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 flex items-center ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>{stat.desc}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-black transition-colors ${isDay ? 'text-slate-900' : 'text-white'}`}>{stat.value}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Column 2: Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`mb-6 flex items-center justify-between p-4 lg:p-5 rounded-[2.5rem] border shadow-2xl transition-all duration-1000 z-20 ${isDay ? 'bg-white border-slate-100' : 'bg-slate-900/80 border-white/5 text-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-2 shadow-lg border border-slate-100"><img src={logoImg} alt="QuestLog" className="w-full h-full object-contain" /></div>
            <div>
              <h1 className={`text-2xl lg:text-3xl font-black tracking-tighter italic uppercase leading-none mb-1 transition-colors ${isDay ? 'text-slate-900' : 'text-white'}`}>QuestLog</h1>
              <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>{t.protocol_active}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2.5 rounded-2xl border transition-all ${isDay ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>{isDay ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            <div className={`flex p-1 rounded-2xl gap-1 border transition-all ${isDay ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <button onClick={() => setLanguage('ko')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${language === 'ko' ? (isDay ? 'bg-white text-purple-600 shadow-sm' : 'bg-white/10 text-white') : 'text-slate-500'}`}>KO</button>
              <button onClick={() => setLanguage('en')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${language === 'en' ? (isDay ? 'bg-white text-purple-600 shadow-sm' : 'bg-white/10 text-white') : 'text-slate-500'}`}>EN</button>
            </div>
            <button onClick={logout} className="p-3 hover:bg-red-500/10 rounded-2xl text-slate-500 hover:text-red-500 transition-all"><LogOut className="w-5 h-5" /></button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-0">
          {/* COMBAT QUEUE - FIXED LISTING */}
          <section className="lg:col-span-7 flex flex-col gap-6 min-h-0 overflow-y-auto custom-scrollbar pr-2">
            <div className="flex items-center justify-between px-4 shrink-0">
              <h3 className={`text-xl font-black uppercase italic tracking-tighter ${isDay ? 'text-slate-900' : 'text-white'}`}>{t.quest_queue}</h3>
              <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95"><Plus className="w-5 h-5" strokeWidth={4} /></button>
            </div>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredQuests.length > 0 ? (
                  filteredQuests.map((quest, index) => (
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: index * 0.05 }} key={quest.qid} onClick={() => quest.status === 'pending' && setVerifyingQuest(quest)} className={`p-6 rounded-[2.5rem] border group transition-all cursor-pointer relative overflow-hidden ${quest.status === 'success' ? 'opacity-40 grayscale border-transparent bg-slate-100/50' : `shadow-xl hover:shadow-purple-100 hover:-translate-y-1 ${isDay ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5 text-white'}`}`}>
                      <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center shrink-0 overflow-hidden ${isDay ? 'bg-slate-50 border-slate-100' : 'bg-black/20 border-white/5'}`}>{quest.monsterImageUrl ? <img src={quest.monsterImageUrl} className="w-full h-full object-cover" /> : <Skull className="w-8 h-8 m-auto text-slate-300" />}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1"><span className={`text-[8px] font-black px-2 py-0.5 rounded-md border uppercase tracking-widest ${isDay ? 'bg-white border-slate-100 text-slate-500' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>{quest.category}</span><span className="text-[8px] font-black text-slate-400 uppercase">LV.{quest.level}</span></div>
                          <h4 className="text-lg font-black truncate uppercase italic leading-none">{quest.monsterName || quest.title}</h4>
                        </div>
                        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className={`py-20 text-center rounded-[3rem] border-4 border-dashed transition-colors ${isDay ? 'border-slate-100 bg-white/40' : 'border-white/5 bg-white/5'}`}>
                    <div className="w-16 h-16 bg-slate-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Shield className="w-8 h-8 text-slate-300" /></div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">{t.sector_clear}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* TABS AREA */}
          <section className="lg:col-span-5 flex flex-col min-h-0 relative">
            <div className={`rounded-[3rem] p-6 border shadow-2xl flex-1 flex flex-col min-h-0 overflow-hidden transition-all duration-1000 ${isDay ? 'bg-white border-orange-100' : 'bg-slate-900 border-white/5 text-white'}`}>
              
              <div className={`flex p-1 rounded-2xl gap-1 mb-6 shrink-0 overflow-x-auto no-scrollbar relative z-10 ${isDay ? 'bg-slate-100/50' : 'bg-white/5'}`}>
                {[
                  { id: 'calendar', icon: CalendarIcon, label: t.chronicle },
                  { id: 'inventory', icon: Box, label: t.arsenal },
                  { id: 'ranking', icon: Trophy, label: t.ranking_tab },
                  { id: 'forge', icon: Hammer, label: t.forge_tab }
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setRightTab(tab.id as any)} className={`flex-1 min-w-[70px] flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[9px] uppercase transition-all ${rightTab === tab.id ? 'bg-white text-purple-600 shadow-md scale-105' : (isDay ? 'text-slate-400 hover:text-slate-600' : 'text-white/40 hover:text-white')}`}>
                    <tab.icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 px-1">
                {rightTab === 'calendar' && (
                  <div className={`p-4 flex flex-col items-center rounded-[2.5rem] border transition-all duration-1000 ${isDay ? 'bg-slate-50/50 border-slate-100' : 'bg-white/5 border-white/5'}`}>
                    <Calendar onChange={(d) => setDate(d as Date)} value={date} locale={language === 'ko' ? 'ko-KR' : 'en-US'} className="compact-calendar" showNeighboringMonth={false} />
                  </div>
                )}
                
                {rightTab === 'inventory' && (
                  <div className="space-y-6">
                    {equippedWeapon && (
                      <div className="bg-slate-900 text-white p-5 rounded-[2.5rem] flex items-center gap-4 border-2 border-white/10 shadow-xl">
                        <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center p-2 border border-white/10 shrink-0"><img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${equippedWeapon.id}&backgroundColor=transparent`} className="w-full h-full object-contain" /></div>
                        <div><h4 className="text-sm font-black uppercase italic leading-none mb-1">{equippedWeapon.name}</h4><p className="text-[8px] font-black text-purple-400 uppercase tracking-widest font-serif">Lv. {user.itemLevels?.[equippedWeapon.id] || 0} • {equippedWeapon.grade}</p></div>
                      </div>
                    )}
                    <div className="grid grid-cols-4 gap-2">
                      {Array.from({ length: 16 }).map((_, i) => {
                        const item = userInventory[i];
                        return (
                          <div key={i} onClick={() => item && handleEquip(item.id)} className={`aspect-square rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center p-2 relative bg-white/50 border-slate-100 ${item ? (user.equippedWeaponId === item.id ? 'border-purple-500 bg-white shadow-lg scale-105' : 'hover:border-purple-200') : 'border-dashed'}`}>
                            {item && <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=transparent`} className="w-full h-full object-contain" />}
                            {item && user.equippedWeaponId === item.id && <div className="absolute -top-1 -right-1 bg-purple-600 rounded-full p-0.5 border-2 border-white shadow-md"><Check className="w-2 h-2 text-white" strokeWidth={5} /></div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {rightTab === 'ranking' && (
                  <div className="relative h-full min-h-[400px] rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl">
                    <img src={bgRanking} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/40 to-black/80"></div>
                    <div className="relative z-10 p-6 space-y-3">
                      {rankings.map((ranker, i) => (
                        <div key={ranker.uid} className={`p-4 rounded-3xl flex items-center gap-4 border transition-all ${ranker.uid === user.uid ? 'bg-amber-900/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                          <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-white">{ranker.photoURL ? <img src={ranker.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-black text-xs text-purple-200">?</div>}</div>
                          <div className="flex-1 min-w-0">
                            <h5 className={`text-xs font-black truncate ${ranker.uid === user.uid ? 'text-amber-400' : 'text-slate-200'}`}>{ranker.nickname}</h5>
                            <div className="flex items-center gap-1.5 mt-0.5"><Sparkles className="w-3 h-3 text-amber-500" /><span className={`text-[14px] font-black italic ${ranker.uid === user.uid ? 'text-amber-400' : 'text-amber-500/80'}`}>{ranker.totalScore.toLocaleString()}</span></div>
                          </div>
                          <div className={`text-lg font-black italic tracking-tighter ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-700' : 'opacity-20 text-white'}`}>#{i + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rightTab === 'forge' && (
                  <div className="relative h-full min-h-[500px] rounded-[3rem] overflow-hidden border border-orange-900/30 shadow-2xl">
                    <img src={bgSmithy} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50 transition-opacity duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 to-black/90"></div>
                    <div className="relative z-10 p-6 space-y-8">
                      <section className={`p-6 rounded-[2.5rem] border-2 shadow-lg backdrop-blur-sm ${isDay ? 'bg-orange-50/20 border-orange-100/30' : 'bg-orange-950/20 border-orange-900/30'}`}>
                        <div className="flex items-center gap-2 mb-4"><Hammer className="w-4 h-4 text-orange-500" /><h4 className="text-sm font-black uppercase italic text-orange-100">{t.enhance}</h4></div>
                        <div className="grid grid-cols-4 gap-2 mb-6">{userInventory.map(item => <div key={item.id} onClick={() => setSelectedForgeItem(item)} className={`aspect-square rounded-xl border-2 cursor-pointer bg-black/40 flex items-center justify-center p-2 transition-all ${selectedForgeItem?.id === item.id ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)] scale-105' : 'border-transparent hover:border-orange-500/30'}`}><img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`} className="w-full h-full object-contain" /></div>)}</div>
                        {selectedForgeItem && (
                          <div className="space-y-4 text-center p-4 bg-black/40 rounded-2xl border border-orange-900/30">
                            <h5 className="font-black text-xs uppercase italic text-white">{selectedForgeItem.name}</h5>
                            <button onClick={handleEnhance} disabled={actionLoading} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 transition-all">{actionLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-200" />}<span>{t.enhance} ({(user.itemLevels?.[selectedForgeItem.id] || 0) + 1} * 50 pts)</span></button>
                          </div>
                        )}
                      </section>
                      <section className={`p-6 rounded-[2.5rem] border-2 shadow-lg backdrop-blur-sm ${isDay ? 'bg-blue-50/20 border-blue-100/30' : 'bg-blue-950/20 border-blue-900/30'}`}>
                        <div className="flex items-center gap-2 mb-4"><Box className="w-4 h-4 text-blue-400" /><h4 className="text-sm font-black uppercase italic text-blue-100">{t.synthesize}</h4></div>
                        <div className="flex justify-center gap-3 mb-6">{[0,1,2].map(i => <div key={i} className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center bg-black/40 transition-all ${synthSelection[i] ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105' : 'border-dashed border-white/10'}`}>{synthSelection[i] && <div className="relative p-2 h-full w-full"><img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${synthSelection[i]}`} className="w-full h-full object-contain" /><button onClick={() => toggleSynthSelection(synthSelection[i])} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 shadow-md active:scale-90"><X className="w-3 h-3" /></button></div>}</div>)}</div>
                        <div className="grid grid-cols-6 gap-2 mb-6">{userInventory.filter(it => !synthSelection.includes(it.id)).map(item => <div key={item.id} onClick={() => toggleSynthSelection(item.id)} className="aspect-square rounded-xl border-2 border-white/5 cursor-pointer bg-black/20 p-1 hover:border-blue-400/50 transition-all shadow-sm"><img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}`} className="w-full h-full object-contain" /></div>)}</div>
                        <button onClick={handleSynthesize} disabled={synthSelection.length !== 3 || actionLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg active:scale-95 disabled:opacity-30 flex items-center justify-center gap-3 transition-all">{actionLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-blue-200" />}<span>{t.synthesize}</span></button>
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      <CreateQuestModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} selectedDate={date} />
      <VerifyQuestModal quest={verifyingQuest} onClose={() => setVerifyingQuest(null)} />
      <InventoryModal isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .compact-calendar { border: none !important; width: 100% !important; background: transparent !important; }
        .compact-calendar .react-calendar__navigation { display: flex !important; margin-bottom: 1rem !important; }
        .compact-calendar .react-calendar__navigation button { 
          min-width: 40px !important; 
          color: ${isDay ? '#1e293b' : '#f1f5f9'} !important; 
          font-weight: 900 !important; 
          border-radius: 0.8rem !important; 
          transition: all 0.2s; 
        }
        .compact-calendar .react-calendar__navigation button:hover {
          background: ${isDay ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.1)'} !important;
        }
        .compact-calendar .react-calendar__month-view__weekdays {
          color: ${isDay ? '#64748b' : '#94a3b8'} !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
          font-size: 0.7rem !important;
        }
        .compact-calendar .react-calendar__tile { 
          aspect-ratio: 1/1; 
          display: flex !important; 
          align-items: center !important; 
          justify-content: center !important; 
          font-weight: 900; 
          border-radius: 0.8rem !important; 
          border: 2px solid transparent !important; 
          transition: all 0.2s;
          color: ${isDay ? '#1e293b' : '#f1f5f9'} !important;
        }
        .compact-calendar .react-calendar__tile--active { background: #9333ea !important; color: white !important; }
        .compact-calendar .react-calendar__tile--now { background: #f3e8ff !important; color: #9333ea !important; }
        .compact-calendar .react-calendar__tile--neighboringMonth { opacity: 0.3 !important; }
      `}</style>
    </div>
  );
};

export default Dashboard;
