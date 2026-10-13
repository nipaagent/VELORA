import { auth } from './firebase';

export type PushSubscriptionStatus = 'subscribed' | 'denied' | 'unsupported' | 'unavailable' | 'error';

/**
 * Converts a base64 string to a Uint8Array for applicationServerKey
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers Web Push notification using VAPID
 */
export async function registerPush(): Promise<PushSubscriptionStatus> {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('serviceWorker' in navigator && 'PushManager' in window)) {
    return 'unsupported';
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    console.warn('[WebPush] VITE_VAPID_PUBLIC_KEY is missing');
    return 'unavailable';
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // ONLY ask permission if Notification.permission === 'default'
    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return 'denied';
    }

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      });
    }

    // Attach Firebase ID token in Authorization header if user is signed in
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth.currentUser) {
      try {
        const idToken = await auth.currentUser.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
      } catch (tokErr) {
        console.warn('[WebPush] Failed to get Firebase ID token:', tokErr);
      }
    }

    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers,
      body: JSON.stringify(subscription.toJSON()),
    });

    if (!response.ok) {
      console.warn('[WebPush] Server subscribe response not ok:', response.status);
    }

    return 'subscribed';
  } catch (err) {
    console.error('[WebPush] registerPush error:', err);
    return 'error';
  }
}

/**
 * Disables Web Push notifications and notifies backend
 */
export async function disablePush(): Promise<string> {
  if (typeof window === 'undefined') return 'unsupported';
  if (!('serviceWorker' in navigator && 'PushManager' in window)) {
    return 'unsupported';
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (auth.currentUser) {
          try {
            const idToken = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${idToken}`;
          } catch (tokErr) {
            console.warn('[WebPush] Failed to get Firebase ID token:', tokErr);
          }
        }

        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers,
          body: JSON.stringify({ endpoint }),
        }).catch(err => console.warn('[WebPush] unsubscribe fetch failed:', err));
      }
    }
    return 'unsubscribed';
  } catch (err) {
    console.error('[WebPush] disablePush error:', err);
    return 'error';
  }
}

/**
 * Checks whether user currently has an active subscription
 */
export async function getPushSubscriptionState(): Promise<{
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  subscribed: boolean;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator && 'PushManager' in window)) {
    return { supported: false, permission: 'unsupported', subscribed: false };
  }

  const permission = Notification.permission;
  let subscribed = false;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      subscribed = Boolean(subscription);
    }
  } catch {
    subscribed = false;
  }

  return {
    supported: true,
    permission,
    subscribed,
  };
}
