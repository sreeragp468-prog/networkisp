const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port === '5500'
  ? 'http://localhost:5000/api/networks'
  : '/api/networks';

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
      return json;
    } catch (err) {
      console.error('Fetch error:', err);
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
