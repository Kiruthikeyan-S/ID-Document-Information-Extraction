import React, { useState, useEffect } from 'react';
import { Sliders, Sparkles, Eye, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { getModelsApi } from '../services/api';

export default function SettingsPanel({ settings, onChange }) {
  const [models, setModels] = useState([
    'openai/gpt-oss-120b',
    'openai/gpt-oss-20b',
    'qwen/qwen3.6-27b',
    'groq/compound-mini',
    'llama-3.3-70b-versatile',
  ]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    getModelsApi()
      .then((data) => {
        if (data.models && data.models.length > 0) {
          setModels(data.models);
        }
      })
      .catch(() => {});
  }, []);

  const handleChange = (key, value) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      
      {/* Header toggle */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Extraction Engine Settings</h3>
            <p className="text-[11px] text-slate-400">Groq LLM model, OCR PSM mode, & image enhancements</p>
          </div>
        </div>
        <span className="text-xs font-medium text-sky-400 hover:text-sky-300">
          {isOpen ? "Hide Settings ▲" : "Customize Settings ▼"}
        </span>
      </div>

      {/* Collapsible Settings Area */}
      {isOpen && (
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Groq Model */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              <span>Groq Model</span>
            </label>
            <select
              value={settings.model_name || 'openai/gpt-oss-120b'}
              onChange={(e) => handleChange('model_name', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
            >
              {models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Tesseract PSM Mode */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tesseract PSM Mode</span>
            </label>
            <select
              value={settings.psm_mode || 11}
              onChange={(e) => handleChange('psm_mode', parseInt(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 transition"
            >
              <option value={11}>11 - Sparse Text (Recommended for ID cards)</option>
              <option value={3}>3 - Fully Automatic Segmentation</option>
              <option value={4}>4 - Single Column Variable Text</option>
              <option value={6}>6 - Single Uniform Block of Text</option>
            </select>
          </div>

          {/* 3. Min OCR Confidence Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 font-medium">Min Confidence:</span>
              <span className="text-sky-400 font-semibold">{settings.min_confidence || 25}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={settings.min_confidence || 25}
              onChange={(e) => handleChange('min_confidence', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
          </div>

          {/* 4. Preprocessing Toggles */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300 block">OpenCV Filters</span>
            <div className="flex flex-wrap gap-2 text-xs">
              <label className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_glare ?? true}
                  onChange={(e) => handleChange('enable_glare', e.target.checked)}
                  className="rounded bg-slate-800 text-sky-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">Glare Reducer</span>
              </label>

              <label className="flex items-center space-x-1.5 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enable_clahe ?? true}
                  onChange={(e) => handleChange('enable_clahe', e.target.checked)}
                  className="rounded bg-slate-800 text-sky-500 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">CLAHE Contrast</span>
              </label>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
