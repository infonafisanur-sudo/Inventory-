import { useState, useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthScreen from './components/AuthScreen';
import DashboardLayout from './components/DashboardLayout';
import UserDashboard from './components/UserDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import AdminDashboard from './components/AdminDashboard';
import SetupGuide from './components/SetupGuide';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('user');

  // Guard tab routing based on current user role transitions
  useEffect(() => {
    if (!user) return;

    // If active tab is 'store' but user role is only 'user', reset to 'user' portal
    if (activeTab === 'store' && user.role === 'user') {
      setActiveTab('user');
    }
    // If active tab is 'admin' but user role is not 'admin', reset to 'user' portal
    if (activeTab === 'admin' && user.role !== 'admin') {
      setActiveTab('user');
    }
  }, [user, activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-600" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-slate-800">Booting AssetFlow Engine</h3>
        <p className="mt-1 text-xs text-slate-400">Loading company authorization directories...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'user' && <UserDashboard />}
      {activeTab === 'store' && <ManagerDashboard />}
      {activeTab === 'admin' && <AdminDashboard />}
      {activeTab === 'guide' && <SetupGuide />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
