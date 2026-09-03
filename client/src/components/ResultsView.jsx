import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  User, 
  Calendar, 
  MapPin, 
  Hash, 
  FileText, 
  Clock, 
  Image as ImageIcon,
  RotateCcw,
  ArrowRight,
  Truck,
  Car,
  Edit2,
  Check
} from 'lucide-react';

export default function ResultsView({ 
  result, 
  onCorrect, 
  onWrong, 
  onRetry, 
  onUploadNew,
  onReupload, 
  onUploadAnother 
}) {
  if (!result) return null;

  const { 
    document_type, 
    is_valid, 
    short_circuited, 
    is_duplicate_or_sample, 
    authenticity_status, 
    data, 
    warnings, 
    images,
    image_id,
    failed_id,
    date,
    time,
    status
  } = result;

  // Local editable state for human-in-the-loop editing
  const [formData, setFormData] = useState(data || {});
  const [confirmationState, setConfirmationState] = useState('pending'); // 'pending' | 'correct' | 'wrong'
  const [confirmedId, setConfirmedId] = useState(image_id || null);
  const [loggedFailedId, setLoggedFailedId] = useState(failed_id || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData(data || {});
    setConfirmationState('pending');
    setConfirmedId(image_id || null);
    setLoggedFailedId(failed_id || null);
  }, [data, result]);

  const handleFieldChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleCorrectClick = async () => {
    setIsSaving(true);
    try {
      if (onCorrect) {
        const res = await onCorrect(formData);
        if (res?.imageId) setConfirmedId(res.imageId);
      }
      setConfirmationState('correct');
    } catch (e) {
      console.error('Confirm correct error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleWrongClick = async () => {
    setIsSaving(true);
    try {
      if (onWrong) {
        const res = await onWrong();
        if (res?.failedId) setLoggedFailedId(res.failedId);
      }
      setConfirmationState('wrong');
    } catch (e) {
      console.error('Confirm wrong error:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const displayId = confirmedId || loggedFailedId || image_id || failed_id || result.id || 'IMG000001';
  const displayDate = date || new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
  const displayTime = time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const displayStatus = confirmationState === 'correct' ? 'Success' : confirmationState === 'wrong' ? 'Failed' : status || (short_circuited ? 'Failed' : 'Success');

  // Document Badge Colors for Light Theme
  const getBadge = () => {
    if (is_duplicate_or_sample || authenticity_status === "DUPLICATE_COPY") {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>⚠️ DUPLICATE / SAMPLE COPY DETECTED</span>
        </div>
      );
    }

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
            <span>AADHAAR FRONT VERIFIED</span>
          </div>
        );
      case 'aadhaar_back':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            <span>AADHAAR BACK (ADDRESS) VERIFIED</span>
          </div>
        );
      case 'pan':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>PAN CARD VERIFIED</span>
          </div>
        );
      case 'pan_back':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold">
            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
            <span>PAN BACK SIDE DETECTED</span>
          </div>
        );
      case 'driving_licence':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DRIVING LICENCE VERIFIED</span>
          </div>
        );
      case 'driving_licence_back':
        return (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>DRIVING LICENCE (BACK) VERIFIED</span>
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
        
        {/* Card Header with Sequential Image ID, Date, Time & Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2 mb-2 flex-wrap gap-y-1">
              <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-md bg-sky-100 text-sky-800 border border-sky-300 shadow-sm">
                ID: {displayId}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md inline-flex items-center space-x-1.5 border shadow-sm ${
                displayStatus === 'Success' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                  : 'bg-rose-50 text-rose-700 border-rose-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${displayStatus === 'Success' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <span>Status: {displayStatus}</span>
              </span>
              {getBadge()}
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {document_type === 'unsupported' 
                ? 'Verification Declined' 
                : `${document_type.replace('_', ' ').toUpperCase()} DETAILS`}
            </h2>
          </div>
          
          <div className="flex flex-col sm:items-end text-xs text-slate-500 space-y-1 self-start sm:self-auto">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{displayDate}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>{displayTime}</span>
            </div>
            <span className="text-[10px] text-slate-400">30-Day Auto Retention</span>
          </div>
        </div>

        {/* SECURITY ALERT: DUPLICATE / SAMPLE CARD WARNING */}
        {(is_duplicate_or_sample || authenticity_status === "DUPLICATE_COPY") && (
          <div className="mt-4 p-4 bg-rose-50 border-2 border-rose-300 rounded-xl flex items-start space-x-3 text-xs text-rose-900 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block text-sm font-bold text-rose-950 mb-0.5">
                ⚠️ SECURITY WARNING: Duplicate / Sample Card Watermark Detected!
              </strong>
              <p className="text-rose-800 leading-relaxed">
                This document contains a <strong>'DUPLICATE / SAMPLE / DIGITAL COPY'</strong> watermark. 
                While text details were extracted for reference, this document is <strong>NOT a genuine physical government ID</strong> and should be rejected for KYC verification.
              </p>
            </div>
          </div>
        )}

        {/* SPECIAL CASE: PAN BACK SIDE GUIDANCE PROMPT */}
        {document_type === 'pan_back' && (
          <div className="mt-6 p-6 bg-amber-50/80 border border-amber-200 rounded-2xl">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-xl flex-shrink-0">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-amber-900 mb-1">
                  PAN Card Back Side Detected
                </h3>
                <p className="text-xs text-amber-800 leading-relaxed max-w-2xl">
                  The back side of an Indian PAN Card contains only barcodes and instructions. It does not have your Name, Father's Name, DOB, or PAN Number.
                </p>
                <div className="mt-4 p-3 bg-white/90 border border-amber-200 rounded-xl text-xs text-slate-700 flex items-center justify-between">
                  <span>👉 <strong>Action Required:</strong> Please flip the card and upload the <strong>FRONT SIDE</strong> to complete verification.</span>
                  {onUploadAnother && (
                    <button
                      onClick={onUploadAnother}
                      className="ml-3 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 flex-shrink-0"
                    >
                      <span>Upload Front Side</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BACK-SIDE PROMPT FOR AADHAAR & DRIVING LICENCE */}
        {(document_type === 'aadhaar_back' || document_type === 'driving_licence_back') && (
          <div className="mt-4 p-4 bg-sky-50 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-sky-900">
            <div className="flex items-start space-x-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block text-sky-950 font-bold">Back Side Verified (Address & Details Extracted)!</strong>
                <span>To link with your full name and cardholder photo, please also upload the <strong>FRONT SIDE</strong>.</span>
              </div>
            </div>
            {onUploadAnother && (
              <button
                onClick={onUploadAnother}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1 self-start sm:self-auto flex-shrink-0"
              >
                <span>Upload Front Side</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Validation Warnings Alert */}
        {warnings && warnings.length > 0 && document_type !== 'pan_back' && (
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

        {/* Extracted Fields Content with Photo Attachment */}
        {document_type === 'unsupported' ? (
          <div className="mt-6 p-8 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <XCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-slate-800 mb-1">Non-Supported Document</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {data?.error || 'Only Indian Aadhaar Card, PAN Card, and Driving Licence are supported by Utility Bot.'}
            </p>
          </div>
        ) : document_type !== 'pan_back' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Attached Document Photo */}
            {images?.original && (
              <div className="lg:col-span-1 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mb-3 self-start">
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Applicant Document Photo</span>
                </div>
                <img
                  src={images.original}
                  alt="Verified Document Scan"
                  className="max-h-48 w-full object-contain rounded-lg border border-slate-200 shadow-sm bg-white p-1"
                />
                <span className="text-[11px] text-slate-400 mt-2">Stored with 30-day retention</span>
              </div>
            )}

            {/* Right Columns: Extracted Data Cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${images?.original ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              
              {/* 1. AADHAAR FRONT FIELDS */}
              {document_type === 'aadhaar' && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm group">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Applicant Name</span>
                      <input
                        type="text"
                        value={formData?.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Applicant Name"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Aadhaar Number (Masked)</span>
                      <input
                        type="text"
                        value={formData?.aadhaar_number || ''}
                        onChange={(e) => handleFieldChange('aadhaar_number', e.target.value)}
                        placeholder="********1234"
                        className="w-full text-sm font-bold text-sky-700 font-mono bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</span>
                      <input
                        type="text"
                        value={formData?.date_of_birth || formData?.year_of_birth || ''}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Gender</span>
                      <input
                        type="text"
                        value={formData?.gender || ''}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                        placeholder="Male / Female"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-purple-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 2. AADHAAR BACK FIELDS (Address & Care of) */}
              {document_type === 'aadhaar_back' && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-purple-100 text-purple-700 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Guardian / Spouse (C/O)</span>
                      <input
                        type="text"
                        value={formData?.care_of || ''}
                        onChange={(e) => handleFieldChange('care_of', e.target.value)}
                        placeholder="Father / Husband Name"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-purple-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Postal Pincode</span>
                      <input
                        type="text"
                        value={formData?.pincode || ''}
                        onChange={(e) => handleFieldChange('pincode', e.target.value)}
                        placeholder="6-digit PIN"
                        className="w-full text-sm font-bold text-sky-700 font-mono bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:col-span-2 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Full Residential Address</span>
                      <textarea
                        rows={2}
                        value={formData?.address || ''}
                        onChange={(e) => handleFieldChange('address', e.target.value)}
                        placeholder="Full Residential Address"
                        className="w-full text-xs text-slate-800 font-medium bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-1 rounded focus:outline-none transition mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 3. PAN FRONT FIELDS */}
              {document_type === 'pan' && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Cardholder Name</span>
                      <input
                        type="text"
                        value={formData?.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Cardholder Name"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">PAN Number</span>
                      <input
                        type="text"
                        value={formData?.pan_number || ''}
                        onChange={(e) => handleFieldChange('pan_number', e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        className="w-full text-sm font-bold text-sky-700 font-mono uppercase bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Father's Name</span>
                      <input
                        type="text"
                        value={formData?.father_name || ''}
                        onChange={(e) => handleFieldChange('father_name', e.target.value)}
                        placeholder="Father's Name"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</span>
                      <input
                        type="text"
                        value={formData?.date_of_birth || ''}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 4. DRIVING LICENCE FRONT FIELDS */}
              {document_type === 'driving_licence' && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Licence Holder Name</span>
                      <input
                        type="text"
                        value={formData?.name || ''}
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        placeholder="Licence Holder Name"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Licence Number</span>
                      <input
                        type="text"
                        value={formData?.dl_number || ''}
                        onChange={(e) => handleFieldChange('dl_number', e.target.value.toUpperCase())}
                        placeholder="DL Number"
                        className="w-full text-sm font-bold text-sky-700 font-mono uppercase bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-sky-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-amber-100 text-amber-700 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Date of Birth</span>
                      <input
                        type="text"
                        value={formData?.date_of_birth || ''}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Valid Until</span>
                      <input
                        type="text"
                        value={formData?.valid_until || ''}
                        onChange={(e) => handleFieldChange('valid_until', e.target.value)}
                        placeholder="YYYY-MM-DD"
                        className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded focus:outline-none transition"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 5. DRIVING LICENCE BACK */}
              {document_type === 'driving_licence_back' && (
                <>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:col-span-2 flex items-start space-x-3 shadow-sm">
                    <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Authorised Vehicle Categories</span>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {data?.vehicle_classes && data.vehicle_classes.length > 0 ? (
                          data.vehicle_classes.map((vc, i) => (
                            <span key={i} className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs">
                              {vc}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">LMV / MCWG (Detected on back)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {data?.address && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:col-span-2 flex items-start space-x-3 shadow-sm">
                      <div className="p-2 rounded-lg bg-sky-100 text-sky-700 flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Permanent Address</span>
                        <p className="text-xs text-slate-800 mt-1 leading-relaxed font-medium">{data.address}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

            </div>

            {/* CONFIRMATION / ACTION TOOLBAR */}
            <div className="mt-8 pt-6 border-t border-slate-200">
              
              {/* STATE 1: PENDING USER CONFIRMATION (Initial View: ✓ Correct / ✗ Wrong) */}
              {confirmationState === 'pending' && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-sky-50/40 border border-slate-200 shadow-sm space-y-4">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center space-x-2 text-slate-800 font-bold text-sm">
                        <Edit2 className="w-4 h-4 text-sky-600" />
                        <span>Step 2: Confirm Extracted Information</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Please review all fields above. You can click and edit any field directly. 
                        Click <strong>✓ Correct</strong> to save as a verified record in History, or <strong>✗ Wrong</strong> to reject.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto flex-wrap sm:flex-nowrap">
                      {/* Button 1: ✓ Correct */}
                      <button
                        type="button"
                        onClick={handleCorrectClick}
                        disabled={isSaving}
                        className="flex-1 sm:flex-initial min-w-[130px] px-6 py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 active:scale-95 transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{isSaving ? 'Saving...' : '✓ Correct'}</span>
                      </button>

                      {/* Button 2: ✗ Wrong */}
                      <button
                        type="button"
                        onClick={handleWrongClick}
                        disabled={isSaving}
                        className="flex-1 sm:flex-initial min-w-[130px] px-6 py-3 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-600/25 active:scale-95 transition-all duration-150 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>✗ Wrong</span>
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* STATE 2: USER CLICKED "✓ Correct" */}
              {confirmationState === 'correct' && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-xl bg-emerald-600 text-white flex-shrink-0 shadow-md shadow-emerald-600/30">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-emerald-950">Record Confirmed & Saved!</h4>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
                            {displayId}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800 mt-1">
                          Successfully verified and saved to database on <strong>{displayDate}</strong> at <strong>{displayTime}</strong>.
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl shadow-sm self-start sm:self-auto flex-shrink-0">
                      ✓ Stored in History
                    </span>
                  </div>

                  <div className="flex items-center justify-end pt-2 border-t border-emerald-200/60">
                    <button
                      type="button"
                      onClick={onUploadNew || onReupload || onUploadAnother}
                      className="px-6 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition flex items-center space-x-2 cursor-pointer active:scale-95"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Upload Next Document</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STATE 3: USER CLICKED "✗ Wrong" */}
              {confirmationState === 'wrong' && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Failure Notice */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2.5 rounded-xl bg-rose-600 text-white flex-shrink-0 shadow-md shadow-rose-600/30">
                        <XCircle className="w-6 h-6 stroke-[2.5]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-bold text-rose-950">Extraction Marked as Inaccurate</h4>
                          <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-200 text-rose-900 border border-rose-300">
                            {displayId}
                          </span>
                        </div>
                        <p className="text-xs text-rose-800 mt-1">
                          Logged internally for system auditing on {displayDate} at {displayTime}. This record is <strong>NOT shown on the public History page</strong>.
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-bold px-3.5 py-1.5 bg-rose-600 text-white rounded-xl shadow-sm self-start sm:self-auto flex-shrink-0">
                      Internal Audit Only
                    </span>
                  </div>

                  {/* The 2 Clear Next Action Buttons: Retry and Upload New Image */}
                  <div className="pt-3 border-t border-rose-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-rose-800 font-medium">What would you like to do next?</span>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      {/* Button 1: Retry */}
                      <button
                        type="button"
                        onClick={onRetry}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-white shadow-md transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-4 h-4 text-slate-300" />
                        <span>Retry</span>
                      </button>

                      {/* Button 2: Upload New Image */}
                      <button
                        type="button"
                        onClick={onUploadNew || onReupload || onUploadAnother}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-md shadow-sky-600/20 transition flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                      >
                        <ImageIcon className="w-4 h-4" />
                        <span>Upload New Image</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
