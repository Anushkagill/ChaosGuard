// ============================================================
// Formatting Utilities — Phase 7
// ============================================================

export function formatTimestamp(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatDuration(seconds) {
  if (seconds === undefined || seconds === null) return '—';
  const sec = Number(seconds);
  if (isNaN(sec)) return `${seconds}`;
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${m}m ${rem}s`;
}

export function formatLatency(ms) {
  if (ms === undefined || ms === null) return '—';
  const n = Number(ms);
  if (n < 1000) return `${n}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

export function getStatusBadgeVariant(status) {
  switch (status) {
    case 'COMPLETED':
      return 'healthy';
    case 'RUNNING':
    case 'QUEUED':
      return 'running';
    case 'FAILED':
      return 'failed';
    case 'PENDING':
    default:
      return 'neutral';
  }
}
