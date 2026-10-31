// ============================================================
// useSSE Hook — Phase 9
// ============================================================
//
// Client subscription hook for ChaosGuard SSE stream.
//
// Guarantees & Architecture:
// 1. Single Shared Connection: Reuses a single EventSource instance
//    across the dashboard to prevent connection leaks.
// 2. Named SSE Events: Registers listeners using addEventListener()
//    for standard SSE event streams.
// 3. Strict Cleanup: Automatically cleans up listeners and closes
//    EventSource when the dashboard / active components unmount.
// 4. Reconnection Handling: Detects native reconnects and fires
//    onReconnect callbacks so consumers can restore authoritative snapshots.
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';

const SSE_URL = '/api/chaosguard/experiments/stream';

class SSEManager {
  constructor(url) {
    this.url = url;
    this.es = null;
    this.listeners = new Map(); // eventName -> Set of callback functions
    this.eventHandlers = new Map(); // eventName -> native EventSource listener
    this.statusListeners = new Set();
    this.reconnectListeners = new Set();
    this.status = 'disconnected';
    this.refCount = 0;
    this.hasConnectedOnce = false;
  }

  connect() {
    this.refCount += 1;
    if (this.es) return;

    this._setStatus('connecting');
    this.es = new EventSource(this.url);

    this.es.onopen = () => {
      const isReconnecting = this.hasConnectedOnce;
      this.hasConnectedOnce = true;
      this._setStatus('connected');
      console.log('[SSE] Stream connected.');

      if (isReconnecting) {
        console.log('[SSE] Stream reconnected. Triggering snapshot recovery.');
        for (const cb of this.reconnectListeners) {
          try {
            cb();
          } catch (err) {
            console.error('[SSE] Reconnect callback error:', err);
          }
        }
      }
    };

    this.es.onerror = (err) => {
      this._setStatus('disconnected');
      // Native EventSource automatically attempts reconnection in background.
      console.warn('[SSE] Stream disconnected or connection error. Reconnecting...');
    };

    // Attach existing registered event listeners
    for (const eventName of this.listeners.keys()) {
      this._attachNativeListener(eventName);
    }
  }

  disconnect() {
    this.refCount = Math.max(0, this.refCount - 1);
    if (this.refCount === 0 && this.es) {
      console.log('[SSE] Closing shared EventSource connection.');
      this.es.close();
      this.es = null;
      this._setStatus('disconnected');
      this.hasConnectedOnce = false;
      this.eventHandlers.clear();
    }
  }

  _setStatus(status) {
    this.status = status;
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (_) {}
    }
  }

  _attachNativeListener(eventName) {
    if (!this.es || this.eventHandlers.has(eventName)) return;

    const handler = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        const callbacks = this.listeners.get(eventName);
        if (callbacks) {
          for (const cb of callbacks) {
            try {
              cb(parsed);
            } catch (err) {
              console.error(`[SSE] Error in callback for ${eventName}:`, err);
            }
          }
        }
      } catch (err) {
        console.error(`[SSE] Failed to parse SSE payload for ${eventName}:`, err);
      }
    };

    this.es.addEventListener(eventName, handler);
    this.eventHandlers.set(eventName, handler);
  }

  _detachNativeListener(eventName) {
    if (!this.es || !this.eventHandlers.has(eventName)) return;
    const handler = this.eventHandlers.get(eventName);
    this.es.removeEventListener(eventName, handler);
    this.eventHandlers.delete(eventName);
  }

  subscribe(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
      if (this.es) {
        this._attachNativeListener(eventName);
      }
    }

    this.listeners.get(eventName).add(callback);

    // Return unsubscribe function
    return () => {
      const set = this.listeners.get(eventName);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(eventName);
          this._detachNativeListener(eventName);
        }
      }
    };
  }

  onReconnect(callback) {
    this.reconnectListeners.add(callback);
    return () => {
      this.reconnectListeners.delete(callback);
    };
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }
}

// Global shared singleton manager
const sseManager = new SSEManager(SSE_URL);

/**
 * React hook to access real-time SSE stream.
 *
 * @param {Object} eventCallbacks - Map of eventName -> callback function
 * @returns {Object} { status, isConnected, subscribe, onReconnect }
 */
export function useSSE(eventCallbacks = {}) {
  const [status, setStatus] = useState(sseManager.status);
  const callbacksRef = useRef(eventCallbacks);
  callbacksRef.current = eventCallbacks;

  useEffect(() => {
    sseManager.connect();
    const unsubStatus = sseManager.onStatusChange(setStatus);

    // Subscribe to any event handlers provided in arguments
    const unsubs = [];
    const events = Object.keys(callbacksRef.current);
    for (const eventName of events) {
      const handler = (data) => {
        if (callbacksRef.current[eventName]) {
          callbacksRef.current[eventName](data);
        }
      };
      unsubs.push(sseManager.subscribe(eventName, handler));
    }

    return () => {
      unsubs.forEach((unsub) => unsub());
      unsubStatus();
      sseManager.disconnect();
    };
  }, []);

  const subscribe = useCallback((eventName, callback) => {
    return sseManager.subscribe(eventName, callback);
  }, []);

  const onReconnect = useCallback((callback) => {
    return sseManager.onReconnect(callback);
  }, []);

  return {
    status,
    isConnected: status === 'connected',
    subscribe,
    onReconnect,
  };
}

export default useSSE;
