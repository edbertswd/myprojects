import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditCourt from './EditCourt';

const useCourtMock = vi.hoisted(() => vi.fn());
const useUpdateCourtMock = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false
}));
const useSportTypesMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useCourts', () => ({
  useCourt: useCourtMock,
  useUpdateCourt: () => useUpdateCourtMock
}));

vi.mock('../../hooks/useSportTypes', async () => {
  const actual = await vi.importActual('../../hooks/useSportTypes');
  return {
    ...actual,
    useSportTypes: useSportTypesMock
  };
});

describe('EditCourt', () => {
  beforeEach(() => {
    useCourtMock.mockReturnValue({
      data: {
        name: 'Court Alpha',
        sport_name: 'Tennis',
        is_active: true,
        hourly_rate: 45,
        opening_time: '08:00',
        closing_time: '22:00',
        availability_start_date: '2025-01-02'
      },
      isLoading: false
    });
    useSportTypesMock.mockReturnValue({
      data: [
        { sport_type_id: 1, sport_name: 'Tennis' },
        { sport_type_id: 2, sport_name: 'Badminton' }
      ],
      isLoading: false
    });
    useUpdateCourtMock.mutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderEditor() {
    return render(
      <MemoryRouter initialEntries={['/manager/facility/3/courts/7/edit']}>
        <Routes>
          <Route path="/manager/facility/:facilityId/courts/:courtId/edit" element={<EditCourt />} />
          <Route path="/manager/facility/:facilityId/courts" element={<div>Court list</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('prefills form with existing court data', async () => {
    renderEditor();

    expect(await screen.findByDisplayValue('Court Alpha')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tennis')).toBeInTheDocument();
    expect(screen.getByDisplayValue('active')).toBeInTheDocument();
  });

  it('submits updates with selected status', async () => {
    renderEditor();

    const selects = await screen.findAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'inactive' } });
    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    await waitFor(() =>
      expect(useUpdateCourtMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          sport_type: 1
        })
      )
    );
  });

  it('validates sport selection against loaded sport types', async () => {
    useSportTypesMock.mockReturnValue({
      data: [],
      isLoading: false
    });

    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    expect(await screen.findByText(/Invalid sport/i)).toBeInTheDocument();
    expect(useUpdateCourtMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('shows duplicate name error from API', async () => {
    useUpdateCourtMock.mutateAsync.mockRejectedValue({ code: 'DUPLICATE_NAME' });

    renderEditor();

    fireEvent.click(screen.getByRole('button', { name: /Save changes/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
  });
});
