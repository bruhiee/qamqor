const tabs = document.querySelectorAll('.nav-tab');
const panels = document.querySelectorAll('.tab-panel');
const chatInput = document.querySelector('.chat-input input');
const articleCards = document.querySelectorAll('.article-card');
const modal = document.getElementById('articleModal');
const modalTitle = document.getElementById('modalTitle');
const modalSummary = document.getElementById('modalSummary');
const modalTags = document.getElementById('modalTags');
const modalClose = document.querySelector('.modal-close');

function setActiveTab(tabName) {
  tabs.forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
    tab.setAttribute('aria-selected', tab.dataset.tab === tabName ? 'true' : 'false');
  });

  panels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tabName}`);
  });

  if (tabName !== 'assistant') {
    document.body.classList.remove('chat-active');
  }
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setActiveTab(tab.dataset.tab);
  });
});

if (chatInput) {
  const activateChat = () => document.body.classList.add('chat-active');
  chatInput.addEventListener('focus', activateChat);
  chatInput.addEventListener('click', activateChat);
}

articleCards.forEach((card) => {
  card.addEventListener('click', () => {
    const title = card.dataset.title || card.querySelector('h3')?.textContent || 'Статья';
    const summary = card.dataset.summary || '';
    const tags = (card.dataset.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);

    if (modalTitle) modalTitle.textContent = title;
    if (modalSummary) modalSummary.textContent = summary;
    if (modalTags) {
      modalTags.innerHTML = '';
      tags.forEach((tag) => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = tag;
        modalTags.appendChild(span);
      });
    }

    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
    }
  });
});

function closeModal() {
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

setActiveTab('assistant');
