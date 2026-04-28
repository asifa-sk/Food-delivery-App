import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { fetchLiveTracking } from '../api/trackingApi';

function getWsUrl() {
  const configuredBase = import.meta.env.VITE_WS_BASE_URL;
  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, '')}/ws-tracking`;
  }

  if (typeof window === 'undefined') {
    return 'http://localhost:8081/ws-tracking';
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase && /^https?:\/\//.test(apiBase)) {
    return `${apiBase.replace(/\/api\/?$/, '').replace(/\/$/, '')}/ws-tracking`;
  }

  return `${window.location.protocol}//${window.location.hostname}:8081/ws-tracking`;
}

export default function useOrderTrackingStream({ customerId, orderId, enabled = true }) {
  const [tracking, setTracking] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');
  const [error, setError] = useState('');
  const nearbyToastRef = useRef('');
  const lastSnapshotRef = useRef('');

  useEffect(() => {
    if (!enabled || !customerId || !orderId) {
      setTracking(null);
      setConnectionState('idle');
      setError('');
      lastSnapshotRef.current = '';
      return undefined;
    }

    let isMounted = true;
    let subscriptions = [];
    let client = null;
    let pollIntervalId = null;

    const applyTrackingSnapshot = (payload) => {
      const serialized = JSON.stringify(payload || {});
      if (serialized === lastSnapshotRef.current) {
        return;
      }
      lastSnapshotRef.current = serialized;
      setTracking(payload);
    };

    const refreshSnapshot = async ({ silent = false } = {}) => {
      try {
        const { data } = await fetchLiveTracking(customerId, orderId);
        if (!isMounted) {
          return;
        }
        applyTrackingSnapshot(data);
        if (!silent) {
          setError('');
        }
      } catch (fetchError) {
        if (isMounted && !silent) {
          setError(fetchError?.response?.data?.message || 'Unable to load live tracking snapshot.');
        }
      }
    };

    setConnectionState('connecting');
    refreshSnapshot();
    pollIntervalId = setInterval(() => {
      refreshSnapshot({ silent: true });
    }, 5000);

    const activateTracking = async () => {
      try {
        if (typeof globalThis !== 'undefined' && typeof globalThis.global === 'undefined') {
          globalThis.global = globalThis;
        }

        const { default: SockJS } = await import('sockjs-client');
        if (!isMounted) {
          return;
        }

        client = new Client({
          reconnectDelay: 5000,
          webSocketFactory: () => new SockJS(getWsUrl()),
          onConnect: () => {
            if (!isMounted) return;
            setConnectionState('connected');
            setError('');
            const handleMessage = (message) => {
              try {
                const payload = JSON.parse(message.body);
                if (isMounted) {
                  applyTrackingSnapshot(payload);
                }
              } catch (streamError) {
                console.error('tracking stream parse failed', streamError);
              }
            };

            subscriptions = [
              client.subscribe(`/topic/orders/${orderId}/tracking`, handleMessage),
              client.subscribe(`/topic/customers/${customerId}/tracking`, handleMessage),
            ];
          },
          onStompError: (frame) => {
            if (!isMounted) return;
            setConnectionState('error');
            setError(frame?.headers?.message || 'Live tracking stream failed.');
          },
          onWebSocketClose: () => {
            if (!isMounted) return;
            setConnectionState((current) => (current === 'connected' ? 'reconnecting' : current));
          },
          onWebSocketError: () => {
            if (!isMounted) return;
            setConnectionState('error');
            setError('Unable to connect to live tracking right now.');
          },
        });

        client.activate();
      } catch (streamSetupError) {
        console.error('tracking stream setup failed', streamSetupError);
        if (isMounted) {
          setConnectionState('error');
          setError('Live tracking is temporarily unavailable.');
        }
      }
    };

    activateTracking();

    return () => {
      isMounted = false;
      subscriptions.forEach((subscription) => subscription.unsubscribe());
      if (client) {
        client.deactivate();
      }
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [customerId, enabled, orderId]);

  useEffect(() => {
    if (!tracking?.notificationMessage || tracking.notificationMessage === nearbyToastRef.current) {
      return;
    }
    nearbyToastRef.current = tracking.notificationMessage;
  }, [tracking]);

  return {
    tracking,
    connectionState,
    error,
  };
}
