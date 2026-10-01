// ============================================================
// API HTTP Client — Phase 7
// ============================================================

export async function request(endpoint, options = {}) {
  const { timeout = 8000, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const body =
      fetchOptions.body && typeof fetchOptions.body === 'object'
        ? JSON.stringify(fetchOptions.body)
        : fetchOptions.body;

    const response = await fetch(endpoint, {
      ...fetchOptions,
      body,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
      signal: controller.signal,
    });

    clearTimeout(id);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error((data && data.message) || `HTTP error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return { status: response.status, data };
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error(`Request timed out after ${timeout}ms`);
      timeoutErr.status = 504;
      throw timeoutErr;
    }
    throw err;
  }
}
