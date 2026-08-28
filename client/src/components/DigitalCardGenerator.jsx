import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  Save, 
  Upload, 
  Sparkles, 
  User, 
  Calendar, 
  MapPin, 
  Hash, 
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
    initialData.aadhaar_number || initialData.pan_number || initialData.dl_number || '3353 3245 7645'
  );
  const [dob, setDob] = useState(initialData.date_of_birth || initialData.year_of_birth || '18/11/2004');
  const [gender, setGender] = useState(initialData.gender || 'Male');
  const [fatherName, setFatherName] = useState(initialData.father_name || initialData.care_of || '');
  const [address, setAddress] = useState(initialData.address || '');
  const [photoUrl, setPhotoUrl] = useState(documentData.images?.original || documentData.thumbnail || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef(null);

  // Format 12 digit number into 4 4 4 blocks
  const formatAadhaar = (num) => {
    if (!num) return '3353 3245 7645';
    const clean = num.replace(/\s+/g, '');
    if (clean.length === 12) {
      return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
    }
    return num;
  };

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

  // Generate and Download Duplicate Card as High-Res PNG
  const handleDownloadCard = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 900;
    canvas.height = 560;

    // 1. White Background & Crisp Border
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

    if (docType.includes('aadhaar')) {
      // --- AUTHENTIC AADHAAR CARD LAYOUT ---
      
      // Top Emblem Placeholder (Left)
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('सत्यमेव जयते', 80, 75);

      // Top Center Indian Flag Ribbon
      // Saffron Stripe
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.roundRect(220, 25, 460, 16, [8, 8, 0, 0]);
      ctx.fill();

      // Green Stripe
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.roundRect(220, 41, 460, 16, [0, 0, 8, 8]);
      ctx.fill();

      // Center Government Text
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Government of India', 450, 48);

      // Top Right Aadhaar Sun Emblem Motif
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('आधाऱ', 820, 50);

      // Left Vertical Issue Date (Optional aesthetic touch)
      ctx.save();
      ctx.translate(35, 280);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#64748b';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Issue Date: Verified Copy', 0, 0);
      ctx.restore();

      // Cardholder Photo Box (Left)
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(65, 100, 240, 280);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(65, 100, 240, 280);

      // Details Content (Right Side)
      ctx.textAlign = 'start';

      // English Name
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(name || 'S Kiruthikeyan', 340, 155);

      // DOB Line
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(`DOB: ${dob || '18/11/2004'}`, 340, 220);

      // Gender Line
      ctx.fillText(`Gender: ${gender || 'Male'}`, 340, 275);

      // Address if present
      if (address) {
        ctx.font = '16px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.fillText(`Address: ${address.slice(0, 45)}`, 340, 330);
      }

      // Large 12-Digit Bold Aadhaar Number (Centered Bottom)
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 44px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatAadhaar(idNumber), 450, 450);

      // Red Line Separator
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(30, 475);
      ctx.lineTo(870, 475);
      ctx.stroke();

      // Bottom Authentic Slogan
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('मेरा आधार, मेरी पहचान', 450, 520);

    } else if (docType.includes('pan')) {
      // --- AUTHENTIC PAN CARD LAYOUT ---
      // Top Header
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, 2, canvas.width - 4, 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('INCOME TAX DEPARTMENT', 40, 40);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('GOVERNMENT OF INDIA', 40, 70);

      // Photo Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(50, 110, 220, 260);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(50, 110, 220, 260);

      // Details
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(name || 'Cardholder Name', 300, 160);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`Father's Name: ${fatherName || 'Father Name'}`, 300, 215);
      ctx.fillText(`Date of Birth: ${dob || 'DD/MM/YYYY'}`, 300, 265);

      // Large PAN Number
      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 40px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idNumber || 'ABCDE1234F', 450, 440);

      // Bottom Bar
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 475);
      ctx.lineTo(870, 475);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Permanent Account Number Card (Duplicate Copy)', 450, 515);

    } else {
      // --- AUTHENTIC DRIVING LICENCE LAYOUT ---
      ctx.fillStyle = '#059669';
      ctx.fillRect(2, 2, canvas.width - 4, 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('INDIAN UNION DRIVING LICENCE', 40, 40);
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('TRANSPORT DEPARTMENT', 40, 70);

      // Photo Box
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(50, 110, 220, 260);
      ctx.strokeStyle = '#94a3b8';
      ctx.strokeRect(50, 110, 220, 260);

      // Details
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Name: ${name || 'Licence Holder'}`, 300, 160);

      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`DOB: ${dob || 'DD/MM/YYYY'}`, 300, 215);
      ctx.fillText(`Licence No: ${idNumber || 'DL-XXXX'}`, 300, 265);

      // Bottom Large DL
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(idNumber || 'DL NUMBER', 450, 440);

      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(30, 475);
      ctx.lineTo(870, 475);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Authorised Driving Licence (Duplicate Copy)', 450, 515);
    }

    // Draw Photo
    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, docType.includes('aadhaar') ? 66 : 51, docType.includes('aadhaar') ? 101 : 111, docType.includes('aadhaar') ? 238 : 218, docType.includes('aadhaar') ? 278 : 258);
        triggerDownload(canvas);
      };
      img.onerror = () => triggerDownload(canvas);
      img.src = photoUrl;
    } else {
      triggerDownload(canvas);
    }
  };

  const triggerDownload = (canvas) => {
    const link = document.createElement('a');
    link.download = `Aadhaar_Card_${name ? name.replace(/\s+/g, '_') : 'Duplicate'}.png`;
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
      <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-sky-600" />
              <h2 className="text-lg font-bold text-slate-900">
                Aadhaar / ID Card Duplicate Generator & Editor
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Edit cardholder details, upload/crop photo, and generate an authentic duplicate ID card copy.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Editor & Real Card Preview */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
          
          {/* Left Form: Edit Fields (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              1. Edit Verification Fields
            </h3>

            {/* Applicant Name */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
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
                {docType.includes('aadhaar') ? '12-Digit Aadhaar Number' : docType.includes('pan') ? 'PAN Number' : 'DL Number'}
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="3353 3245 7645"
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
                  placeholder="DD/MM/YYYY"
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

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Address / Extra Line</label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="Address string"
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 text-slate-800"
              />
            </div>

            {/* Photo Upload */}
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

          {/* Right Area: Authentic Card Design (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                2. Authentic Card Layout (Matching Image 2)
              </h3>

              {/* AUTHENTIC AADHAAR CARD VISUAL TILE */}
              <div className="bg-white border-2 border-slate-300 rounded-2xl shadow-xl p-5 overflow-hidden relative">
                
                {/* Header Row: Emblem, Flag Banner, Sun Logo */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  {/* Left: Ashoka Emblem Text Motif */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg">🏛️</span>
                    <span className="text-[9px] font-bold text-slate-700">सत्यमेव जयते</span>
                  </div>

                  {/* Center: Tricolor Indian Flag Banner */}
                  <div className="flex-1 max-w-[260px] mx-2">
                    <div className="h-2.5 bg-orange-500 rounded-t-md" />
                    <div className="h-3.5 bg-green-600 rounded-b-md flex items-center justify-center">
                      <span className="text-[10px] font-bold text-white tracking-wider">Government of India</span>
                    </div>
                  </div>

                  {/* Right: Red Aadhaar Sun Emblem */}
                  <div className="flex flex-col items-center">
                    <span className="text-xl">☀️</span>
                    <span className="text-[9px] font-extrabold text-red-600">आधार</span>
                  </div>
                </div>

                {/* Cardholder Details & Photo Body */}
                <div className="mt-4 flex items-start space-x-4">
                  {/* Photo with Border */}
                  <div className="w-28 h-36 rounded-md bg-slate-100 border-2 border-slate-300 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-inner">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Cardholder Photo" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* Right Side Text Lines */}
                  <div className="flex-1 text-left space-y-1.5">
                    <div className="text-sm font-extrabold text-slate-900 tracking-tight">
                      {name || 'S Kiruthikeyan'}
                    </div>

                    <div className="text-xs font-semibold text-slate-700">
                      <span className="text-slate-500 font-medium">DOB: </span>
                      {dob || '18/11/2004'}
                    </div>

                    <div className="text-xs font-semibold text-slate-700">
                      <span className="text-slate-500 font-medium">Gender: </span>
                      {gender || 'Male'}
                    </div>

                    {address && (
                      <div className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-1">
                        <span className="text-slate-400 font-medium">Address: </span>
                        {address}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Center: Large 12-Digit Bold Aadhaar Number */}
                <div className="mt-4 pt-3 text-center">
                  <div className="text-2xl font-extrabold font-mono tracking-widest text-slate-900">
                    {formatAadhaar(idNumber)}
                  </div>
                </div>

                {/* Red Line Separator */}
                <div className="mt-3 border-t-2 border-red-500" />

                {/* Bottom Slogan */}
                <div className="mt-2 text-center text-xs font-bold text-slate-800">
                  <span>எனது </span>
                  <span className="text-red-600">ஆதார்</span>
                  <span>, எனது அடையாளம் (मेरा आधार, मेरी पहचान)</span>
                </div>

              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleDownloadCard}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition flex items-center justify-center space-x-2 cursor-pointer"
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
                  <span>Details saved to verification database!</span>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
