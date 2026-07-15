// Met à jour dynamiquement les liens de la navbar selon l'état de connexion
// et affiche le compteur de notifications non lues. Appelé sur chaque page.
async function initNavbar() {
  const guestLinks = document.getElementById('nav-guest');
  const userLinks = document.getElementById('nav-user');
  const adminLink = document.getElementById('nav-admin');
  const userNameEl = document.getElementById('nav-user-name');
  const logoutBtn = document.getElementById('nav-logout');

  // On force l'affichage via style.display plutôt que la classe Tailwind "hidden" :
  // ces éléments portent aussi "md:flex" en dur dans le HTML, qui l'emporterait
  // sinon sur "hidden" à partir du breakpoint md et ferait apparaître les deux
  // blocs (invité + connecté) en même temps sur desktop.
  if (isLoggedIn()) {
    const user = getCurrentUser();
    if (guestLinks) guestLinks.style.display = 'none';
    if (userLinks) userLinks.style.display = '';
    if (userNameEl) userNameEl.textContent = user?.name || '';
    if (adminLink) adminLink.classList.toggle('hidden', !['admin', 'instructor'].includes(user?.role));

    logoutBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });

    loadNotificationBadge();
  } else {
    if (guestLinks) guestLinks.style.display = '';
    if (userLinks) userLinks.style.display = 'none';
  }

  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
  });
}

async function loadNotificationBadge() {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  try {
    const notifications = await apiFetch('/notifications/me');
    const unread = notifications.filter((n) => !n.isRead).length;
    badge.textContent = unread;
    badge.classList.toggle('hidden', unread === 0);
  } catch (e) {
    /* silencieux : la navbar ne doit pas casser la page si l'API est indisponible */
  }
}

document.addEventListener('DOMContentLoaded', initNavbar);
