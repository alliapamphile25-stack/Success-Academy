// Page formation : affiche modules/leçons, lecteur vidéo/PDF/quiz, progression, commentaires, inscription/paiement.

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('id');

let state = {
  course: null,
  completedLessonIds: [],
  allLessons: [],
  activeLesson: null,
};

async function loadCourse() {
  const container = document.getElementById('course-container');
  if (!courseId) {
    container.innerHTML = '<p class="text-red-500">Aucune formation spécifiée.</p>';
    return;
  }

  try {
    state.course = await apiFetch(`/courses/${courseId}`, { auth: isLoggedIn() });

    if (isLoggedIn() && state.course.isEnrolled) {
      state.completedLessonIds = await apiFetch(`/progress/${courseId}`);
    }

    const template = document.getElementById('course-template').content.cloneNode(true);
    container.innerHTML = '';
    container.appendChild(template);

    renderCourseHeader();
    renderSidebar();
    bindEnrollButton();
    bindCommentForm();

    // Sélectionne automatiquement la première leçon accessible.
    const firstLesson = state.allLessons[0];
    if (firstLesson) selectLesson(firstLesson);
  } catch (err) {
    container.innerHTML = `<p class="text-red-500">Erreur : ${err.message}</p>`;
  }
}

function renderCourseHeader() {
  document.getElementById('course-title').textContent = state.course.title;
  document.getElementById('course-instructor').textContent = `Par ${state.course.instructor?.name || 'Formateur'} · ${state.course.level}`;

  const enrollBox = document.getElementById('enroll-box');
  if (!state.course.isEnrolled) {
    enrollBox.classList.remove('hidden');
    document.getElementById('course-price').textContent = state.course.price === 0 ? 'Gratuit' : `${state.course.price} ${state.course.currency}`;
  }
}

function renderSidebar() {
  state.allLessons = [];
  const modulesList = document.getElementById('modules-list');
  modulesList.innerHTML = state.course.modules
    .map((m) => {
      const lessonsHtml = m.lessons
        .map((l) => {
          state.allLessons.push(l);
          const locked = !state.course.isEnrolled && !l.isFreePreview;
          const done = state.completedLessonIds.includes(l._id);
          const icon = l.type === 'quiz' ? '📝' : l.type === 'pdf' ? '📄' : '▶️';
          return `
          <button data-lesson-id="${l._id}" ${locked ? 'disabled' : ''}
            class="lesson-item w-full flex items-center gap-2 text-left text-sm px-3 py-2 rounded-lg ${locked ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-blue-50 text-slate-700'}">
            <span>${locked ? '🔒' : done ? '✅' : icon}</span>
            <span class="flex-1">${l.title}</span>
          </button>`;
        })
        .join('');
      return `
      <div>
        <p class="text-xs font-bold text-slate-400 uppercase mb-1 px-3">${m.title}</p>
        <div class="space-y-1">${lessonsHtml}</div>
      </div>`;
    })
    .join('');

  modulesList.querySelectorAll('.lesson-item:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lesson = state.allLessons.find((l) => l._id === btn.dataset.lessonId);
      selectLesson(lesson);
    });
  });

  updateProgressUI();
}

function updateProgressUI() {
  const total = state.allLessons.length;
  const done = state.completedLessonIds.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  document.getElementById('course-progress-label').textContent = `${percent}%`;
  document.getElementById('sidebar-progress-fill').style.width = `${percent}%`;
}

async function selectLesson(lesson) {
  state.activeLesson = lesson;
  document.getElementById('lesson-title').textContent = lesson.title;

  document.querySelectorAll('.lesson-item').forEach((b) => b.classList.remove('bg-blue-50', 'font-semibold'));
  document.querySelector(`[data-lesson-id="${lesson._id}"]`)?.classList.add('bg-blue-50', 'font-semibold');

  const player = document.getElementById('lesson-player');
  const quizBlock = document.getElementById('quiz-block');
  const completeBtn = document.getElementById('btn-complete');
  quizBlock.classList.add('hidden');
  quizBlock.innerHTML = '';

  if (lesson.type === 'video') {
    player.classList.remove('hidden');
    player.innerHTML = `<iframe class="w-full h-full" src="${lesson.videoUrl}" title="${lesson.title}" frameborder="0" allowfullscreen></iframe>`;
  } else if (lesson.type === 'pdf') {
    player.innerHTML = `<iframe class="w-full h-full bg-white" src="${lesson.pdfUrl}" title="${lesson.title}"></iframe>`;
  } else if (lesson.type === 'quiz') {
    player.innerHTML = `<div class="text-slate-400">Répondez au quiz ci-dessous ⬇️</div>`;
    await loadQuiz(lesson._id);
  } else {
    player.innerHTML = `<div class="text-white p-6 text-sm">${lesson.content || ''}</div>`;
  }

  const isDone = state.completedLessonIds.includes(lesson._id);
  if (lesson.type !== 'quiz') {
    completeBtn.classList.toggle('hidden', isDone);
    completeBtn.onclick = () => completeLesson(lesson._id);
  } else {
    completeBtn.classList.add('hidden');
  }

  loadComments(lesson._id);
}

async function completeLesson(lessonId) {
  try {
    const result = await apiFetch('/progress/complete', { method: 'POST', body: { lessonId } });
    if (!state.completedLessonIds.includes(lessonId)) state.completedLessonIds.push(lessonId);
    renderSidebar();
    document.getElementById('btn-complete').classList.add('hidden');
    document.querySelector(`[data-lesson-id="${lessonId}"] span:first-child`).textContent = '✅';

    if (result.certificateIssued && result.certificate) {
      showToast('🎉 Formation terminée ! Votre certificat est disponible.', 'success');
      setTimeout(() => {
        window.location.href = `certificate.html?code=${result.certificate.certificateCode}`;
      }, 1800);
    } else {
      showToast('Leçon marquée comme terminée', 'success');
      goToNextLesson(lessonId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function goToNextLesson(currentLessonId) {
  const index = state.allLessons.findIndex((l) => l._id === currentLessonId);
  const next = state.allLessons[index + 1];
  if (next) selectLesson(next);
}

async function loadQuiz(lessonId) {
  const quizBlock = document.getElementById('quiz-block');
  try {
    const quiz = await apiFetch(`/quizzes/lesson/${lessonId}`);
    quizBlock.classList.remove('hidden');
    quizBlock.innerHTML = `
      <h3 class="font-semibold text-slate-900 mb-1">${quiz.title}</h3>
      <p class="text-xs text-slate-500 mb-4">Score minimum pour valider : ${quiz.passingScore}%</p>
      <form id="quiz-form" class="space-y-5">
        ${quiz.questions
          .map(
            (q, qi) => `
          <fieldset>
            <legend class="text-sm font-medium text-slate-800 mb-2">${qi + 1}. ${q.question}</legend>
            <div class="space-y-2">
              ${q.options
                .map(
                  (opt, oi) => `
                <label class="flex items-center gap-2 text-sm text-slate-600">
                  <input type="radio" name="q${qi}" value="${oi}" required class="text-blue-600">
                  ${opt}
                </label>`
                )
                .join('')}
            </div>
          </fieldset>`
          )
          .join('')}
        <button class="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-blue-700">Valider mes réponses</button>
      </form>
      <div id="quiz-result" class="mt-4 hidden"></div>
    `;

    document.getElementById('quiz-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const answers = quiz.questions.map((_, qi) => Number(e.target[`q${qi}`].value));
      try {
        const attempt = await apiFetch(`/quizzes/${quiz._id}/attempt`, { method: 'POST', body: { answers } });
        const resultEl = document.getElementById('quiz-result');
        resultEl.classList.remove('hidden');
        resultEl.className = `mt-4 p-4 rounded-lg text-sm font-semibold ${attempt.passed ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`;
        resultEl.textContent = attempt.passed
          ? `✅ Score : ${attempt.score}% — Quiz réussi !`
          : `❌ Score : ${attempt.score}% — Score insuffisant, réessayez.`;

        if (attempt.passed) completeLesson(lessonId);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  } catch (err) {
    quizBlock.classList.add('hidden');
  }
}

async function performEnroll(btn) {
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Traitement...';
  }
  try {
    if (state.course.price === 0) {
      await apiFetch('/enrollments', { method: 'POST', body: { courseId } });
      showToast('Inscription réussie !', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      const { url } = await apiFetch('/payments/checkout', { method: 'POST', body: { courseId } });
      window.location.href = url;
    }
  } catch (err) {
    showToast(err.message, 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = "S'inscrire à cette formation";
    }
  }
}

function bindEnrollButton() {
  const btn = document.getElementById('btn-enroll');
  btn?.addEventListener('click', () => {
    if (!isLoggedIn()) {
      window.location.href = `register.html?course=${courseId}`;
      return;
    }
    performEnroll(btn);
  });

  // Arrivée depuis register.html/login.html après inscription à la formation :
  // on déclenche l'inscription automatiquement, sans clic supplémentaire.
  if (isLoggedIn() && urlParams.get('enroll') === '1' && !state.course.isEnrolled) {
    performEnroll(btn);
  }
}

async function loadComments(lessonId) {
  const list = document.getElementById('comments-list');
  if (!isLoggedIn()) {
    list.innerHTML = '<p class="text-sm text-slate-400">Connectez-vous pour participer à la discussion.</p>';
    return;
  }
  try {
    const comments = await apiFetch(`/comments/lesson/${lessonId}`);
    list.innerHTML = comments.length
      ? comments
          .map(
            (c) => `
        <div class="flex gap-3">
          <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">${c.user.name[0]}</div>
          <div>
            <p class="text-sm"><span class="font-semibold text-slate-900">${c.user.name}</span> ${c.user.role !== 'student' ? '<span class="text-xs text-blue-600">(formateur)</span>' : ''}</p>
            <p class="text-sm text-slate-600">${c.text}</p>
          </div>
        </div>`
          )
          .join('')
      : '<p class="text-sm text-slate-400">Aucun commentaire pour le moment.</p>';
  } catch (err) {
    list.innerHTML = '';
  }
}

function bindCommentForm() {
  document.getElementById('comment-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    const input = document.getElementById('comment-input');
    if (!input.value.trim() || !state.activeLesson) return;

    try {
      await apiFetch('/comments', { method: 'POST', body: { lessonId: state.activeLesson._id, text: input.value } });
      input.value = '';
      loadComments(state.activeLesson._id);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', loadCourse);
