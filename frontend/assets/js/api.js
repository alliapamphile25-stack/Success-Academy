// Petit wrapper autour de fetch() qui :
// - préfixe automatiquement l'URL de l'API
// - ajoute le JWT stocké en localStorage dans l'en-tête Authorization
// - lève une erreur lisible en cas de réponse non-OK
async function apiFetch(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('lms_token');
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${CONFIG.API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    /* réponse sans corps JSON (ex: 204) */
  }

  if (!res.ok) {
    throw new Error(data?.message || `Erreur ${res.status}`);
  }
  return data;
}

function getCurrentUser() {
  const raw = localStorage.getItem('lms_user');
  return raw ? JSON.parse(raw) : null;
}

function isLoggedIn() {
  return !!localStorage.getItem('lms_token');
}

function saveSession(userData) {
  const { token, ...user } = userData;
  localStorage.setItem('lms_token', token);
  localStorage.setItem('lms_user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('lms_token');
  localStorage.removeItem('lms_user');
  window.location.href = 'login.html';
}

// Protège une page : redirige vers login.html si non connecté,
// ou vérifie un rôle minimum requis (ex: 'admin').
function requireAuth(requiredRole) {
  if (!isLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  if (requiredRole) {
    const user = getCurrentUser();
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!user || !roles.includes(user.role)) {
      window.location.href = 'dashboard.html';
      return false;
    }
  }
  return true;
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
    document.body.appendChild(el);
    return el;
  })();

  const colors = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    error: 'bg-red-600',
  };

  const toast = document.createElement('div');
  toast.className = `${colors[type] || colors.info} text-white px-4 py-3 rounded-lg shadow-lg text-sm animate-fade-in`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.remove(), 4000);
}
