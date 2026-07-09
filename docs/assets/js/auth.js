// Gère la soumission des formulaires d'inscription et de connexion.

// Si l'utilisateur arrivait depuis une page formation (ex: register.html?course=ID),
// on le renvoie directement dessus pour finaliser l'inscription à cette formation.
function redirectAfterLogin() {
  const user = getCurrentUser();
  const courseId = new URLSearchParams(window.location.search).get('course');
  if (courseId) {
    window.location.href = `course.html?id=${courseId}&enroll=1`;
    return;
  }
  if (user && ['admin', 'instructor'].includes(user.role)) {
    window.location.href = 'admin/index.html';
  } else {
    window.location.href = 'dashboard.html';
  }
}

// Préserve le paramètre ?course=ID quand on bascule entre les liens inscription/connexion.
function preserveCourseParamInLinks() {
  const courseId = new URLSearchParams(window.location.search).get('course');
  if (!courseId) return;
  document.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach((link) => {
    link.href = `${link.getAttribute('href')}?course=${courseId}`;
  });
}
document.addEventListener('DOMContentLoaded', preserveCourseParamInLinks);

document.getElementById('register-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = document.getElementById('register-error');
  const submitBtn = document.getElementById('register-submit');
  errorEl.classList.add('hidden');

  const payload = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
  };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Création du compte...';

  try {
    const data = await apiFetch('/auth/register', { method: 'POST', body: payload, auth: false });
    saveSession(data);
    redirectAfterLogin();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = "S'inscrire";
  }
});

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const errorEl = document.getElementById('login-error');
  const submitBtn = document.getElementById('login-submit');
  errorEl.classList.add('hidden');

  const payload = { email: form.email.value.trim(), password: form.password.value };

  submitBtn.disabled = true;
  submitBtn.textContent = 'Connexion...';

  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: payload, auth: false });
    saveSession(data);
    redirectAfterLogin();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Se connecter';
  }
});

// Si l'utilisateur est déjà connecté et arrive sur login/register, on le redirige.
if (isLoggedIn() && (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html'))) {
  redirectAfterLogin();
}
