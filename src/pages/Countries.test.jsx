import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Countries from './Countries';
import { getCountries } from '../api/CountryApis';

jest.mock('../api/CountryApis');

describe('pages/Countries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  const mockCountries = [
    { id: 1, country_name: 'India', country_code: 'IN', currency_code: 'INR', employee_count: 20 },
    { id: 2, country_name: 'United States', country_code: 'US', currency_code: 'USD', employee_count: 10 },
  ];

  test('renders countries page and displays country records', async () => {
    getCountries.mockResolvedValueOnce({ data: mockCountries });

    render(<Countries />);

    expect(screen.getByRole('heading', { name: /Countries/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('India')).toBeInTheDocument();
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('INR')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
    });
  });

  test('opens add country modal when Add Country button is clicked', async () => {
    getCountries.mockResolvedValueOnce({ data: [] });

    render(<Countries />);

    const addBtn = screen.getByRole('button', { name: /Add Country/i });
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);

    expect(screen.getByRole('heading', { name: /Add Country/i })).toBeInTheDocument();
  });
});
