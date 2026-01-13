import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ReauthModal from './ReauthModal';

describe('ReauthModal', () => {
  it('renders nothing when closed', () => {
    render(<ReauthModal open={false} />);
    expect(screen.queryByText(/Admin verification/i)).not.toBeInTheDocument();
  });

  it('submits password verification and closes on success', async () => {
    const onVerified = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(<ReauthModal open onVerified={onVerified} onClose={onClose} />);

    const passwordInput = screen.getByPlaceholderText('Enter password');
    fireEvent.change(passwordInput, { target: { value: 'secret pass' } });

    const submitButton = screen.getByRole('button', { name: 'Verify' });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() =>
      expect(onVerified).toHaveBeenCalledWith({ method: 'password', credential: 'secret pass' })
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('requests OTP when method is set to one-time code', async () => {
    const onVerified = vi.fn().mockResolvedValue({ requiresOtp: true, message: 'OTP sent' });
    const onClose = vi.fn();

    render(<ReauthModal open onVerified={onVerified} onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('One-time code'));

    const sendCodeButton = screen.getByRole('button', { name: 'Send Code' });
    await act(async () => {
      fireEvent.click(sendCodeButton);
    });

    await waitFor(() =>
      expect(onVerified).toHaveBeenCalledWith({ method: 'otp', credential: '' })
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('verifies OTP when awaiting code', async () => {
    const onVerifyOtp = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();

    render(
      <ReauthModal
        open
        awaitingOtp
        onVerifyOtp={onVerifyOtp}
        onClose={onClose}
      />
    );

    const verifyButton = screen.getByRole('button', { name: 'Verify Code' });
    expect(verifyButton).toBeDisabled();

    const otpInput = screen.getByPlaceholderText('000000');
    fireEvent.change(otpInput, { target: { value: '123456' } });

    expect(verifyButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.click(verifyButton);
    });

    await waitFor(() => expect(onVerifyOtp).toHaveBeenCalledWith('123456'));
    expect(onClose).toHaveBeenCalled();
  });
});
