import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, FileText, CheckCircle2, XCircle, Search, RefreshCw } from 'lucide-react';
import { getHistoryApi, deleteDocumentApi } from '../services/api';

export default function HistoryDrawer({ isOpen, onClose, onSelectDocument }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getHistoryApi(1, 50, filterType);
      setHistory(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, filterType]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this extraction record from MongoDB?')) return;
    try {
      await deleteDocumentApi(id);
      setHistory(history.filter((doc) => doc._id !== id));
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  if (!isOpen) return null;

  const filteredDocs = history.filter((doc) => {
    const name = doc.data?.name || '';
    const num = doc.data?.aadhaar_number || doc.data?.pan_number || doc.data?.dl_number || '';
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || num.toLowerCase().includes(q) || doc.originalFileName?.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Extraction History</h3>
            <p className="text-xs text-slate-400">Stored records in MongoDB</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, number, file..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto text-xs">
            {['', 'aadhaar', 'pan', 'driving_licence', 'unsupported'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                  filterType === t
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {t ? t.replace('_', ' ').toUpperCase() : 'ALL'}
              </button>
            ))}
          </div>
        </div>

        {/* Records List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading records...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">No records found in database.</div>
          ) : (
            filteredDocs.map((doc) => (
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
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 cursor-pointer transition flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700/60">
                      {doc.documentType}
                    </span>
                    <h4 className="text-sm font-semibold text-white mt-1.5 truncate max-w-[220px]">
                      {doc.data?.name || doc.originalFileName || 'Untitled Document'}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc._id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Confidence: <strong className="text-slate-200">{doc.ocrConfidence}%</strong></span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
