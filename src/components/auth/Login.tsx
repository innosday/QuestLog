import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } from '../../firebase/auth';
import logoImg from '../../assets/questlog-logo.png';
import { Mail, Lock, User, ArrowRight, RotateCw } from 'lucide-react';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      alert('구글 로그인에 실패했습니다.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert('이메일을 입력해주세요.');
      return;
    }
    try {
      await resetPassword(email);
      alert('비밀번호 재설정 이메일이 발송되었습니다.');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '요청에 실패했습니다.';
      alert(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!nickname.trim()) throw new Error('닉네임을 입력해주세요.');
        await signupWithEmail(email, password, nickname);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '인증에 실패했습니다.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="glass-card rounded-[3rem] p-10 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col items-center text-center mb-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-28 h-28 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.15)] p-5"
            >
              <img src={logoImg} alt="QuestLog Logo" className="w-full h-full object-contain" />
            </motion.div>
            
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
              QuestLog
            </h1>
            <p className="text-slate-500 font-bold text-sm">
              {isSignUp ? 'Begin your legend today.' : 'Welcome back, adventurer.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <AnimatePresence mode="wait">
              {isSignUp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nickname</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                    <input
                      type="text"
                      placeholder="Your Hero Name"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold text-white placeholder:text-slate-700"
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  type="email"
                  placeholder="adventurer@realm.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold text-white placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[9px] font-black text-slate-500 hover:text-purple-400 uppercase tracking-widest transition-colors"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-bold text-white placeholder:text-slate-700"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              disabled={loading || googleLoading}
              className="w-full btn-primary py-4 mt-4 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <RotateCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Create Account' : 'Enter Realm'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="relative mb-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-[#0f172a]/80 text-[10px] font-black text-slate-600 uppercase tracking-widest">Or continue with</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            type="button"
            className="w-full flex items-center justify-center gap-4 bg-white text-slate-950 font-black py-4 px-8 rounded-2xl shadow-xl transition-all group hover:bg-slate-50 disabled:opacity-50"
          >
            {googleLoading ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                Google
              </>
            )}
          </motion.button>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors"
            >
              {isSignUp ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">© 2026 QUESTLOG PROTOCOL</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;
