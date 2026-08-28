import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Edit3, 
  Download, 
  Printer, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  User, 
  Calendar, 
  Hash, 
  MapPin, 
  FileText, 
  QrCode, 
  Sparkles,
  Camera
} from 'lucide-react';

export default function DigitalCardGenerator({ result }) {
  if (!result || result.document_type === 'unsupported' || result.document_type === 'pan_back') {
    return null;
  }

  const { document_type, data, images } = result;

  // Editable Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    idNumber: '',
    fatherName: '',
    address: '',
    validUntil: '',
    photo: null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [cardType, setCardType] = useState('aadhaar');

  // Populate from extracted data
  useEffect(() => {
    if (result) {
      const isAadhaar = document_type.startsWith('aadhaar');
      const isPan = document_type.startsWith('pan');
      const isDl = document_type.startsWith('driving_licence');

      const inferredType = isPan ? 'pan' : isDl ? 'dl' : 'aadhaar';
      setCardType(inferredType);

      setFormData({
        name: data?.name || data?.care_of || 'CARDHOLDER NAME',
        dob: data?.date_of_birth || data?.year_of_birth || '2000-01-01',
        gender: data?.gender || 'Male',
        idNumber: 
          data?.aadhaar_number || 
          data?.pan_number || 
          data?.dl_number || 
          (inferredType === 'aadhaar' ? '4444 3333 6666' : inferredType === 'pan' ? 'ABCDE1234F' : 'TN01 20220012345'),
        fatherName: data?.father_name || data?.care_of || 'FATHER NAME',
        address: data?.address || '123 Government Colony, City, State - 600001',
        validUntil: data?.valid_until || '2040-12-31',
        photo: images?.original || null,
      });
    }
  }, [result]);

  const handlePrint = () => {
    window.print();
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Controls */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-sky-100 text-sky-700">
              <CreditCard className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Interactive Digital ID Card & Editor
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-filled with verified details. You can edit any field or customize your photo before printing.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 border ${
              isEditing 
                ? 'bg-sky-600 text-white border-sky-600 shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Close Editor' : 'Edit Details'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Editor Form (Collapsible) */}
      {isEditing && (
        <div className="bg-white border border-sky-200 rounded-2xl p-6 shadow-sm animate-in fade-in-50 duration-300">
          <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100 text-xs font-bold text-sky-900">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Live Card Data Editor</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            
            {/* Card Type Selector */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Card Design Template</label>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="aadhaar">Aadhaar Card (UIDAI Official)</option>
                <option value="pan">PAN Card (Income Tax Dept)</option>
                <option value="dl">Driving Licence (Union of India)</option>
              </select>
            </div>

            {/* Applicant Name */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Applicant Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                placeholder="Enter full name"
              />
            </div>

            {/* ID Number */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                {cardType === 'aadhaar' ? 'Aadhaar Number' : cardType === 'pan' ? 'PAN Number' : 'DL Number'}
              </label>
              <input
                type="text"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono font-medium focus:outline-none focus:border-sky-500"
                placeholder="Enter ID number"
              />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date of Birth</label>
              <input
                type="text"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                placeholder="YYYY-MM-DD or DD/MM/YYYY"
              />
            </div>

            {/* Gender */}
            {cardType === 'aadhaar' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                >
                  <option value="Male">Male / पुरुष</option>
                  <option value="Female">Female / महिला</option>
                  <option value="Transgender">Transgender</option>
                </select>
              </div>
            )}

            {/* Father's Name */}
            {cardType === 'pan' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Father's Name</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  placeholder="Father's Name"
                />
              </div>
            )}

            {/* DL Validity */}
            {cardType === 'dl' && (
              <div>
                <label className="font-bold text-slate-700 block mb-1">Valid Until</label>
                <input
                  type="text"
                  value={formData.validUntil}
                  onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-medium focus:outline-none focus:border-sky-500"
                  placeholder="YYYY-MM-DD"
                />
              </div>
            )}

            {/* Replace Photo */}
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Cardholder Photo</label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
                {formData.photo && (
                  <button
                    onClick={() => setFormData({ ...formData, photo: null })}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER DIGITAL CARD PREVIEW */}
      <div className="flex justify-center p-4 sm:p-8 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
        
        {/* ========================================================================= */}
        {/* TEMPLATE 1: OFFICIAL AADHAAR CARD                                          */}
        {/* ========================================================================= */}
        {cardType === 'aadhaar' && (
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden font-sans text-slate-900 select-none">
            
            {/* Header with Emblem & Sun Logo */}
            <header className="flex justify-between items-start px-6 pt-5 pb-3 border-b border-slate-100">
              {/* Emblem */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-10 flex items-center justify-center font-serif text-xs font-bold text-slate-800">
                  <span className="text-xl">🏛️</span>
                </div>
                <span className="text-[7px] font-bold text-slate-700 tracking-tighter">सत्यमेव जयते</span>
              </div>

              {/* Center Government of India Banner */}
              <div className="flex flex-col items-center flex-1 mx-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">भारत सरकार</h3>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Government of India</h4>
                <div className="w-32 h-0.5 bg-gradient-to-r from-orange-500 via-white to-green-600 mt-1 rounded-full" />
              </div>

              {/* Aadhaar Sun Logo */}
              <div className="w-14 h-12 flex flex-col items-center justify-center">
                <div className="text-xl">☀️</div>
                <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">AADHAAR</span>
              </div>
            </header>

            {/* Main Content Area */}
            <section className="flex flex-row justify-between items-center px-8 py-5 gap-6">
              
              {/* Profile Photo */}
              <div className="w-28 h-36 bg-slate-100 rounded-xl overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center flex-shrink-0 bg-cover bg-center">
                {formData.photo ? (
                  <img src={formData.photo} alt="Cardholder" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <User className="w-10 h-10 text-slate-300" />
                    <span className="text-[9px] mt-1 font-semibold">Photo</span>
                  </div>
                )}
              </div>

              {/* Personal Details */}
              <div className="flex-1 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">नाम / Name</span>
                  <span className="text-base font-bold text-slate-900 block leading-tight">{formData.name}</span>
                </div>

                <div className="flex gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">जन्म तिथि / DOB</span>
                    <span className="text-xs font-bold text-slate-800 block">{formData.dob}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">लिंग / Gender</span>
                    <span className="text-xs font-bold text-slate-800 block">{formData.gender}</span>
                  </div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="w-24 h-24 border border-slate-300 bg-white p-1 rounded-lg flex flex-col items-center justify-center shadow-inner flex-shrink-0">
                <QrCode className="w-16 h-16 text-slate-800" />
                <span className="text-[7px] font-bold text-slate-500 uppercase tracking-tighter mt-0.5">UIDAI SECURE QR</span>
              </div>

            </section>

            {/* Aadhaar Number Band */}
            <section className="py-3 text-center bg-slate-50 border-y border-slate-200">
              <span className="text-2xl font-bold tracking-widest text-slate-900 font-mono">
                {formData.idNumber}
              </span>
            </section>

            {/* UIDAI Footer */}
            <footer className="bg-white py-2.5 text-center">
              <p className="text-xs font-bold text-slate-800 flex items-center justify-center space-x-1">
                <span className="text-rose-600 font-black">आधार</span>
                <span>- भारतीय विशिष्ट पहचान प्राधिकरण (UIDAI)</span>
              </p>
            </footer>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE 2: OFFICIAL PAN CARD (INCOME TAX DEPT)                            */}
        {/* ========================================================================= */}
        {cardType === 'pan' && (
          <div className="w-full max-w-2xl bg-gradient-to-br from-sky-50 via-slate-50 to-amber-50/40 rounded-2xl shadow-xl border-2 border-sky-200 overflow-hidden font-sans text-slate-900 select-none p-6 relative">
            
            {/* Watermark Emblem */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-8xl opacity-5 pointer-events-none">
              🏛️
            </div>

            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b-2 border-sky-400">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase">आयकर विभाग</h3>
                <h4 className="text-[10px] font-extrabold text-sky-800 tracking-wider uppercase">INCOME TAX DEPARTMENT</h4>
              </div>
              <div className="text-center">
                <h3 className="text-xs font-bold text-slate-800 uppercase">भारत सरकार</h3>
                <h4 className="text-[10px] font-extrabold text-sky-800 tracking-wider uppercase">GOVT. OF INDIA</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-700 font-mono">Permanent Account Card</span>
              </div>
            </div>

            {/* Card Body */}
            <div className="mt-4 flex justify-between items-center gap-6">
              
              {/* Photo */}
              <div className="w-28 h-32 bg-white rounded-lg border border-slate-300 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                {formData.photo ? (
                  <img src={formData.photo} alt="PAN Photo" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-slate-300" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 space-y-2 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Name / नाम</span>
                  <strong className="text-sm font-bold text-slate-900 block">{formData.name}</strong>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Father's Name / पिता का नाम</span>
                  <span className="font-semibold text-slate-800 block">{formData.fatherName}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Date of Birth / जन्म तिथि</span>
                  <span className="font-semibold text-slate-800 block">{formData.dob}</span>
                </div>
              </div>

              {/* PAN Number & QR */}
              <div className="flex flex-col items-end justify-between h-32 flex-shrink-0">
                <div className="w-16 h-16 bg-white border border-slate-300 p-1 rounded flex items-center justify-center shadow-inner">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Permanent Account Number</span>
                  <span className="text-lg font-black text-slate-900 font-mono tracking-widest bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                    {formData.idNumber}
                  </span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TEMPLATE 3: DRIVING LICENCE (UNION OF INDIA)                               */}
        {/* ========================================================================= */}
        {cardType === 'dl' && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border-2 border-emerald-300 overflow-hidden font-sans text-slate-900 select-none p-6">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b-2 border-emerald-500">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase">UNION OF INDIA DRIVING LICENCE</h3>
                <h4 className="text-[10px] font-bold text-emerald-800">TRANSPORT DEPARTMENT</h4>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 font-mono">FORM 7 (RULE 16(2))</span>
              </div>
            </div>

            {/* DL Body */}
            <div className="mt-4 flex justify-between items-start gap-6">
              
              {/* Photo & Signature */}
              <div className="flex flex-col items-center space-y-2 flex-shrink-0">
                <div className="w-28 h-32 bg-slate-100 rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
                  {formData.photo ? (
                    <img src={formData.photo} alt="DL Photo" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-slate-300" />
                  )}
                </div>
                <div className="w-28 h-8 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-[9px] font-cursive text-slate-500">
                  Cardholder Signature
                </div>
              </div>

              {/* DL Details */}
              <div className="flex-1 space-y-2 text-xs">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Licence Number</span>
                  <span className="text-sm font-black text-sky-800 font-mono">{formData.idNumber}</span>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Name</span>
                  <span className="font-bold text-slate-900 block">{formData.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Date of Birth</span>
                    <span className="font-semibold text-slate-800">{formData.dob}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Valid Until</span>
                    <span className="font-semibold text-emerald-800">{formData.validUntil}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Address</span>
                  <p className="text-[11px] text-slate-700 leading-tight font-medium">{formData.address}</p>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
}
