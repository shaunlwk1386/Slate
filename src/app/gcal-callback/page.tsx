'use client';
import { useEffect } from 'react';

export default function GcalCallbackPage() {
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('access_token');
    const error = params.get('error');

    const channel = new BroadcastChannel('gcal-auth');
    channel.postMessage(token ? { token } : { error: error || 'auth_failed' });
    channel.close();
    window.close();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#fff', background: '#1a202c', minHeight: '100vh' }}>
      Authenticating…
    </div>
  );
}
