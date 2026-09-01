import React, { useState } from 'react';
import { X, Plus, Video, Sparkles } from 'lucide-react';

export default function AddTemplateModal({ isOpen, onClose, onAddTemplate }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('3D WebGL');
  const [price, setPrice] = useState(3200);
  const [description, setDescription] = useState('');
  const [previewVideoUrl, setPreviewVideoUrl] = useState('https://assets.mixkit.co/videos/preview/mixkit-cyber-monday-shopping-animation-41484-large.mp4');
  const [tags, setTags] = useState('React, Three.js, Lenis, GSAP');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) return;
    onAddTemplate({
      title,
      category,
      price: parseFloat(price),
      description,
      preview_video_url: previewVideoUrl,
      tags,
      rating: 4.9,
      downloads_count: 1
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg glass-panel bg-white dark:bg-slate-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span>Add New 3D / SaaS Template</span>
          </h2>
          <button onClick={onClose} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Template Title</label>
            <input
              type="text"
              placeholder="e.g. Lusion SSAO Interactive Portal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border font-semibold"
              >
                <option value="3D WebGL">3D WebGL</option>
                <option value="SaaS Platform">SaaS Platform</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Mobile App">Mobile App</option>
                <option value="AI & ML">AI & ML</option>
                <option value="Fintech">Fintech</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300">Price ($)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Preview Video URL</label>
            <input
              type="text"
              value={previewVideoUrl}
              onChange={(e) => setPreviewVideoUrl(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Tags (Comma Separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 dark:text-slate-300">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border"
              required
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 font-bold">
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-extrabold shadow">
              Publish Template
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
