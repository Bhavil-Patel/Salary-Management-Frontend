import { useEffect } from 'react';

export default function useBodyScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      if (originalOverflow) {
        document.body.style.overflow = originalOverflow;
      } else {
        document.body.style.removeProperty('overflow');
      }

      if (originalPaddingRight) {
        document.body.style.paddingRight = originalPaddingRight;
      } else {
        document.body.style.removeProperty('padding-right');
      }
    };
  }, [isLocked]);
}
