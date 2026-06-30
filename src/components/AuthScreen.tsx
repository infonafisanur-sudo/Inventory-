import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/db';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Lock, User, RefreshCw, Database, KeyRound, Info } from 'lucide-react';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signUp } = useAuth();

  const fillCredentials = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLogin(true);
    setLoading(true);
    try {
      await login(demoEmail, 'password123');
    } catch (err) {
      // Errors are handled inside AuthContext & displayed via useToast
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) return;

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (err) {
      // Errors are handled inside AuthContext & displayed via useToast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="bg-blue-600 p-3.5 rounded-2xl shadow-lg flex items-center justify-center border border-blue-500/20"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-slate-900 font-sans">
          AssetFlow
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 max-w-sm mx-auto font-medium">
          Corporate Inventory Management & Equipment Request Portal
        </p>

        {/* Database Status Pill */}
        <div className="mt-4 flex justify-center">
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
              isFirebaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                : 'bg-blue-50 text-blue-700 border-blue-100'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isFirebaseConfigured ? 'bg-emerald-400' : 'bg-blue-400'
              }`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isFirebaseConfigured ? 'bg-emerald-500' : 'bg-blue-500'
              }`}></span>
            </span>
            <Database className="w-3 h-3 shrink-0" />
            <span>{isFirebaseConfigured ? 'Enterprise Firebase Database Connected' : 'Local Sandbox Mode'}</span>
          </motion.div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white py-8 px-4 shadow-sm border border-slate-200/80 sm:rounded-2xl sm:px-10"
        >
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'signup'}
              initial={{ opacity: 0, x: isLogin ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 10 : -10 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
              onSubmit={handleSubmit}
            >
              {!isLogin && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-all bg-slate-50/50 hover:bg-slate-50"
                      placeholder="Sarah Jenkins"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Work Email Address</label>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-all bg-slate-50/50 hover:bg-slate-50"
                    placeholder="alex@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                </div>
                <div className="relative rounded-lg">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 text-sm transition-all bg-slate-50/50 hover:bg-slate-50"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : isLogin ? (
                    'Sign In'
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </motion.form>
          </AnimatePresence>

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex justify-center text-sm">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer text-xs"
              >
                {isLogin ? 'Register standard Employee account' : 'Return to sign in'}
              </button>
            </div>
          </div>

          {/* Quick-Login Demo Accounts Directory */}
          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              <span>Sandbox Testing Accounts</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">
              Click an account below to sign in instantly. Since your Firebase database is connected, these will register/login in your database (with a local fallback if you hit rate limits).
            </p>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@company.com')}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 border border-slate-200/60 rounded-xl text-left transition-all text-xs cursor-pointer group hover:border-slate-300 disabled:opacity-50"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block group-hover:text-blue-600 transition-colors">Sarah Jenkins</span>
                  <span className="text-slate-400 font-mono text-[10px]">admin@company.com</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded-md text-[9px] uppercase border border-blue-100 shadow-2xs">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('manager@company.com')}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 border border-slate-200/60 rounded-xl text-left transition-all text-xs cursor-pointer group hover:border-slate-300 disabled:opacity-50"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block group-hover:text-blue-600 transition-colors">David Miller</span>
                  <span className="text-slate-400 font-mono text-[10px]">manager@company.com</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-amber-50 text-amber-700 font-extrabold rounded-md text-[9px] uppercase border border-amber-100 shadow-2xs">
                  Manager
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('employee@company.com')}
                disabled={loading}
                className="w-full flex items-center justify-between p-2.5 bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 border border-slate-200/60 rounded-xl text-left transition-all text-xs cursor-pointer group hover:border-slate-300 disabled:opacity-50"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-800 block group-hover:text-blue-600 transition-colors">Alex Rivera</span>
                  <span className="text-slate-400 font-mono text-[10px]">employee@company.com</span>
                </div>
                <span className="shrink-0 px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md text-[9px] uppercase border border-emerald-100 shadow-2xs">
                  Employee
                </span>
              </button>
            </div>

            <div className="mt-3 flex items-start gap-1.5 bg-slate-50 border border-slate-200/40 rounded-lg p-2.5">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-normal">
                Common password for all test accounts is <strong className="text-slate-600 font-semibold">password123</strong>.
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
