// Charge et affiche les formations publiées sur la page d'accueil.
async function loadCourses() {
  const grid = document.getElementById('courses-grid');
  try {
    const courses = await apiFetch('/courses', { auth: false });
    if (!courses.length) {
      grid.innerHTML = '<p class="text-slate-400 col-span-3 text-center py-10">Aucune formation disponible pour le moment.</p>';
      return;
    }

    grid.innerHTML = courses
      .map(
        (c) => `
      <a href="course.html?id=${c._id}" class="card-hover bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm block">
        <img src="${c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600'}" alt="${c.title}" class="w-full h-40 object-cover">
        <div class="p-5">
          <span class="text-xs font-semibold text-blue-600 uppercase">${c.category}</span>
          <h3 class="font-bold text-lg text-slate-900 mt-1">${c.title}</h3>
          <p class="text-sm text-slate-500 mt-2 line-clamp-2">${c.shortDescription || ''}</p>
          <div class="flex items-center justify-between mt-4">
            <span class="text-sm text-slate-500">${c.level}</span>
            <span class="font-bold ${c.price === 0 ? 'text-green-600' : 'text-slate-900'}">${c.price === 0 ? 'Gratuit' : c.price + ' ' + (c.currency || 'EUR')}</span>
          </div>
        </div>
      </a>`
      )
      .join('');
  } catch (err) {
    grid.innerHTML = `<p class="text-red-500 col-span-3 text-center py-10">Impossible de charger les formations : ${err.message}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', loadCourses);
