import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsersTable from './UsersTable';

const useAdminUsersMock = vi.hoisted(() => vi.fn());

vi.mock('../../hooks/useAdminUsers', () => ({
  useAdminUsers: useAdminUsersMock
}));

describe('UsersTable', () => {
  const calls = [];
  const rows = [
    {
      user_id: 1,
      name: 'User One',
      email: 'user1@example.com',
      role: 'user',
      status: 'active',
      last_active: '2025-01-02T10:00:00Z'
    }
  ];

  beforeEach(() => {
    calls.length = 0;
    useAdminUsersMock.mockImplementation((params) => {
      calls.push(params);
      return {
        data: {
          data: rows,
          meta: { page: params.page, pageSize: params.pageSize, total: 25 }
        },
        isLoading: false,
        isError: false,
        error: null
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function renderTable(initialPath = '/admin/users') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/admin/users" element={<UsersTable />} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('renders moderation table with user rows and actions', async () => {
    renderTable();

    expect(await screen.findByText('User Moderation')).toBeInTheDocument();
    expect(screen.getByText('User One')).toBeInTheDocument();
    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Suspend/i })).toHaveAttribute('href', '/admin/users/1?open=suspend');

    expect(calls[0]).toMatchObject({
      q: '',
      role: '',
      status: '',
      page: 1,
      pageSize: 10
    });
  });

  it('updates filters and resets page when searching or changing role', async () => {
    renderTable('/admin/users?page=2&role=manager');

    expect(calls[0]).toMatchObject({
      role: 'manager',
      page: 2
    });

    const roleSelect = screen.getByDisplayValue('manager');
    fireEvent.change(roleSelect, { target: { value: 'admin' } });

    await waitFor(() =>
      expect(calls.at(-1)).toMatchObject({
        role: 'admin',
        page: 1
      })
    );

    const searchInput = screen.getByPlaceholderText('Search name or email…');
    fireEvent.change(searchInput, { target: { value: 'alice' } });

    await waitFor(() =>
      expect(calls.at(-1)).toMatchObject({
        q: 'alice',
        page: 1
      })
    );
  });
});
