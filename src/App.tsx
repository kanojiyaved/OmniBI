import React, { useState } from 'react';
import { useAppStore } from './store/useAppStore';
import { CollapsibleSidebar } from './components/layout/CollapsibleSidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { StatusBar } from './components/layout/StatusBar';
import { UploadModal } from './components/upload/UploadModal';
import { AiChatDrawer } from './components/chat/AiChatDrawer';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { DataImportPage } from './pages/DataImportPage';
import { DataExplorerPage } from './pages/DataExplorerPage';
import { DealManagementPage } from './pages/DealManagementPage';
import { CampaignManagementPage } from './pages/CampaignManagementPage';
import { ReportsPage } from './pages/ReportsPage';
import { SalesPipelinePage } from './pages/SalesPipelinePage';
import { CalendarPage } from './pages/CalendarPage';
import { ContactsPage } from './pages/ContactsPage';
import { GoalsPage } from './pages/GoalsPage';
import { AiAnalystPage } from './pages/AiAnalystPage';
import { SettingsPage } from './pages/SettingsPage';

import { SAMPLE_DATASETS } from './data/sampleDatasets';
import { parseCSVContent } from './core/parser/csvParser';

export const App: React.FC = () => {
  const { addDataset, setChatOpen } = useAppStore();

  const [currentPath, setCurrentPath] = useState<string>('/');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const handleLoadSample = (sampleId: string) => {
    const sample = SAMPLE_DATASETS.find((s) => s.id === sampleId) || SAMPLE_DATASETS[0];
    const parsed = parseCSVContent(sample.csvContent);

    addDataset({
      id: `ds-${Date.now()}`,
      name: sample.name,
      fileName: `${sample.domain}-metrics.csv`,
      fileFormat: 'csv',
      fileSize: sample.csvContent.length,
      uploadedAt: new Date().toISOString(),
      rowCount: parsed.data.length,
      columnCount: parsed.columns.length,
      columns: parsed.columns,
      data: parsed.data,
      availableSheets: ['Sheet1'],
      activeSheet: 'Sheet1',
      processingStatus: 'ready',
      profiles: {},
      quality: {
        overallScore: 94,
        totalRows: parsed.data.length,
        totalColumns: parsed.columns.length,
        duplicateRowsCount: 0,
        missingCellsCount: 0,
        missingDataPercentage: 0,
        anomaliesDetected: [],
      },
      detectedDomain: {
        domain: sample.domain as any,
        confidence: 0.95,
        reasoning: ['Benchmark sample dataset initialized'],
        domainLabel: sample.domain.toUpperCase(),
      },
      semanticMappings: {},
    });

    setCurrentPath('/explorer');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex antialiased font-sans overflow-x-hidden selection:bg-purple-500/20 selection:text-purple-900">
      {/* Collapsible Sidebar */}
      <CollapsibleSidebar
        currentPath={currentPath}
        onNavigate={(path) => setCurrentPath(path)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar
          currentPath={currentPath}
          onNavigate={(path) => setCurrentPath(path)}
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenAiAnalyst={() => setChatOpen(true)}
        />

        {/* Dynamic Route Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto w-full">
            {currentPath === '/' && (
              <OverviewPage
                onOpenImport={() => setIsUploadModalOpen(true)}
                onOpenAi={() => setCurrentPath('/ai-analyst')}
              />
            )}
            {currentPath === '/import' && (
              <DataImportPage
                onOpenUploadModal={() => setIsUploadModalOpen(true)}
                onLoadSample={handleLoadSample}
              />
            )}
            {currentPath === '/explorer' && <DataExplorerPage />}
            {currentPath === '/deals' && <DealManagementPage />}
            {currentPath === '/campaigns' && <CampaignManagementPage />}
            {currentPath === '/reports' && <ReportsPage />}
            {currentPath === '/pipeline' && <SalesPipelinePage />}
            {currentPath === '/calendar' && <CalendarPage />}
            {currentPath === '/contacts' && <ContactsPage />}
            {currentPath === '/goals' && <GoalsPage />}
            {currentPath === '/ai-analyst' && <AiAnalystPage />}
            {currentPath === '/settings' && <SettingsPage />}
          </div>
        </main>

        {/* Global Status Bar */}
        <StatusBar />
      </div>

      {/* Universal Upload Engine Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onDatasetLoaded={() => setCurrentPath('/explorer')}
      />

      {/* Global AI Copilot Slide-out Drawer */}
      <AiChatDrawer onNavigateToFullPage={() => setCurrentPath('/ai-analyst')} />
    </div>
  );
};

export default App;
