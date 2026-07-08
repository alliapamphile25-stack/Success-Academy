// Gestion des formations côté admin : créer/publier des formations, ajouter modules et leçons.

document.getElementById('nav-logout')?.addEventListener('click', (e) => {
  e.preventDefault();
  logout();
});

let expandedCourseId = null;

async function loadAdminCourses() {
  if (!requireAuth(['admin', 'instructor'])) return;
  const list = document.getElementById('courses-admin-list');
  try {
    const courses = await apiFetch('/admin/courses');
    list.innerHTML = courses.map(renderCourseRow).join('');
    bindCourseRowEvents(courses);
  } catch (err) {
    list.innerHTML = `<p class="text-red-500">${err.message}</p>`;
  }
}

function renderCourseRow(c) {
  return `
    <div class="bg-white rounded-xl border border-slate-100 p-5">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-slate-900">${c.title}</h3>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${c.isPublished ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">${c.isPublished ? 'Publié' : 'Brouillon'}</span>
          </div>
          <p class="text-xs text-slate-500 mt-1">${c.price === 0 ? 'Gratuit' : c.price + ' ' + c.currency} · ${c.studentsCount} inscrits</p>
        </div>
        <div class="flex gap-2">
          <button class="btn-add-module text-xs font-semibold border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50" data-course-id="${c._id}">+ Module</button>
          <button class="btn-toggle-course text-xs font-semibold text-blue-600 hover:underline" data-course-id="${c._id}">Gérer le contenu</button>
        </div>
      </div>
      <div class="course-modules mt-4 hidden" data-course-id="${c._id}"></div>
    </div>`;
}

function bindCourseRowEvents(courses) {
  document.getElementById('btn-new-course').addEventListener('click', () => openModal('modal-course'));
  document.getElementById('btn-cancel-course').addEventListener('click', () => closeModal('modal-course'));
  document.querySelectorAll('.btn-cancel-modal').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fixed.inset-0').forEach((m) => m.classList.add('hidden'));
    })
  );

  document.querySelectorAll('.btn-toggle-course').forEach((btn) =>
    btn.addEventListener('click', () => toggleCourseModules(btn.dataset.courseId))
  );

  document.querySelectorAll('.btn-add-module').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.getElementById('module-form').dataset.courseId = btn.dataset.courseId;
      openModal('modal-module');
    })
  );
}

async function toggleCourseModules(courseId) {
  const container = document.querySelector(`.course-modules[data-course-id="${courseId}"]`);
  if (!container.classList.contains('hidden')) {
    container.classList.add('hidden');
    return;
  }
  document.querySelectorAll('.course-modules').forEach((el) => el.classList.add('hidden'));
  container.classList.remove('hidden');
  container.innerHTML = '<p class="text-xs text-slate-400">Chargement...</p>';

  try {
    const course = await apiFetch(`/courses/${courseId}`);
    container.innerHTML = course.modules.length
      ? course.modules
          .map(
            (m) => `
      <div class="border-l-2 border-blue-200 pl-4 mb-3">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-slate-800">${m.title}</p>
          <button class="btn-add-lesson text-xs text-blue-600 hover:underline" data-course-id="${courseId}" data-module-id="${m._id}">+ Leçon</button>
        </div>
        <ul class="mt-1 space-y-1">
          ${m.lessons.map((l) => `<li class="text-xs text-slate-500">${l.type === 'quiz' ? '📝' : l.type === 'pdf' ? '📄' : '▶️'} ${l.title}</li>`).join('') || '<li class="text-xs text-slate-300">Aucune leçon</li>'}
        </ul>
      </div>`
          )
          .join('')
      : '<p class="text-xs text-slate-400">Aucun module. Cliquez sur "+ Module" pour commencer.</p>';

    container.querySelectorAll('.btn-add-lesson').forEach((btn) =>
      btn.addEventListener('click', () => {
        const form = document.getElementById('lesson-form');
        form.dataset.courseId = btn.dataset.courseId;
        form.dataset.moduleId = btn.dataset.moduleId;
        openModal('modal-lesson');
      })
    );
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-red-500">${err.message}</p>`;
  }
}

function openModal(id) {
  document.getElementById(id).classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

document.getElementById('course-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  try {
    await apiFetch('/courses', {
      method: 'POST',
      body: {
        title: fd.get('title'),
        description: fd.get('description'),
        shortDescription: fd.get('shortDescription'),
        thumbnail: fd.get('thumbnail'),
        category: fd.get('category'),
        level: fd.get('level'),
        price: Number(fd.get('price')) || 0,
        isPublished: fd.get('isPublished') === 'on',
      },
    });
    showToast('Formation créée avec succès', 'success');
    closeModal('modal-course');
    e.target.reset();
    loadAdminCourses();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('module-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const courseId = e.target.dataset.courseId;
  try {
    await apiFetch(`/courses/${courseId}/modules`, {
      method: 'POST',
      body: { title: fd.get('title'), order: Number(fd.get('order')) || 0 },
    });
    showToast('Module ajouté', 'success');
    closeModal('modal-module');
    e.target.reset();
    toggleCourseModules(courseId);
    toggleCourseModules(courseId);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.getElementById('lesson-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const courseId = e.target.dataset.courseId;
  const moduleId = e.target.dataset.moduleId;
  try {
    await apiFetch(`/courses/${courseId}/modules/${moduleId}/lessons`, {
      method: 'POST',
      body: {
        title: fd.get('title'),
        type: fd.get('type'),
        videoUrl: fd.get('videoUrl'),
        pdfUrl: fd.get('pdfUrl'),
        duration: Number(fd.get('duration')) || 0,
        order: Number(fd.get('order')) || 0,
        isFreePreview: fd.get('isFreePreview') === 'on',
      },
    });
    showToast('Leçon ajoutée', 'success');
    closeModal('modal-lesson');
    e.target.reset();
    toggleCourseModules(courseId);
    toggleCourseModules(courseId);
  } catch (err) {
    showToast(err.message, 'error');
  }
});

document.addEventListener('DOMContentLoaded', loadAdminCourses);
