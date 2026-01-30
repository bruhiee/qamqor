// facts.js — управляет всплывающими фактами и подсветкой статей
export function initFacts() {
  const badges = Array.from(document.querySelectorAll('.fact-badge'));
  if (!badges.length) return;

  // Создаём элемент попапа
  const popup = document.createElement('div');
  popup.className = 'fact-popup';
  document.body.appendChild(popup);

  function showFact(text) {
    popup.textContent = text;
    popup.style.display = 'block';
    setTimeout(() => { popup.style.display = 'none'; }, 6000);
  }

  badges.forEach(b => {
    const fact = b.getAttribute('data-fact') || 'Интересный факт';
    b.addEventListener('click', (e) => {
      showFact(fact);
      const card = b.closest('.article-card');
      if (card) {
        card.classList.add('highlight');
        setTimeout(() => card.classList.remove('highlight'), 4200);
      }
    });
    // hover также показывает краткий превью
    b.addEventListener('mouseenter', () => {
      popup.textContent = fact;
      popup.style.display = 'block';
    });
    b.addEventListener('mouseleave', () => {
      popup.style.display = 'none';
    });
  });

  // Периодически подсвечивать случайную статью и показывать факт
  setInterval(() => {
    const idx = Math.floor(Math.random() * badges.length);
    const b = badges[idx];
    const fact = b.getAttribute('data-fact');
    if (!b) return;
    const card = b.closest('.article-card');
    if (card) {
      card.classList.add('highlight');
      setTimeout(() => card.classList.remove('highlight'), 4200);
    }
    showFact(fact);
  }, 15000);
}

export default { initFacts };
