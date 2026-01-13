import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScheduleEditor from './ScheduleEditor';

const useWeeklyScheduleMock = vi.hoisted(() => vi.fn());
const usePatchScheduleMock = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isLoading: false
}));
let refetchSpy;

vi.mock('../../hooks/useSchedule', () => ({
  useWeeklySchedule: useWeeklyScheduleMock,
  usePatchSchedule: () => usePatchScheduleMock
}));

describe('ScheduleEditor', () => {
  beforeEach(() => {
    vi.setSystemTime(new Date('2025-01-06T00:00:00Z'));
    const iso = new Date('2025-01-06T06:00:00Z').toISOString();
    refetchSpy = vi.fn();
    useWeeklyScheduleMock.mockReturnValue({
      data: { slots: { [iso]: false } },
      isLoading: false,
      isFetching: false,
      refetch: refetchSpy
    });
    usePatchScheduleMock.mutateAsync.mockResolvedValue({});
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  function renderEditor() {
    return render(
      <MemoryRouter initialEntries={['/manager/facility/1/courts/2/schedule']}>
        <Routes>
          <Route path="/manager/facility/:facilityId/courts/:courtId/schedule" element={<ScheduleEditor />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('allows toggling availability and saving changes', async () => {
    renderEditor();

    const cell = (await screen.findAllByTitle('Closed'))[0];
    fireEvent.click(cell);

    const saveButton = screen.getByRole('button', { name: /Save Changes/i });
    expect(saveButton).not.toBeDisabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(usePatchScheduleMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ changes: expect.any(Object) })
      );
      expect(refetchSpy).toHaveBeenCalled();
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ message: 'Schedule saved', type: 'success' })
        })
      );
    });
  });

  it('marks pending changes after resetting to business hours', async () => {
    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /Reset to Business Hours/i }));

    expect(await screen.findByText(/changes pending/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save Changes/i })).not.toBeDisabled();
  });

  it('can discard pending changes', async () => {
    renderEditor();

    const cell = (await screen.findAllByTitle('Closed'))[0];
    fireEvent.click(cell);

    fireEvent.click(screen.getByRole('button', { name: /Discard/i }));

    await waitFor(() => expect(screen.queryByText(/changes pending/i)).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: /Save Changes/i })).toBeDisabled();
  });
});
