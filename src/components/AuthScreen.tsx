import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/db';
import { motion } from 'motion/react';
import { ShieldCheck, RefreshCw, Database, AlertTriangle, ChevronRight, UserPlus } from 'lucide-react';
import { UserRole } from '../types';

export default function AuthScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('user');

  const handleGoogleSignIn = async (email?: string, role?: UserRole, name?: string) => {
    setLoading(true);
    try {
      await signInWithGoogle(email, role, name);
    } catch (err: any) {
      console.warn('Real Google Sign-In failed or was blocked by iframe container. Launching simulated picker...', err);
      // If we clicked the main button and real auth failed/blocked, we can prompt simulated select.
      if (!email) {
        setShowCustomInput(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    const nameToUse = customName || customEmail.split('@')[0];
    handleGoogleSignIn(customEmail, customRole, nameToUse);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Top Header */}
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
          className="bg-white py-8 px-6 shadow-md border border-slate-200/60 sm:rounded-2xl sm:px-10"
        >
          {/* Header resembling a standard Google account picker */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center">
              {/* Official Google Icon */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-3.3-4.53-6.16-4.53z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-800">Choose an account</h3>
            <p className="text-xs text-slate-500 mt-1">to continue to AssetFlow Workspace</p>
          </div>

          <div className="space-y-4">
            {/* Primary Live Firebase Google OAuth Button */}
            <button
              onClick={() => handleGoogleSignIn()}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-200 hover:border-slate-300 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-xs active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              ) : (
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-3.3-4.53-6.16-4.53z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              <span>{loading ? 'Connecting Google API...' : 'Sign in with Google'}</span>
            </button>

            {/* Separator / Instruction */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 font-medium">or choose a corporate profile</span>
              </div>
            </div>

            {/* Google Profile-Styled Corporate Identity Directory */}
            <div className="space-y-2.5">
              {/* Admin - Sarah Jenkins */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('admin@company.com', 'admin', 'Sarah Jenkins')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/50 border border-slate-200/60 rounded-xl text-left transition-all text-xs cursor-pointer group hover:border-slate-300 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Google style circular avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0 select-none text-[13px]">
                    SJ
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">Sarah Jenkins</span>
                    <span className="text-slate-400 font-mono text-[10px]">admin@company.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-extrabold rounded-md text-[9px] uppercase border border-blue-100">
                    Admin
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Manager - David Miller */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('manager@company.com', 'store', 'David Miller')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/50 border border-slate-200/60 rounded-xl text-left transition-all text-xs cursor-pointer group hover:border-slate-300 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shrink-0 select-none text-[13px]">
                    DM
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">David Miller</span>
                    <span className="text-slate-400 font-mono text-[10px]">manager@company.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-md text-[9px] uppercase border border-indigo-100">
                    Manager
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Employee - Alex Rivera */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('employee@company.com', 'user', 'Alex Rivera')}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/90 active:bg-slate-200/50 border border-slate-200/60 rounded-xl text-left transition-all text-xs cursor-pointer group hover:border-slate-300 disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700 shrink-0 select-none text-[13px]">
                    AR
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block group-hover:text-blue-600 transition-colors">Alex Rivera</span>
                    <span className="text-slate-400 font-mono text-[10px]">employee@company.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-extrabold rounded-md text-[9px] uppercase border border-emerald-100">
                    Employee
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>

            {/* Custom Google Account Login Button Toggle */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 underline underline-offset-4 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{showCustomInput ? 'Hide custom Google account form' : 'Use a custom Google Account'}</span>
              </button>
            </div>

            {showCustomInput && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 border border-slate-200 bg-slate-50/50 rounded-xl space-y-3.5 text-left mt-2"
                onSubmit={handleCustomSubmit}
              >
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Google Email</label>
                  <input
                    type="email"
                    required
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600 text-xs transition-all bg-white"
                    placeholder="name@company.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600 text-xs transition-all bg-white"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Starting Role</label>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as UserRole)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1.5 focus:ring-blue-600 focus:border-blue-600 text-xs transition-all bg-white"
                  >
                    <option value="user">Employee (Regular user)</option>
                    <option value="store">Manager (Inventory controller)</option>
                    <option value="admin">Admin (System administrator)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-1.5 py-2 px-3 border border-transparent rounded-lg shadow-xs text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 cursor-pointer disabled:opacity-50"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign in as Custom Google User</span>
                </button>
              </motion.form>
            )}

            {/* Firebase Auth Troubleshooting Section */}
            <div className="mt-4 border-t border-slate-100 pt-3">
              <details className="group">
                <summary className="flex items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer select-none">
                  <span>Firebase Google Auth Configuration</span>
                  <span className="transition-transform group-open:rotate-180 text-[10px]">▼</span>
                </summary>
                <div className="mt-2.5 text-[11px] text-slate-500 leading-relaxed bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 space-y-2 text-left">
                  <p className="font-semibold text-blue-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Enable Google Sign-In Provider</span>
                  </p>
                  <p>
                    By default, custom projects require activating the Google sign-in provider inside your Firebase Project console to support live popup logins.
                  </p>
                  <p className="font-bold text-slate-700">How to configure in 45 seconds:</p>
                  <ol className="list-decimal pl-4.5 space-y-1">
                    <li>Click the link below to open your console.</li>
                    <li>Click <strong className="font-semibold">Add new provider</strong> and choose <strong className="font-semibold">Google</strong>.</li>
                    <li>Toggle the switch to <strong className="font-semibold">Enable</strong>.</li>
                    <li>Select your support email, then click <strong className="font-semibold">Save</strong>.</li>
                  </ol>
                  <div className="pt-2 text-center">
                    <a
                      href="https://console.firebase.google.com/project/luminous-scheme-t5jvd/authentication/providers"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border border-blue-200 rounded-lg font-bold text-[10px] cursor-pointer"
                    >
                      Open Firebase Console ↗
                    </a>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
