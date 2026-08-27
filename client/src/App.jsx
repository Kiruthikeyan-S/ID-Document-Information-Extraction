import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import UploadZone from './components/UploadZone';
import SettingsPanel from './components/SettingsPanel';
import ResultsView from './components/ResultsView';
import VisualPipeline from './components/VisualPipeline';
import JsonViewer from './components/JsonViewer';
import HistoryDrawer from './components/HistoryDrawer';
import { extractDocumentApi, getHealthApi } from './services/api';
import { Sparkles, Eye, FileText, Code, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [settings, setSettings] = useState({
    model_name: 'openai/gpt-oss-120b',
    psm_mode: 11,
    min_confidence: 25,
    enable_glare: true,
    enable_clahe: true,
    enable_denoise: true,
    enable_threshold: false,
    threshold_method: 'otsu',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('fields');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  useEffect(() => {
    getHealthApi()
      .then((data) => {
        setIsDbConnected(!!data.database_connected);
      })
      .catch(() => {
        setIsDbConnected(false);
      });
  }, []);

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await extractDocumentApi(selectedFile, settings);
      setExtractionResult(result);
      setActiveTab('fields');
    } catch (err) {
      console.error('Extraction failed:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to extract document.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setExtractionResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      
      {/* Navigation */}
      <Navbar
        onToggleHistory={() => setIsHistoryOpen(true)}
        isConnected={isDbConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Upload & Settings Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Upload Zone (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            <UploadZone
              onFileSelected={(file) => {
                setSelectedFile(file);
                setExtractionResult(null);
                setErrorMessage(null);
              }}
              selectedFile={selectedFile}
              onClear={handleClear}
              isLoading={isLoading}
            />

            {/* Run Extraction Button */}
            {selectedFile && (
              <button
                onClick={handleExtract}
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Image (OpenCV → Tesseract OCR → Decision Gate → Groq)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Extract Document Information</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

          {/* Engine Settings (1 Column) */}
          <div className="lg:col-span-1">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
            />
          </div>

        </div>

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start space-x-3 text-rose-300">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white">Extraction Request Failed</h4>
              <p className="text-xs text-rose-200 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Results Dashboard */}
        {extractionResult && (
          <div className="space-y-4 animate-in fade-in-50 duration-300">
            
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-800 space-x-2">
              <button
                onClick={() => setActiveTab('fields')}
                className={`flex items-center space-x-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 ${
                  activeTab === 'fields'
                    ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Extracted Fields</span>
              </button>

              <button
                onClick={() => setActiveTab('pipeline')}
                className={`flex items-center space-x-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 ${
                  activeTab === 'pipeline'
                    ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" />
                <span>Visual Pipeline</span>
              </button>

              <button
                onClick={() => setActiveTab('ocr')}
                className={`flex items-center space-x-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 ${
                  activeTab === 'ocr'
                    ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Raw OCR Text</span>
              </button>

              <button
                onClick={() => setActiveTab('json')}
                className={`flex items-center space-x-2 py-2.5 px-4 rounded-t-xl text-xs font-bold transition border-b-2 ${
                  activeTab === 'json'
                    ? 'border-sky-500 text-sky-400 bg-slate-900/80'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-4 h-4" />
                <span>JSON Payload</span>
              </button>
            </div>

            {/* Tab 1: Extracted Fields Card */}
            {activeTab === 'fields' && (
              <ResultsView result={extractionResult} />
            )}

            {/* Tab 2: Visual Pipeline Gallery */}
            {activeTab === 'pipeline' && (
              <VisualPipeline images={extractionResult.images} />
            )}

            {/* Tab 3: Raw OCR & Spatial Text */}
            {activeTab === 'ocr' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div>
                  <h3 className="text-base font-bold text-white">OCR Extracted Text & Line Sequences</h3>
                  <p className="text-xs text-slate-400">Direct output from Tesseract OCR before Groq LLM parsing</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 max-h-[400px] overflow-auto">
                  <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                    {extractionResult.raw_ocr_text || 'No text detected.'}
                  </pre>
                </div>
              </div>
            )}

            {/* Tab 4: JSON Viewer */}
            {activeTab === 'json' && (
              <JsonViewer
                data={extractionResult}
                fileName={`${extractionResult.document_type}_${selectedFile?.name.replace(/\.[^/.]+$/, '')}`}
              />
            )}

          </div>
        )}

      </main>

      {/* History Slide-out Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectDocument={(doc) => {
          setExtractionResult(doc);
          setActiveTab('fields');
        }}
      />

    </div>
  );
}
