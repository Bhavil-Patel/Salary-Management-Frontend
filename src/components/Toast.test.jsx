import { render, screen, fireEvent } from '@testing-library/react';
import Toast from './Toast';

describe('components/Toast', () => {
  test('returns null when no toast message is provided', () => {
    const { container } = render(<Toast />);
    expect(container).toBeEmptyDOMElement();
  });

  test('renders message provided via message string prop', () => {
    render(<Toast message="Employee created successfully!" type="success" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Employee created successfully!')).toBeInTheDocument();
  });

  test('renders message provided via toast object prop', () => {
    render(<Toast toast={{ message: 'Revision recorded', type: 'info' }} />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Revision recorded')).toBeInTheDocument();
  });

  test('applies appropriate color styles according to toast type', () => {
    const { rerender } = render(<Toast message="Warning msg" type="warning" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-amber-50');

    rerender(<Toast message="Error msg" type="error" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-rose-50');

    rerender(<Toast message="Info msg" type="info" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-sky-50');

    rerender(<Toast message="Success msg" type="success" />);
    expect(screen.getByRole('alert')).toHaveClass('bg-emerald-50');
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(<Toast message="Dismissable toast" onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close notification/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('does not render close button when onClose is not provided', () => {
    render(<Toast message="Non-dismissable toast" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('renders at top side of screen', () => {
    render(<Toast message="Top toast" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('top-4');
    expect(alert).toHaveClass('sm:top-6');
  });

  test('auto-dismisses after 3 seconds by calling onClose', () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();
    render(<Toast message="Auto-dismiss toast" onClose={handleClose} duration={3000} />);

    expect(handleClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(2999);
    expect(handleClose).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);
    expect(handleClose).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('does not auto-dismiss when duration is 0', () => {
    jest.useFakeTimers();
    const handleClose = jest.fn();
    render(<Toast message="Sticky toast" onClose={handleClose} duration={0} />);

    jest.advanceTimersByTime(5000);
    expect(handleClose).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

