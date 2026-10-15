import { renderHook } from '@testing-library/react';
import useBodyScrollLock from './useBodyScrollLock';

describe('useBodyScrollLock', () => {
  let originalOverflow;
  let originalPaddingRight;

  beforeEach(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  });

  afterEach(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  });

  test('does not modify body overflow when isLocked is false', () => {
    renderHook(() => useBodyScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });

  test('sets overflow to hidden when isLocked is true', () => {
    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  test('restores previous overflow when isLocked toggles back to false', () => {
    document.body.style.overflow = 'visible';

    const { rerender, unmount } = renderHook(({ locked }) => useBodyScrollLock(locked), {
      initialProps: { locked: true },
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ locked: false });
    expect(document.body.style.overflow).toBe('visible');

    unmount();
  });

  test('adds paddingRight when scrollbar width is greater than 0', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(document.documentElement, 'clientWidth', {
      writable: true,
      configurable: true,
      value: 1008,
    });

    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.paddingRight).toBe('16px');

    unmount();
    expect(document.body.style.paddingRight).toBe('');
  });
});
