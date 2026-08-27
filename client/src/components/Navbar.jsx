import React from 'react';
import { Shield, History, Cpu, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ onToggleHistory, isConnected, onOpenSettings }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-tight">ID Document Extractor</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                MERN + AI
              </span>
            </div>
            <p className="text-xs text-slate-400">Indian ID Extraction Engine • OpenCV • Tesseract • Groq</p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center space-x-3">
          {/* MongoDB Status Badge */}
          <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-300 font-medium">MongoDB:</span>
            <span className={isConnected ? "text-emerald-400 font-semibold" : "text-amber-400 font-semibold"}>
              {isConnected ? "Connected" : "Standalone"}
            </span>
          </div>

          {/* History Button */}
          <button
            onClick={onToggleHistory}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition text-xs font-medium shadow-sm"
          >
            <History className="w-4 h-4 text-sky-400" />
            <span>History</span>
          </button>
        </div>

      </div>
    </header>
  );
}
