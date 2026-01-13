import { render, fireEvent, screen, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToastProvider } from './Toaster';
import { useToast } from './toastContext';

describe('Toaster', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('throws when useToast is used outside provider', () => {
    function NakedConsumer() {
      useToast();
      return null;
    }

    expect(() => render(<NakedConsumer />)).toThrow('useToast must be used inside <ToastProvider>');
  });

  it('renders and auto-dismisses toast messages', () => {
    function TestComponent() {
      const { push } = useToast();
      return (
        <button onClick={() => push('Toast Message', 'success', 500)}>
          Trigger toast
        </button>
      );
    }

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /trigger toast/i }));
    expect(screen.getByText('Toast Message')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(screen.queryByText('Toast Message')).not.toBeInTheDocument();
  });
});
