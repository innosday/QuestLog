import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, Locate, Plus, Shield, Sword, Target, Flame, RotateCw, Sparkles, Skull } from 'lucide-react';
import type { Category, Difficulty, Quest, MonsterData } from '../../types';
import { useUserStore } from '../../store/userStore';
import { createQuest } from '../../firebase/questService';
import { useQuestStore } from '../../store/questStore';
import { analyzeQuestWithAI } from '../../services/aiService';
import { translations } from '../../i18n/translations';

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
  const [description, setDescription] = useState('');
  const [isTeam, setIsTeam] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | undefined>();
  
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [analysis, setAnalysis] = useState<MonsterData | null>(null);

  if (!user) return null;

  const handleSummon = async () => {
    if (!title.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeQuestWithAI(title, language);
      setAnalysis(result);
    } catch (error) {
      alert(language === 'ko' ? 'AI 소환에 실패했습니다.' : 'AI Summon failed.');
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
          address: language === 'ko' ? '현재 위치' : 'Current Location'
        });
        setLocating(false);
      },
      (err) => {
        alert(language === 'ko' ? '위치 정보를 가져올 수 없습니다.' : 'Failed to get location.');
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !analysis) return;

    setLoading(true);
    try {
      const questData: any = {
        authorId: user.uid,
        title,
        description,
        category: analysis.category,
        difficulty: analysis.grade,
        monsterName: analysis.monsterName,
        monsterDescription: analysis.monsterDescription,
        level: analysis.level,
        deadline: selectedDate.getTime(),
        status: 'pending',
        isTeam,
      };
      
      if (location) {
        questData.location = location;
      }
      
      const qid = await createQuest(questData);
      addQuest({ qid, ...questData, createdAt: Date.now() });
      resetAndClose();
    } catch (error) {
      alert(language === 'ko' ? '퀘스트 생성에 실패했습니다.' : 'Quest creation failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    onClose();
    setTitle('');
    setDescription('');
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
            onClick={resetAndClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          ></motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative glass-card w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-red-600 rounded-lg shadow-lg shadow-red-200">
                    <Skull className="w-5 h-5 text-white" />
                  </div>
                  {t.summon_target}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Quest Commission</p>
              </div>
              <button 
                onClick={resetAndClose} 
                className="p-3 bg-slate-100 hover:bg-red-500 rounded-2xl transition-all group shadow-sm hover:shadow-red-200 hover:scale-110 active:scale-95"
                title="Close"
              >
                <X className="w-6 h-6 text-slate-500 group-hover:text-white transition-colors" strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Monster Essence</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.essence_placeholder}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold text-lg text-slate-900 placeholder:text-slate-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleSummon}
                    disabled={analyzing || !title.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-100 text-white px-6 rounded-2xl font-black transition-all shadow-lg flex items-center gap-2"
                  >
                    {analyzing ? <RotateCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {t.summon}
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {analysis && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0, y: -10 }}
                    animate={{ height: 'auto', opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded border border-purple-200 text-purple-600 bg-purple-50 uppercase tracking-widest`}>
                            {analysis.category}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded border border-slate-200 text-slate-400 uppercase tracking-tighter">
                            {analysis.grade}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{analysis.monsterName}</h3>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase">LV.</div>
                        <div className="text-2xl font-black text-purple-600 leading-none">{analysis.level}</div>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-slate-500 italic">"{analysis.monsterDescription}"</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t.party_mode}</label>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 h-[54px]">
                    <Users className="w-5 h-5 text-blue-500" />
                    <label className="relative inline-flex items-center cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={isTeam} 
                        onChange={(e) => setIsTeam(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{t.gps_verification}</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={locating}
                    className={`w-full h-[54px] flex items-center justify-center gap-3 rounded-2xl border font-black text-xs transition-all ${
                      location 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                      : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {locating ? <RotateCw className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    {location ? t.gps_locked : 'GPS TAG'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !analysis}
                className="btn-primary w-full py-5 text-lg disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none"
              >
                {loading ? <RotateCw className="w-6 h-6 animate-spin" /> : t.accept_mission}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateQuestModal;
