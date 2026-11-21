import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CollapsibleSidebar, SIDEBAR_ITEMS } from '../components/layout/CollapsibleSidebar';
import { TopNavbar } from '../components/layout/TopNavbar';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { KPICard } from '../components/ui/KPICard';
import { ChartCard } from '../components/ui/ChartCard';
import { DataTable } from '../components/ui/DataTable';
import { Dropdown } from '../components/ui/Dropdown';
import { ProgressIndicator } from '../components/ui/ProgressIndicator';
import { DatePicker } from '../components/ui/DatePicker';
import { FilterComponent } from '../components/ui/FilterComponent';
import { EmptyState } from '../components/ui/EmptyState';

// Pages
import { OverviewPage } from '../pages/OverviewPage';
import { DataImportPage } from '../pages/DataImportPage';
import { DataExplorerPage } from '../pages/DataExplorerPage';
import { DealManagementPage } from '../pages/DealManagementPage';
import { CampaignManagementPage } from '../pages/CampaignManagementPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SalesPipelinePage } from '../pages/SalesPipelinePage';
import { CalendarPage } from '../pages/CalendarPage';
import { ContactsPage } from '../pages/ContactsPage';
import { GoalsPage } from '../pages/GoalsPage';
import { AiAnalystPage } from '../pages/AiAnalystPage';
import { SettingsPage } from '../pages/SettingsPage';

describe('Stage 1: Premium SaaS UI/UX Design System Validation', () => {
  it('renders CollapsibleSidebar with all 12 navigation items', () => {
    const handleNavigate = vi.fn();
    const handleToggle = vi.fn();

    render(
      <CollapsibleSidebar
        currentPath="/"
        onNavigate={handleNavigate}
        isCollapsed={false}
        onToggleCollapse={handleToggle}
      />
    );

    expect(SIDEBAR_ITEMS.length).toBe(12);
    SIDEBAR_ITEMS.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });

    // Click on 'Deal Management'
    const dealsBtn = screen.getByText('Deal Management');
    fireEvent.click(dealsBtn);
    expect(handleNavigate).toHaveBeenCalledWith('/deals');
  });

  it('handles sidebar collapse and expansion', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(
      <CollapsibleSidebar
        currentPath="/"
        onNavigate={() => {}}
        isCollapsed={false}
        onToggleCollapse={handleToggle}
      />
    );

    const collapseButton = screen.getByTitle(/Collapse sidebar/i);
    fireEvent.click(collapseButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);

    rerender(
      <CollapsibleSidebar
        currentPath="/"
        onNavigate={() => {}}
        isCollapsed={true}
        onToggleCollapse={handleToggle}
      />
    );

    const expandButton = screen.getByTitle(/Expand sidebar/i);
    expect(expandButton).toBeInTheDocument();
  });

  it('renders Breadcrumbs correctly resolving active route', () => {
    render(<Breadcrumbs currentPath="/pipeline" onNavigate={() => {}} />);
    expect(screen.getByText('Sales Pipeline')).toBeInTheDocument();
  });

  it('renders TopNavbar and opens Global Search modal', () => {
    const handleNavigate = vi.fn();
    render(
      <TopNavbar
        currentPath="/"
        onNavigate={handleNavigate}
        onOpenMobileMenu={() => {}}
      />
    );

    // Search button
    const searchTrigger = screen.getByText(/Search analytics, metrics, deals/i);
    fireEvent.click(searchTrigger);

    // Modal input should now be open
    const searchInput = screen.getByPlaceholderText(/Search pages, metrics, reports/i);
    expect(searchInput).toBeInTheDocument();

    // Type query to filter
    fireEvent.change(searchInput, { target: { value: 'Deal' } });
    const match = screen.getByText('Deal Management');
    expect(match).toBeInTheDocument();
  });

  it('renders KPICard with value, change rate, and progress', () => {
    render(
      <KPICard
        title="Total Revenue"
        value="$2,845,900"
        change="+14.2%"
        isPositive={true}
        progressPercent={85}
      />
    );
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$2,845,900')).toBeInTheDocument();
    expect(screen.getByText('+14.2%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('renders ChartCard with title, subtitle, and action buttons', () => {
    const handleExport = vi.fn();
    render(
      <ChartCard
        title="Revenue Growth"
        subtitle="Monthly recurring revenue"
        onExport={handleExport}
      >
        <div>Chart Graph Visual</div>
      </ChartCard>
    );

    expect(screen.getByText('Revenue Growth')).toBeInTheDocument();
    expect(screen.getByText('Monthly recurring revenue')).toBeInTheDocument();
    expect(screen.getByText('Chart Graph Visual')).toBeInTheDocument();

    const exportBtn = screen.getByTitle('Export Chart');
    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalledTimes(1);
  });

  it('renders DataTable with sorting and search filtering', () => {
    const data = [
      { id: '1', name: 'Alpha Corp', value: 100 },
      { id: '2', name: 'Beta Ltd', value: 200 },
      { id: '3', name: 'Gamma Inc', value: 150 },
    ];
    const columns = [
      { key: 'name', header: 'Company Name' },
      { key: 'value', header: 'Value' },
    ];

    render(<DataTable data={data} columns={columns} searchKey="name" />);
    expect(screen.getByText('Alpha Corp')).toBeInTheDocument();
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();

    // Search
    const searchInput = screen.getByPlaceholderText('Search records...');
    fireEvent.change(searchInput, { target: { value: 'Beta' } });
    expect(screen.getByText('Beta Ltd')).toBeInTheDocument();
    expect(screen.queryByText('Alpha Corp')).not.toBeInTheDocument();
  });

  it('renders Dropdown menu and triggers selection', () => {
    const handleSelect = vi.fn();
    const items = [
      { id: 'opt1', label: 'Option 1' },
      { id: 'opt2', label: 'Option 2' },
    ];

    render(
      <Dropdown
        trigger={<button>Open Menu</button>}
        items={items}
        onSelect={handleSelect}
      />
    );

    fireEvent.click(screen.getByText('Open Menu'));
    expect(screen.getByText('Option 1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Option 1'));
    expect(handleSelect).toHaveBeenCalledWith(items[0]);
  });

  it('renders ProgressIndicator with clamped values', () => {
    render(<ProgressIndicator value={76} label="Target Attainment" />);
    expect(screen.getByText('Target Attainment')).toBeInTheDocument();
    expect(screen.getByText('76%')).toBeInTheDocument();
  });

  it('renders DatePicker and allows selecting range presets', () => {
    const handleChange = vi.fn();
    render(<DatePicker selectedRange="Last 30 Days" onChange={handleChange} />);
    const trigger = screen.getByText('Last 30 Days');
    fireEvent.click(trigger);

    const preset = screen.getByText('This Quarter (Q4)');
    fireEvent.click(preset);
    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'This Quarter (Q4)' })
    );
  });

  it('renders FilterComponent and handles tag removal', () => {
    const handleRemove = vi.fn();
    const handleClear = vi.fn();
    const filters = [{ id: 'f1', category: 'Stage', value: 'Negotiation' }];

    render(
      <FilterComponent
        activeFilters={filters}
        onRemoveFilter={handleRemove}
        onClearAll={handleClear}
      />
    );

    expect(screen.getByText('Stage:')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toBeInTheDocument();

    const clearAll = screen.getByText('Clear all');
    fireEvent.click(clearAll);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('renders EmptyState correctly', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No Opportunities"
        description="Create your first deal to populate pipeline metrics."
        actionLabel="Create Opportunity"
        onAction={handleAction}
      />
    );
    expect(screen.getByText('No Opportunities')).toBeInTheDocument();
    const btn = screen.getByRole('button', { name: /Create Opportunity/i });
    fireEvent.click(btn);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  it('renders each of the 12 dashboard pages cleanly', () => {
    // 1. Overview
    const { unmount: u1 } = render(<OverviewPage />);
    expect(screen.getByText('Executive Overview')).toBeInTheDocument();
    u1();

    // 2. Data Import
    const { unmount: u2 } = render(<DataImportPage onOpenUploadModal={() => {}} onLoadSample={() => {}} />);
    expect(screen.getByText('Data Import & Ingestion Hub')).toBeInTheDocument();
    u2();

    // 3. Data Explorer (Empty state test)
    const { unmount: u3 } = render(<DataExplorerPage />);
    expect(screen.getByText('No Dataset Active')).toBeInTheDocument();
    u3();

    // 4. Deal Management
    const { unmount: u4 } = render(<DealManagementPage />);
    expect(screen.getByText('Deal Management')).toBeInTheDocument();
    u4();

    // 5. Campaign Management
    const { unmount: u5 } = render(<CampaignManagementPage />);
    expect(screen.getByText('Campaign Management')).toBeInTheDocument();
    u5();

    // 6. Reports & Analytics
    const { unmount: u6 } = render(<ReportsPage />);
    expect(screen.getByText('Reports & Analytics')).toBeInTheDocument();
    u6();

    // 7. Sales Pipeline
    const { unmount: u7 } = render(<SalesPipelinePage />);
    expect(screen.getByText('Sales Pipeline')).toBeInTheDocument();
    u7();

    // 8. Calendar
    const { unmount: u8 } = render(<CalendarPage />);
    expect(screen.getByText('Calendar & Milestones')).toBeInTheDocument();
    u8();

    // 9. Contacts
    const { unmount: u9 } = render(<ContactsPage />);
    expect(screen.getByText('Key Stakeholders & Contacts')).toBeInTheDocument();
    u9();

    // 10. Goals
    const { unmount: u10 } = render(<GoalsPage />);
    expect(screen.getByText('Goals & Quota Attainment')).toBeInTheDocument();
    u10();

    // 11. AI Analyst
    const { unmount: u11 } = render(<AiAnalystPage />);
    expect(screen.getByText('AI Data Analyst & Copilot')).toBeInTheDocument();
    u11();

    // 12. Settings
    const { unmount: u12 } = render(<SettingsPage />);
    expect(screen.getByText('Platform Settings')).toBeInTheDocument();
    u12();
  });
});
