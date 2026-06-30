import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { User, AssignedItem, Complaint, UserRole } from '../types';
import { motion } from 'motion/react';
import { Users, ClipboardList, ShieldAlert, BadgeHelp, RefreshCw, EyeOff, ShieldCheck, UserCog, HelpCircle, Laptop } from 'lucide-react';

export default function AdminDashboard() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [assigned, setAssigned] = useState<AssignedItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Sub tab tracking inside admin dashboard
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'distributions' | 'complaints'>('users');

  // Loading indicator for processing role updates / complaints resolving
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  const handleUnassign = async (assignmentId: string, itemName: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke "${itemName}" from ${userName}? The item will be returned to store stock.`)) return;

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
  };

  const handleComplaintStatus = async (complaintId: string, currentStatus: 'pending' | 'resolved') => {
    const nextStatus = currentStatus === 'pending' ? 'resolved' : 'pending';
    setProcessingId(complaintId);
    try {
      await dbService.updateComplaintStatus(complaintId, nextStatus);
      toast(`Ticket marked as ${nextStatus}!`, 'success');
      loadData();
    } catch (err) {
      toast('Failed to change support ticket status', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // KPI Calculations
  const metrics = {
    totalUsers: users.length,
    assignedAssets: assigned.length,
    activeComplaints: complaints.filter((c) => c.status === 'pending').length,
    resolvedComplaints: complaints.filter((c) => c.status === 'resolved').length,
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
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Corporate Admin Panel</h1>
          <p className="text-slate-500 text-sm">Control user authorizations, track active device allocations, and oversee employee support tickets.</p>
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
          className={`pb-3 text-sm font-semibold border-b-2 px-1 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === 'complaints'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          HelpDesk Complaints Inbox
        </button>
      </div>

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
                    <th className="p-4 pr-6 text-right w-44">User Access Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6 font-semibold text-slate-900">{item.name}</td>
                      <td className="p-4 font-mono text-xs text-slate-500">{item.email}</td>
                      <td className="p-4 pr-6 text-right">
                        <select
                          disabled={processingId === item.id}
                          value={item.role}
                          onChange={(e) => handleRoleChange(item.id, e.target.value as UserRole)}
                          className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-600"
                        >
                          <option value="user">User (Employee)</option>
                          <option value="store">Store Manager</option>
                          <option value="admin">Administrator</option>
                        </select>
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
              <h2 className="font-bold text-slate-900 font-sans text-base">Corporate HelpDesk Ticket Desk</h2>
            </div>
            {complaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No technical support complaints filed.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((item) => {
                  const isPending = item.status === 'pending';
                  return (
                    <div key={item.id} className="p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-slate-50/20 transition-colors">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-md">
                            {item.item?.name || 'Asset'}
                          </span>
                          <span className="text-slate-400 text-xs">Logged by: {item.user?.name || 'Employee'} ({item.user?.email})</span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">{item.message}</p>
                        <p className="text-slate-400 text-xs font-mono">
                          Filing date: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                            isPending
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleComplaintStatus(item.id, item.status)}
                          disabled={processingId === item.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border cursor-pointer ${
                            isPending
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-750 border-slate-200'
                          }`}
                        >
                          {isPending ? 'Resolve Ticket' : 'Mark Reopened'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
