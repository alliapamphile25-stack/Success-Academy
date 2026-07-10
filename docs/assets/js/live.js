// Page live : liste des sessions accessibles, puis salle de live avec player YouTube + chat Socket.io.

let socket = null;
let currentLiveId = null;

async function loadLiveSessions() {
  if (!requireAuth()) return;
  const list = document.getElementById('live-sessions-list');

  const liveIdParam = new URLSearchParams(window.location.search).get('id');
  if (liveIdParam) return enterLiveRoom(liveIdParam);

  try {
    const sessions = await apiFetch('/live');
    if (!sessions.length) {
      list.innerHTML = '<p class="text-slate-400">Aucune session live programmée pour le moment.</p>';
      return;
    }
    list.innerHTML = sessions
      .map(
        (s) => `
      <div class="bg-white rounded-xl border border-slate-100 p-5">
        <div class="flex items-center gap-2 mb-2">
          ${s.isLive ? '<span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span><span class="text-xs font-bold text-red-600">EN DIRECT</span>' : '<span class="text-xs font-semibold text-slate-400">À VENIR</span>'}
        </div>
        <h3 class="font-semibold text-slate-900">${s.title} <span class="text-xs font-normal text-slate-400">${s.platform === 'zoom' ? '(Zoom)' : '(YouTube)'}</span></h3>
        <p class="text-xs text-slate-500 mt-1">${s.course?.title || ''} · ${new Date(s.scheduledAt).toLocaleString('fr-FR')}</p>
        <a href="live.html?id=${s._id}" class="inline-block mt-3 text-sm font-semibold text-blue-600 hover:underline">Rejoindre →</a>
      </div>`
      )
      .join('');
  } catch (err) {
    list.innerHTML = `<p class="text-red-500">${err.message}</p>`;
  }
}

async function enterLiveRoom(liveId) {
  document.getElementById('live-list-view').classList.add('hidden');
  document.getElementById('live-room-view').classList.remove('hidden');
  currentLiveId = liveId;

  try {
    const { session, messages } = await apiFetch(`/live/${liveId}`);
    document.getElementById('live-title').textContent = session.title;
    document.getElementById('live-description').textContent = session.description || '';

    const playerEl = document.getElementById('live-player');
    if (session.platform === 'zoom') {
      // Zoom ne s'intègre pas dans une iframe (restriction de leur plateforme) :
      // on affiche un bouton qui ouvre la réunion dans un nouvel onglet.
      playerEl.innerHTML = `
        <div class="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-6">
          <span class="text-4xl">🎥</span>
          <p class="text-white font-semibold">Cette session se déroule sur Zoom</p>
          <a href="${session.zoomJoinUrl}" target="_blank" rel="noopener" class="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition">Rejoindre la réunion Zoom →</a>
        </div>`;
    } else {
      playerEl.innerHTML = `<iframe class="w-full h-full" src="https://www.youtube.com/embed/${session.youtubeVideoId}?autoplay=1" title="${session.title}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    }

    const chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML = messages.map(renderChatMessage).join('');
    chatBox.scrollTop = chatBox.scrollHeight;

    connectChatSocket(liveId);

    document.getElementById('chat-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('chat-input');
      if (!input.value.trim() || !socket) return;
      socket.emit('send-message', { liveSessionId: liveId, text: input.value });
      input.value = '';
    });
  } catch (err) {
    document.getElementById('live-room-view').innerHTML = `<p class="text-red-500">${err.message}</p>`;
  }
}

function renderChatMessage(m) {
  const isStaff = m.role === 'admin' || m.role === 'instructor';
  return `
    <div>
      <span class="font-semibold ${isStaff ? 'text-blue-600' : 'text-slate-900'}">${m.userName}${isStaff ? ' 🎓' : ''}</span>
      <span class="text-slate-600">: ${m.text}</span>
    </div>`;
}

function connectChatSocket(liveId) {
  const token = localStorage.getItem('lms_token');
  socket = io(CONFIG.SOCKET_URL, { auth: { token } });

  socket.on('connect', () => socket.emit('join-live', { liveSessionId: liveId }));

  socket.on('new-message', (msg) => {
    const chatBox = document.getElementById('chat-messages');
    chatBox.insertAdjacentHTML('beforeend', renderChatMessage(msg));
    chatBox.scrollTop = chatBox.scrollHeight;
  });

  socket.on('connect_error', (err) => showToast(`Chat indisponible : ${err.message}`, 'error'));
}

window.addEventListener('beforeunload', () => {
  if (socket && currentLiveId) socket.emit('leave-live', { liveSessionId: currentLiveId });
});

document.addEventListener('DOMContentLoaded', loadLiveSessions);
