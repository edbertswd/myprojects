import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ApproveManagers from './ApproveManagers';

vi.mock('../../services/adminApi', () => ({
  getManagerApplications: vi.fn(),
  approveManagerApplication: vi.fn(),
  rejectManagerApplication: vi.fn()
}));

const {
  getManagerApplications,
  approveManagerApplication,
  rejectManagerApplication
} = await import('../../services/adminApi');

const alertMock = vi.fn();
const confirmMock = vi.fn(() => true);
vi.stubGlobal('alert', alertMock);
vi.stubGlobal('confirm', confirmMock);

describe('ApproveManagers', () => {
  beforeEach(() => {
    getManagerApplications.mockResolvedValue({
      data: [
        {
          request_id: 1,
          user_name: 'Alice Manager',
          user_email: 'alice@example.com',
          facility_name: 'Court Hub',
          facility_address: '123 Main St'
        }
      ],
      meta: { total: 1, pageSize: 20 }
    });
    approveManagerApplication.mockResolvedValue({});
    rejectManagerApplication.mockResolvedValue({});
    alertMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and displays manager applications on mount', async () => {
    render(<ApproveManagers />);

    await waitFor(() => expect(getManagerApplications).toHaveBeenCalled());
    expect(screen.getByText('Manager Applications')).toBeInTheDocument();
    expect(screen.getByText('Alice Manager')).toBeInTheDocument();
    expect(screen.getByText('Court Hub')).toBeInTheDocument();
  });

  it('approves an application through the review modal', async () => {
    render(<ApproveManagers />);

    await screen.findByText('Alice Manager');

    fireEvent.click(screen.getByText('Alice Manager'));

    fireEvent.click(await screen.findByRole('button', { name: /Approve Application/i }));

    const reasonInput = await screen.findByRole('textbox');
    fireEvent.change(reasonInput, { target: { value: 'Approval reason >= 10' } });

    fireEvent.click(screen.getByRole('button', { name: /Confirm Approval/i }));

    await waitFor(() =>
      expect(approveManagerApplication).toHaveBeenCalledWith({
        requestId: 1,
        reason: 'Approval reason >= 10'
      })
    );

    expect(alertMock).toHaveBeenCalledWith('Application approved successfully!');
    expect(getManagerApplications).toHaveBeenCalledTimes(2);
  });

  it('rejects an application after confirmation', async () => {
    render(<ApproveManagers />);

    await screen.findByText('Alice Manager');
    fireEvent.click(screen.getByText('Alice Manager'));

    fireEvent.click(await screen.findByRole('button', { name: /Reject Application/i }));

    const reasonInput = await screen.findByRole('textbox');
    fireEvent.change(reasonInput, { target: { value: 'Rejection reason >= 10' } });

    confirmMock.mockReturnValueOnce(true);
    fireEvent.click(screen.getByRole('button', { name: /Confirm Rejection/i }));

    await waitFor(() =>
      expect(rejectManagerApplication).toHaveBeenCalledWith({
        requestId: 1,
        reason: 'Rejection reason >= 10'
      })
    );

    expect(confirmMock).toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledWith('Application rejected successfully!');
    expect(getManagerApplications).toHaveBeenCalledTimes(2);
  });
});
