import apiConfig from './ApiConfig';

describe('api/ApiConfig', () => {
  test('has configured baseURL, timeout, and json content-type header', () => {
    expect(apiConfig.defaults.baseURL).toBeTruthy();
    expect(apiConfig.defaults.timeout).toBe(30000);
    expect(
      apiConfig.defaults.headers['Content-Type'] ||
      apiConfig.defaults.headers.common?.['Content-Type'] ||
      apiConfig.defaults.headers.post?.['Content-Type']
    ).toBe('application/json');
  });

  test('default baseURL points to backend API endpoint', () => {
    expect(apiConfig.defaults.baseURL).toMatch(/https:\/\/salary-management-backend-vcnr\.onrender\.com\/api/);
  });
});
