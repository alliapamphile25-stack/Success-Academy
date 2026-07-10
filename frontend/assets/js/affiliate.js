// Page "Programme d'affiliation" : lien de parrainage, statistiques, historique des commissions.

async function loadAffiliatePage() {
  if (!requireAuth()) return;

  try {
    const stats = await apiFetch('/affiliate/me');

    const referralLink = `${window.location.origin}${window.location.pathname.replace('affiliate.html', '')}register.html?ref=${stats.referralCode}`;
    document.getElementById('referral-link').value = referralLink;

    document.getElementById('stat-referred').textContent = stats.referredCount;
    document.getElementById('stat-pending').textContent = `${stats.pendingTotal} €`;
    document.getElementById('stat-paid').textContent = `${stats.paidTotal} €`;

    const listEl = document.getElementById('commissions-list');
    listEl.innerHTML = stats.commissions.length
      ? stats.commissions
          .map(
            (c) => `
        <div class="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-4">
          <div>
            <p class="text-sm font-semibold text-slate-900">${c.course?.title || 'Formation supprimée'}</p>
            <p class="text-xs text-slate-500 mt-0.5">Filleul : ${c.referredUser?.name || 'Utilisateur'} · ${new Date(c.createdAt).toLocaleDateString('fr-FR')}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-slate-900">${c.amount} €</p>
            <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}">${c.status === 'paid' ? 'Payée' : 'En attente'}</span>
          </div>
        </div>`
          )
          .join('')
      : '<p class="text-slate-400 text-sm">Aucune commission pour le moment — partagez votre lien pour commencer à gagner !</p>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.getElementById('btn-copy-link')?.addEventListener('click', () => {
  const input = document.getElementById('referral-link');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    showToast('Lien copié !', 'success');
  });
});

document.addEventListener('DOMContentLoaded', loadAffiliatePage);
