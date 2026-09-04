import React, { useState } from 'react';
import { Send, DollarSign, User, ShieldCheck, X, Check, Edit3 } from 'lucide-react';

export default function ChatModal({
  project,
  messages,
  currentUserRole,
  onSendMessage,
  onEditBudget,
  onClose
}) {
  const [msgText, setMsgText] = useState('');
  const [showBudgetInput, setShowBudgetInput] = useState(false);
  const [proposedBudget, setProposedBudget] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!msgText.trim()) return;
    onSendMessage({
      project_id: project?.id,
      sender_name: currentUserRole === 'OWNER' ? 'Admin (Aura Studio)' : currentUserRole === 'EMPLOYEE' ? 'Alex Rivera (Frontend)' : 'Lisa Ray (Client)',
      sender_role: currentUserRole,
      message: msgText,
      budget_proposal: proposedBudget ? parseFloat(proposedBudget) : null
    });
    setMsgText('');
    setProposedBudget('');
    setShowBudgetInput(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl h-[600px] glass-panel bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <span className="text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">
              LIVE PROJECT COLLABORATION
            </span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {project ? project.title : 'Project Chat'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => {
            const isMe = m.sender_role === currentUserRole;
            return (
              <div
                key={idx}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {m.sender_name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-semibold uppercase">
                    {m.sender_role}
                  </span>
                </div>

                <div
                  className={`max-w-md p-4 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <p>{m.message}</p>
                  
                  {/* Budget Edit Proposal Card in Chat */}
                  {m.budget_proposal && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold">Proposed Budget Adjustment:</span>
                        <div className="text-lg font-black">${m.budget_proposal}</div>
                      </div>
                      {currentUserRole === 'CLIENT' && (
                        <button
                          onClick={() => onEditBudget(project?.id, m.budget_proposal)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow flex items-center space-x-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accept & Update Budget</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col space-y-2">
          {showBudgetInput && (
            <div className="flex items-center space-x-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-900">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <input
                type="number"
                placeholder="Propose new budget amount..."
                value={proposedBudget}
                onChange={(e) => setProposedBudget(e.target.value)}
                className="w-full text-xs bg-transparent focus:outline-none text-slate-900 dark:text-white"
              />
            </div>
          )}

          <div className="flex items-center space-x-2">
            {currentUserRole === 'OWNER' && (
              <button
                type="button"
                onClick={() => setShowBudgetInput(!showBudgetInput)}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-colors flex items-center space-x-1 ${
                  showBudgetInput
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
                title="Propose Budget Adjustment"
              >
                <DollarSign className="w-4 h-4" />
              </button>
            )}

            <input
              type="text"
              placeholder="Type message to team..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md flex items-center space-x-1"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
