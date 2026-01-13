import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RateEditor from './RateEditor';

const useCourtMock = vi.hoisted(() => vi.fn());
const useUpdateRateMock = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false
}));

vi.mock('../../hooks/useCourts', () => ({
  useCourt: useCourtMock
}));

vi.mock('../../hooks/useRates', () => ({
  useUpdateRate: () => useUpdateRateMock
}));

describe('RateEditor', () => {
  beforeEach(() => {
    useCourtMock.mockReturnValue({
      data: { name: 'Court 5', hourly_rate: 40 },
      isLoading: false
    });
    useUpdateRateMock.mutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderEditor() {
    return render(
      <MemoryRouter initialEntries={['/manager/facility/9/courts/5/rate']}>
        <Routes>
          <Route path="/manager/facility/:facilityId/courts/:courtId/rate" element={<RateEditor />} />
          <Route path="/manager/facility/:facilityId/courts" element={<div>Court list</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('validates rate boundaries', async () => {
    renderEditor();

    const input = await screen.findByRole('spinbutton');
    fireEvent.change(input, { target: { value: '500' } });
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.submit(saveButton.closest('form'));

    await screen.findByText(/Rate must be between \$10 and \$200/);
    expect(useUpdateRateMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('enforces step increments when saving', async () => {
    renderEditor();

    const input = await screen.findByRole('spinbutton');
    fireEvent.change(input, { target: { value: '45.50' } });
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.submit(saveButton.closest('form'));

    await screen.findByText(/Use increments of \$1\.00/);
    expect(useUpdateRateMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('submits a valid rate update', async () => {
    renderEditor();

    const input = await screen.findByRole('spinbutton');
    fireEvent.change(input, { target: { value: '45' } });
    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.submit(saveButton.closest('form'));

    await waitFor(() =>
      expect(useUpdateRateMock.mutateAsync).toHaveBeenCalledWith({
        facilityId: '9',
        courtId: '5',
        ratePerHour: 45,
        currency: 'AUD'
      })
    );
  });
});
