import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { User, AssignedItem, Complaint, UserRole } from '../types';
import { motion } from 'motion/react';
import { Users, ClipboardList, ShieldAlert, BadgeHelp, RefreshCw, EyeOff, ShieldCheck, UserCog, HelpCircle, Laptop, Trash2 } from 'lucide-react';

interface AdminDashboardProps {
  defaultTab?: 'users' | 'distributions' | 'complaints';
}

export default function AdminDashboard({ defaultTab = 'users' }: AdminDashboardProps) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [assigned, setAssigned] = useState<AssignedItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Track admin resolution comments/feedback for each ticket
  const [feedbackTexts, setFeedbackTexts] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sub tab tracking inside admin dashboard
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'distributions' | 'complaints'>(defaultTab);

  useEffect(() => {
    setActiveSubTab(defaultTab);
  }, [defaultTab]);

  // Loading indicator for processing role updates / complaints resolving
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Custom Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);

  const requestConfirm = (title: string, message: string, confirmText: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(null);
      }
    });
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedUsers, fetchedAssigned, fetchedComplaints] = await Promise.all([
        dbService.getAllUsers(),
        dbService.getAssignedItems(),
        dbService.getComplaints(),
      ]);

      setUsers(fetchedUsers);
      setAssigned(fetchedAssigned);
      setComplaints(fetchedComplaints);
    } catch (err) {
      toast('Failed to load system directory logs', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setProcessingId(userId);
    try {
      await dbService.updateUserRole(userId, newRole);
      toast(`User role updated to ${newRole}!`, 'success');
      loadData();
    } catch (err: any) {
      toast('Failed to update user authorization role', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (currentUser && currentUser.id === userId) {
      toast('You cannot delete your own admin account!', 'error');
      return;
    }

    requestConfirm(
      'Delete User Account',
      `Are you absolutely sure you want to delete user "${userName}"? This action cannot be undone.`,
      'Delete Account',
      async () => {
        setProcessingId(userId);
        try {
          await dbService.deleteUser(userId);
          toast(`User "${userName}" deleted successfully!`, 'success');
          loadData();
        } catch (err) {
          toast('Failed to delete user', 'error');
        } finally {
          setProcessingId(null);
        }
      }
    );
  };

  const handleUnassign = async (assignmentId: string, itemName: string, userName: string) => {
    requestConfirm(
      'Revoke Asset Assignment',
      `Are you sure you want to revoke "${itemName}" from ${userName}? The item will be returned to store stock.`,
      'Revoke Assignment',
      async () => {
        setProcessingId(assignmentId);
        try {
          await dbService.unassignItem(assignmentId);
          toast(`Revoked asset assignment successfully!`, 'success');
          loadData();
        } catch (err) {
          toast('Failed to unassign asset', 'error');
        } finally {
          setProcessingId(null);
        }
      }
    );
  };

  const handleUpdateTicketStatus = async (
    complaintId: string,
    status: 'pending' | 'resolved' | 'unsolved',
    feedbackMessage?: string
  ) => {
    setProcessingId(complaintId);
    try {
      const message = feedbackMessage?.trim() || '';
      await dbService.updateComplaintStatus(complaintId, status, message);
      
      const statusLabel = status === 'resolved' ? 'Solved' : status === 'unsolved' ? 'Cannot Solve' : 'Reopened';
      toast(`Support Ticket successfully marked as: ${statusLabel}!`, 'success');
      
      setFeedbackTexts((prev) => {
        const copy = { ...prev };
        delete copy[complaintId];
        return copy;
      });
      loadData();
    } catch (err) {
      toast('Failed to update technical support ticket status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // KPI Calculations
  const metrics = {
    totalUsers: users.length,
    assignedAssets: assigned.length,
    activeComplaints: complaints.filter((c) => c.status === 'pending').length,
    resolvedComplaints: complaints.filter((c) => c.status === 'resolved' || c.status === 'unsolved').length,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Loading corporate administration logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">
            {defaultTab === 'complaints' ? 'Support Tickets' : 'Corporate Admin Panel'}
          </h1>
          <p className="text-slate-500 text-sm">
            {defaultTab === 'complaints'
              ? 'Review employee-reported asset issues, assign technical resolutions, and send status updates directly back to staff.'
              : 'Control user authorizations, track active device allocations, and oversee employee support tickets.'}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''} text-slate-500`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-100">
            <Users className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Directory Users</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-sans">{metrics.totalUsers}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-100">
            <ClipboardList className="w-6 h-6 text-slate-500" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Assignments</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1 font-sans">{metrics.assignedAssets}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-700 border border-amber-100">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <span className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Pending Support Tickets</span>
            <h3 className="text-2xl font-bold text-amber-950 mt-1 font-sans">{metrics.activeComplaints}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 border border-emerald-100">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <span className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Resolved Tickets</span>
            <h3 className="text-2xl font-bold text-emerald-950 mt-1 font-sans">{metrics.resolvedComplaints}</h3>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      {defaultTab !== 'complaints' && (
        <div className="border-b border-slate-200 flex gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('users')}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'users'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            User Directory Management
          </button>
          <button
            onClick={() => setActiveSubTab('distributions')}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'distributions'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Active Allocations & Returns
          </button>
          <button
            onClick={() => setActiveSubTab('complaints')}
            className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeSubTab === 'complaints'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Support Tickets</span>
            {metrics.activeComplaints > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full animate-pulse">
                {metrics.activeComplaints}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Tab Panels */}
      <div>
        {activeSubTab === 'users' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <UserCog className="w-5 h-5 text-slate-800" />
              <h2 className="font-bold text-slate-900 font-sans text-base">Authorize Corporate Access Roles</h2>
            </div>
             <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="p-4 pl-6">Full Name</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4 w-44">User Access Role</th>
                    <th className="p-4 pr-6 text-right w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{item.email}</td>
                      <td className="p-4">
                        <select
                          disabled={processingId === item.id}
                          value={item.role}
                          onChange={(e) => handleRoleChange(item.id, e.target.value as UserRole)}
                          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 w-full"
                        >
                          <option value="user">User (Employee)</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          disabled={processingId === item.id}
                          onClick={() => handleDeleteUser(item.id, item.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-40"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'distributions' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-slate-800" />
              <h2 className="font-bold text-slate-900 font-sans text-base">Inventory Allocation Tracker</h2>
            </div>
            {assigned.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No inventory allocations currently on record.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Assigned Employee</th>
                      <th className="p-4">Equipment Name</th>
                      <th className="p-4">Assigned On</th>
                      <th className="p-4 pr-6 text-right w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assigned.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <span className="font-semibold text-slate-900 block">{item.user?.name || 'Unknown User'}</span>
                          <span className="text-xs text-slate-400 block font-mono">{item.user?.email || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-slate-900 block">{item.item?.name || 'Asset Entry'}</span>
                          <span className="text-xs text-slate-400 block">{item.item?.category || 'Hardware'}</span>
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {item.assigned_date ? new Date(item.assigned_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleUnassign(item.id, item.item?.name || 'Asset', item.user?.name || 'User')}
                            disabled={processingId === item.id}
                            className="px-3 py-1.5 border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-40 shadow-sm"
                          >
                            Return Asset / Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'complaints' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <BadgeHelp className="w-5 h-5 text-slate-800" />
              <h2 className="font-bold text-slate-900 font-sans text-base">Employee Support & Fault Reports Desk</h2>
            </div>
            {complaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No technical support complaints filed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((item) => {
                  const isPending = item.status === 'pending';
                  const isResolved = item.status === 'resolved';
                  const isUnsolved = item.status === 'unsolved';
                  const feedbackText = feedbackTexts[item.id] || '';

                  return (
                    <div key={item.id} className="p-6 flex flex-col space-y-4 hover:bg-slate-50/10 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-md">
                              {item.item?.name || 'Asset Issue'}
                            </span>
                            <span className="text-slate-400 text-xs">
                              Logged by: <strong className="text-slate-600 font-semibold">{item.user?.name || 'Employee'}</strong> ({item.user?.email || 'N/A'})
                            </span>
                          </div>
                          <p className="text-slate-700 text-sm leading-relaxed">{item.message}</p>
                          <p className="text-slate-400 text-xs font-mono">
                            Filing date: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                              PENDING
                            </span>
                          )}
                          {isResolved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              SOLVED
                            </span>
                          )}
                          {isUnsolved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border bg-rose-50 text-rose-700 border-rose-200">
                              CANNOT SOLVE
                            </span>
                          )}

                          {!isPending && (
                            <button
                              onClick={() => handleUpdateTicketStatus(item.id, 'pending')}
                              disabled={processingId === item.id}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded-lg hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50"
                            >
                              Reopen Ticket
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display Saved Admin Feedback */}
                      {!isPending && item.admin_feedback && (
                        <div className={`p-4 rounded-xl border text-sm ${isResolved ? 'bg-emerald-50/30 border-emerald-100 text-emerald-900' : 'bg-rose-50/30 border-rose-100 text-rose-900'}`}>
                          <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                            Admin Feedback & Resolution Message
                          </div>
                          <p className="italic text-slate-700">"{item.admin_feedback}"</p>
                          {item.resolved_at && (
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              Processed on: {new Date(item.resolved_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Pending Ticket Action Forms */}
                      {isPending && (
                        <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                              Resolution Message / Feedback for Employee (Required to Solve)
                            </label>
                            <textarea
                              rows={2}
                              value={feedbackText}
                              onChange={(e) => setFeedbackTexts((prev) => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Type instructions, workarounds, or resolution feedback here..."
                              className="block w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-none placeholder-slate-400"
                            />
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => handleUpdateTicketStatus(item.id, 'unsolved', feedbackText || 'This technical issue cannot be resolved at this moment.')}
                              disabled={processingId === item.id}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                            >
                              Cannot Solve
                            </button>
                            <button
                              onClick={() => handleUpdateTicketStatus(item.id, 'resolved', feedbackText || 'The issue has been successfully resolved.')}
                              disabled={processingId === item.id}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                            >
                              Solve Issue
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl max-w-md w-full shadow-xl overflow-hidden border border-slate-100"
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{confirmModal.message}</p>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-750 text-sm font-semibold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
