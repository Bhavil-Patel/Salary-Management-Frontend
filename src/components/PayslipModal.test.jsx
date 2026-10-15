import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PayslipModal from './PayslipModal';
import html2pdf from 'html2pdf.js';

jest.mock('html2pdf.js', () => {
  const save = jest.fn().mockResolvedValue(true);
  const from = jest.fn(() => ({ save }));
  const set = jest.fn(() => ({ from }));
  const mockFn = jest.fn(() => ({ set }));
  mockFn.default = mockFn;
  return mockFn;
});

describe('components/PayslipModal', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });
  const mockPayroll = {
    id: 1,
    month: 10,
    year: 2026,
    status: 'PAID',
    payment_method: 'BANK_TRANSFER',
    payment_date: '2026-10-31',
    basic_salary: 50000,
    hra: 20000,
    conveyance_allowance: 5000,
    medical_allowance: 5000,
    special_allowance: 20000,
    bonus: 10000,
    gross_salary: 110000,
    pf_deduction: 6000,
    professional_tax: 200,
    tds_tax: 11000,
    other_deductions: 0,
    total_deductions: 17200,
    net_salary: 92800,
    employee: {
      id: 101,
      full_name: 'Arthur Dent',
      email: 'arthur@earth.galaxy',
      department: { department_name: 'Exploration' },
      job: { job_title: 'Hitchhiker' },
      country: { country_name: 'United Kingdom', currency_code: 'GBP' },
    },
  };

  test('does not render when isOpen is false', () => {
    const { container } = render(
      <PayslipModal isOpen={false} payroll={mockPayroll} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('does not render when payroll is null', () => {
    const { container } = render(
      <PayslipModal isOpen={true} payroll={null} onClose={jest.fn()} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders payslip details when open', () => {
    render(
      <PayslipModal isOpen={true} payroll={mockPayroll} onClose={jest.fn()} />
    );

    expect(screen.getByText('Arthur Dent')).toBeInTheDocument();
    expect(screen.getByText('arthur@earth.galaxy')).toBeInTheDocument();
    expect(screen.getByText('Exploration')).toBeInTheDocument();
    expect(screen.getByText('Hitchhiker')).toBeInTheDocument();
    expect(screen.getAllByText(/October 2026/i).length).toBeGreaterThanOrEqual(1);
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    render(
      <PayslipModal isOpen={true} payroll={mockPayroll} onClose={handleClose} />
    );

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('triggers PDF download when Download Salary Slip button is clicked', async () => {
    render(
      <PayslipModal isOpen={true} payroll={mockPayroll} onClose={jest.fn()} />
    );

    const downloadBtn = screen.getByRole('button', { name: /Download Salary Slip/i });
    expect(downloadBtn).toBeInTheDocument();

    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(html2pdf).toHaveBeenCalled();
    });
  });
});
