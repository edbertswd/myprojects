import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ManageFacilities from './ManageFacilities';

const alertMock = vi.fn();
const promptMock = vi.fn(() => 'Valid reason more than ten chars');
vi.stubGlobal('alert', alertMock);
vi.stubGlobal('prompt', promptMock);

vi.mock('../../services/adminApi', () => ({
  getAllFacilities: vi.fn(),
  approveFacility: vi.fn(),
  rejectFacility: vi.fn(),
  activateFacility: vi.fn(),
  deactivateFacility: vi.fn()
}));

const {
  getAllFacilities,
  approveFacility,
  rejectFacility,
  activateFacility,
  deactivateFacility
} = await import('../../services/adminApi');

describe('ManageFacilities', () => {
  beforeEach(() => {
    promptMock.mockReturnValue('Valid reason more than ten chars');
    alertMock.mockReset();
    approveFacility.mockResolvedValue({});
    rejectFacility.mockResolvedValue({});
    activateFacility.mockResolvedValue({});
    deactivateFacility.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads facilities on mount and renders table', async () => {
    getAllFacilities.mockResolvedValue([
      {
        facility_id: 99,
        facility_name: 'City Arena',
        address: '456 Broadway',
        is_active: true,
        approval_status: 'approved'
      }
    ]);

    render(<ManageFacilities />);

    await waitFor(() => expect(getAllFacilities).toHaveBeenCalled());
    expect(screen.getByText('Manage Facilities')).toBeInTheDocument();
    expect(screen.getByText('City Arena')).toBeInTheDocument();
  });

  it('approves a pending facility and refetches list', async () => {
    getAllFacilities.mockResolvedValue([
      {
        facility_id: 42,
        facility_name: 'Pending Hub',
        address: '101 Pending St',
        is_active: false,
        approval_status: 'pending'
      }
    ]);

    render(<ManageFacilities />);

    await screen.findByText('Pending Hub');

    promptMock.mockReturnValue('Approval reason >= 10');
    fireEvent.click(screen.getByRole('button', { name: /Approve/i }));

    await waitFor(() =>
      expect(approveFacility).toHaveBeenCalledWith({
        facilityId: 42,
        reason: 'Approval reason >= 10'
      })
    );

    expect(alertMock).toHaveBeenCalledWith('Facility approved successfully!');
    expect(getAllFacilities).toHaveBeenCalledTimes(2);
  });

  it('rejects a pending facility with provided reason', async () => {
    getAllFacilities.mockResolvedValue([
      {
        facility_id: 55,
        facility_name: 'Reject Arena',
        address: '202 Reject Rd',
        is_active: false,
        approval_status: 'pending'
      }
    ]);

    render(<ManageFacilities />);

    await screen.findByText('Reject Arena');

    promptMock.mockReturnValue('Rejection reason >= 10');
    fireEvent.click(screen.getByRole('button', { name: /Reject/i }));

    await waitFor(() =>
      expect(rejectFacility).toHaveBeenCalledWith({
        facilityId: 55,
        reason: 'Rejection reason >= 10'
      })
    );

    expect(alertMock).toHaveBeenCalledWith('Facility rejected successfully!');
    expect(getAllFacilities).toHaveBeenCalledTimes(2);
  });

  it('activates an approved inactive facility', async () => {
    getAllFacilities.mockResolvedValue([
      {
        facility_id: 77,
        facility_name: 'Inactive Courts',
        address: '303 Activate Ave',
        is_active: false,
        approval_status: 'approved'
      }
    ]);

    render(<ManageFacilities />);

    await screen.findByText('Inactive Courts');

    promptMock.mockReturnValue('Activation rationale >= 10');
    fireEvent.click(screen.getByRole('button', { name: /Activate/i }));

    await waitFor(() =>
      expect(activateFacility).toHaveBeenCalledWith({
        facilityId: 77,
        reason: 'Activation rationale >= 10'
      })
    );

    expect(alertMock).toHaveBeenCalledWith('Facility activated successfully!');
    expect(getAllFacilities).toHaveBeenCalledTimes(2);
  });

  it('deactivates an approved active facility', async () => {
    getAllFacilities.mockResolvedValue([
      {
        facility_id: 88,
        facility_name: 'Active Courts',
        address: '404 Deactivate Dr',
        is_active: true,
        approval_status: 'approved'
      }
    ]);

    render(<ManageFacilities />);

    await screen.findByText('Active Courts');

    promptMock.mockReturnValue('Deactivation rationale >= 10');
    fireEvent.click(screen.getByRole('button', { name: /Deactivate/i }));

    await waitFor(() =>
      expect(deactivateFacility).toHaveBeenCalledWith({
        facilityId: 88,
        reason: 'Deactivation rationale >= 10'
      })
    );

    expect(alertMock).toHaveBeenCalledWith('Facility deactivated successfully!');
    expect(getAllFacilities).toHaveBeenCalledTimes(2);
  });
});
