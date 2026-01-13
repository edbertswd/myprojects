import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/api', () => ({
  __esModule: true,
  default: { patch: vi.fn() }
}));

const alertMock = vi.fn();
vi.stubGlobal('alert', alertMock);

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePanel from './ProfilePanel';
import api from '../../services/api';

const patchMock = api.patch;

describe('ProfilePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    patchMock.mockReset();
  });

  it('keeps panel hidden when closed', () => {
    render(<ProfilePanel open={false} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.className).toContain('translate-x-full');
  });

  it('validates phone format and disables save button', () => {
    render(<ProfilePanel open initialPhone="" />);

    const input = screen.getByLabelText('Phone number');
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.blur(input);

    expect(
      screen.getByText('Please enter a valid phone number format.')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('updates phone successfully and closes panel', async () => {
    patchMock.mockResolvedValue({});
    const onSaved = vi.fn();
    const onClose = vi.fn();

    render(
      <ProfilePanel
        open
        initialPhone="+61 400 000 000"
        onSaved={onSaved}
        onClose={onClose}
      />
    );

    const input = screen.getByLabelText('Phone number');
    fireEvent.change(input, { target: { value: '+61 455 123 456' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(patchMock).toHaveBeenCalledWith('/auth/profile/', {
        phone_number: '+61 455 123 456'
      })
    );

    expect(onSaved).toHaveBeenCalledWith('+61 455 123 456');
    expect(alertMock).toHaveBeenCalledWith('Phone updated successfully');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error alert when API fails', async () => {
    patchMock.mockRejectedValue(new Error('fail'));
    const onClose = vi.fn();

    render(<ProfilePanel open initialPhone="+61 400 000 000" onClose={onClose} />);

    const input = screen.getByLabelText('Phone number');
    fireEvent.change(input, { target: { value: '+61 455 123 456' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() =>
      expect(alertMock).toHaveBeenCalledWith('Failed to update phone, please try again.')
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
