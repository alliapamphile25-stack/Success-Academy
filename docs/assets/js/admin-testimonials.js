// Gestion des témoignages côté admin : création, édition, publication/dépublication, suppression.

document.getElementById('nav-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

async function loadTestimonials() {
  if (!requireAuth(['admin', 'instructor'])) return;
  await refreshTestimonialsList();
}

async function refreshTestimonialsList() {
  const list = document.getElementById('testimonials-admin-list');
  try {
    const testimonials = await apiFetch('/admin/testimonials');
    list.innerHTML = testimonials.length
      ? testimonials.map(renderTestimonialRow).join('')
      : '<p class="text-slate-400">Aucun témoignage pour le moment.</p>';

    document.querySelectorAll('.btn-edit-testimonial').forEach((btn) =>
      btn.addEventListener('click', () => openEditModal(testimonials.find((t) => t._id === btn.dataset.id)))
    );
    document.querySelectorAll('.btn-toggle-testimonial').forEach((btn) =>
      btn.addEventListener('click', () => togglePublished(btn.dataset.id, btn.dataset.published === 'true'))
    );
    document.querySelectorAll('.btn-delete-testimonial').forEach((btn) =>
      btn.addEventListener('click', () => deleteTestimonial(btn.dataset.id))
    );
  } catch (err) {
    list.innerHTML = `<p class="text-red-500">${err.message}</p>`;
  }
}

function renderTestimonialRow(t) {
  return `
    <div class="bg-white rounded-xl border border-slate-100 p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-slate-900">${t.name}${t.role ? ` <span class="text-xs font-normal text-slate-400">— ${t.role}</span>` : ''}</h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${t.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}">${t.isPublished ? 'Publié' : 'Masqué'}</span>
          </div>
          <p class="text-sm text-slate-600 mt-2">"${t.text}"</p>
        </div>
        <div class="flex flex-col gap-2 shrink-0">
          <button class="btn-edit-testimonial text-xs font-semibold text-blue-600 hover:underline" data-id="${t._id}">Modifier</button>
          <button class="btn-toggle-testimonial text-xs font-semibold text-slate-500 hover:underline" data-id="${t._id}" data-published="${t.isPublished}">${t.isPublished ? 'Masquer' : 'Publier'}</button>
          <button class="btn-delete-testimonial text-xs font-semibold text-red-600 hover:underline" data-id="${t._id}">Supprimer</button>
        </div>
      </div>
    </div>`;
}

function openEditModal(testimonial) {
  const form = document.getElementById('testimonial-form');
  document.getElementById('modal-testimonial-title').textContent = 'Modifier le témoignage';
  form.id.value = testimonial._id;
  form.name.value = testimonial.name;
  form.role.value = testimonial.role || '';
  form.text.value = testimonial.text;
  form.isPublished.checked = testimonial.isPublished;
  document.getElementById('modal-testimonial').classList.remove('hidden');
}

async function togglePublished(id, currentlyPublished) {
  try {
    await apiFetch(`/admin/testimonials/${id}`, { method: 'PUT', body: { isPublished: !currentlyPublished } });
    refreshTestimonialsList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteTestimonial(id) {
  if (!confirm('Supprimer ce témoignage définitivement ?')) return;
  try {
    await apiFetch(`/admin/testimonials/${id}`, { method: 'DELETE' });
    showToast('Témoignage supprimé', 'success');
    refreshTestimonialsList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('btn-new-testimonial').addEventListener('click', () => {
  const form = document.getElementById('testimonial-form');
  form.reset();
  form.id.value = '';
  document.getElementById('modal-testimonial-title').textContent = 'Nouveau témoignage';
  document.getElementById('modal-testimonial').classList.remove('hidden');
});
document.getElementById('btn-cancel-testimonial').addEventListener('click', () => {
  document.getElementById('modal-testimonial').classList.add('hidden');
});

document.getElementById('testimonial-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const id = fd.get('id');
  const body = {
    name: fd.get('name'),
    role: fd.get('role'),
    text: fd.get('text'),
    isPublished: fd.get('isPublished') === 'on',
  };

  try {
    if (id) {
      await apiFetch(`/admin/testimonials/${id}`, { method: 'PUT', body });
    } else {
      await apiFetch('/admin/testimonials', { method: 'POST', body });
    }
    showToast('Témoignage enregistré', 'success');
    document.getElementById('modal-testimonial').classList.add('hidden');
    refreshTestimonialsList();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.addEventListener('DOMContentLoaded', loadTestimonials);
