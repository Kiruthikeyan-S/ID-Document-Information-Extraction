import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Save, 
  Upload, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Calendar, 
  MapPin, 
  Hash, 
  FileText, 
  QrCode,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { updateDocumentApi } from '../services/api';

export default function DigitalCardGenerator({ isOpen, onClose, documentData, onSaveUpdated }) {
  if (!isOpen || !documentData) return null;

  const docType = documentData.document_type || 'aadhaar';
  const initialData = documentData.data || {};
  const docId = documentData.id || documentData._id;

  // Editable Form State
  const [name, setName] = useState(initialData.name || '');
  const [idNumber, setIdNumber] = useState(
    initialData.aadhaar_number || initialData.pan_number || initialData.dl_number || ''
  );
  const [dob, setDob] = useState(initialData.date_of_birth || initialData.year_of_birth || '');
  const [gender, setGender] = useState(initialData.gender || 'Male');
  const [fatherName, setFatherName] = useState(initialData.father_name || initialData.care_of || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [photoUrl, setPhotoUrl] = useState(documentData.images?.original || documentData.thumbnail || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle Photo Replacement
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Generate and Download Duplicate Digital ID Card as PNG
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1000;
    canvas.height = 630; // Standard CR80 ID Card Aspect Ratio

    // 1. Card Background & Border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Rounded Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    if (docType.includes('aadhaar')) {
      // --- AADHAAR CARD THEME ---
      // Top Tricolor Ribbon
      ctx.fillStyle = '#ea580c'; // Saffron
      ctx.fillRect(4, 4, canvas.width - 8, 12);
      ctx.fillStyle = '#16a34a'; // Green
      ctx.fillRect(4, 16, canvas.width - 8, 12);

      // Header Text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('भारत सरकार', 180, 65);
      ctx.fillText('Government of India', 180, 95);

      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('DUPLICATE DIGITAL CARD COPY', 580, 75);

      // Divider Line
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(40, 115, 920, 2);

      // Photo Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(60, 140, 220, 270);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 140, 220, 270);

      // Details Content
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Name: ${name || 'N/A'}`, 320, 175);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`DOB: ${dob || 'N/A'}`, 320, 220);
      ctx.fillText(`Gender: ${gender || 'N/A'}`, 320, 260);

      if (address) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Address: ${address.slice(0, 55)}`, 320, 305);
        if (address.length > 55) {
          ctx.fillText(`${address.slice(55, 110)}`, 320, 330);
        }
      }

      // Large Aadhaar Number Box at Bottom
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(60, 440, 880, 80);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(60, 440, 880, 80);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idNumber || 'XXXX XXXX XXXX', 500, 495);
      ctx.textAlign = 'start';

      // Bottom Tagline
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(4, 580, canvas.width - 8, 46);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('मेरा आधार, मेरी पहचान (Utility Bot Verified Digital Copy)', 500, 610);

    } else if (docType.includes('pan')) {
      // --- PAN CARD THEME ---
      // Header Blue Gradient Banner
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(4, 4, canvas.width - 8, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('आयकर विभाग / INCOME TAX DEPARTMENT', 40, 45);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('GOVT. OF INDIA (DIGITAL DUPLICATE COPY)', 40, 75);

      // Photo Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(60, 130, 220, 270);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(60, 130, 220, 270);

      // Details Content
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Name: ${name || 'N/A'}`, 320, 170);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`Father's Name: ${fatherName || 'N/A'}`, 320, 220);
      ctx.fillText(`Date of Birth: ${dob || 'N/A'}`, 320, 270);

      // Permanent Account Number Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(320, 320, 600, 80);
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(320, 320, 600, 80);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Permanent Account Number (PAN)', 340, 345);
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 34px monospace';
      ctx.fillText(idNumber || 'ABCDE1234F', 340, 385);

      // Bottom Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(4, 580, canvas.width - 8, 46);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Utility Bot Verified Digital PAN Copy', 500, 610);

    } else {
      // --- DRIVING LICENCE THEME ---
      ctx.fillStyle = '#047857';
      ctx.fillRect(4, 4, canvas.width - 8, 90);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('INDIAN UNION DRIVING LICENCE', 40, 45);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('TRANSPORT DEPARTMENT (DIGITAL DUPLICATE COPY)', 40, 75);

      // Photo Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(60, 130, 220, 270);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(60, 130, 220, 270);

      // Details
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Licence Holder: ${name || 'N/A'}`, 320, 170);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`DL Number: ${idNumber || 'N/A'}`, 320, 220);
      ctx.fillText(`Date of Birth: ${dob || 'N/A'}`, 320, 260);

      if (address) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Address: ${address.slice(0, 55)}`, 320, 305);
      }

      ctx.fillStyle = '#047857';
      ctx.fillRect(4, 580, canvas.width - 8, 46);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Utility Bot Verified Digital Driving Licence', 500, 610);
    }

    // Draw Photo if available
    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 62, docType.includes('aadhaar') ? 142 : 132, 216, 266);
        triggerDownload(canvas);
      };
      img.onerror = () => {
        triggerDownload(canvas);
      };
      img.src = photoUrl;
    } else {
      triggerDownload(canvas);
    }
  };

  const triggerDownload = (canvas) => {
    const link = document.createElement('a');
    link.download = `Duplicate_${docType.toUpperCase()}_${name ? name.replace(/\s+/g, '_') : 'Card'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Save changes to database
  const handleSaveToDatabase = async () => {
    if (!docId) {
      alert('Document ID is missing. Cannot update record.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedPayload = {
        data: {
          ...initialData,
          name: name,
          aadhaar_number: docType.includes('aadhaar') ? idNumber : initialData.aadhaar_number,
          pan_number: docType.includes('pan') ? idNumber : initialData.pan_number,
          dl_number: docType.includes('driving_licence') ? idNumber : initialData.dl_number,
          date_of_birth: dob,
          gender: gender,
          father_name: fatherName,
          care_of: fatherName,
          address: address,
        },
        thumbnail: photoUrl,
      };

      await updateDocumentApi(docId, updatedPayload);
      setSaveSuccess(true);
      if (onSaveUpdated) {
        onSaveUpdated({
          ...documentData,
          data: updatedPayload.data,
          thumbnail: photoUrl,
        });
      }
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update record:', err);
      alert('Failed to save updated details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Edit Details & Generate Duplicate ID Card
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Modify applicant data, change document photo, and export a digital duplicate copy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Editor & Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50">
          
          {/* Left Column: Editable Form Fields */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              1. Edit Verification Fields
            </h3>

            {/* Applicant Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Applicant Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-800"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {docType.includes('aadhaar') ? 'Aadhaar Number' : docType.includes('pan') ? 'PAN Number' : 'Licence Number'}
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="ID Number"
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-sky-700"
              />
            </div>

            {/* Date of Birth & Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-800"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-800"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>
            </div>

            {/* Father's Name / Spouse Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Father's / Guardian Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Father or Guardian Name"
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-800"
              />
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Residential Address</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Full Address"
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-800"
              />
            </div>

            {/* Photo Swap Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Cardholder Photo:</span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center space-x-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload New Photo</span>
              </button>
            </div>

          </div>

          {/* Right Column: Live Digital Duplicate Card Preview */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Live Digital ID Preview
            </h3>

            {/* Rendered Visual Card */}
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 shadow-md overflow-hidden relative">
              
              {/* Top Banner */}
              {docType.includes('aadhaar') ? (
                <div>
                  <div className="h-1.5 bg-gradient-to-r from-orange-500 via-white to-green-600 rounded-full mb-3" />
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">Government of India</h4>
                      <p className="text-[10px] text-slate-500">Unique Identification Authority of India</p>
                    </div>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">
                      DUPLICATE DIGITAL COPY
                    </span>
                  </div>
                </div>
              ) : docType.includes('pan') ? (
                <div className="bg-sky-700 -mx-4 -mt-4 p-3 text-white rounded-t-xl mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold">INCOME TAX DEPARTMENT</h4>
                    <p className="text-[10px] text-sky-100">Govt. of India</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                    DIGITAL COPY
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-700 -mx-4 -mt-4 p-3 text-white rounded-t-xl mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold">DRIVING LICENCE</h4>
                    <p className="text-[10px] text-emerald-100">Transport Department</p>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/20 text-white">
                    DIGITAL COPY
                  </span>
                </div>
              )}

              {/* Card Body */}
              <div className="mt-3 flex items-start space-x-3">
                {/* Photo */}
                <div className="w-20 h-24 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {photoUrl ? (
                    <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Text Details */}
                <div className="flex-1 overflow-hidden space-y-1 text-left">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {name || 'Cardholder Name'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-400">DOB: </span>{dob || 'YYYY-MM-DD'}
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span className="font-semibold text-slate-400">Gender: </span>{gender || 'Male'}
                  </div>
                  {address && (
                    <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                      <span className="font-semibold text-slate-400">Address: </span>{address}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Large Number Box */}
              <div className="mt-3 p-2 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono font-bold text-sky-800 text-sm tracking-wider">
                {idNumber || 'XXXX XXXX XXXX'}
              </div>

              {/* Bottom Watermark */}
              <div className="mt-2 text-[10px] text-center text-slate-400 font-medium">
                Verified & Rendered by Utility Bot
              </div>

            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleDownloadCard}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Duplicate ID Card (PNG)</span>
              </button>

              <button
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-sky-600" />
                <span>{isSaving ? 'Saving...' : 'Save Edited Details to History'}</span>
              </button>

              {saveSuccess && (
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Changes saved to verification database!</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
