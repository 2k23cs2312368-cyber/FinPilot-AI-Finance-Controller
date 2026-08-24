import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function Layout({
  children,
  currentTab,
  onSelectTab,
  counts = {},
  businessName,
  aiEngineStatus,
  onSeedData,
  isSeeding
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        counts={counts}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        <Header
          businessName={businessName}
          aiEngineStatus={aiEngineStatus}
          onSeedData={onSeedData}
          isSeeding={isSeeding}
          pendingApprovalsCount={counts.pending_approvals_count}
          onOpenNotifications={() => onSelectTab('approvals')}
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
