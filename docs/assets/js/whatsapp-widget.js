// Bouton flottant WhatsApp, injecté sur les pages publiques/apprenant.
// Le numéro se configure dans config.js (CONFIG.WHATSAPP_NUMBER).
(function injectWhatsappButton() {
  if (typeof CONFIG === 'undefined' || !CONFIG.WHATSAPP_NUMBER) return;

  const message = encodeURIComponent("Bonjour, j'ai une question sur Elite Tranaing.");
  const link = document.createElement('a');
  link.href = `https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${message}`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', 'Contactez-nous sur WhatsApp');
  link.className =
    'fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg flex items-center justify-center transition transform hover:scale-105';
  link.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="w-8 h-8 fill-white">
      <path d="M16 0C7.16 0 0 7.16 0 16c0 2.82.74 5.47 2.03 7.76L0 32l8.46-2.22C10.66 30.94 13.26 31.6 16 31.6 24.84 31.6 32 24.44 32 15.6 32 7.16 24.84 0 16 0zm0 29.09c-2.47 0-4.79-.66-6.8-1.82l-.49-.29-5.02 1.32 1.34-4.9-.32-.5A12.87 12.87 0 0 1 3.09 16C3.09 8.83 8.83 3.09 16 3.09S28.91 8.83 28.91 16 23.17 29.09 16 29.09zm7.1-9.68c-.39-.2-2.3-1.14-2.65-1.27-.36-.13-.62-.2-.88.2-.26.39-1 1.27-1.23 1.53-.23.26-.45.29-.84.1-.39-.2-1.65-.61-3.14-1.94-1.16-1.03-1.94-2.31-2.17-2.7-.23-.39-.02-.6.17-.79.18-.18.39-.45.58-.68.2-.23.26-.39.39-.65.13-.26.07-.49-.03-.68-.1-.2-.88-2.12-1.21-2.9-.32-.76-.64-.66-.88-.67h-.75c-.26 0-.68.1-1.04.49-.36.39-1.36 1.33-1.36 3.25s1.39 3.77 1.58 4.03c.2.26 2.73 4.16 6.6 5.84.92.4 1.64.63 2.2.81.92.29 1.76.25 2.42.15.74-.11 2.3-.94 2.62-1.85.32-.9.32-1.68.23-1.84-.1-.16-.36-.26-.75-.46z"/>
    </svg>`;

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(link));
})();
