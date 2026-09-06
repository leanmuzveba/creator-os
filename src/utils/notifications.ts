/**
 * Thin wrapper around the browser `Notification` API so the Notifications
 * toggle in Profile Settings drives real OS notifications, not just a stored
 * preference — mirroring `flutter_local_notifications` on mobile. Every call
 * is guarded since `Notification` isn't available in every browser/context
 * (e.g. insecure origins), so it degrades to a no-op instead of throwing.
 */
import { logger } from './logger';

/** Requests the browser notification permission. Returns whether it was granted. */
export async function requestPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try {
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (err) {
    logger.warn('Could not request notification permission:', err);
    return false;
  }
}

/** Fires a confirmation notification once the user enables notifications. */
export function showConfirmation(): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  try {
    if (Notification.permission !== 'granted') return;
    new Notification('Notifications enabled', {
      body: "You'll now see Creator OS alerts here and on your lock screen.",
    });
  } catch (err) {
    logger.warn('Could not show notification:', err);
  }
}
