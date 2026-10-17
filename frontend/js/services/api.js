/* =========================================================
   HEYPITCH STORE — Frontend API Client Service
   Safe, reusable REST API consumer for HeyPitch backend.
   ========================================================= */

const API_BASE = (typeof HP_CONFIG !== 'undefined' && HP_CONFIG.apiBaseUrl)
  ? HP_CONFIG.apiBaseUrl
  : 'https://hey-pitch.onrender.com/api/v1';

let authToken = localStorage.getItem('hp_auth_token') || null;

/**
 * Low-level HTTP fetch wrapper with standardized error handling.
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.error?.message || `API request failed with status ${response.status}`;
      const errorCode = data?.error?.code || 'HTTP_ERROR';
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = errorCode;
      error.details = data?.error?.details || null;
      throw error;
    }

    return data;
  } catch (err) {
    // Graceful error propagation without logging sensitive information
    if (!err.status) {
      const netErr = new Error(`Cannot connect to backend server at ${API_BASE}. Ensure server is running.`);
      netErr.code = 'NETWORK_ERROR';
      throw netErr;
    }
    throw err;
  }
}

const HeyPitchAPI = {
  // Liveness and readiness
  getHealth: () => apiRequest('/health'),
  getReady: () => apiRequest('/ready'),

  // Authentication
  setToken: (token) => {
    authToken = token;
    if (token) {
      localStorage.setItem('hp_auth_token', token);
    } else {
      localStorage.removeItem('hp_auth_token');
    }
  },
  getToken: () => authToken,
  register: async (userData) => {
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res?.data?.token) HeyPitchAPI.setToken(res.data.token);
    return res;
  },
  login: async (credentials) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    if (res?.data?.token) HeyPitchAPI.setToken(res.data.token);
    return res;
  },
  getMe: () => apiRequest('/auth/me'),
  logout: async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } finally {
      HeyPitchAPI.setToken(null);
    }
  },

  // Orders
  createOrder: (orderPayload) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  }),
  listOrders: (page = 1, limit = 10) => apiRequest(`/orders?page=${page}&limit=${limit}`),
  getOrder: (orderId) => apiRequest(`/orders/${orderId}`),
  updateOrder: (orderId, updatePayload) => apiRequest(`/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(updatePayload)
  }),
  cancelOrder: (orderId) => apiRequest(`/orders/${orderId}/cancel`, {
    method: 'POST'
  }),

  // Payments
  initiatePayment: (orderId, idempotencyKey = null) => {
    const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {};
    return apiRequest('/payments/create', {
      method: 'POST',
      headers,
      body: JSON.stringify({ orderId })
    });
  },
  getPaymentStatus: (paymentId) => apiRequest(`/payments/${paymentId}`),

  // File and Link Verification
  validateUrl: (url) => apiRequest('/verification/validate-url', {
    method: 'POST',
    body: JSON.stringify({ url })
  }),
  checkResource: (url) => apiRequest('/verification/check', {
    method: 'POST',
    body: JSON.stringify({ url })
  }),

  // Geo IP and Local Currency Detection
  getGeoLookup: () => apiRequest('/geo/lookup')
};

// Expose globally for browser usage
window.HeyPitchAPI = HeyPitchAPI;
