export type HapticType = 'light' | 'medium' | 'success' | 'warning' | 'error';

/**
 * Triggers subtle haptic feedback (vibration) on supported mobile devices.
 * Completely safe to call on desktops, iOS, or unsupported browsers (fails silently).
 */
export function triggerHaptic(type: HapticType = 'light'): void {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
  if (!('vibrate' in navigator) || typeof navigator.vibrate !== 'function') return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'success':
        navigator.vibrate([15, 35, 20]);
        break;
      case 'warning':
        navigator.vibrate([30, 40, 30]);
        break;
      case 'error':
        navigator.vibrate([40, 50, 40]);
        break;
    }
  } catch {
    // Fail silently on browsers with strict vibration permissions
  }
}
