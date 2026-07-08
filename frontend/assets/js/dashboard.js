// Charge les formations de l'utilisateur connecté et ses statistiques de progression.
async function loadDashboard() {
  if (!requireAuth()) return;

  const listEl = document.getElementById('enrollments-list');
  try {
    const [enrollments, certificates] = await Promise.all([
      apiFetch('/enrollments/me'),
      apiFetch('/certificates/me'),
    ]);

    const inProgress = enrollments.filter((e) => e.progressPercent < 100).length;
    const completed = enrollments.filter((e) => e.progressPercent >= 100).length;

    document.getElementById('stat-inprogress').textContent = inProgress;
    document.getElementById('stat-completed').textContent = completed;
    document.getElementById('stat-certificates').textContent = certificates.length;

    if (!enrollments.length) {
      listEl.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 p-10 text-center">
          <p class="text-slate-500">Vous n'êtes inscrit à aucune formation pour le moment.</p>
          <a href="index.html#formations" class="inline-block mt-4 text-blue-600 font-semibold hover:underline">Découvrir le catalogue →</a>
        </div>`;
      return;
    }

    listEl.innerHTML = enrollments
      .map((e) => {
        const course = e.course;
        if (!course) return '';
        return `
        <a href="course.html?id=${course._id}" class="card-hover flex flex-col sm:flex-row gap-4 bg-white rounded-xl border border-slate-100 p-5">
          <img src="${course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}" class="w-full sm:w-40 h-28 object-cover rounded-lg" alt="${course.title}">
          <div class="flex-1">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h3 class="font-semibold text-slate-900">${course.title}</h3>
                <p class="text-xs text-slate-500 mt-1">Par ${course.instructor?.name || 'Formateur'}</p>
              </div>
              ${e.progressPercent >= 100 ? '<span class="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">Terminé ✓</span>' : ''}
            </div>
            <div class="mt-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progression</span>
                <span>${e.progressPercent}%</span>
              </div>
              <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${e.progressPercent}%"></div></div>
            </div>
          </div>
        </a>`;
      })
      .join('');
  } catch (err) {
    listEl.innerHTML = `<p class="text-red-500">Erreur de chargement : ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadDashboard);
