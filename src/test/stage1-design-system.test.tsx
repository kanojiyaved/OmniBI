import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { DataHealthMeter } from '../components/ui/DataHealthMeter';
import { Modal } from '../components/ui/Modal';

describe('Stage 1: Premium SaaS UI/UX Design System Component Tests', () => {
  it('renders Button with variants and handles click events', () => {
    const handleClick = vi.fn();
    render(
      <Button variant="primary" size="md" onClick={handleClick}>
        Analyze Data
      </Button>
    );

    const button = screen.getByRole('button', { name: /Analyze Data/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders Button in loading state with disabled attribute', () => {
    render(<Button isLoading>Processing</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders Badge with variants and dot indicators', () => {
    render(<Badge variant="success" hasDot>E-Commerce</Badge>);
    expect(screen.getByText('E-Commerce')).toBeInTheDocument();
  });

  it('renders Card with Header, Title and Content', () => {
    render(
      <Card glass hoverable>
        <CardHeader>
          <CardTitle>Total Volume</CardTitle>
        </CardHeader>
        <CardContent>
          <p>$4,250,000</p>
        </CardContent>
      </Card>
    );
    expect(screen.getByText('Total Volume')).toBeInTheDocument();
    expect(screen.getByText('$4,250,000')).toBeInTheDocument();
  });

  it('renders Input with label, placeholder, and handles clearing', () => {
    const handleClear = vi.fn();
    render(
      <Input
        label="Search Columns"
        placeholder="Filter by name..."
        value="Revenue"
        onChange={() => {}}
        onClear={handleClear}
      />
    );
    expect(screen.getByText('Search Columns')).toBeInTheDocument();
    const input = screen.getByPlaceholderText('Filter by name...');
    expect(input).toHaveValue('Revenue');

    // Click clear button
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('renders Tabs and triggers onChange when clicked', () => {
    const handleTabChange = vi.fn();
    const tabs = [
      { id: 'tab1', label: 'Dashboard' },
      { id: 'tab2', label: 'Profiler' },
    ];
    render(
      <Tabs tabs={tabs} activeTab="tab1" onChange={handleTabChange} />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    const tab2 = screen.getByText('Profiler');
    fireEvent.click(tab2);
    expect(handleTabChange).toHaveBeenCalledWith('tab2');
  });

  it('renders DataHealthMeter with appropriate score and status label', () => {
    const { rerender } = render(<DataHealthMeter score={95} />);
    expect(screen.getByText(/95%/)).toBeInTheDocument();
    expect(screen.getByText(/Excellent Quality/i)).toBeInTheDocument();

    rerender(<DataHealthMeter score={40} />);
    expect(screen.getByText(/40%/)).toBeInTheDocument();
    expect(screen.getByText(/Critical Quality Issues/i)).toBeInTheDocument();
  });

  it('renders Modal when isOpen is true and fires onClose on close button click', () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={handleClose} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        Modal Content
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /Close dialog/i });
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
