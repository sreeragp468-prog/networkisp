const API_BASE = (() => {
  const isFile = window.location.protocol === 'file:';
  const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isFile || (isLocalHost && window.location.port !== '5000')) {
    return 'http://localhost:5000/api/networks';
  }
  return '/api/networks';
})();

// Toast Notification System
function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 12px;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgColor = type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6';
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  
  toast.style.cssText = `
    background-color: ${bgColor};
    color: #ffffff;
    padding: 12px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    font-weight: 500;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;
  
  toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// LocalStorage Backup Cache Helper
const LocalCache = {
  key: 'network_manager_records',
  get() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  save(data) {
    try {
      if (Array.isArray(data)) {
        localStorage.setItem(this.key, JSON.stringify(data));
      }
    } catch (e) {}
  }
};

// API Service Layer
const ApiService = {
  async getAll(search = '', status = '') {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'All') params.append('status', status);
      
      const res = await fetch(`${API_BASE}?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to fetch network records');
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        LocalCache.save(json.data);
      }
      return json;
    } catch (err) {
      console.error('Fetch error:', err);
      const cached = LocalCache.get();
      if (cached && cached.length > 0) {
        let filtered = cached;
        if (status && status !== 'All') {
          filtered = filtered.filter(i => i.status === status);
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(i =>
            (i.ispName && i.ispName.toLowerCase().includes(q)) ||
            (i.userName && i.userName.toLowerCase().includes(q)) ||
            (i.location && i.location.toLowerCase().includes(q)) ||
            (i.serviceAddress && i.serviceAddress.toLowerCase().includes(q))
          );
        }
        return { success: true, count: filtered.length, data: filtered };
      }
      showToast(err.message, 'error');
      return { success: false, data: [] };
    }
  },

  async getById(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load record details');
      return json;
    } catch (err) {
      console.error('GetById error:', err);
      const cached = LocalCache.get();
      if (cached) {
        const item = cached.find(i => String(i._id) === String(id));
        if (item) return { success: true, data: item };
      }
      showToast(err.message, 'error');
      return { success: false, data: null };
    }
  },

  async create(data) {
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save network configuration');
      showToast('Network details saved successfully!', 'success');
      return json;
    } catch (err) {
      console.error('Create error:', err);
      showToast(err.message, 'error');
      return { success: false };
    }
  },

  async update(id, data) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to update network configuration');
      showToast('Network record updated successfully!', 'success');
      return json;
    } catch (err) {
      console.error('Update error:', err);
      showToast(err.message, 'error');
      return { success: false };
    }
  },

  async delete(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete record');
      showToast('Network record deleted successfully', 'success');
      return json;
    } catch (err) {
      console.error('Delete error:', err);
      showToast(err.message, 'error');
      return { success: false };
    }
  }
};
