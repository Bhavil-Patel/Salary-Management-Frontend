import reportWebVitals from './reportWebVitals';

jest.mock('web-vitals', () => ({
  __esModule: true,
  getCLS: jest.fn(),
  getFID: jest.fn(),
  getFCP: jest.fn(),
  getLCP: jest.fn(),
  getTTFB: jest.fn(),
}));

describe('reportWebVitals', () => {
  it('does not trigger web vitals if callback is missing or not a function', () => {
    expect(() => reportWebVitals()).not.toThrow();
    expect(() => reportWebVitals(null)).not.toThrow();
    expect(() => reportWebVitals('not-a-func')).not.toThrow();
  });

  it('triggers web vitals metrics when passed a valid function', async () => {
    const mockCallback = jest.fn();
    const onPerfEntry = (metric) => mockCallback(metric);

    reportWebVitals(onPerfEntry);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const webVitals = await import('web-vitals');
    expect(webVitals.getCLS).toHaveBeenCalledWith(onPerfEntry);
    expect(webVitals.getFID).toHaveBeenCalledWith(onPerfEntry);
    expect(webVitals.getFCP).toHaveBeenCalledWith(onPerfEntry);
    expect(webVitals.getLCP).toHaveBeenCalledWith(onPerfEntry);
    expect(webVitals.getTTFB).toHaveBeenCalledWith(onPerfEntry);
  });
});
