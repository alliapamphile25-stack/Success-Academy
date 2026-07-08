// Tableau de bord admin : stats globales, derniers utilisateurs, dernières ventes.

document.getElementById('nav-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

async function loadAdminDashboard() {
  if (!requireAuth(['admin', 'instructor'])) return;

  try {
    const stats = await apiFetch('/admin/stats');
    document.getElementById('stat-users').textContent = stats.usersCount;
    document.getElementById('stat-courses').textContent = stats.coursesCount;
    document.getElementById('stat-enrollments').textContent = stats.enrollmentsCount;
    document.getElementById('stat-revenue').textContent = `${stats.revenue.toFixed(2)} €`;
  } catch (err) {
    showToast(err.message, 'error');
  }

  try {
    const users = await apiFetch('/admin/users');
    document.getElementById('users-table').innerHTML = users
      .slice(0, 8)
      .map(
        (u) => `
      <div class="flex items-center justify-between py-2.5">
        <div>
          <p class="font-medium text-slate-900">${u.name}</p>
          <p class="text-xs text-slate-500">${u.email}</p>
        </div>
        <span class="text-xs font-semibold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'instructor' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}">${u.role}</span>
      </div>`
      )
      .join('');
  } catch (err) {
    /* silencieux */
  }

  try {
    const sales = await apiFetch('/admin/sales');
    document.getElementById('sales-table').innerHTML = sales.length
      ? sales
          .slice(0, 8)
          .map(
            (s) => `
      <div class="flex items-center justify-between py-2.5">
        <div>
          <p class="font-medium text-slate-900">${s.course?.title || 'Formation supprimée'}</p>
          <p class="text-xs text-slate-500">${s.user?.name || ''}</p>
        </div>
        <span class="text-sm font-semibold text-green-600">${s.amount} ${s.currency}</span>
      </div>`
          )
          .join('')
      : '<p class="text-sm text-slate-400 py-4">Aucune vente pour le moment.</p>';
  } catch (err) {
    /* silencieux */
  }
}

document.addEventListener('DOMContentLoaded', loadAdminDashboard);
