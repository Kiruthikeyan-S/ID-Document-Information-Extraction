import React from 'react';
import { AlertTriangle, XCircle, ShieldCheck, User, Calendar, MapPin, Hash, FileText } from 'lucide-react';

export default function ResultsView({ result }) {
  if (!result) return null;

  const { document_type, is_valid, short_circuited, data, warnings } = result;

  // Document Badge Colors for Light Theme
  const getBadge = () => {
    if (short_circuited) {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>DECLINED: NON-ID DOCUMENT</span>
        </div>
      );
    }

    switch (document_type) {
      case 'aadhaar':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>AADHAAR CARD VERIFIED</span>
          </div>
        );
      case 'pan':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>PAN CARD VERIFIED</span>
          </div>
        );
      case 'driving_licence':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DRIVING LICENCE VERIFIED</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>UNSUPPORTED DOCUMENT</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Main Extracted Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="mb-1.5">{getBadge()}</div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {document_type === 'unsupported' 
                ? 'Document Not Supported' 
                : `${document_type.replace('_', ' ').toUpperCase()} EXTRACTION`}
            </h2>
          </div>
        </div>

        {/* Validation Warnings Alert */}
        {warnings && warnings.length > 0 && (
          <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-3 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Verification Notices:</span>
              <ul className="list-disc list-inside space-y-0.5 text-amber-900/90">
                {warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Extracted Fields Content */}
        {document_type === 'unsupported' ? (
          <div className="mt-6 p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">Non-Supported Document</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {data?.error || 'Only Indian Aadhaar Card, PAN Card, and Driving Licence are supported by this system.'}
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cardholder Name */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cardholder Name</span>
                <span className="text-sm font-bold text-slate-900 block truncate">{data?.name || 'Not Detected'}</span>
              </div>
            </div>

            {/* Document Specific Number (Aadhaar / PAN / DL) */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
                <Hash className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {document_type === 'aadhaar' ? 'Aadhaar Number (Masked)' : document_type === 'pan' ? 'PAN Number' : 'DL Number'}
                </span>
                <span className="text-sm font-bold text-sky-700 font-mono block">
                  {data?.aadhaar_number || data?.pan_number || data?.dl_number || 'Not Detected'}
                </span>
              </div>
            </div>

            {/* Date of Birth */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</span>
                <span className="text-sm font-bold text-slate-900 block">
                  {data?.date_of_birth || data?.year_of_birth || 'Not Detected'}
                </span>
              </div>
            </div>

            {/* Father's Name (PAN) or Gender (Aadhaar) or Validity (DL) */}
            {document_type === 'pan' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Father's Name</span>
                  <span className="text-sm font-bold text-slate-900 block truncate">{data?.father_name || 'Not Detected'}</span>
                </div>
              </div>
            )}

            {document_type === 'aadhaar' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-700 flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gender</span>
                  <span className="text-sm font-bold text-slate-900 block">{data?.gender || 'Not Detected'}</span>
                </div>
              </div>
            )}

            {document_type === 'driving_licence' && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Validity / Expiry Date</span>
                  <span className="text-sm font-bold text-slate-900 block">{data?.valid_until || 'Not Detected'}</span>
                </div>
              </div>
            )}

            {/* Address (Aadhaar or Driving Licence) */}
            {(document_type === 'aadhaar' || document_type === 'driving_licence') && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-2 flex items-start space-x-3 shadow-sm">
                <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Address</span>
                  <p className="text-xs text-slate-800 mt-0.5 leading-relaxed font-medium">
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
