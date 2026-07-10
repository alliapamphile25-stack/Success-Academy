// Gestion des sessions live côté admin : planification (YouTube ou Zoom), démarrage/fin.

document.getElementById('nav-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

async function loadAdminLive() {
  if (!requireAuth(['admin', 'instructor'])) return;

  try {
    const courses = await apiFetch('/admin/courses');
    document.getElementById('live-course-select').innerHTML = courses
      .map((c) => `<option value="${c._id}">${c.title}</option>`)
      .join('');
  } catch (err) {
    showToast(err.message, 'error');
  }

  await refreshLiveList();
}

async function refreshLiveList() {
  const list = document.getElementById('live-admin-list');
  try {
    const sessions = await apiFetch('/live/admin/all');
    list.innerHTML = sessions.length
      ? sessions.map(renderLiveRow).join('')
      : '<p class="text-slate-400">Aucune session live planifiée pour le moment.</p>';

    document.querySelectorAll('.btn-start-live').forEach((btn) =>
      btn.addEventListener('click', () => updateLiveStatus(btn.dataset.id, { isLive: true }))
    );
    document.querySelectorAll('.btn-end-live').forEach((btn) =>
      btn.addEventListener('click', () => updateLiveStatus(btn.dataset.id, { isLive: false, isEnded: true }))
    );
  } catch (err) {
    list.innerHTML = `<p class="text-red-500">${err.message}</p>`;
  }
}

function renderLiveRow(s) {
  const statusBadge = s.isEnded
    ? '<span class="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Terminée</span>'
    : s.isLive
      ? '<span class="text-xs font-semibold bg-red-100 text-red-600 px-2 py-1 rounded-full">🔴 En direct</span>'
      : '<span class="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">À venir</span>';

  return `
    <div class="bg-white rounded-xl border border-slate-100 p-5 flex items-center justify-between flex-wrap gap-3">
      <div>
        <div class="flex items-center gap-2">
          <h3 class="font-semibold text-slate-900">${s.title}</h3>
          ${statusBadge}
          <span class="text-xs text-slate-400">${s.platform === 'zoom' ? 'Zoom' : 'YouTube'}</span>
        </div>
        <p class="text-xs text-slate-500 mt-1">${s.course?.title || ''} · ${new Date(s.scheduledAt).toLocaleString('fr-FR')}</p>
      </div>
      ${
        !s.isEnded
          ? `<div class="flex gap-2">
              ${!s.isLive ? `<button class="btn-start-live text-xs font-semibold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700" data-id="${s._id}">Démarrer</button>` : ''}
              <button class="btn-end-live text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50" data-id="${s._id}">Terminer</button>
            </div>`
          : ''
      }
    </div>`;
}

async function updateLiveStatus(id, body) {
  try {
    await apiFetch(`/live/${id}/status`, { method: 'PUT', body });
    refreshLiveList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('btn-new-live').addEventListener('click', () => {
  document.getElementById('modal-live').classList.remove('hidden');
});
document.getElementById('btn-cancel-live').addEventListener('click', () => {
  document.getElementById('modal-live').classList.add('hidden');
});

document.querySelectorAll('input[name="platform"]').forEach((radio) =>
  radio.addEventListener('change', (e) => {
    const isZoom = e.target.value === 'zoom';
    document.getElementById('field-youtube').classList.toggle('hidden', isZoom);
    document.getElementById('field-zoom').classList.toggle('hidden', !isZoom);
  })
);

document.getElementById('live-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await apiFetch('/live', {
      method: 'POST',
      body: {
        course: fd.get('course'),
        title: fd.get('title'),
        description: fd.get('description'),
        platform: fd.get('platform'),
        youtubeVideoId: fd.get('youtubeVideoId'),
        zoomJoinUrl: fd.get('zoomJoinUrl'),
        scheduledAt: fd.get('scheduledAt'),
      },
    });
    showToast('Session live planifiée', 'success');
    document.getElementById('modal-live').classList.add('hidden');
    e.target.reset();
    refreshLiveList();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.addEventListener('DOMContentLoaded', loadAdminLive);
