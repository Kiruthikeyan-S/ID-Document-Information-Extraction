import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, FileCheck, ArrowRight } from 'lucide-react';

export default function UploadZone({ onFileSelected, selectedFile, onClear, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, JPEG, PNG).');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClear();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        accept="image/png,image/jpeg,image/jpg"
        className="hidden"
      />

      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center ${
            isDragOver
              ? 'border-sky-500 bg-sky-500/5 scale-[1.01]'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/70'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Drop your ID Document image here, or <span className="text-sky-400 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4 max-w-sm">
            Supports Indian <strong>Aadhaar Card</strong>, <strong>PAN Card</strong>, and <strong>Driving Licence</strong> (JPG, JPEG, PNG).
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-slate-500 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
            <span>🔒 Images are processed in-memory and never stored on disk.</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-950/60 border border-slate-800 rounded-xl gap-4">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Upload preview"
                className="w-16 h-16 object-cover rounded-lg border border-slate-700 shadow-md flex-shrink-0"
              />
            )}
            <div className="overflow-hidden">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-sm font-medium text-white truncate max-w-xs">{selectedFile.name}</p>
              </div>
              <p className="text-xs text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB • Ready for extraction</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition disabled:opacity-50"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-medium transition disabled:opacity-50"
            >
              Change File
            </button>
          </div>
        </div>
      )}

      {/* Supported Documents Badges */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span className="font-medium text-slate-300">Supported Formats:</span>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-md bg-blue-950/60 text-blue-300 border border-blue-800/50 font-medium text-[11px]">
            🆔 Aadhaar Card
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-950/60 text-amber-300 border border-amber-800/50 font-medium text-[11px]">
            💳 PAN Card
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 font-medium text-[11px]">
            🚗 Driving Licence
          </span>
        </div>
      </div>

    </div>
  );
}
