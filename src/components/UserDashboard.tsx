import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'motion/react';
import { Laptop, Send, MessageSquare, History, PlusCircle, AlertCircle, RefreshCw, ClipboardList, CheckCircle } from 'lucide-react';
import { Item, RequestItem, AssignedItem, Complaint } from '../types';

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [selectedItemId, setSelectedItemId] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Complaint modal states
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintItemId, setComplaintItemId] = useState('');
  const [complaintItemName, setComplaintItemName] = useState('');
  const [complaintMessage, setComplaintMessage] = useState('');
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (!user) return;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedItems, fetchedAssigned, fetchedRequests, fetchedComplaints] = await Promise.all([
        dbService.getItems(),
        dbService.getMyAssignedItems(user.id),
        dbService.getMyRequests(user.id),
        dbService.getMyComplaints(user.id),
      ]);

      setItems(fetchedItems);
      setAssignedItems(fetchedAssigned);
      setRequests(fetchedRequests);
      setComplaints(fetchedComplaints);
    } catch (err: any) {
      toast('Failed to synchronize dashboard data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedItemId) return;

    setSubmittingRequest(true);
    try {
      await dbService.createRequest(user.id, selectedItemId);
      toast('Equipment request submitted successfully for approval!', 'success');
      setSelectedItemId('');
      loadData();
    } catch (err: any) {
      toast(err.message || 'Failed to submit equipment request', 'error');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const openComplaintModal = (itemId: string, name: string) => {
    setComplaintItemId(itemId);
    setComplaintItemName(name);
    setComplaintMessage('');
    setIsComplaintModalOpen(true);
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !complaintItemId || !complaintMessage.trim()) return;

    setSubmittingComplaint(true);
    try {
      await dbService.submitComplaint(user.id, complaintItemId, complaintMessage.trim());
      toast('Technical complaint report submitted to the Help Desk!', 'success');
      setIsComplaintModalOpen(false);
      loadData();
    } catch (err: any) {
      toast('Failed to record technical complaint', 'error');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Synchronizing corporate assets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Employee Portal</h1>
          <p className="text-slate-500 text-sm">Request office hardware, view assigned inventory, and file support tickets.</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Requests and Assigned Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Equipment */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-slate-800" />
                <h2 className="font-bold text-slate-900 font-sans text-lg">My Assigned Equipment</h2>
              </div>
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-full">
                {assignedItems.length} {assignedItems.length === 1 ? 'Asset' : 'Assets'}
              </span>
            </div>

            {assignedItems.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm">No hardware currently assigned</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
                  Use the request panel on the right to requisition a laptop, monitor, keyboard, or other workplace equipment.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assignedItems.map((as) => (
                  <div key={as.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{as.item?.name || 'Unknown Asset'}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">Category: {as.item?.category || 'Hardware'}</p>
                      <p className="text-slate-400 text-xs mt-1">
                        Assigned on: {as.assigned_date ? new Date(as.assigned_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                      </p>
                    </div>
                    <button
                      onClick={() => openComplaintModal(as.item_id, as.item?.name || 'Asset')}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-semibold text-slate-700 hover:text-rose-700 transition-all cursor-pointer self-start sm:self-auto shadow-sm"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                      Report Fault / Complaint
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Request Status Track */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-800" />
                <h2 className="font-bold text-slate-900 font-sans text-lg">Equipment Requisition Log</h2>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                You have not submitted any equipment requests yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Requested Item</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Submitted Date</th>
                      <th className="p-4 pr-6 text-right">Approval Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-slate-900">{req.item?.name || 'Unknown Item'}</td>
                        <td className="p-4 text-slate-600">{req.item?.category || 'Hardware'}</td>
                        <td className="p-4 text-xs text-slate-400">
                          {req.created_at ? new Date(req.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A'}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              req.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Fault / Complaint History */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-800" />
                <h2 className="font-bold text-slate-900 font-sans text-lg">Technical Support Tickets</h2>
              </div>
            </div>

            {complaints.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No technical issues reported. Your equipment is operating normally.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {complaints.map((comp) => (
                  <div key={comp.id} className="p-6 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{comp.item?.name || 'Device Asset'}</h4>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          comp.status === 'resolved'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}
                      >
                        {comp.status === 'resolved' ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> Resolved
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 animate-pulse" /> Pending
                          </>
                        )}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{comp.message}</p>
                    <p className="text-slate-400 text-xs font-mono">
                      Ticket logged on: {comp.created_at ? new Date(comp.created_at).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Submission Forms */}
        <div className="space-y-8">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <PlusCircle className="w-5 h-5 text-slate-800" />
              <h2 className="font-bold text-slate-900 font-sans text-lg">Request Asset</h2>
            </div>

            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Company Catalog</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="">-- Choose an item --</option>
                  {items.map((i) => {
                    const isAvailable = i.quantity > 0;
                    return (
                      <option key={i.id} value={i.id} disabled={!isAvailable}>
                        {i.name} ({i.category}) — {isAvailable ? `${i.quantity} in stock` : 'Out of Stock'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="submit"
                disabled={submittingRequest || !selectedItemId}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                {submittingRequest ? 'Submitting...' : 'Submit Requisition'}
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Report Complaint Modal */}
      <AnimatePresence>
        {isComplaintModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                <MessageSquare className="w-5 h-5 text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900 font-sans">Submit Support Ticket</h3>
              </div>

              <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Reporting issue for:</span>
                <p className="text-sm font-bold text-slate-800 mt-0.5">{complaintItemName}</p>
              </div>

              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Issue Description</label>
                  <textarea
                    required
                    rows={4}
                    value={complaintMessage}
                    onChange={(e) => setComplaintMessage(e.target.value)}
                    placeholder="Describe exactly what is wrong with the device (e.g., broken charger port, system freezes, damaged keys)..."
                    className="block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none placeholder-slate-400"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsComplaintModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingComplaint || !complaintMessage.trim()}
                    className="flex items-center gap-1.5 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-45"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
