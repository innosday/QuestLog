import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sword, Zap, Target, Flame, Box, Check, Calendar as CalendarIcon, Hammer, Sparkles, TrendingUp, Skull, Shield } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { WEAPON_DATABASE } from '../../data/items';
import type { Item } from '../../data/items';
import { equipWeapon, enhanceWeapon, synthesizeItems } from '../../firebase/userService';
import { translations } from '../../i18n/translations';
import type { Difficulty } from '../../types';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose }) => {
  const { user, language } = useUserStore();
  const [activeTab, setActiveTab] = useState<'inventory' | 'calendar' | 'forge'>('inventory');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedForgeItem, setSelectedForgeItem] = useState<Item | null>(null);
  const [synthSelection, setSynthSelection] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  const t = translations[language];

  if (!user) return null;

  const userInventory = (user.inventory || [])
    .map(id => WEAPON_DATABASE.find(item => item.id === id))
    .filter((item): item is Item => !!item);

  const equippedWeapon = WEAPON_DATABASE.find(w => w.id === user.equippedWeaponId);

  const handleEquip = async (itemId: string) => {
    await equipWeapon(user.uid, user.equippedWeaponId === itemId ? null : itemId);
  };

  const handleEnhance = async () => {
    if (!selectedForgeItem || actionLoading) return;
    const currentLevel = user.itemLevels?.[selectedForgeItem.id] || 0;
    const cost = (currentLevel + 1) * 50; // Simple cost formula

    if (user.totalScore < cost) {
      alert(language === 'ko' ? '점수가 부족합니다!' : 'Not enough points!');
      return;
    }

    setActionLoading(true);
    try {
      await enhanceWeapon(user.uid, selectedForgeItem.id, cost);
      console.log(`[Forge] 🔨 Enhanced ${selectedForgeItem.name} to Lv.${currentLevel + 1}`);
    } catch (error) {
      alert('Forge failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSynthesize = async () => {
    if (synthSelection.length !== 3 || actionLoading) return;
    const firstItem = WEAPON_DATABASE.find(i => i.id === synthSelection[0])!;
    
    // Determine next grade
    const grades: Difficulty[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
    const currentIndex = grades.indexOf(firstItem.grade);
    const targetGrade = grades[Math.min(currentIndex + 1, grades.length - 1)];

    setActionLoading(true);
    try {
      const newItem = await synthesizeItems(user.uid, synthSelection, targetGrade);
      alert(language === 'ko' ? `축하합니다! ${newItem.name}을(를) 획득했습니다!` : `Success! Obtained ${newItem.name}!`);
      setSynthSelection([]);
    } catch (error) {
      alert('Synthesis failed');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSynthSelection = (id: string) => {
    if (synthSelection.includes(id)) {
      setSynthSelection(synthSelection.filter(sid => sid !== id));
    } else if (synthSelection.length < 3) {
      const item = userInventory.find(i => i.id === id);
      const firstSelected = userInventory.find(i => i.id === synthSelection[0]);
      
      if (firstSelected && item?.grade !== firstSelected.grade) {
        alert(language === 'ko' ? '같은 등급의 아이템만 합성할 수 있습니다.' : 'Only items of the same grade can be synthesized.');
        return;
      }
      setSynthSelection([...synthSelection, id]);
    }
  };

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'STR': return <Flame className="w-4 h-4 text-red-500" />;
      case 'INT': return <Target className="w-4 h-4 text-blue-500" />;
      case 'DEX': return <Zap className="w-4 h-4 text-green-500" />;
      case 'CHA': return <Sparkles className="w-4 h-4 text-pink-500" />;
      case 'ECO': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      default: return <Sword className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"></motion.div>
          
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative glass-card w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col h-[85vh] bg-white shadow-2xl">
            {/* Header Tabs */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] gap-1">
                <button onClick={() => setActiveTab('inventory')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-white text-purple-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Box className="w-4 h-4" /> <span className="font-black text-[10px] uppercase tracking-tighter">{t.inventory}</span>
                </button>
                <button onClick={() => setActiveTab('forge')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all ${activeTab === 'forge' ? 'bg-white text-orange-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
                  <Hammer className="w-4 h-4" /> <span className="font-black text-[10px] uppercase tracking-tighter">Ancient Forge</span>
                </button>
                <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all ${activeTab === 'calendar' ? 'bg-white text-purple-600 shadow-md scale-105' : 'text-slate-500 hover:text-slate-700'}`}>
                  <CalendarIcon className="w-4 h-4" /> <span className="font-black text-[10px] uppercase tracking-tighter">Chronicles</span>
                </button>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {/* 🛡️ INVENTORY TAB */}
              {activeTab === 'inventory' && (
                <div className="space-y-10">
                  <section>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1">{t.active_gear}</label>
                    {equippedWeapon ? (
                      <div className="p-6 rounded-[2rem] bg-slate-50 border-4 border-double border-purple-200 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-6 relative z-10">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-md border border-slate-100">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${equippedWeapon.id}&backgroundColor=ffffff`} alt="" className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{equippedWeapon.grade}</span>
                              <div className="flex items-center gap-1 bg-slate-900 text-white px-1.5 py-0.5 rounded text-[9px] font-black italic shadow-sm">Lv. {user.itemLevels?.[equippedWeapon.id] || 0}</div>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-tight">{equippedWeapon.name}</h3>
                            <p className="text-sm font-bold text-emerald-600">+{equippedWeapon.bonusValue + (user.itemLevels?.[equippedWeapon.id] || 0) * 2} {equippedWeapon.statType} Affinity</p>
                          </div>
                        </div>
                        <button onClick={() => handleEquip(equippedWeapon.id)} className="relative z-10 px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-red-600 transition-all shadow-lg active:scale-95 uppercase tracking-widest italic">Unequip</button>
                      </div>
                    ) : (
                      <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center bg-slate-50/30 font-serif italic text-slate-400">"A hero needs a blade to carve their path."</div>
                    )}
                  </section>

                  <section>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1">{t.inventory} ({userInventory.length})</label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userInventory.map((item, i) => (
                        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} key={`${item.id}-${i}`} onClick={() => handleEquip(item.id)} className={`p-4 rounded-3xl border-2 transition-all cursor-pointer group relative ${user.equippedWeaponId === item.id ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-100 shadow-sm'}`}>
                          {user.equippedWeaponId === item.id && <div className="absolute top-3 right-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm z-30"><Check className="w-3 h-3 text-white" strokeWidth={4} /></div>}
                          <div className="w-full aspect-square bg-slate-50 rounded-2xl mb-4 flex items-center justify-center p-4 group-hover:scale-105 transition-transform shadow-inner relative overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`} alt="" className="w-full h-full object-contain relative z-10" />
                            <div className="absolute bottom-1 right-1 bg-slate-900 text-white px-1.5 py-0.5 rounded-lg text-[8px] font-black z-20">Lv. {user.itemLevels?.[item.id] || 0}</div>
                          </div>
                          <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{item.grade}</div>
                          <h4 className="text-sm font-black text-slate-900 truncate uppercase italic">{item.name}</h4>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                </div>
              )}

              {/* 🔥 ANCIENT FORGE TAB */}
              {activeTab === 'forge' && (
                <div className="space-y-12">
                  {/* ENHANCEMENT SECTION */}
                  <section className="bg-orange-50/50 p-8 rounded-[3rem] border-2 border-orange-100 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none"><Hammer className="w-48 h-48 text-orange-900 rotate-12" /></div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="p-2 bg-orange-600 rounded-lg shadow-lg shadow-orange-200"><Sparkles className="w-5 h-5 text-white" /></div>
                      <h3 className="text-2xl font-black text-orange-950 tracking-tighter uppercase italic">Flame Enhancement</h3>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 items-center relative z-10">
                      <div className="w-full lg:w-1/2 space-y-4">
                        <label className="text-[10px] font-black text-orange-900/40 uppercase tracking-[0.2em] ml-1">Select Weapon</label>
                        <div className="grid grid-cols-4 gap-2">
                          {userInventory.map((item) => (
                            <div key={item.id} onClick={() => setSelectedForgeItem(item)} className={`aspect-square rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-center p-2 bg-white ${selectedForgeItem?.id === item.id ? 'border-orange-500 ring-4 ring-orange-100 shadow-lg' : 'border-orange-900/5 hover:border-orange-200 shadow-sm'}`}>
                              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=transparent`} alt="" className="w-full h-full object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 w-full text-center lg:text-left">
                        {selectedForgeItem ? (
                          <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-orange-200">
                              <h4 className="text-xl font-black text-slate-900 uppercase italic mb-2 leading-none">{selectedForgeItem.name}</h4>
                              <div className="flex items-center justify-center lg:justify-start gap-4 mb-4 font-black">
                                <div className="text-slate-400">Lv. {user.itemLevels?.[selectedForgeItem.id] || 0}</div>
                                <ArrowRight className="w-4 h-4 text-orange-500" />
                                <div className="text-orange-600">Lv. {(user.itemLevels?.[selectedForgeItem.id] || 0) + 1}</div>
                              </div>
                              <div className="flex items-center justify-center lg:justify-start gap-2 text-emerald-600 font-black text-sm">
                                <TrendingUp className="w-4 h-4" />
                                <span>+2 {selectedForgeItem.statType} Affinity Bonus</span>
                              </div>
                            </div>
                            <button 
                              onClick={handleEnhance}
                              disabled={actionLoading}
                              className="w-full bg-slate-900 hover:bg-black text-white py-5 rounded-2xl font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center gap-1 group"
                            >
                              <div className="flex items-center gap-3">
                                {actionLoading ? <RotateCw className="w-6 h-6 animate-spin" /> : <Hammer className="w-6 h-6 group-hover:rotate-12 transition-transform text-orange-400" />}
                                <span className="text-lg uppercase tracking-[0.1em]">Enhance Soul</span>
                              </div>
                              <span className="text-[10px] text-orange-400/60 font-bold uppercase tracking-widest">Cost: {((user.itemLevels?.[selectedForgeItem.id] || 0) + 1) * 50} pts</span>
                            </button>
                          </div>
                        ) : (
                          <div className="py-12 border-2 border-dashed border-orange-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-orange-950/20">
                            <Sword className="w-10 h-10" />
                            <span className="text-xs font-black uppercase tracking-widest">Select an artifact to awaken</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  {/* SYNTHESIS SECTION */}
                  <section className="bg-blue-50/50 p-8 rounded-[3rem] border-2 border-blue-100 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none"><Box className="w-48 h-48 text-blue-900 -rotate-12" /></div>
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                      <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200"><Shield className="w-5 h-5 text-white" /></div>
                      <h3 className="text-2xl font-black text-blue-950 tracking-tighter uppercase italic">Mystic Synthesis</h3>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div className="flex justify-center gap-4">
                        {[0, 1, 2].map((i) => {
                          const itemId = synthSelection[i];
                          const item = userInventory.find(it => it.id === itemId);
                          return (
                            <div key={i} className={`w-24 h-24 rounded-3xl border-4 flex items-center justify-center shadow-xl transition-all ${item ? 'bg-white border-blue-500 scale-105' : 'bg-blue-900/5 border-dashed border-blue-900/10'}`}>
                              {item ? (
                                <div className="relative group p-3 w-full h-full flex items-center justify-center">
                                  <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=transparent`} alt="" className="w-full h-full object-contain" />
                                  <button onClick={() => toggleSynthSelection(item.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                </div>
                              ) : (
                                <Skull className="w-8 h-8 text-blue-900/10" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] ml-1 text-center block">Source Materials (Pick 3 of same grade)</label>
                        <div className="grid grid-cols-6 gap-2">
                          {userInventory.filter(item => !synthSelection.includes(item.id)).map((item) => (
                            <div key={item.id} onClick={() => toggleSynthSelection(item.id)} className="aspect-square rounded-2xl border-2 border-blue-900/5 cursor-pointer bg-white flex items-center justify-center p-2 hover:border-blue-300 shadow-sm transition-all grayscale hover:grayscale-0">
                              <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=transparent`} alt="" className="w-full h-full object-contain" />
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={handleSynthesize}
                        disabled={synthSelection.length !== 3 || actionLoading}
                        className="w-full bg-blue-950 hover:bg-black text-white py-6 rounded-2xl font-black shadow-2xl transition-all active:scale-[0.98] disabled:opacity-30 flex items-center justify-center gap-4 group"
                      >
                        {actionLoading ? <RotateCw className="w-8 h-8 animate-spin" /> : <Box className="w-8 h-8 group-hover:scale-110 transition-transform text-blue-400" />}
                        <span className="text-xl uppercase tracking-widest">Perform Rite of Union</span>
                      </button>
                    </div>
                  </section>
                </div>
              )}

              {/* 📅 CALENDAR TAB */}
              {activeTab === 'calendar' && (
                <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-8 shadow-inner flex flex-col items-center justify-center min-h-[400px]">
                  <Calendar onChange={(d) => setDate(d as Date)} value={date} locale={language === 'ko' ? 'ko-KR' : 'en-US'} className="compact-calendar full-calendar" showNeighboringMonth={false} />
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        .compact-calendar { border: none !important; font-family: inherit !important; width: 100% !important; background: transparent !important; }
        .compact-calendar .react-calendar__navigation { display: flex !important; margin-bottom: 2rem !important; height: 48px !important; }
        .compact-calendar .react-calendar__navigation button { 
          min-width: 48px !important; height: 48px !important; 
          font-size: 1.1rem !important; font-weight: 900 !important; color: #1e293b !important;
          background: transparent !important; border: none !important; border-radius: 1rem !important; transition: all 0.2s !important;
        }
        .compact-calendar .react-calendar__tile { 
          aspect-ratio: 1 / 1; display: flex !important; align-items: center !important; justify-content: center !important;
          font-size: 1rem !important; font-weight: 900; border-radius: 1.2rem !important; color: #94a3b8; background: transparent !important; border: 2px solid transparent !important; transition: all 0.2s ease;
        }
        .compact-calendar .react-calendar__tile--active { background: #9333ea !important; color: white !important; box-shadow: 0 8px 20px rgba(147,51,234,0.3); border-color: transparent !important; }
        .compact-calendar .react-calendar__month-view__weekdays { font-weight: 900; text-transform: uppercase; font-size: 0.75rem; color: #64748b; margin-bottom: 1rem; }
        .compact-calendar .react-calendar__month-view__days__day--neighboringMonth { visibility: hidden !important; }
      `}</style>
    </AnimatePresence>
  );
};

export default InventoryModal;
