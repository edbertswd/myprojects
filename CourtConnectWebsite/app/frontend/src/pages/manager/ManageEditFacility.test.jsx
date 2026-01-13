import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ManageEditFacility from './ManageEditFacility';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

const api = (await import('../../services/api')).default;

describe('ManageEditFacility', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url.endsWith('/manager/facilities/123/')) {
        return Promise.resolve({
          data: {
            facility_name: 'Arena 123',
            address: '789 Example Rd',
            timezone: 'Australia/Sydney',
            latitude: '0',
            longitude: '0',
            is_active: true
          }
        });
      }
      if (url.endsWith('/manager/facilities/123/courts/')) {
        return Promise.resolve({ data: { courts: [] } });
      }
      if (url.endsWith('/facilities/sport-types/')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('loads facility data and displays form', async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: '/manager/facilities/123/edit' }]}>        
        <Routes>
          <Route path="/manager/facilities/:facilityId/edit" element={<ManageEditFacility />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/manager/facilities/123/'));
    expect(screen.getByDisplayValue('Arena 123')).toBeInTheDocument();
    expect(screen.getByText('Manage Facility')).toBeInTheDocument();
  });
});
