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

// Préserve les paramètres ?course=ID et ?ref=CODE quand on bascule entre inscription/connexion.
function preserveCourseParamInLinks() {
  const params = new URLSearchParams(window.location.search);
  const extra = [];
  if (params.get('course')) extra.push(`course=${params.get('course')}`);
  if (params.get('ref')) extra.push(`ref=${params.get('ref')}`);
  if (!extra.length) return;
  document.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach((link) => {
    link.href = `${link.getAttribute('href')}?${extra.join('&')}`;
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
    referralCode: new URLSearchParams(window.location.search).get('ref') || undefined,
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
