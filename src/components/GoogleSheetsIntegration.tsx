import React, { useState, useEffect } from 'react';
import { sheetsService } from '../services/sheets';
import { dbService } from '../services/db';
import { useToast } from '../context/ToastContext';
import { Item, RequestItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  Link,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';

interface GoogleSheetsIntegrationProps {
  onRefreshNeeded?: () => void;
  items?: Item[];
  requests?: RequestItem[];
}

export default function GoogleSheetsIntegration({ onRefreshNeeded, items = [], requests = [] }: GoogleSheetsIntegrationProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(sheetsService.isConnected());
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [exportingInventory, setExportingInventory] = useState(false);
  const [exportingRequests, setExportingRequests] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Import settings
  const [importUrl, setImportUrl] = useState('');
  const [importRange, setImportRange] = useState('Sheet1!A2:C100');

  useEffect(() => {
    setIsConnected(sheetsService.isConnected());
    const user = sheetsService.getConnectedUser();
    if (user) {
      setConnectedEmail(user.email);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const result = await sheetsService.connect();
      setIsConnected(true);
      setConnectedEmail(result.email);
      toast('Successfully authenticated with Google Workspace!', 'success');
    } catch (error: any) {
      toast(error.message || 'Failed to authenticate with Google', 'error');
    }
  };

  const handleDisconnect = () => {
    sheetsService.disconnect();
    setIsConnected(false);
    setConnectedEmail(null);
    toast('Disconnected Google Workspace account', 'info');
  };

  const handleExportInventory = async () => {
    if (items.length === 0) {
      toast('No items available to export', 'error');
      return;
    }

    setExportingInventory(true);
    try {
      const dateStr = new Date().toLocaleDateString();
      const title = `AssetFlow Inventory Report - ${dateStr}`;
      
      toast('Creating new Google Spreadsheet...', 'info');
      const spreadsheet = await sheetsService.createSpreadsheet(title);
      
      const headers = ['Asset ID', 'Item Name', 'Category', 'Quantity Stock'];
      const rows = items.map(item => [item.id, item.name, item.category, item.quantity]);
      const values = [headers, ...rows];
      
      toast('Writing inventory records to spreadsheet...', 'info');
      // Update cell values in "Sheet1"
      await sheetsService.updateValues(spreadsheet.id, 'Sheet1!A1', values);
      
      toast('Inventory successfully exported!', 'success');
      window.open(spreadsheet.url, '_blank');
    } catch (error: any) {
      console.error('Export error:', error);
      toast(error.message || 'Failed to export inventory to Google Sheets', 'error');
    } finally {
      setExportingInventory(false);
    }
  };

  const handleExportRequests = async () => {
    if (requests.length === 0) {
      toast('No employee requests to export', 'error');
      return;
    }

    setExportingRequests(true);
    try {
      const dateStr = new Date().toLocaleDateString();
      const title = `AssetFlow Requests Log - ${dateStr}`;
      
      toast('Creating new Google Spreadsheet...', 'info');
      const spreadsheet = await sheetsService.createSpreadsheet(title);
      
      const headers = ['Request ID', 'Requester Name', 'Email', 'Item Requested', 'Category', 'Status', 'Date Logged'];
      const rows = requests.map(req => [
        req.id,
        req.user?.name || 'Unknown User',
        req.user?.email || 'N/A',
        req.item?.name || 'Unknown Item',
        req.item?.category || 'N/A',
        req.status.toUpperCase(),
        req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'
      ]);
      const values = [headers, ...rows];
      
      toast('Writing request logs to spreadsheet...', 'info');
      await sheetsService.updateValues(spreadsheet.id, 'Sheet1!A1', values);
      
      toast('Employee requests log successfully exported!', 'success');
      window.open(spreadsheet.url, '_blank');
    } catch (error: any) {
      console.error('Export error:', error);
      toast(error.message || 'Failed to export requests to Google Sheets', 'error');
    } finally {
      setExportingRequests(false);
    }
  };

  const handleImportInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) {
      toast('Please enter a Google Sheets URL or ID', 'error');
      return;
    }

    setImporting(true);
    try {
      const spreadsheetId = sheetsService.extractSpreadsheetId(importUrl);
      toast('Fetching sheet cell values...', 'info');
      
      const rows = await sheetsService.getValues(spreadsheetId, importRange);
      
      if (rows.length === 0) {
        throw new Error('No data found in the specified range. Check your spreadsheet formatting.');
      }

      toast(`Parsing ${rows.length} rows of inventory data...`, 'info');
      
      let importedCount = 0;
      let errorCount = 0;

      for (const row of rows) {
        const name = row[0]?.toString().trim();
        const category = row[1]?.toString().trim() || 'General';
        const qtyRaw = row[2];
        const qty = parseInt(qtyRaw?.toString() || '0', 10);

        if (name && !isNaN(qty) && qty >= 0) {
          // Add items securely
          await dbService.addItem(name, category, qty);
          importedCount++;
        } else {
          errorCount++;
        }
      }

      if (importedCount > 0) {
        toast(`Successfully imported ${importedCount} items into physical inventory!`, 'success');
        if (errorCount > 0) {
          toast(`Skipped ${errorCount} malformed rows due to empty names or negative quantities.`, 'info');
        }
        setImportUrl('');
        if (onRefreshNeeded) onRefreshNeeded();
      } else {
        toast('No valid items were parsed. Make sure your columns are: Name | Category | Quantity', 'error');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast(error.message || 'Failed to bulk import items from Google Sheets', 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden mb-8">
      {/* Banner / Title Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 px-6 py-5 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2.5 rounded-xl border border-white/10 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg tracking-tight font-sans">Google Sheets Workspace</h3>
                <span className="flex items-center gap-0.5 px-2 py-0.5 bg-emerald-500/30 text-emerald-100 font-semibold rounded-full text-[10px] uppercase tracking-wider border border-emerald-400/20">
                  <Sparkles className="w-2.5 h-2.5" /> Live sync
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
                Sync and export company assets, track real-time logs, and import catalogs seamlessly.
              </p>
            </div>
          </div>

          <div>
            {!isConnected ? (
              <button
                onClick={handleConnect}
                className="gsi-material-button text-sm font-semibold flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white text-slate-800 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <div className="gsi-material-button-icon w-4 h-4">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>Connect Google Drive</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 bg-white/10 px-3.5 py-1.5 rounded-xl border border-white/15">
                <div className="text-right">
                  <span className="block text-[10px] font-bold text-emerald-200/90 uppercase tracking-widest">Workspace Linked</span>
                  <span className="block text-xs font-semibold text-white truncate max-w-[160px]">{connectedEmail}</span>
                </div>
                <button
                  onClick={handleDisconnect}
                  title="Disconnect Google"
                  className="p-1.5 hover:bg-white/15 hover:text-rose-100 rounded-lg text-emerald-200 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isConnected ? (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 text-center text-slate-500 flex flex-col items-center justify-center min-h-[140px]"
          >
            <AlertCircle className="w-8 h-8 text-amber-500 mb-2 shrink-0" />
            <h4 className="font-bold text-sm text-slate-700">Google Drive & Sheets Disconnected</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Authenticate your account using Google Secure Auth to access import/export utilities.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100"
          >
            {/* Left: Export Action Center */}
            <div className="lg:col-span-5 space-y-5 pb-6 lg:pb-0">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3">Export Utilities</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <button
                  onClick={handleExportInventory}
                  disabled={exportingInventory}
                  className="flex items-center justify-between gap-3 p-4 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl transition-all text-left cursor-pointer disabled:opacity-40"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100/80 p-2 rounded-lg text-emerald-700 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm">Export Inventory</span>
                      <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">{items.length} items logged</span>
                    </div>
                  </div>
                  {exportingInventory && <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />}
                </button>

                <button
                  onClick={handleExportRequests}
                  disabled={exportingRequests}
                  className="flex items-center justify-between gap-3 p-4 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl transition-all text-left cursor-pointer disabled:opacity-40"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-100/80 p-2 rounded-lg text-emerald-700 flex items-center justify-center">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm">Export Request Log</span>
                      <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">{requests.length} logs collected</span>
                    </div>
                  </div>
                  {exportingRequests && <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />}
                </button>
              </div>

              <div className="flex items-start gap-2 bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Exporting creates a brand new document in your Google Drive folder and launches it automatically in a new browser tab.
                </p>
              </div>
            </div>

            {/* Right: Import Action Center */}
            <div className="lg:col-span-7 pt-6 lg:pt-0 lg:pl-8 space-y-4">
              <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest mb-3">Bulk Catalog Import</h4>
              
              <form onSubmit={handleImportInventory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Google Sheet URL or ID</label>
                  <div className="relative rounded-lg">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Link className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      required
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all bg-slate-50/50 hover:bg-slate-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sheet Range (A1 notation)</label>
                    <input
                      type="text"
                      required
                      value={importRange}
                      onChange={(e) => setImportRange(e.target.value)}
                      placeholder="Sheet1!A2:C100"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm transition-all bg-slate-50/50 hover:bg-slate-50"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={importing || !importUrl.trim()}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/40 text-white rounded-lg text-sm font-semibold shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed h-[42px]"
                    >
                      {importing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Importing...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Bulk Import Assets</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              <div className="bg-slate-50 border border-slate-200/50 p-3 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Required Columns Format</span>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                  Your Google Sheet range must have 3 columns in order: <code className="bg-slate-100 border border-slate-200 px-1 rounded text-slate-800">Name</code>, <code className="bg-slate-100 border border-slate-200 px-1 rounded text-slate-800">Category</code>, and <code className="bg-slate-100 border border-slate-200 px-1 rounded text-slate-800">Quantity</code>. The first row can be header titles (hence the default A2 range to skip them).
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
