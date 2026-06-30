import React, { useState, useEffect, useCallback } from 'react';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { Item, RequestItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, Edit3, Check, X, RefreshCw, Package, CheckCircle2, XCircle, AlertCircle, Search, Layers } from 'lucide-react';
import GoogleSheetsIntegration from './GoogleSheetsIntegration';

export default function ManagerDashboard() {
  const { toast } = useToast();

  const [items, setItems] = useState<Item[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form search states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // New Item form states
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [submittingItem, setSubmittingItem] = useState(false);

  // Editing Stock Inline states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingQtyValue, setEditingQtyValue] = useState<number>(0);
  const [updatingStock, setUpdatingStock] = useState(false);

  // Processing Request IDs (for loading state)
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedItems, fetchedRequests] = await Promise.all([
        dbService.getItems(),
        dbService.getRequests(),
      ]);
      setItems(fetchedItems);
      setRequests(fetchedRequests);
    } catch (err: any) {
      toast('Failed to load storage repository data', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim() || !newItemCategory.trim() || newItemQty < 0) return;

    setSubmittingItem(true);
    try {
      await dbService.addItem(newItemName.trim(), newItemCategory.trim(), newItemQty);
      toast(`Successfully added ${newItemName} to catalog`, 'success');
      setIsAddingItem(false);
      setNewItemName('');
      setNewItemCategory('');
      setNewItemQty(1);
      loadData();
    } catch (err: any) {
      toast('Failed to add inventory item', 'error');
    } finally {
      setSubmittingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}" from the inventory?`)) return;

    try {
      await dbService.deleteItem(itemId);
      toast(`Removed "${name}" from inventory`, 'info');
      loadData();
    } catch (err) {
      toast('Failed to delete item', 'error');
    }
  };

  const startEditStock = (item: Item) => {
    setEditingItemId(item.id);
    setEditingQtyValue(item.quantity);
  };

  const handleUpdateStock = async (itemId: string) => {
    if (editingQtyValue < 0) {
      toast('Stock count cannot be negative', 'error');
      return;
    }

    setUpdatingStock(true);
    try {
      await dbService.updateItemStock(itemId, editingQtyValue);
      toast('Inventory levels adjusted successfully!', 'success');
      setEditingItemId(null);
      loadData();
    } catch (err: any) {
      toast('Failed to update stock quantity', 'error');
    } finally {
      setUpdatingStock(false);
    }
  };

  const handleRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessingRequestId(requestId);
    try {
      await dbService.handleRequest(requestId, status);
      toast(`Equipment requisition was successfully ${status}!`, 'success');
      loadData();
    } catch (err: any) {
      toast(err.message || `Failed to ${status} request`, 'error');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Filter items based on user search query and selected category
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Extract unique categories for filtering
  const categories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-slate-500 font-medium">Loading hardware logs & stock catalogs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-sans">Store Manager Dashboard</h1>
          <p className="text-slate-500 text-sm">Control company inventory quantities and review incoming user equipment requests.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''} text-slate-500`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => setIsAddingItem(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
        </div>
      </div>

      {/* Google Sheets Workspace Integration */}
      <GoogleSheetsIntegration 
        onRefreshNeeded={() => loadData()} 
        items={items} 
        requests={requests} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Manage Inventory list (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-800" />
                <h2 className="font-bold text-slate-900 font-sans text-lg">Inventory Catalog</h2>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative rounded-lg shadow-sm flex-1 sm:max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search stock..."
                    className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 text-xs"
                  />
                </div>

                {/* Category Selector */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="block border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-slate-50 text-slate-700 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm font-medium">
                No items match your catalog filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-4 pl-6">Equipment Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 w-32 text-center">In Stock</th>
                      <th className="p-4 pr-6 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 pl-6 font-semibold text-slate-900">{item.name}</td>
                        <td className="p-4">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {editingItemId === item.id ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                value={editingQtyValue}
                                onChange={(e) => setEditingQtyValue(Number(e.target.value))}
                                className="w-16 border border-slate-300 rounded-lg px-1.5 py-1 text-center font-bold text-sm bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-600"
                              />
                              <button
                                onClick={() => handleUpdateStock(item.id)}
                                disabled={updatingStock}
                                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingItemId(null)}
                                className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg cursor-pointer transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span
                                className={`font-bold text-sm px-2.5 py-0.5 rounded-full ${
                                  item.quantity <= 0
                                    ? 'bg-rose-100 text-rose-800'
                                    : item.quantity <= 3
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                  }`}
                              >
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => startEditStock(item)}
                                className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                title="Adjust stock level"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <button
                            onClick={() => handleDeleteItem(item.id, item.name)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Requisition approvals queue (Span 1) */}
        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-800" />
                <h2 className="font-bold text-slate-900 font-sans text-lg">Requisition Queue</h2>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                {requests.filter((r) => r.status === 'pending').length} Pending
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No requisitions recorded in the company logs yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {requests.map((req) => {
                  const isPending = req.status === 'pending';
                  const isAvailable = (req.item?.quantity || 0) > 0;

                  return (
                    <div key={req.id} className="p-5 space-y-3 hover:bg-slate-50/30 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-snug">{req.item?.name || 'Unknown Item'}</h4>
                          <p className="text-slate-500 text-xs mt-0.5">By: {req.user?.name || 'Employee'}</p>
                          <p className="text-slate-400 text-xs font-mono">{req.user?.email}</p>
                        </div>

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            req.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : req.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {isPending && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleRequestStatus(req.id, 'approved')}
                            disabled={processingRequestId !== null || !isAvailable}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-40"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleRequestStatus(req.id, 'rejected')}
                            disabled={processingRequestId !== null}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      )}

                      {isPending && !isAvailable && (
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 mt-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Insufficient physical stock level. Re-stock item to approve.</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Add New Item Modal */}
      <AnimatePresence>
        {isAddingItem && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <Package className="w-5 h-5 text-slate-900" />
                <h3 className="text-lg font-bold text-slate-900 font-sans">Register New Asset</h3>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Item Name / Manufacturer</label>
                  <input
                    type="text"
                    required
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g. Dell UltraSharp 27 Monitor"
                    className="block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Department Category</label>
                  <input
                    type="text"
                    required
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    placeholder="e.g. Hardware, Accessories, Office"
                    className="block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Stock Quantity</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(Number(e.target.value))}
                    className="block w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingItem}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-45"
                  >
                    Create Asset
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
