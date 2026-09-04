import React, { useState } from 'react';
import Hero3DCanvas from '../components/Hero3DCanvas';
import TemplateCard3D from '../components/TemplateCard3D';
import AuthPanel from './AuthPanel';
import ResumeDownloadCard from './ResumeDownloadCard';
import { BRAND } from '../config/brand';
import { useAuth } from '../context/AuthContext';
import { Mail, Phone, Search, Sparkles, Filter, ShieldCheck, Zap, Layers, Play, CheckCircle } from 'lucide-react';

export default function LandingView({
  templates,
  onPreviewVideo,
  onOrderTemplate,
  onOpenCustomRequestModal
}) {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', '3D WebGL', 'SaaS Platform', 'E-Commerce', 'Mobile App', 'AI & ML', 'Fintech', 'Creative Portfolio'];

  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.tags.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="relative min-h-screen">
      
      {/* 3D WebGL Hero Canvas */}
      <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <Hero3DCanvas />

        {/* Hero Content Overlay (AstIsland & Codrops Inspired) */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-20">
          
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-indigo-200 dark:border-indigo-900/60 shadow-lg mb-8 animate-bounce">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold tracking-wide text-slate-800 dark:text-slate-200">
              codemantra — 3D Interactive WebGL Product Studio
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
            Build & Launch <span className="text-gradient">3D Web Apps</span> <br className="hidden sm:block"/>
            With Precision Engineering.
          </h1>

          <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-medium leading-relaxed">
            codemantra builds full-stack products: Django REST engineering paired with Lenis smooth scroll, Three.js motion and real developer task workflows.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => {
                const el = document.getElementById('templates-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-base shadow-xl shadow-indigo-500/25 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <Layers className="w-5 h-5" />
              <span>Explore 50+ Templates</span>
            </button>

            <button
              onClick={onOpenCustomRequestModal}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white font-extrabold text-base border border-slate-300 dark:border-slate-700 hover:border-indigo-500 transition-all flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Request Custom Project</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="p-4 rounded-2xl glass-panel text-center">
              <div className="text-2xl font-black text-slate-900 dark:text-white">50+</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">WebGL Templates</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel text-center">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">30%</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Advance Deposit</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel text-center">
              <div className="text-2xl font-black text-slate-900 dark:text-white">5 Days</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Money Back Guarantee</div>
            </div>
            <div className="p-4 rounded-2xl glass-panel text-center">
              <div className="text-2xl font-black text-emerald-500">60 FPS</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">R3F Smooth Motion</div>
            </div>
          </div>

        </div>
      </div>

      {/* Templates Catalog Section */}
      {/* Home-page authentication: visitors sign in or create an account here */}
      {!isAuthenticated && <AuthPanel />}

      {/* Resume access — admin approval gated */}
      <section className="px-4 py-12 max-w-3xl mx-auto">
        <ResumeDownloadCard />
      </section>

      {/* Contact */}
      <section className="px-4 pb-12 max-w-3xl mx-auto">
        <div className="p-6 rounded-3xl glass-panel bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Talk to {BRAND.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{BRAND.tagline}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
            <a href={`mailto:${BRAND.email}`} className="flex items-center gap-1.5 hover:text-indigo-600">
              <Mail className="w-4 h-4" /> {BRAND.email}
            </a>
            <a href={BRAND.phoneHref} className="flex items-center gap-1.5 hover:text-indigo-600">
              <Phone className="w-4 h-4" /> {BRAND.phone}
            </a>
          </div>
        </div>
      </section>

      <section id="templates-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-xs tracking-wider uppercase">
              <Sparkles className="w-4 h-4" />
              <span>CODROPS 3D MOTION GALLERY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-1">
              Curated Production Templates
            </h2>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, tag, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 3D Stack Motion Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredTemplates.map(template => (
            <TemplateCard3D
              key={template.id}
              template={template}
              onPreviewVideo={onPreviewVideo}
              onOrderTemplate={onOrderTemplate}
            />
          ))}
        </div>

      </section>
    </div>
  );
}
