/**
 * UMBC HvZ - API Client Helper
 */
const HvZ = {
  // Core fetch wrapper
  async request(url, options = {}) {
    const defaults = { headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin' };
    const opts = { ...defaults, ...options };
    if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
      opts.body = JSON.stringify(opts.body);
    }
    if (opts.body instanceof FormData) {
      delete opts.headers['Content-Type'];
    }
    const res = await fetch(url, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },

  get(url) { return this.request(url); },
  post(url, body) { return this.request(url, { method: 'POST', body }); },
  del(url) { return this.request(url, { method: 'DELETE' }); },

  // Auth
  async getMe() { return this.get('/api/auth/me'); },
  async getSalt() { return this.get('/api/auth/salt'); },
  async login(username, hash) { return this.post('/api/auth/login', { username, hash }); },
  async logout() { return this.post('/api/auth/logout'); },
  async register(data) { return this.post('/api/auth/register', data); },
  async recover(data) { return this.post('/api/auth/recover', data); },
  async resetPassword(data) { return this.post('/api/auth/reset', data); },

  // Sidebar
  async getSidebar() { return this.get('/api/sidebar'); },

  // Helpers
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
