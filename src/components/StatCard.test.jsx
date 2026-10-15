import { render, screen } from '@testing-library/react';
import StatCard from './StatCard';

describe('components/StatCard', () => {
  test('renders label and value', () => {
    render(<StatCard label="Total Employees" value="125" />);

    expect(screen.getByText('Total Employees')).toBeInTheDocument();
    expect(screen.getByText('125')).toBeInTheDocument();
  });

  test('renders formatted currency or string values', () => {
    render(<StatCard label="Total Net Payroll" value="₹ 15,20,000" />);

    expect(screen.getByText('Total Net Payroll')).toBeInTheDocument();
    expect(screen.getByText('₹ 15,20,000')).toBeInTheDocument();
  });
});
