import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../context/useAuth', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: { patch: vi.fn() }
}));

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileSettings from './ProfileSettings';
import { useAuth } from '../../context/useAuth';
import api from '../../services/api';

const useAuthMock = useAuth;
const patchMock = api.patch;

describe('ProfileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReset();
    patchMock.mockReset();
  });

  const baseUser = {
    name: 'Alex Smith',
    email: 'alex@example.com',
    role: 'manager',
    mfa_enabled: false,
    phone_number: ''
  };

  it('renders loading state when user is not ready', () => {
    useAuthMock.mockReturnValue({ user: null });
    render(<ProfileSettings />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('toggles MFA and updates profile on success', async () => {
    const setUser = vi.fn();
    useAuthMock.mockReturnValue({
      user: baseUser,
      updatePhone: vi.fn(),
      setUser
    });
    patchMock.mockResolvedValue({
      data: { ...baseUser, mfa_enabled: true }
    });

    render(<ProfileSettings />);

    const toggleButton = screen.getAllByRole('button').find((btn) => btn.textContent === '');
    fireEvent.click(toggleButton);

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith('/auth/profile/', { mfa_enabled: true })
    );
    expect(setUser).toHaveBeenCalledWith(expect.objectContaining({ mfa_enabled: true }));
    expect(screen.getByText(/MFA enabled!/i)).toBeInTheDocument();
  });

  it('shows error when MFA toggle fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    useAuthMock.mockReturnValue({
      user: baseUser,
      updatePhone: vi.fn(),
      setUser: vi.fn()
    });
    patchMock.mockRejectedValue(new Error('boom'));

    render(<ProfileSettings />);

    const toggleButton = screen.getAllByRole('button').find((btn) => btn.textContent === '');
    fireEvent.click(toggleButton);

    await waitFor(() =>
      expect(screen.getByText('Failed to update MFA setting')).toBeInTheDocument()
    );

    consoleSpy.mockRestore();
  });

  it('validates phone number format before submitting', async () => {
    useAuthMock.mockReturnValue({
      user: baseUser,
      updatePhone: vi.fn(),
      setUser: vi.fn()
    });

    render(<ProfileSettings />);

    fireEvent.change(screen.getByPlaceholderText('+61 400 000 000'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Phone/i }));

    expect(await screen.findByText('Invalid phone number format')).toBeInTheDocument();
    expect(patchMock).not.toHaveBeenCalled();
  });

  it('updates phone number and shows success message', async () => {
    const updatePhone = vi.fn();
    useAuthMock.mockReturnValue({
      user: baseUser,
      updatePhone,
      setUser: vi.fn()
    });
    patchMock.mockResolvedValue({ data: {} });

    render(<ProfileSettings />);

    const phoneInput = screen.getByPlaceholderText('+61 400 000 000');
    fireEvent.change(phoneInput, { target: { value: '+61 455 123 456' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Phone/i }));

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith('/auth/profile/', {
        phone_number: '+61 455 123 456'
      })
    );
    expect(updatePhone).toHaveBeenCalledWith('+61 455 123 456');
    expect(screen.getByText('Phone number updated successfully')).toBeInTheDocument();
  });
});
