// Charge les formations de l'utilisateur connecté et ses statistiques de progression.
async function loadDashboard() {
  if (!requireAuth()) return;

  const inProgressEl = document.getElementById('enrollments-inprogress');
  const historyEl = document.getElementById('enrollments-history');
  try {
    const [enrollments, certificates] = await Promise.all([
      apiFetch('/enrollments/me'),
      apiFetch('/certificates/me'),
    ]);

    const inProgress = enrollments.filter((e) => e.progressPercent < 100);
    const completed = enrollments.filter((e) => e.progressPercent >= 100);

    document.getElementById('stat-inprogress').textContent = inProgress.length;
    document.getElementById('stat-completed').textContent = completed.length;
    document.getElementById('stat-certificates').textContent = certificates.length;

    if (!enrollments.length) {
      inProgressEl.innerHTML = `
        <div class="bg-white rounded-xl border border-slate-100 p-10 text-center">
          <p class="text-slate-500">Vous n'êtes inscrit à aucune formation pour le moment.</p>
          <a href="index.html#formations" class="inline-block mt-4 text-blue-600 font-semibold hover:underline">Découvrir le catalogue →</a>
        </div>`;
      document.getElementById('heading-history')?.classList.add('hidden');
      return;
    }

    inProgressEl.innerHTML = inProgress.length
      ? inProgress.map((e) => renderCourseCard(e)).join('')
      : '<p class="text-slate-400 text-sm">Aucune formation en cours pour le moment.</p>';

    historyEl.innerHTML = completed.length
      ? completed.map((e) => renderCourseCard(e, certificates)).join('')
      : '<p class="text-slate-400 text-sm">Aucune formation terminée pour le moment.</p>';
  } catch (err) {
    inProgressEl.innerHTML = `<p class="text-red-500">Erreur de chargement : ${err.message}</p>`;
  }
}

function renderCourseCard(enrollment, certificates) {
  const course = enrollment.course;
  if (!course) return '';
  const certificate = certificates?.find((c) => c.course?._id === course._id);

  return `
    <div class="card-hover flex flex-col sm:flex-row gap-4 bg-white rounded-xl border border-slate-100 p-5">
      <a href="course.html?id=${course._id}" class="shrink-0">
        <img src="${course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400'}" class="w-full sm:w-40 h-28 object-cover rounded-lg" alt="${course.title}">
      </a>
      <div class="flex-1">
        <div class="flex items-start justify-between gap-4">
          <a href="course.html?id=${course._id}">
            <h3 class="font-semibold text-slate-900 hover:text-blue-600">${course.title}</h3>
            <p class="text-xs text-slate-500 mt-1">Par ${course.instructor?.name || 'Formateur'}</p>
          </a>
          ${enrollment.progressPercent >= 100 ? '<span class="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full whitespace-nowrap">Terminé ✓</span>' : ''}
        </div>
        <div class="mt-4">
          <div class="flex justify-between text-xs text-slate-500 mb-1">
            <span>Progression</span>
            <span>${enrollment.progressPercent}%</span>
          </div>
          <div class="progress-bar-track"><div class="progress-bar-fill" style="width:${enrollment.progressPercent}%"></div></div>
        </div>
        ${
          certificate
            ? `<a href="certificate.html?code=${certificate.certificateCode}" class="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline">🏆 Voir mon certificat →</a>`
            : ''
        }
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', loadDashboard);
