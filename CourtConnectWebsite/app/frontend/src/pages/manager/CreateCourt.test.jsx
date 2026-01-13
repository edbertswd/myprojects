import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateCourt from './CreateCourt';
import * as sportTypesModule from '../../hooks/useSportTypes';

const createCourtMock = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isPending: false
}));

const useSportTypesMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useCourts', () => ({
  useCreateCourt: () => createCourtMock
}));

vi.mock('../../hooks/useSportTypes', async () => {
  const actual = await vi.importActual('../../hooks/useSportTypes');
  return {
    ...actual,
    useSportTypes: useSportTypesMock
  };
});

describe('CreateCourt', () => {
  beforeEach(() => {
    useSportTypesMock.mockReturnValue({
      data: [
        { sport_type_id: 1, sport_name: 'Tennis' },
        { sport_type_id: 2, sport_name: 'Pickleball' }
      ],
      isLoading: false
    });
    createCourtMock.mutateAsync.mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderForm() {
    return render(
      <MemoryRouter initialEntries={['/manager/facility/5/courts/new']}>
        <Routes>
          <Route path="/manager/facility/:facilityId/courts/new" element={<CreateCourt />} />
          <Route path="/manager/facility/:facilityId/courts" element={<div>Court list</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('validates name before submitting', async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));
    expect(await screen.findByText(/Name is required/i)).toBeInTheDocument();
    expect(createCourtMock.mutateAsync).not.toHaveBeenCalled();
  });

  it('submits form with mapped sport type', async () => {
    renderForm();

    fireEvent.change(screen.getByPlaceholderText(/Court name/i), { target: { value: 'Centre Court' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Pickleball' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: 40 } });

    fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() =>
      expect(createCourtMock.mutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Centre Court',
          sport_type: 2,
          hourly_rate: 40
        })
      )
    );
  });

  it('handles duplicate name error', async () => {
    createCourtMock.mutateAsync.mockRejectedValue({ code: 'DUPLICATE_NAME' });

    renderForm();

    fireEvent.change(screen.getByPlaceholderText(/Court name/i), { target: { value: 'Court 1' } });
    fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() =>
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    );
  });

  it('surfaces facility limit errors from backend', async () => {
    createCourtMock.mutateAsync.mockRejectedValue({ code: 'LIMIT_REACHED' });

    renderForm();

    fireEvent.change(screen.getByPlaceholderText(/Court name/i), { target: { value: 'Court X' } });
    fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

    await waitFor(() =>
      expect(screen.getByText(/Max 20 courts reached/i)).toBeInTheDocument()
    );
  });

  it('shows form error when sport type mapping fails', async () => {
    const mapSpy = vi.spyOn(sportTypesModule, 'buildSportTypeMap').mockReturnValue({});

    try {
      renderForm();

      fireEvent.change(screen.getByPlaceholderText(/Court name/i), { target: { value: 'Court Z' } });
      fireEvent.click(screen.getByRole('button', { name: /^Create$/i }));

      await waitFor(() =>
        expect(screen.getByText(/Invalid sport type selected/i)).toBeInTheDocument()
      );

      expect(createCourtMock.mutateAsync).not.toHaveBeenCalled();
    } finally {
      mapSpy.mockRestore();
    }
  });
});
