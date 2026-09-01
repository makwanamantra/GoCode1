import React, { useState, useEffect } from 'react';
import LenisScrollProvider from './components/LenisScrollProvider';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingView from './views/LandingView';
import OwnerDashboard from './views/OwnerDashboard';
import EmployeeDashboard from './views/EmployeeDashboard';
import ClientDashboard from './views/ClientDashboard';
import VideoPreviewModal from './components/VideoPreviewModal';
import ChatModal from './components/ChatModal';
import CustomRequestModal from './components/CustomRequestModal';
import AddTemplateModal from './components/AddTemplateModal';

import { fetchFromAPI, apiPostStrict } from './services/apiService';
import { useVisitorTracking } from './hooks/useVisitorTracking';
import { BRAND } from './config/brand';

// Views each role is permitted to render. Anything else falls back to landing.
const ALLOWED_VIEWS = {
  OWNER: ['landing', 'owner'],
  EMPLOYEE: ['landing', 'employee'],
  CLIENT: ['landing', 'client'],
};

const HOME_VIEW = { OWNER: 'owner', EMPLOYEE: 'employee', CLIENT: 'client' };

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

function AppShell() {
  const { user, role, isAuthenticated, ready } = useAuth();
  useVisitorTracking(user);
  const [darkMode, setDarkMode] = useState(false);
  const [activeView, setActiveView] = useState('landing'); // 'landing', 'owner', 'employee', 'client'
  const currentUserRole = role || 'CLIENT';

  // Application Data States
  const [templates, setTemplates] = useState([]);
  const [customRequests, setCustomRequests] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [deliverables, setDeliverables] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Active Modals
  const [activeVideoItem, setActiveVideoItem] = useState(null);
  const [activeChatProjectTitle, setActiveChatProjectTitle] = useState(null);
  const [isCustomRequestOpen, setIsCustomRequestOpen] = useState(false);
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);

  // Sync Dark Class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Send each role to its own workspace on sign-in and block cross-role views.
  useEffect(() => {
    if (!role) return;
    setActiveView((prev) =>
      ALLOWED_VIEWS[role].includes(prev) && prev !== 'landing' ? prev : HOME_VIEW[role]
    );
  }, [role]);

  // Load Data from Django API (with rich fallback)
  useEffect(() => {
    async function loadInitialData() {
      const tmplRes = await fetchFromAPI('templates/');
      if (tmplRes && Array.isArray(tmplRes.results || tmplRes)) {
        setTemplates(tmplRes.results || tmplRes);
      } else {
        // Generate 50 fallback templates
        const sampleTmpls = [];
        const cats = ['3D WebGL', 'SaaS Platform', 'E-Commerce', 'Mobile App', 'AI & ML', 'Fintech', 'Creative Portfolio'];
        const vids = [
          'https://assets.mixkit.co/videos/preview/mixkit-cyber-monday-shopping-animation-41484-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-digital-animation-screens-of-a-data-center-40010-large.mp4',
          'https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-hud-display-42875-large.mp4'
        ];
        for (let i = 1; i <= 50; i++) {
          sampleTmpls.push({
            id: i,
            title: `Aura Production Engine Template #${i}`,
            category: cats[i % cats.length],
            description: "High performance 3D WebGL template built with R3F, Lenis smooth scroll inertia, and Django backend.",
            price: 2800 + (i * 45),
            preview_video_url: vids[i % vids.length],
            tags: "React, Three.js, Lenis, Django",
            rating: 4.9,
            downloads_count: 120 + i
          });
        }
        setTemplates(sampleTmpls);
      }

      const reqRes = await fetchFromAPI('custom-requests/');
      if (reqRes && Array.isArray(reqRes.results || reqRes)) {
        setCustomRequests(reqRes.results || reqRes);
      } else {
        setCustomRequests([
          {
            id: 1,
            title: "Custom WebGL Interactive Car Showroom",
            category: "3D WebGL",
            description: "Need a high-performance 3D WebGL configurator for custom vehicles with custom paint shaders.",
            user_budget: 5000,
            admin_proposed_price: 5500,
            status: "ADMIN_OFFER"
          }
        ]);
      }

      const projRes = await fetchFromAPI('projects/');
      if (projRes && Array.isArray(projRes.results || projRes)) {
        setProjects(projRes.results || projRes);
      } else {
        setProjects([
          {
            id: 1,
            title: "Horizon Crypto Liquidity Dashboard",
            description: "Decentralized liquidity pool tracking system with WebGL animations and Django backend.",
            total_budget: 7200,
            advance_paid: true,
            advance_amount: 2160,
            status: "IN_PROGRESS"
          },
          {
            id: 2,
            title: "Acme Lusion 3D Brand Portal",
            description: "Luxury interactive 3D brand portal built with Lenis smooth scroll.",
            total_budget: 3499,
            advance_paid: true,
            advance_amount: 1049.7,
            status: "COMPLETED"
          }
        ]);
      }

      const taskRes = await fetchFromAPI('tasks/');
      if (taskRes && Array.isArray(taskRes.results || taskRes)) {
        setTasks(taskRes.results || taskRes);
      } else {
        setTasks([
          {
            id: 1,
            project: 1,
            role_type: 'FRONTEND',
            title: "Implement R3F 3D Liquidity Particle System",
            description: "Create interactive 3D node network graph using @react-three/fiber and Lenis smooth scroll inertia.",
            assigned_employee_name: "Alex Rivera",
            payout: 1500,
            status: "IN_PROGRESS"
          },
          {
            id: 2,
            project: 1,
            role_type: 'BACKEND',
            title: "Django REST API & WebSocket Feed Setup",
            description: "Configure Django REST viewsets and payment calculations.",
            assigned_employee_name: "Sarah Chen",
            payout: 1800,
            status: "COMPLETED"
          }
        ]);
      }

      const delivRes = await fetchFromAPI('deliverables/');
      if (delivRes && Array.isArray(delivRes.results || delivRes)) {
        setDeliverables(delivRes.results || delivRes);
      } else {
        setDeliverables([
          {
            id: 1,
            project: 1,
            title: "Django Core REST APIs & Database Schemas v1.0",
            uploaded_by_name: "Sarah Chen (Backend)",
            code_url: "https://github.com/agency/horizon-backend",
            video_demo_url: "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-screens-of-a-data-center-40010-large.mp4",
            status: "APPROVED"
          }
        ]);
      }

      const anaRes = await fetchFromAPI('analytics/');
      if (anaRes) {
        setAnalytics(anaRes);
      } else {
        setAnalytics({
          total_gross_revenue: 12859,
          total_developer_payouts: 6300,
          net_agency_profit: 6559,
          employee_rankings: [
            { username: 'alex_frontend', sub_role: 'FRONTEND', total_earned: 4200, completed_tasks_count: 5 },
            { username: 'sarah_backend', sub_role: 'BACKEND', total_earned: 5800, completed_tasks_count: 7 },
            { username: 'david_uiux', sub_role: 'UIUX', total_earned: 3900, completed_tasks_count: 4 }
          ]
        });
      }

      setChatMessages([
        { sender_name: 'Admin (Aura Studio)', sender_role: 'OWNER', message: 'Welcome Lisa! We assigned Sarah (Backend) and Alex (Frontend) to your project.' },
        { sender_name: 'Lisa Ray', sender_role: 'CLIENT', message: 'Thanks Admin! Looking forward to seeing the 3D WebGL particle node renders.' }
      ]);

      setAuditLogs([
        { action: 'System Seeded', details: 'Pre-populated 50+ templates & sample projects.', timestamp: new Date().toISOString() },
        { action: '30% Advance Deposit Paid', details: 'Client paid $2160 advance for Horizon Crypto Liquidity Dashboard.', timestamp: new Date().toISOString() }
      ]);
    }

    loadInitialData();
  }, []);

  // Handlers
  const handleOrderTemplate = (template) => {
    const newProj = {
      id: Date.now(),
      title: template.title,
      description: template.description,
      total_budget: template.price,
      advance_paid: false,
      advance_amount: template.price * 0.3,
      status: 'IN_PROGRESS'
    };
    setProjects([newProj, ...projects]);
    setActiveView('client');
  };

  const handleAdminRespondRequest = async (reqId, proposedPrice, predictedDate, action) => {
    try {
      const res = await apiPostStrict(`custom-requests/${reqId}/admin_respond/`, {
        action,
        proposed_price: proposedPrice,
        predicted_date: predictedDate,
      });
      // Backend returns { status, request: <updated CustomRequest> }
      const updated = res?.request;
      setCustomRequests(customRequests.map(r => (r.id === reqId ? { ...r, ...updated } : r)));
    } catch (err) {
      console.error('Failed to send admin offer, falling back to local-only update.', err);
      window.alert(`Could not save this offer to the server (${err.message || 'network error'}). It will only be visible in this tab.`);
      setCustomRequests(customRequests.map(r => {
        if (r.id === reqId) {
          return { ...r, admin_proposed_price: parseFloat(proposedPrice), status: 'ADMIN_OFFER' };
        }
        return r;
      }));
    }
  };

  const handleAcceptAdminOffer = async (reqId) => {
    try {
      const res = await apiPostStrict(`custom-requests/${reqId}/client_accept/`, {});
      // Backend returns { status, project: <newly created Project> } and flips the request to APPROVED.
      const newProj = res?.project;
      if (newProj) setProjects([newProj, ...projects]);
      setCustomRequests(customRequests.map(r => (r.id === reqId ? { ...r, status: 'APPROVED' } : r)));
    } catch (err) {
      console.error('Failed to accept offer on the server, falling back to local-only project.', err);
      window.alert(`Could not confirm this on the server (${err.message || 'network error'}). Project shown here only, not saved.`);
      const req = customRequests.find(r => r.id === reqId);
      if (req) {
        const newProj = {
          id: Date.now(),
          title: req.title,
          description: req.description,
          total_budget: req.admin_proposed_price || req.user_budget,
          advance_paid: false,
          advance_amount: (req.admin_proposed_price || req.user_budget) * 0.3,
          status: 'IN_PROGRESS'
        };
        setProjects([newProj, ...projects]);
        setCustomRequests(customRequests.map(r => (r.id === reqId ? { ...r, status: 'APPROVED' } : r)));
      }
    }
  };

  const handlePayAdvance = (projectId) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, advance_paid: true } : p));
  };

  const handleCancelProject = (projectId) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: 'CANCELLED' } : p));
  };

  const handleEditBudget = (projectId, newBudget) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, total_budget: newBudget } : p));
  };

  const handleAssignTask = (newTask) => {
    setTasks([{ ...newTask, id: Date.now(), assigned_employee_name: 'Alex Rivera' }, ...tasks]);
  };

  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleSubmitDeliverable = (newDeliv) => {
    setDeliverables([{ ...newDeliv, id: Date.now(), uploaded_by_name: 'Alex Rivera (Frontend)' }, ...deliverables]);
  };

  const handleApproveCompletion = (projectId) => {
    setProjects(projects.map(p => p.id === projectId ? { ...p, status: 'COMPLETED' } : p));
  };

  const handleAddTemplate = (newTmpl) => {
    setTemplates([{ ...newTmpl, id: Date.now() }, ...templates]);
  };

  const handleSubmitCustomRequest = async (newReq) => {
    if (!user?.id) {
      return { ok: false, error: 'You must be signed in as a client to submit a request.' };
    }
    try {
      // CustomRequestSerializer uses fields = '__all__', so `client` is a required
      // writable field on the backend — it will 400 without this.
      const created = await apiPostStrict('custom-requests/', { ...newReq, client: user.id });
      setCustomRequests([created, ...customRequests]);
      setActiveView('client');
      return { ok: true };
    } catch (err) {
      console.error('Failed to save custom request to the server.', err);
      return { ok: false, error: err.message || 'Could not reach the server. Please try again.' };
    }
  };

  const handleSendChatMessage = (msgObj) => {
    setChatMessages([...chatMessages, msgObj]);
  };

  return (
    <LenisScrollProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
        
        {/* Navigation Header */}
        <Navbar
          activeView={activeView}
          setActiveView={setActiveView}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onOpenCustomRequestModal={() => setIsCustomRequestOpen(true)}
        />

        {/* View Router */}
        <main>
          {/* The landing page is public: visitors browse it and sign in / sign up inline. */}
          {(!isAuthenticated || activeView === 'landing') && (
            <LandingView
              templates={templates}
              onPreviewVideo={(t) => setActiveVideoItem(t)}
              onOrderTemplate={handleOrderTemplate}
              onOpenCustomRequestModal={() => setIsCustomRequestOpen(true)}
            />
          )}

          {isAuthenticated && activeView === 'owner' && role === 'OWNER' && (
            <OwnerDashboard
              analytics={analytics}
              customRequests={customRequests}
              projects={projects}
              tasks={tasks}
              deliverables={deliverables}
              employees={[
                { id: 1, username: 'alex_frontend', profile: { sub_role: 'FRONTEND' } },
                { id: 2, username: 'sarah_backend', profile: { sub_role: 'BACKEND' } },
                { id: 3, username: 'david_uiux', profile: { sub_role: 'UIUX' } }
              ]}
              auditLogs={auditLogs}
              onAdminRespondRequest={handleAdminRespondRequest}
              onAssignTask={handleAssignTask}
              onApproveCompletion={handleApproveCompletion}
              onOpenChat={(pTitle) => setActiveChatProjectTitle(pTitle)}
              onAddTemplateModal={() => setIsAddTemplateOpen(true)}
            />
          )}

          {isAuthenticated && activeView === 'employee' && role === 'EMPLOYEE' && (
            <EmployeeDashboard
              tasks={tasks}
              deliverables={deliverables}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onSubmitDeliverable={handleSubmitDeliverable}
              onOpenChat={(pTitle) => setActiveChatProjectTitle(pTitle)}
            />
          )}

          {isAuthenticated && activeView === 'client' && role === 'CLIENT' && (
            <ClientDashboard
              customRequests={customRequests}
              projects={projects}
              deliverables={deliverables}
              onAcceptAdminOffer={handleAcceptAdminOffer}
              onPayAdvance={handlePayAdvance}
              onCancelProject={handleCancelProject}
              onEditBudget={handleEditBudget}
              onOpenCustomRequestModal={() => setIsCustomRequestOpen(true)}
              onOpenChat={(pTitle) => setActiveChatProjectTitle(pTitle)}
              onPreviewVideo={(item) => setActiveVideoItem(item)}
            />
          )}
        </main>

        {/* Global Footer */}
        <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-10 glass-panel">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 font-medium">
            <p className="font-bold text-slate-700 dark:text-slate-300">{BRAND.name} © 2026</p>
            <p className="mt-1">{BRAND.tagline}</p>
            <p className="mt-1">
              <a href={`mailto:${BRAND.email}`} className="hover:text-indigo-600">{BRAND.email}</a>
              {' · '}
              <a href={BRAND.phoneHref} className="hover:text-indigo-600">{BRAND.phone}</a>
            </p>
          </div>
        </footer>

        {/* Modals */}
        <VideoPreviewModal
          item={activeVideoItem}
          onClose={() => setActiveVideoItem(null)}
          onOrder={handleOrderTemplate}
        />

        {activeChatProjectTitle && (
          <ChatModal
            project={{ title: activeChatProjectTitle, id: 1 }}
            messages={chatMessages}
            currentUserRole={currentUserRole}
            onSendMessage={handleSendChatMessage}
            onEditBudget={handleEditBudget}
            onClose={() => setActiveChatProjectTitle(null)}
          />
        )}

        <CustomRequestModal
          isOpen={isCustomRequestOpen}
          onClose={() => setIsCustomRequestOpen(false)}
          onSubmitCustomRequest={handleSubmitCustomRequest}
        />

        <AddTemplateModal
          isOpen={isAddTemplateOpen}
          onClose={() => setIsAddTemplateOpen(false)}
          onAddTemplate={handleAddTemplate}
        />

      </div>
    </LenisScrollProvider>
  );
}
