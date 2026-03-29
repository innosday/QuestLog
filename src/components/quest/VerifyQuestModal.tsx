import React, { useState } from 'react';
// UI Refresh
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, MapPin, RotateCw, CheckCircle2, AlertCircle, Sparkles, Trophy, ShieldAlert } from 'lucide-react';
import type { Quest } from '../../types';
import { uploadProofPhoto, completeQuest } from '../../firebase/questService';
import { getDistance } from '../../utils/geo';
import { verifyProofWithAI } from '../../services/aiService';
import { useUserStore } from '../../store/userStore';
import { translations } from '../../i18n/translations';
import type { Item } from '../../data/items';

interface VerifyQuestModalProps {
  quest: Quest | null;
  onClose: () => void;
}

const VerifyQuestModal: React.FC<VerifyQuestModalProps> = ({ quest, onClose }) => {
  const { language } = useUserStore();
  const t = translations[language];
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [locationVerified, setLocationVerified] = useState<boolean | null>(null);
  const [aiVerification, setAiVerification] = useState<{ success: boolean; reason: string } | null>(null);
  const [loot, setLoot] = useState<Item | null>(null);

  if (!quest) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
      setAiVerification(null);
    }
  };

  const handleVerifyLocation = () => {
    if (!quest.location) return;
    setVerifying(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistance(
          pos.coords.latitude,
          pos.coords.longitude,
          quest.location!.lat,
          quest.location!.lng
        );
        setLocationVerified(dist < 200);
        setVerifying(false);
      },
      () => {
        alert(language === 'ko' ? '위치 정보를 가져올 수 없습니다.' : 'Failed to get location.');
        setVerifying(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quest.location && locationVerified !== true) {
      alert(language === 'ko' ? '위치 인증이 필요합니다.' : 'Location verification required.');
      return;
    }

    if (!file || !preview) {
      alert(language === 'ko' ? '증거 사진이 필요합니다.' : 'Proof photo required.');
      return;
    }

    setLoading(true);
    try {
      // AI Vision Analysis
      const result = await verifyProofWithAI(quest.title, quest.category, preview, language);
      setAiVerification(result);
      
      if (!result.success) {
        setLoading(false);
        return;
      }

      const photoURL = await uploadProofPhoto(quest.qid, file);
      const droppedLoot = await completeQuest(quest, photoURL || undefined);
      
      if (droppedLoot) {
        setLoot(droppedLoot);
      } else {
        onClose();
      }
    } catch (error) {
      alert(language === 'ko' ? '결과 보고에 실패했습니다.' : 'Failed to report result.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {quest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
          ></motion.div>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative glass-card w-full max-w-md rounded-[2.5rem] overflow-hidden border border-white/10"
          >
            {loot ? (
              <div className="p-10 text-center space-y-8">
                <motion.div 
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-lg"
                >
                  <Trophy className="w-12 h-12 text-white" />
                </motion.div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">{t.loot_dropped}</h2>
                  <p className="text-slate-500 font-bold">You found a rare treasure while hunting.</p>
                </div>
                <div className="p-6 rounded-3xl bg-slate-50 border border-yellow-200">
                  <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center p-3 shadow-inner border border-yellow-100">
                    <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${loot.id}&backgroundColor=ffffff`} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-yellow-600 font-black text-[10px] uppercase tracking-widest mb-1">{loot.grade} Weapon</div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{loot.name}</h3>
                  <div className="text-emerald-600 font-bold text-sm">+{loot.bonusValue} {loot.statType} Affinity</div>
                </div>
                <button onClick={onClose} className="btn-primary w-full py-4">{t.collect_continue}</button>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                      <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-100">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                      Victory Report
                    </h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Monster Defeated</p>
                  </div>
                  <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-full transition-colors group">
                    <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                  <div className="text-center p-6 bg-slate-50 rounded-3xl border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1 relative z-10">{quest.monsterName || quest.title}</h3>
                    <div className="flex justify-center gap-2 relative z-10">
                      <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{quest.category}</span>
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">·</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{quest.difficulty}</span>
                    </div>
                  </div>

                  {/* AI Verification Status */}
                  <AnimatePresence>
                    {aiVerification && !aiVerification.success && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-3"
                      >
                        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-black text-red-600 uppercase tracking-wider">Cheat Detected!</div>
                          <p className="text-[10px] font-bold text-slate-500 mt-1">{aiVerification.reason}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Location Verification */}
                  {quest.location && (
                    <div className={`p-6 rounded-[2rem] border-2 transition-all duration-500 ${
                      locationVerified === true 
                      ? 'bg-emerald-50 border-emerald-100' 
                      : locationVerified === false
                      ? 'bg-red-50 border-red-100'
                      : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl transition-colors ${locationVerified === true ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white border border-slate-100 text-slate-300'}`}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-black text-xs uppercase tracking-wider text-slate-900">{t.gps_verification}</div>
                            <div className="text-[10px] font-bold text-slate-400">Must be within 200m</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyLocation}
                          disabled={verifying || locationVerified === true}
                          className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all ${
                            locationVerified === true
                            ? 'text-emerald-600 border border-emerald-100 cursor-default'
                            : 'bg-slate-900 text-white hover:scale-105 active:scale-95'
                          }`}
                        >
                          {verifying ? <RotateCw className="w-4 h-4 animate-spin mx-auto" /> : locationVerified === true ? 'VERIFIED' : 'SCAN'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Photo Verification */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 text-center block">{t.visual_proof}</label>
                    <div className="relative group">
                      {preview ? (
                        <motion.div 
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="relative rounded-[2rem] overflow-hidden border-4 border-white shadow-xl aspect-video"
                        >
                          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => { setFile(null); setPreview(null); setAiVerification(null); }}
                            className="absolute top-3 right-3 p-2 bg-slate-900/60 text-white rounded-full hover:bg-slate-900 transition-colors backdrop-blur-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-slate-100 hover:border-purple-200 transition-all cursor-pointer group">
                          <div className="p-5 bg-white rounded-2xl shadow-md mb-4 group-hover:scale-110 transition-transform">
                            <Camera className="w-8 h-8 text-slate-300 group-hover:text-purple-400 transition-colors" />
                          </div>
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{t.capture_evidence}</span>
                          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                        </label>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || (quest.location && locationVerified !== true)}
                    className="btn-primary w-full py-5 text-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-3">
                        <RotateCw className="w-6 h-6 animate-spin" />
                        <span className="text-sm uppercase tracking-widest">{t.verifying}</span>
                      </div>
                    ) : t.confirm_victory}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VerifyQuestModal;
