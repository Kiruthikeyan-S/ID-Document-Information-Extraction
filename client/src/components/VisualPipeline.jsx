import React, { useState } from 'react';
import { Layers, ZoomIn, Eye } from 'lucide-react';

export default function VisualPipeline({ images }) {
  const [activeZoomImage, setActiveZoomImage] = useState(null);

  if (!images || (!images.original && !images.preprocessed && !images.annotated)) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Layers className="w-8 h-8 mx-auto mb-2 text-slate-500" />
        <p className="text-sm">No visual pipeline images available for this document.</p>
      </div>
    );
  }

  const steps = [
    { key: 'original', title: '1. Original Uploaded Image', desc: 'Raw uncompressed card scan' },
    { key: 'preprocessed', title: '2. OpenCV Preprocessed', desc: 'Grayscale + Glare + CLAHE Contrast' },
    { key: 'annotated', title: '3. OCR Bounding Box Overlay', desc: 'Color-coded coordinates & confidence %' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Image Processing & OCR Detection Pipeline</span>
          </h3>
          <p className="text-xs text-slate-400">Step-by-step visual transformation from raw photo to bounding boxes</p>
        </div>
      </div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {steps.map((step) => {
          const imgUrl = images[step.key];
          return (
            <div key={step.key} className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col">
              <div className="mb-2">
                <span className="text-xs font-bold text-slate-200 block">{step.title}</span>
                <span className="text-[10px] text-slate-400">{step.desc}</span>
              </div>
              <div 
                className="relative group rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 aspect-[16/10] flex items-center justify-center cursor-pointer"
                onClick={() => imgUrl && setActiveZoomImage({ url: imgUrl, title: step.title })}
              >
                {imgUrl ? (
                  <>
                    <img src={imgUrl} alt={step.title} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold shadow-lg">
                        <ZoomIn className="w-3.5 h-3.5" />
                        <span>Enlarge</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-slate-600">Not Available</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Zoom Popup */}
      {activeZoomImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveZoomImage(null)}
        >
          <div 
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-4 overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white">{activeZoomImage.title}</h4>
              <button 
                onClick={() => setActiveZoomImage(null)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              >
                Close (ESC)
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center">
              <img src={activeZoomImage.url} alt="Enlarged preview" className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
