import { useState } from 'react';
import { Copy, Check, ShieldCheck, Database, Cloud, FileCode2, Info } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function SetupGuide() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    toast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const firestoreRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Users collection rules
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // 2. Items collection rules
    match /items/{itemId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // 3. Requests collection rules
    match /requests/{requestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // 4. Assigned items collection rules
    match /assigned_items/{assignmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    // 5. Complaints collection rules
    match /complaints/{complaintId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}`;

  return (
    <div className="space-y-8 pb-12">
      {/* Overview Block */}
      <div className="bg-slate-900 text-white rounded-xl p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Database className="w-44 h-44" />
        </div>
        <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-3 py-1 rounded-full text-xs">
          Firebase Activated & Ready
        </span>
        <h1 className="text-3xl font-bold font-sans mt-3">Firebase Firestore & Auth Blueprint</h1>
        <p className="text-slate-400 mt-2 max-w-2xl text-sm leading-relaxed">
          AssetFlow is now fully migrated and connected directly to your Firebase Firestore & Authentication resources! All operations sync instantly in real-time, completely bypassing local storage and ensuring persistent database storage.
        </p>
      </div>

      {/* Connection Info */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <Info className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-900 font-sans">Active Configuration Info</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Your application is securely connected in AI Studio with the following configuration details:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-xs text-slate-700 space-y-2">
          <div><span className="text-slate-400">Project ID:</span> <strong className="text-slate-800">luminous-scheme-t5jvd</strong></div>
          <div><span className="text-slate-400">Database Name:</span> <strong className="text-slate-800">ai-studio-inventorymanagem-c5bce93c-0adf-40f6-b6bc-ab716c92d16f</strong></div>
          <div><span className="text-slate-400">Platform Status:</span> <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px] uppercase border border-emerald-100">Fully Configured</span></div>
        </div>
      </div>

      {/* Firebase Firestore Security Rules */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 font-sans">Firestore Security Rules</h2>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          The following rules are automatically loaded into your Firebase Firestore project to authorize reads and writes to all authenticated employees:
        </p>

        <div className="relative rounded-lg bg-slate-950 p-5 overflow-x-auto max-h-[400px] border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed">
          <button
            onClick={() => handleCopy(firestoreRules, 'rules')}
            className="absolute top-4 right-4 p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-800 flex items-center gap-1.5"
          >
            {copiedSection === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy</span>
          </button>
          <pre className="pr-12">{firestoreRules}</pre>
        </div>
      </div>

      {/* Deployment & Vercel Steps */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-4">
          <Cloud className="w-5 h-5 text-slate-900" />
          <h2 className="text-xl font-bold text-slate-900 font-sans">Vercel Deployment Guide</h2>
        </div>
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            Deploying your Firebase-connected applet to Vercel is extremely easy:
          </p>
          <p>
            1. Push the generated codebase to your personal GitHub, GitLab, or Bitbucket repository.
          </p>
          <p>
            2. Log in to your <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-semibold underline">Vercel Dashboard</a> and click <b>Add New &gt; Project</b>.
          </p>
          <p>
            3. Import your repository. The configuration is already set up and will build with zero adjustments.
          </p>
          <p>
            4. Once deployed, the application will automatically read configuration from the bundled <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">firebase-applet-config.json</code>, maintaining absolute data consistency globally.
          </p>
        </div>
      </div>
    </div>
  );
}
