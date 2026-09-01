import React, { useState } from 'react';
import { Play, Star, ArrowUpRight, Code, Eye, Sparkles } from 'lucide-react';

export default function TemplateCard3D({ template, onPreviewVideo, onOrderTemplate }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-3xl glass-card-3d p-4 overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
    >
      {/* Video Preview / Image Hero Thumbnail */}
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-inner group-hover:shadow-2xl transition-all duration-300">
        
        {/* Video / Preview Element */}
        <video
          src={template.preview_video_url}
          muted
          loop
          playsInline
          autoPlay={isHovered}
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            isHovered ? 'scale-105 opacity-90' : 'scale-100 opacity-75'
          }`}
        />

        {/* Overlay Badges */}
        <div className="absolute top-3 left-3 flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur-md border border-white/20 shadow-sm">
            {template.category}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400/90 text-slate-900 backdrop-blur-md flex items-center space-x-1">
            <Star className="w-3 h-3 fill-slate-900" />
            <span>{template.rating}</span>
          </span>
        </div>

        {/* Price Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-600 text-white backdrop-blur-md shadow-md">
            ${template.price}
          </span>
        </div>

        {/* Video Play Trigger Center Button */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onPreviewVideo(template)}
            className="w-12 h-12 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform"
            title="Watch HD Video Demo"
          >
            <Play className="w-5 h-5 fill-indigo-600 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Details Body */}
      <div className="pt-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {template.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* Tags */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.split(',').map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            >
              {tag.trim()}
            </span>
          ))}
        </div>

        {/* Card Footer Actions */}
        <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onPreviewVideo(template)}
            className="flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Video Demo</span>
          </button>

          <button
            onClick={() => onOrderTemplate(template)}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-indigo-600 dark:hover:bg-indigo-400 dark:hover:text-white transition-all shadow-sm"
          >
            <span>Order Template</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
