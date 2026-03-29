import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, RotateCw, Sparkles, Skull, Shield, Sword } from 'lucide-react';
import type { MonsterData, Quest } from '../../types';
import { useUserStore } from '../../store/userStore';
import { createQuest } from '../../firebase/questService';
import { useQuestStore } from '../../store/questStore';
import { analyzeQuestWithAI, suggestQuestsWithAI } from '../../services/aiService';
import { translations } from '../../i18n/translations';

import questPaper from '../../assets/quest-paper.png';

/**
 * 🎨 Refined Ancient Monster Display
 */
const MonsterDisplay: React.FC<{ monster: MonsterData }> = ({ monster }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="w-24 h-24 rounded-lg overflow-hidden border-2 border-[#3d2b1f] shadow-inner shrink-0 bg-[#fdf6e3] relative">
      {monster.monsterImageUrl && (
        <img 
          src={monster.monsterImageUrl} 
          alt={monster.monsterName} 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 z-20 mix-blend-multiply ${isLoaded ? 'opacity-90' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
      <img 
        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(monster.monsterName)}&backgroundColor=fdf6e3`}
        alt=""
        className={`absolute inset-0 w-full h-full object-cover z-10 ${isLoaded ? 'opacity-20' : 'opacity-100 animate-pulse'}`}
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5 z-30">
          <RotateCw className="w-5 h-5 text-[#3d2b1f]/40 animate-spin" />
        </div>
      )}
    </div>
  );
};

interface CreateQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
}

const CreateQuestModal: React.FC<CreateQuestModalProps> = ({ isOpen, onClose, selectedDate }) => {
  const { user, language } = useUserStore();
  const { addQuest } = useQuestStore();
  const t = translations[language];
  
  const [title, setTitle] = useState('');
  const [isTeam, setIsTeam] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | undefined>();
  
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<MonsterData | null>(null);

  if (!user) return null;

  const handleOracle = async () => {
    setSuggesting(true);
    try {
      const results = await suggestQuestsWithAI(user.stats, language);
      setSuggestions(results);
    } catch (error) {
      console.error("[UI] Oracle Error:", error);
    } finally {
      setSuggesting(false);
    }
  };

  const handleSummon = async (selectedTitle?: string) => {
    const targetTitle = selectedTitle || title;
    if (!targetTitle.trim()) return;
    
    if (selectedTitle) setTitle(selectedTitle);
    
    setAnalyzing(true);
    setAnalysis(null);
    setSuggestions([]); // Clear suggestions once one is picked or summon starts
    try {
      const result = await analyzeQuestWithAI(targetTitle, language);
      setAnalysis(result);
    } catch (error) {
      console.error("[UI] Summon Error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGetLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: language === 'ko' ? '현 위치' : 'GPS TAGGED'
        });
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !analysis) return;

    setLoading(true);
    try {
      const qid = await createQuest({
        authorId: user.uid,
        title,
        description: "",
        category: analysis.category,
        difficulty: analysis.grade,
        monsterName: analysis.monsterName,
        monsterDescription: analysis.monsterDescription,
        monsterImageUrl: analysis.monsterImageUrl,
        level: analysis.level,
        deadline: selectedDate.getTime(),
        status: 'pending',
        isTeam,
        location: location
      });

      addQuest({
        qid,
        authorId: user.uid,
        title,
        description: "",
        category: analysis.category,
        difficulty: analysis.grade,
        monsterName: analysis.monsterName,
        monsterDescription: analysis.monsterDescription,
        monsterImageUrl: analysis.monsterImageUrl,
        level: analysis.level,
        deadline: selectedDate.getTime(),
        status: 'pending',
        isTeam,
        location: location,
        createdAt: Date.now()
      });
      
      resetAndClose();
    } catch (error) {
      console.error("[UI] Submit Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTitle('');
    setLocation(undefined);
    setAnalysis(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !loading && !analyzing && resetAndClose()}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          ></motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="relative w-[850px] h-[880px] flex flex-col items-center"
          >
            {/* Ancient Scroll Background */}
            <div 
              className="absolute inset-0 pointer-events-none z-0"
              style={{ 
                backgroundImage: `url(${questPaper})`,
                backgroundSize: '100% 100%',
                filter: 'drop-shadow(0 40px 80px rgba(0,0,0,0.9)) sepia(0.2)'
              }}
            ></div>

            {/* Modal Content - Hand-written Script Style */}
            <div className="relative z-10 w-full h-full flex flex-col px-[165px] pt-[180px] pb-[180px] font-serif">
              <div className="flex justify-between items-start mb-6 shrink-0 border-b-2 border-[#3d2b1f]/10 pb-4">
                <div className="flex items-center gap-4">
                  <Skull className="w-8 h-8 text-[#1a0f08]" />
                  <h2 className="text-3xl font-black tracking-tighter text-[#1a0f08] uppercase italic">
                    {t.summon_target}
                  </h2>
                </div>
                
                <button 
                  onClick={resetAndClose} 
                  disabled={loading || analyzing}
                  className="w-10 h-10 bg-[#1a0f08] text-[#fdf6e3] rounded-full flex items-center justify-center hover:bg-red-950 transition-all shadow-lg disabled:opacity-30"
                >
                  <X className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-visible">
                <div className="space-y-6">
                  {/* Quest Title Input - Ink on Parchment Style */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <label className="text-[11px] font-bold text-[#3d2b1f]/60 uppercase tracking-[0.4em] ml-1">Essence of the Mission</label>
                      <button
                        type="button"
                        onClick={handleOracle}
                        disabled={suggesting}
                        className="flex items-center gap-1.5 text-[10px] font-black text-[#3d2b1f]/40 hover:text-[#1a0f08] transition-colors uppercase tracking-widest group/oracle"
                      >
                        {suggesting ? (
                          <RotateCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3 group-hover/oracle:text-amber-600 transition-colors" />
                        )}
                        {t.oracle_advice}
                      </button>
                    </div>
                    
                    <div className="relative flex items-center group/input">
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={t.essence_placeholder}
                        className="w-full bg-transparent border-b-2 border-[#1a0f08]/20 py-4 pl-2 pr-36 outline-none font-bold text-2xl text-[#1a0f08] placeholder:text-[#1a0f08]/10 transition-all focus:border-[#1a0f08]/60"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleSummon()}
                        disabled={analyzing || !title.trim()}
                        className="absolute right-4 flex items-center gap-2 group/summon disabled:opacity-20 transition-all hover:scale-105 active:translate-y-0.5"
                      >
                        <div className="relative">
                          <div className="absolute inset-0 bg-amber-400/0 group-hover/summon:bg-amber-400/20 blur-lg rounded-full transition-all"></div>
                          {analyzing ? (
                            <RotateCw className="w-6 h-6 text-[#1a0f08] animate-spin relative z-10" />
                          ) : (
                            <Sparkles className="w-6 h-6 text-[#1a0f08] group-hover/summon:text-amber-700 transition-colors relative z-10" />
                          )}
                        </div>
                        <span className="text-xl font-black italic tracking-tighter text-[#1a0f08] group-hover/summon:text-amber-900 transition-colors" style={{ fontFamily: 'serif' }}>
                          Summon
                        </span>
                      </button>
                    </div>

                    {/* AI Suggestions Chips */}
                    <AnimatePresence>
                      {suggestions.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-2 overflow-hidden"
                        >
                          {suggestions.map((s, i) => (
                            <motion.button
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                              type="button"
                              onClick={() => handleSummon(s)}
                              className="px-3 py-1.5 rounded-full border border-[#1a0f08]/10 bg-[#1a0f08]/5 text-[11px] font-bold text-[#1a0f08]/60 hover:bg-[#1a0f08] hover:text-[#fdf6e3] transition-all"
                            >
                              {s}
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Monster Card - Parchment Inset Style */}
                  <div className="min-h-[180px]">
                    <AnimatePresence mode="wait">
                      {analysis && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 rounded-lg border-2 border-[#1a0f08]/10 bg-[#1a0f08]/5 space-y-4"
                        >
                          <div className="flex gap-6">
                            <MonsterDisplay monster={analysis} />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-[#1a0f08] text-[#fdf6e3] uppercase tracking-widest">{analysis.category}</span>
                                    <span className="text-[10px] font-bold text-[#1a0f08] italic border-b border-[#1a0f08]">{analysis.grade}</span>
                                  </div>
                                  <h3 className="text-2xl font-black text-[#1a0f08] tracking-tight">{analysis.monsterName}</h3>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-[10px] font-bold text-[#3d2b1f]/60">LV.</div>
                                  <div className="text-4xl font-black text-[#1a0f08] leading-none">{analysis.level}</div>
                                </div>
                              </div>
                              <p className="text-base font-medium text-[#1a0f08]/80 italic mt-3 leading-relaxed border-l-2 border-[#1a0f08]/20 pl-4">
                                "{analysis.monsterDescription}"
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Toggles & GPS - Wood/Ink Style */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#3d2b1f]/60 uppercase tracking-widest ml-1">Party Tactics</label>
                      <div className="flex items-center justify-between p-4 border-2 border-[#1a0f08]/10 bg-[#1a0f08]/5 rounded-sm">
                        <div className="flex items-center gap-3 text-[#1a0f08]">
                          <Users className="w-5 h-5 opacity-60" />
                          <span className="text-[11px] font-bold uppercase tracking-tighter">Raid Mode</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer scale-90">
                          <input type="checkbox" checked={isTeam} onChange={(e) => setIsTeam(e.target.checked)} className="sr-only peer" />
                          <div className="w-12 h-6 bg-[#1a0f08]/10 rounded-full peer peer-checked:bg-[#1a0f08] transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#fdf6e3] after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:after:translate-x-6"></div>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#3d2b1f]/60 uppercase tracking-widest ml-1">Ancient Tracking</label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={locating}
                        className={`w-full h-[58px] flex items-center justify-center gap-3 border-2 font-bold transition-all shadow-sm active:translate-y-0.5 ${location ? 'bg-emerald-950 text-emerald-50 border-emerald-950' : 'bg-transparent border-[#1a0f08]/20 text-[#1a0f08] hover:border-[#1a0f08]'}`}
                      >
                        {locating ? <RotateCw className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
                        <span className="text-[11px] font-black uppercase tracking-widest">{location ? 'LOCATED' : 'LOCATE'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Final Mission Button - DECORATIVE SEAL STYLE (NO RECT BOX) */}
                <div className="mt-8 flex justify-center shrink-0">
                  <button
                    type="submit"
                    disabled={loading || !analysis}
                    className="relative group flex items-center justify-center gap-10 px-12 py-4 transition-all active:scale-95 disabled:opacity-20"
                  >
                    {/* Decorative Flanker - Shield */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full group-hover:bg-red-600/30 transition-all"></div>
                      <Shield className="w-12 h-12 text-[#5d3a1a] group-hover:text-red-950 transition-colors relative z-10" strokeWidth={1.5} />
                    </div>

                    {/* Main Text - Ancient Script Style */}
                    <div className="text-center relative z-10">
                      <div className="text-[10px] font-black text-red-900/60 uppercase tracking-[0.5em] mb-1">Confirm Decree</div>
                      <span className="text-4xl font-black text-[#1a0f08] italic tracking-widest uppercase drop-shadow-sm transition-colors group-hover:text-red-950" style={{ fontFamily: 'serif' }}>
                        {loading ? <RotateCw className="w-10 h-10 animate-spin mx-auto" /> : t.accept_mission}
                      </span>
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#1a0f08]/40 to-transparent mt-2"></div>
                    </div>

                    {/* Decorative Flanker - Sword */}
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full group-hover:bg-red-600/30 transition-all"></div>
                      <Sword className="w-12 h-12 text-[#5d3a1a] group-hover:text-red-950 transition-colors relative z-10" strokeWidth={1.5} />
                    </div>

                    {/* Background Decorative Crest (Optional, faint) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none group-hover:opacity-[0.07] transition-opacity">
                      <Skull className="w-32 h-32 text-black" />
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateQuestModal;
