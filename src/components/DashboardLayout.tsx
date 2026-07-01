import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../services/db';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Package,
  Layers,
  UserCog,
  BookOpen,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Database,
  Briefcase,
  BadgeHelp,
  AlertTriangle
} from 'lucide-react';
import { UserRole } from '../types';

interface DashboardLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export default function DashboardLayout({ activeTab, setActiveTab, children }: DashboardLayoutProps) {
  const { user, logout, demoSwitchRole } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  // Filter tabs based on roles
  const menuItems = [
    { id: 'user', label: 'Employee Portal', icon: Briefcase, roles: ['user', 'admin'] },
    { id: 'store', label: 'Inventory Desk', icon: Package, roles: ['admin'] },
    { id: 'tickets', label: 'Support Tickets', icon: BadgeHelp, roles: ['admin'] },
    { id: 'admin', label: 'Admin Desk', icon: UserCog, roles: ['admin'] },
  ];

  const visibleMenuItems = menuItems.filter((item) => item.roles.includes(user.role));

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'store':
        return 'Administrator';
      case 'user':
        return 'Employee';
      default:
        return 'Staff';
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 p-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 pb-8 border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-xl text-white flex items-center justify-center shadow-md">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-xl tracking-tight font-sans text-white">AssetFlow</span>
          <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Enterprise IMS</span>
        </div>
      </div>

      {/* User Information */}
      <div className="py-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 text-slate-300 font-bold">
          {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-sm text-slate-200 truncate">{user.name}</h4>
          <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-400 font-semibold rounded-md text-[10px] tracking-wide">
            {getRoleLabel(user.role)}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-6 space-y-1">
        {visibleMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="border-t border-slate-800 pt-4">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Logout Session</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar (md and up) */}
      <aside className="hidden md:block w-72 shrink-0 border-r border-slate-200 shadow-sm">
        <div className="h-full fixed w-72">{sidebarContent}</div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-600 p-1.5 rounded-lg text-white flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span className="font-bold tracking-tight">AssetFlow</span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Floating Mobile Navigation Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-40 flex">
              {/* Back backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
              {/* Drawer panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative flex flex-col max-w-xs w-full h-full"
              >
                {sidebarContent}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Database Sync Banner indicator */}
        <div className="bg-slate-50 px-6 sm:px-8 pt-4 flex flex-col gap-3">
          <div className={`p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border ${
            isFirebaseConfigured
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-slate-100/80 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${isFirebaseConfigured ? 'text-emerald-500' : 'text-slate-500'}`} />
              <span className="text-xs font-semibold">
                {isFirebaseConfigured ? (
                  <>
                    ✨ Connected and syncing live to your Firebase Firestore Database (Project ID:{' '}
                    <code className="bg-emerald-100/80 px-1.5 py-0.5 rounded font-mono text-[11px] text-emerald-900 border border-emerald-200/50">
                      luminous-scheme-t5jvd
                    </code>)
                  </>
                ) : (
                  '⚙️ Running in Sandbox mode (Local Persistence).'
                )}
              </span>
            </div>
          </div>

          {user?.is_local_fallback && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-amber-950">Action Required: Enable Email/Password Auth in Firebase</h4>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Firebase authentication failed with <code className="font-mono bg-amber-100 px-1 py-0.2 rounded text-amber-950">auth/operation-not-allowed</code> because the Email/Password sign-in method is disabled. 
                    The app is currently falling back to <strong className="font-semibold">Local Storage mode</strong>. To enable cloud-synced logins:
                  </p>
                  <ol className="list-decimal pl-4 mt-2 text-xs text-amber-800 space-y-1">
                    <li>Open the Authentication console using the link on the right.</li>
                    <li>Click <strong className="font-semibold">Email/Password</strong> under sign-in providers and toggle the enable switch.</li>
                    <li>Click <strong className="font-semibold">Save</strong>. You can then register and sync data to Firestore.</li>
                  </ol>
                </div>
              </div>
              <div className="shrink-0 flex items-center">
                <a
                  href="https://console.firebase.google.com/project/luminous-scheme-t5jvd/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
                >
                  Configure Firebase Auth ↗
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* Active Tab Screen Area */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
