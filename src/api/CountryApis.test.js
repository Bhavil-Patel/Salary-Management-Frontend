import apiConfig from './ApiConfig';
import {
  getCountries,
  getCountryById,
  addCountry,
  updateCountry,
  deleteCountry,
} from './CountryApis';

jest.mock('./ApiConfig');

describe('api/CountryApis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  describe('getCountries', () => {
    test('fetches countries with pagination and formatted query params', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: {
          data: [{ id: 1, country_name: 'India', country_code: 'IN', currency_code: 'INR' }],
          totalRecords: 1,
        },
      });

      const result = await getCountries({
        page: 1,
        limit: 10,
        search: ' India ',
        country_code: ' in ',
      });

      expect(apiConfig.get).toHaveBeenCalledWith('/country', {
        params: {
          page: 1,
          limit: 10,
          search: 'India',
          country_code: 'IN',
        },
      });
      expect(result.data).toHaveLength(1);
    });

    test('supports all=true flag', async () => {
      apiConfig.get.mockResolvedValueOnce({ data: { data: [] } });

      await getCountries({ all: true });

      expect(apiConfig.get).toHaveBeenCalledWith('/country', {
        params: { all: true },
      });
    });
  });

  describe('getCountryById', () => {
    test('throws error if ID is missing', async () => {
      await expect(getCountryById()).rejects.toThrow('Country ID is required.');
    });

    test('fetches country by ID', async () => {
      apiConfig.get.mockResolvedValueOnce({
        data: { id: 1, country_name: 'United States', country_code: 'US' },
      });

      const result = await getCountryById(1);
      expect(apiConfig.get).toHaveBeenCalledWith('/country/1');
      expect(result.country_name).toBe('United States');
    });
  });

  describe('addCountry', () => {
    test('throws error if required fields are missing', async () => {
      await expect(
        addCountry({ country_code: '', country_name: 'Test', currency_code: 'TST' })
      ).rejects.toThrow('country_code, country_name, and currency_code are required.');
    });

    test('uppercases country_code and currency_code before posting', async () => {
      apiConfig.post.mockResolvedValueOnce({ data: { id: 2, country_name: 'Canada' } });

      const result = await addCountry({
        country_code: 'ca',
        country_name: '  Canada  ',
        currency_code: 'cad',
      });

      expect(apiConfig.post).toHaveBeenCalledWith('/country/add', {
        country_code: 'CA',
        country_name: 'Canada',
        currency_code: 'CAD',
      });
      expect(result.id).toBe(2);
    });
  });

  describe('updateCountry', () => {
    test('throws error if ID is missing', async () => {
      await expect(updateCountry(null, {})).rejects.toThrow('Country ID is required.');
    });

    test('updates country and normalizes country_code and currency_code to uppercase', async () => {
      apiConfig.put.mockResolvedValueOnce({ data: { success: true } });

      const result = await updateCountry(3, {
        country_code: 'uk',
        country_name: 'United Kingdom',
        currency_code: 'gbp',
      });

      expect(apiConfig.put).toHaveBeenCalledWith('/country/update', {
        id: 3,
        country_code: 'UK',
        country_name: 'United Kingdom',
        currency_code: 'GBP',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('deleteCountry', () => {
    test('throws error if ID is missing', async () => {
      await expect(deleteCountry()).rejects.toThrow('Country ID is required.');
    });

    test('deletes country by ID', async () => {
      apiConfig.delete.mockResolvedValueOnce({ data: { success: true } });

      const result = await deleteCountry(8);
      expect(apiConfig.delete).toHaveBeenCalledWith('/country/8');
      expect(result.success).toBe(true);
    });
  });
});
