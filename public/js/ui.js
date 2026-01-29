// ui.js — управление вкладками и отображением секций

import { initMapbox, mapInitialized } from './map.js';

export function initUI(mapboxToken) {
  const navHomeBtn = document.getElementById('navHomeBtn');
  const navMapBtn = document.getElementById('navMapBtn');
  const navPharmacyBtn = document.getElementById('navPharmacyBtn');
  const chatSection = document.getElementById('chatSection');
  const mapSection = document.getElementById('mapSection');
  const articlesSection = document.getElementById('articlesSection');
  const pharmacySection = document.getElementById('pharmacySection');

  function clearAllSections() {
    if (chatSection) chatSection.style.display = 'none';
    if (mapSection) mapSection.style.display = 'none';
    if (articlesSection) articlesSection.style.display = 'none';
    if (pharmacySection) pharmacySection.style.display = 'none';
  }

  function setActiveNav(button) {
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    if (button) button.classList.add('active');
  }

  if (navHomeBtn) {
    navHomeBtn.addEventListener('click', () => {
      setActiveNav(navHomeBtn);
      clearAllSections();
      if (chatSection) chatSection.style.display = 'block';
      if (articlesSection) articlesSection.style.display = 'block';
      const uploadSection = document.querySelector('.upload-section');
      const askBtn = document.getElementById('askBtn');
      if (uploadSection) uploadSection.style.display = 'block';
      if (askBtn) askBtn.style.display = 'flex';
      const sideChat = document.getElementById('sideChat');
      if (sideChat) {
        sideChat.classList.remove('available');
        const panel = sideChat.querySelector('.side-panel');
        if (panel) panel.classList.remove('open');
        document.body.classList.remove('side-open');
      }
    });
  }

  if (navMapBtn) {
    navMapBtn.addEventListener('click', () => {
      setActiveNav(navMapBtn);
      clearAllSections();
      if (mapSection) mapSection.style.display = 'block';
      initMapbox(mapboxToken);
      const uploadSection = document.querySelector('.upload-section');
      const askBtn = document.getElementById('askBtn');
      if (uploadSection) uploadSection.style.display = 'none';
      if (askBtn) askBtn.style.display = 'none';
      if (chatSection) chatSection.style.display = 'none';
      const sideChat = document.getElementById('sideChat');
      if (sideChat) {
        sideChat.classList.remove('available');
        const panel = sideChat.querySelector('.side-panel');
        if (panel) panel.classList.remove('open');
      }
      document.body.classList.remove('side-open');
    });
  }

  if (navPharmacyBtn) {
    navPharmacyBtn.addEventListener('click', () => {
      setActiveNav(navPharmacyBtn);
      clearAllSections();
      if (pharmacySection) pharmacySection.style.display = 'block';
      const uploadSection = document.querySelector('.upload-section');
      const askBtn = document.getElementById('askBtn');
      if (uploadSection) uploadSection.style.display = 'none';
      if (askBtn) askBtn.style.display = 'none';
      if (chatSection) chatSection.style.display = 'none';
      const sideChat = document.getElementById('sideChat');
      if (sideChat) {
        sideChat.classList.remove('available');
        const panel = sideChat.querySelector('.side-panel');
        if (panel) panel.classList.remove('open');
      }
      document.body.classList.remove('side-open');
    });
  }
  
  const sideChat = document.getElementById('sideChat');
  if (sideChat) {
    const panel = sideChat.querySelector('.side-panel');
    const sideSend = document.getElementById('sideSendBtn');
    const sideInput = document.getElementById('sideMessageInput');

    const mo = new MutationObserver(() => {
      if (sideChat.classList.contains('available')) {
        function onMoveOnce() {
          panel.classList.add('open');
          document.body.classList.add('side-open');
          document.removeEventListener('mousemove', onMoveOnce);
        }
        document.addEventListener('mousemove', onMoveOnce);
      }
    });
    mo.observe(sideChat, { attributes: true });

    document.addEventListener('click', (e) => {
      if (!sideChat.contains(e.target) && document.body.classList.contains('side-open')) {
        panel.classList.remove('open');
        document.body.classList.remove('side-open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('side-open')) {
        panel.classList.remove('open');
        document.body.classList.remove('side-open');
      }
    });

    if (sideSend && sideInput) {
      sideSend.addEventListener('click', () => {
        if (window.chatModule && typeof window.chatModule.sendMessage === 'function') {
          window.chatModule.sendMessage(sideInput.value || '');
        }
      });
      sideInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sideSend.click();
        }
      });
    }
  }
}
