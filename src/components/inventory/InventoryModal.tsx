import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sword, Shield, Zap, Target, Flame, Box, Check } from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { WEAPON_DATABASE } from '../../data/items';
import type { Item } from '../../data/items';
import { equipWeapon } from '../../firebase/userService';
import { translations } from '../../i18n/translations';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose }) => {
  const { user, language } = useUserStore();
  const t = translations[language];

  if (!user) return null;

  const userInventory = (user.inventory || [])
    .map(id => WEAPON_DATABASE.find(item => item.id === id))
    .filter((item): item is Item => !!item);

  const equippedWeapon = WEAPON_DATABASE.find(w => w.id === user.equippedWeaponId);

  const handleEquip = async (itemId: string) => {
    if (user.equippedWeaponId === itemId) {
      await equipWeapon(user.uid, null); // Unequip
    } else {
      await equipWeapon(user.uid, itemId); // Equip
    }
  };

  const getStatIcon = (type: string) => {
    switch (type) {
      case 'STR': return <Flame className="w-4 h-4 text-red-500" />;
      case 'INT': return <Target className="w-4 h-4 text-blue-500" />;
      case 'DEX': return <Zap className="w-4 h-4 text-green-500" />;
      default: return <Sword className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative glass-card w-full max-w-2xl rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col h-[80vh]"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900">
                  <div className="p-2 bg-purple-600 rounded-lg shadow-lg shadow-purple-100">
                    <Box className="w-5 h-5 text-white" />
                  </div>
                  {t.arsenal}
                </h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage your gear</p>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-full transition-colors group">
                <X className="w-6 h-6 text-slate-300 group-hover:text-slate-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-10">
              {/* Currently Equipped */}
              <section>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1">{t.active_gear}</label>
                {equippedWeapon ? (
                  <div className="p-6 rounded-[2rem] bg-slate-50 border border-purple-100 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-3 shadow-md border border-slate-100">
                        <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${equippedWeapon.id}&backgroundColor=ffffff`} alt="" className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">{equippedWeapon.grade}</span>
                          {getStatIcon(equippedWeapon.statType)}
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{equippedWeapon.name}</h3>
                        <p className="text-sm font-bold text-emerald-600">+{equippedWeapon.bonusValue} {equippedWeapon.statType} Affinity</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleEquip(equippedWeapon.id)}
                      className="px-6 py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-red-600 transition-all shadow-lg"
                    >
                      Unequip
                    </button>
                  </div>
                ) : (
                  <div className="p-8 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center bg-slate-50/30">
                    <p className="text-slate-400 font-bold text-sm text-center">No weapon equipped. Slay monsters to find loot!</p>
                  </div>
                )}
              </section>

              {/* Inventory Grid */}
              <section>
                <div className="flex justify-between items-center mb-4 ml-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t.inventory} ({userInventory.length})</label>
                </div>
                {userInventory.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {userInventory.map((item, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={`${item.id}-${i}`}
                        className={`p-4 rounded-3xl border transition-all cursor-pointer group relative ${
                          user.equippedWeaponId === item.id 
                          ? 'bg-purple-50 border-purple-200' 
                          : 'bg-white border-slate-100 hover:border-purple-100 hover:bg-slate-50 shadow-sm'
                        }`}
                        onClick={() => handleEquip(item.id)}
                      >
                        {user.equippedWeaponId === item.id && (
                          <div className="absolute top-3 right-3 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <Check className="w-3 h-3 text-white" strokeWidth={4} />
                          </div>
                        )}
                        <div className="w-full aspect-square bg-white rounded-2xl mb-4 flex items-center justify-center p-4 group-hover:scale-105 transition-transform shadow-inner border border-slate-50">
                          <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${item.id}&backgroundColor=ffffff`} alt="" className="w-full h-full object-contain" />
                        </div>
                        <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{item.grade}</div>
                        <h4 className="text-sm font-black text-slate-900 truncate">{item.name}</h4>
                        <div className="flex items-center gap-1 mt-2">
                          {getStatIcon(item.statType)}
                          <span className="text-[10px] font-bold text-emerald-600">+{item.bonusValue}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
                    <Box className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Inventory Empty</p>
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InventoryModal;
