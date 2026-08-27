import React, { useState, useEffect } from 'react';
import { X, Trash2, FileText, Search, RefreshCw, ChevronRight } from 'lucide-react';
import { getHistoryApi, deleteHistoryApi } from '../services/api';

export default function HistoryDrawer({ isOpen, onClose, onSelectDocument }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await getHistoryApi({ limit: 50, type: typeFilter || undefined });
      setHistory(data.documents || []);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, typeFilter]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this extraction record?')) return;
    try {
      await deleteHistoryApi(id);
      setHistory((prev) => prev.filter((d) => d._id !== id));
    } catch (e) {
      alert('Failed to delete document.');
    }
  };

  if (!isOpen) return null;

  const filteredHistory = history.filter((doc) => {
    const term = search.toLowerCase();
    const docType = (doc.documentType || '').toLowerCase();
    const name = (doc.data?.name || '').toLowerCase();
    const idNum = (
      doc.data?.aadhaar_number ||
      doc.data?.pan_number ||
      doc.data?.dl_number ||
      ''
    ).toLowerCase();
    return docType.includes(term) || name.includes(term) || idNum.includes(term);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Extraction History</h2>
              <p className="text-xs text-slate-500">Stored document verification records</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-100 bg-white space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, ID number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex gap-2">
              {['', 'aadhaar', 'pan', 'driving_licence'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-md font-medium capitalize transition ${
                    typeFilter === t
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === '' ? 'All' : t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mb-2" />
                <p className="text-xs">Loading records...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold text-slate-700">No records found</p>
                <p className="text-[11px] text-slate-500 mt-1">Processed document extractions will be listed here.</p>
              </div>
            ) : (
              filteredHistory.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => {
                    onSelectDocument({
                      document_type: doc.documentType,
                      is_valid: doc.isValid,
                      short_circuited: doc.shortCircuited,
                      data: doc.data,
                      warnings: doc.warnings,
                      ocr_confidence: doc.ocrConfidence,
                      quality_report: doc.qualityReport,
                      raw_ocr_text: doc.rawOcrText,
                    });
                    onClose();
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-3.5 hover:border-sky-400 hover:shadow-sm cursor-pointer transition flex items-center justify-between group"
                >
                  <div className="overflow-hidden pr-2">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                        {doc.documentType || 'document'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {doc.data?.name || doc.originalFileName || 'Unnamed Document'}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {doc.data?.aadhaar_number || doc.data?.pan_number || doc.data?.dl_number || 'No ID Number'}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => handleDelete(e, doc._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-sky-600 transition" />
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
