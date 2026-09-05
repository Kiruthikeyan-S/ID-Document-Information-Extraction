import React, { useState, useMemo } from 'react';
import { Copy, Check, Download, Code2, FileCode } from 'lucide-react';

export default function JsonViewer({ data, fileName }) {
  const [copied, setCopied] = useState(false);
  const [showFullImages, setShowFullImages] = useState(false);

  // Safely parse data whether it's an object or a JSON string
  const cleanData = useMemo(() => {
    if (!data) return null;
    let parsed = data;
    if (typeof data === 'string') {
      try {
        parsed = JSON.parse(data);
      } catch (e) {
        parsed = { rawText: data };
      }
    }

    // Create a copy for display
    const obj = JSON.parse(JSON.stringify(parsed));

    // Summarize heavy base64 image strings unless full images toggled
    if (!showFullImages && obj.images && typeof obj.images === 'object') {
      Object.keys(obj.images).forEach(key => {
        if (typeof obj.images[key] === 'string' && obj.images[key].startsWith('data:image')) {
          obj.images[key] = `[Base64 Image Data — ${Math.round(obj.images[key].length / 1024)} KB]`;
        }
      });
    }

    return obj;
  }, [data, showFullImages]);

  if (!data) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center text-slate-500 shadow-sm">
        <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium">No JSON payload available for this document.</p>
      </div>
    );
  }

  const jsonString = JSON.stringify(cleanData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(cleanData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(cleanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName || 'document_extraction'}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm space-y-0">
      {/* Header with actions */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 text-white">
          <Code2 className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-xs font-bold tracking-wide uppercase text-slate-200">Structured JSON Output Payload</h3>
            <p className="text-[11px] text-slate-400">Validated response ready for Core Banking / API integration</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {data?.images && (
            <button
              type="button"
              onClick={() => setShowFullImages(prev => !prev)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
            >
              {showFullImages ? 'Hide Base64 Images' : 'Show Full Base64'}
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .json</span>
          </button>
        </div>
      </div>

      {/* Formatted Code Box in Dark Console Theme */}
      <div className="bg-[#0f172a] p-5 overflow-auto max-h-[550px] font-mono text-xs leading-relaxed text-slate-200 border-t border-slate-800">
        <pre className="whitespace-pre-wrap break-all select-all">
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
