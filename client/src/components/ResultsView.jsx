import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, User, Calendar, MapPin, Hash, FileText, Zap } from 'lucide-react';

export default function ResultsView({ result }) {
  if (!result) return null;

  const { document_type, is_valid, short_circuited, data, warnings, ocr_confidence, quality_report } = result;

  // Document Badge Colors
  const getBadge = () => {
    if (short_circuited) {
      return (
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
          <Zap className="w-4 h-4 text-rose-400" />
          <span>⚡ REJECTED BY PRE-LLM DECISION GATE</span>
        </div>
      );
    }

    switch (document_type) {
      case 'aadhaar':
        return (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>🆔 AADHAAR CARD DETECTED</span>
          </div>
        );
      case 'pan':
        return (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>💳 PAN CARD DETECTED</span>
          </div>
        );
      case 'driving_licence':
        return (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>🚗 DRIVING LICENCE DETECTED</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold">
            <XCircle className="w-4 h-4 text-red-400" />
            <span>⚠️ UNSUPPORTED DOCUMENT</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Metrics Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="mb-2">{getBadge()}</div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {document_type === 'unsupported' 
                ? 'Document Not Supported' 
                : `${document_type.replace('_', ' ').toUpperCase()} EXTRACTION`}
            </h2>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Confidence</span>
              <span className="text-base font-bold text-sky-400">{ocr_confidence}%</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Sharpness</span>
              <span className="text-base font-bold text-emerald-400">{quality_report?.blur_score || 'N/A'}</span>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Gate Status</span>
              <span className={`text-xs font-bold ${short_circuited ? 'text-rose-400' : 'text-indigo-400'}`}>
                {short_circuited ? 'Declined' : 'Verified'}
              </span>
            </div>
          </div>
        </div>

        {/* Validation Warnings Alert */}
        {warnings && warnings.length > 0 && (
          <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start space-x-3 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Validation Notices:</span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-200/90">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Extracted Fields Content */}
        {document_type === 'unsupported' ? (
          <div className="mt-6 p-6 bg-slate-950/60 border border-slate-800 rounded-xl text-center">
            <XCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-white mb-1">Non-ID Document Detected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {data?.error || 'Only Indian Aadhaar Card, PAN Card, and Driving Licence are supported by this system.'}
            </p>
            {short_circuited && (
              <p className="text-[11px] text-sky-400/90 mt-3 font-mono bg-sky-950/40 py-1.5 px-3 rounded-lg inline-block border border-sky-800/40">
                ⚡ Cost Saver: Skipped Groq LLM inference to conserve API tokens.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cardholder Name */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Cardholder Name</span>
                <span className="text-sm font-semibold text-white block truncate">{data?.name || 'Not Detected'}</span>
              </div>
            </div>

            {/* Document Specific Number (Aadhaar / PAN / DL) */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                  {document_type === 'aadhaar' ? 'Aadhaar Number (Masked)' : document_type === 'pan' ? 'PAN Number' : 'DL Number'}
                </span>
                <span className="text-sm font-bold text-sky-400 font-mono block">
                  {data?.aadhaar_number || data?.pan_number || data?.dl_number || 'Not Detected'}
                </span>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Date of Birth</span>
                <span className="text-sm font-semibold text-white block">
                  {data?.date_of_birth || data?.year_of_birth || 'Not Detected'}
                </span>
              </div>
            </div>

            {/* Father's Name (PAN) or Gender (Aadhaar) or Validity (DL) */}
            {document_type === 'pan' && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Father's Name</span>
                  <span className="text-sm font-semibold text-white block truncate">{data?.father_name || 'Not Detected'}</span>
                </div>
              </div>
            )}

            {document_type === 'aadhaar' && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Gender</span>
                  <span className="text-sm font-semibold text-white block">{data?.gender || 'Not Detected'}</span>
                </div>
              </div>
            )}

            {document_type === 'driving_licence' && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Validity / Expiry Date</span>
                  <span className="text-sm font-semibold text-white block">{data?.valid_until || 'Not Detected'}</span>
                </div>
              </div>
            )}

            {/* Address (Aadhaar or Driving Licence) */}
            {(document_type === 'aadhaar' || document_type === 'driving_licence') && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 md:col-span-2 flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">Address</span>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                    {data?.address || 'Not Present on Front Side / Unreadable'}
                  </p>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
