import React from 'react';
import { X, ExternalLink, ShieldCheck, CheckCircle } from 'lucide-react';

export default function VideoPreviewModal({ item, onClose, onOrder }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl glass-panel bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-[10px] font-extrabold tracking-widest uppercase text-indigo-600 dark:text-indigo-400">
              {item.category || 'HD DEMO PREVIEW'}
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {item.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player */}
        <div className="relative aspect-video bg-black">
          <video
            src={item.preview_video_url || item.video_demo_url}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Modal Footer / Info */}
        <div className="p-6 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
              {item.description || "Developer submitted video deliverable proof verified by Aura Studio automated quality inspection."}
            </p>
            {item.price && (
              <div className="mt-2 text-lg font-black text-indigo-600 dark:text-indigo-400">
                Price: ${item.price} <span className="text-xs font-medium text-slate-500">(Includes 30% advance start)</span>
              </div>
            )}
          </div>

          {onOrder && item.price && (
            <button
              onClick={() => {
                onOrder(item);
                onClose();
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all flex items-center space-x-2"
            >
              <span>Initialize Order</span>
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
