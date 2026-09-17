const TOKEN_KEY = 'kta_admin_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return Boolean(getToken());
}

async function request(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm && body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) setToken(null);
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),

  getKids: () => request('/kids'),
  createKid: (kid) => request('/kids', { method: 'POST', body: kid }),
  updateKid: (id, kid) => request(`/kids/${id}`, { method: 'PUT', body: kid }),
  deleteKid: (id) => request(`/kids/${id}`, { method: 'DELETE' }),

  getKidGoals: (id) => request(`/kids/${id}/goals`),
  getKidProgress: (id) => request(`/kids/${id}/progress`),
  getKidRedemptions: (id) => request(`/kids/${id}/redemptions`),
  redeemReward: (id, reward_id) => request(`/kids/${id}/redeem`, { method: 'POST', body: { reward_id } }),

  createGoal: (goal) => request('/goals', { method: 'POST', body: goal }),
  updateGoal: (id, goal) => request(`/goals/${id}`, { method: 'PUT', body: goal }),
  deleteGoal: (id) => request(`/goals/${id}`, { method: 'DELETE' }),

  createTask: (task) => request('/tasks', { method: 'POST', body: task }),
  updateTask: (id, task) => request(`/tasks/${id}`, { method: 'PUT', body: task }),
  toggleTask: (id) => request(`/tasks/${id}/toggle`, { method: 'PATCH' }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  getRewards: () => request('/rewards'),
  createReward: (reward) => request('/rewards', { method: 'POST', body: reward }),
  updateReward: (id, reward) => request(`/rewards/${id}`, { method: 'PUT', body: reward }),
  deleteReward: (id) => request(`/rewards/${id}`, { method: 'DELETE' }),

  uploadPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('/upload', { method: 'POST', body: form, isForm: true });
  },
};
