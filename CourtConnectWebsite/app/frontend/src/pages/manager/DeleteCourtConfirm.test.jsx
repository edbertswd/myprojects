import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DeleteCourtConfirm from './DeleteCourtConfirm';

const queryState = vi.hoisted(() => ({ data: { is_active: true } }));
const mutationMocks = vi.hoisted(() => []);

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => queryState),
  useMutation: vi.fn(({ mutationFn, onSuccess, onError }) => {
    const fn = vi.fn(async () => {
      try {
        const result = await mutationFn();
        onSuccess?.(result);
      } catch (err) {
        onError?.(err);
      }
    });
    const mock = { mutate: fn, mutateAsync: fn, isPending: false, isSuccess: false };
    mutationMocks.push(mock);
    return mock;
  })
}));

const apiMock = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: apiMock
}));

describe('DeleteCourtConfirm', () => {
  beforeEach(() => {
    apiMock.get.mockResolvedValue({
      data: {
        courts: [
          { court_id: 10, is_active: true }
        ]
      }
    });
    apiMock.patch.mockResolvedValue({ data: {} });
    apiMock.delete.mockResolvedValue({ data: {} });
    mutationMocks.length = 0;
    queryState.data = { is_active: true };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={['/manager/facility/2/courts/10/delete']}>
        <Routes>
          <Route path="/manager/facility/:facilityId/courts/:courtId/delete" element={<DeleteCourtConfirm />} />
          <Route path="/manager/facility/:facilityId/courts" element={<div>Court list</div>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('prevents permanent delete when court is active', async () => {
    renderPage();

    const deleteOption = await screen.findByRole('button', { name: /Delete Permanently/i });
    fireEvent.click(deleteOption);

    expect(
      await screen.findByText(/Cannot Delete Active Court/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('DELETE'), {
      target: { value: 'DELETE' }
    });

    const confirmButtons = screen.getAllByRole('button', { name: /Delete Permanently/i });
    const confirmButton = confirmButtons[confirmButtons.length - 1];
    await waitFor(() => expect(confirmButton).toBeEnabled());
    fireEvent.click(confirmButton);

    expect(screen.getByText(/This court is currently active/i)).toBeInTheDocument();
    expect(apiMock.delete).not.toHaveBeenCalled();
  });

  it('deactivates a court when confirmed', async () => {
    queryState.data = { is_active: true };

    renderPage();

    fireEvent.change(screen.getByPlaceholderText('DEACTIVATE'), { target: { value: 'DEACTIVATE' } });
    fireEvent.click(screen.getByRole('button', { name: /Deactivate Court/i }));

    await waitFor(() => expect(apiMock.patch).toHaveBeenCalled());
  });

  it('permanently deletes an inactive court after confirmation', async () => {
    queryState.data = { is_active: false };
    apiMock.get.mockResolvedValue({
      data: { courts: [{ court_id: 10, is_active: false }] }
    });

    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: /Delete Permanently/i }));
    fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });

    const confirmButtons = screen.getAllByRole('button', { name: /Delete Permanently/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => expect(apiMock.delete).toHaveBeenCalled());
  });
});
