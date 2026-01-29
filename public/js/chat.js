import { getCurrentFile, clearUpload } from './upload.js';
import { ensureMap, locateAndMarkHospitals } from './map.js';

export let currentSessionId = null;

export function initChat() {
  const askBtn = document.getElementById("askBtn");
  const sendBtn = document.getElementById("sendBtn");
  const messageInput = document.getElementById("messageInput");

  if (askBtn) askBtn.addEventListener('click', analyzeImage);
  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (messageInput) messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  const newAnalysisBtn = document.getElementById('newAnalysisBtn');
  if (newAnalysisBtn) newAnalysisBtn.addEventListener('click', () => {
    clearChat();
    clearUpload();
    const messageInput = document.getElementById('messageInput');
    if (messageInput) messageInput.value = '';
  });
}

export async function analyzeImage() {
  const askBtn = document.getElementById("askBtn");
  const chatInput = document.getElementById("chatInput");
  const chatHistory = document.getElementById("chatHistory");

  const currentFile = getCurrentFile();
  if (!currentFile) {
    alert('Пожалуйста, выберите изображение');
    return;
  }

  if (askBtn) {
    askBtn.disabled = true;
    askBtn.innerHTML = '<span class="btn-text">Анализируем...</span>';
  }

  clearChat();
  showTypingIndicator();

  try {
    const formData = new FormData();
    formData.append('image', currentFile);

    const res = await fetch('/analyze', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Ошибка при анализе изображения');
    const data = await res.json();

    removeTypingIndicator();
    currentSessionId = data.sessionId;
    showAgeIndicator(data.ageCategory);
    // render medical-aware result if backend provides structured object
    if (data.result && typeof data.result === 'object' && (data.result.diagnosis || data.result.findings)) {
      renderMedicalResult(data.result);
    } else {
      addMessage('ai', data.result);
    }

    if (chatInput) chatInput.style.display = 'flex';
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');
    if (newAnalysisBtn) newAnalysisBtn.style.display = 'block';
    if (chatHistory) chatHistory.classList.add('visible');

    const sideChat = document.getElementById('sideChat');
    if (sideChat) {
      sideChat.classList.add('available');
      const panel = sideChat.querySelector('.side-panel');
      if (panel) panel.classList.add('open');
      document.body.classList.add('side-open');
    }

    const chatSection = document.getElementById('chatSection');
    if (chatSection) chatSection.style.display = 'none';

  } catch (error) {
    removeTypingIndicator();
    alert('Произошла ошибка: ' + error.message);
  } finally {
    if (askBtn) {
      askBtn.disabled = false;
      askBtn.innerHTML = '<span class="btn-text">Анализировать</span><svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 5L20 12L13 19M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
  }
}

export async function sendMessage() {
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('sendBtn');
  const chatHistory = document.getElementById('chatHistory');

  let message = '';
  if (arguments.length > 0 && typeof arguments[0] === 'string') {
    message = arguments[0].trim();
  } else {
    message = messageInput ? messageInput.value.trim() : '';
  }
  if (!message || !currentSessionId) return;

  addMessage('user', message);
  if (messageInput) messageInput.value = '';
  const sideInput = document.getElementById('sideMessageInput');
  if (sideInput) sideInput.value = '';

  if (sendBtn) sendBtn.disabled = true;
  showTypingIndicator();

  try {
    const res = await fetch('/continue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: currentSessionId, message })
    });
    if (!res.ok) throw new Error('Ошибка при отправке сообщения');
    const data = await res.json();
    removeTypingIndicator();
    addMessage('ai', data.result);
  } catch (error) {
    removeTypingIndicator();
    addMessage('ai', 'Извините, произошла ошибка: ' + error.message);
  } finally {
    if (sendBtn) sendBtn.disabled = false;
    if (messageInput) messageInput.focus();
  }
}

export function showAgeIndicator(ageCategory) {
  const ageIndicator = document.getElementById('ageIndicator');
  if (!ageIndicator) return;
  ageIndicator.classList.remove('child','adult','unknown');
  let text = '';
  if (ageCategory === 'child') { ageIndicator.classList.add('child'); text = '👶 Обнаружен ребенок - используется детская консультация'; }
  else if (ageCategory === 'adult') { ageIndicator.classList.add('adult'); text = '👤 Обнаружен взрослый - используется взрослая консультация'; }
  else { ageIndicator.classList.add('unknown'); text = '❓ Возраст не определен - используется общая консультация'; }
  ageIndicator.textContent = text;
  ageIndicator.classList.add('visible');
}

export function addMessage(type, text) {
  const chatHistory = document.getElementById('chatHistory');
  const sideHistory = document.getElementById('sideChatHistory');
  if (!chatHistory && !sideHistory) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  const bubbleDiv = document.createElement('div');
  bubbleDiv.className = 'message-bubble';
  bubbleDiv.textContent = text;
  messageDiv.appendChild(bubbleDiv);
  if (chatHistory) {
    const clone = messageDiv.cloneNode(true);
    chatHistory.appendChild(clone);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }
  if (sideHistory) {
    const clone2 = messageDiv.cloneNode(true);
    sideHistory.appendChild(clone2);
    sideHistory.scrollTop = sideHistory.scrollHeight;
  }
}

function renderMedicalResult(result) {
  const chatHistory = document.getElementById('chatHistory');
  const sideHistory = document.getElementById('sideChatHistory');
  const container = document.createElement('div');
  container.className = 'message ai';
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const title = document.createElement('div');
  title.style.fontWeight = '700';
  title.style.marginBottom = '6px';
  title.textContent = result.diagnosis || 'Медицинский отчёт';
  bubble.appendChild(title);

  if (result.confidence) {
    const conf = document.createElement('div');
    conf.style.opacity = '0.9';
    conf.textContent = `Достоверность: ${Math.round((result.confidence||0)*100)}%`;
    bubble.appendChild(conf);
  }

  if (result.findings) {
    const f = document.createElement('div');
    f.style.marginTop = '8px';
    f.innerHTML = '<strong>Заключение / Находки:</strong><br/>' + escapeHtml(result.findings).replace(/\n/g,'<br/>');
    bubble.appendChild(f);
  }

  if (result.recommendation) {
    const r = document.createElement('div');
    r.style.marginTop = '8px';
    r.innerHTML = '<strong>Рекомендации:</strong><br/>' + escapeHtml(result.recommendation).replace(/\n/g,'<br/>');
    bubble.appendChild(r);
  }

  if (result.urgency && result.urgency === 'high') {
    const warn = document.createElement('div');
    warn.style.marginTop = '10px';
    warn.style.color = '#ffdd57';
    warn.style.fontWeight = '700';
    warn.textContent = 'Срочно: рекомендуется немедленная консультация врача или обращение в неотложную помощь.';
    bubble.appendChild(warn);
  }

  // action row
  const actions = document.createElement('div');
  actions.style.marginTop = '10px';
  const hospitalBtn = document.createElement('button');
  hospitalBtn.textContent = 'Найти ближайшую больницу';
  hospitalBtn.className = 'side-send-btn';
  hospitalBtn.addEventListener('click', () => {
    // open map tab and trigger locating hospitals
    const mapBtn = document.getElementById('navMapBtn');
    if (mapBtn) mapBtn.click();
    try { locateAndMarkHospitals(ensureMap()); } catch(e){ try{ locateAndMarkHospitals(window.map); }catch(_){} }
  });
  actions.appendChild(hospitalBtn);
  bubble.appendChild(actions);

  container.appendChild(bubble);

  if (chatHistory) { chatHistory.appendChild(container); chatHistory.classList.add('visible'); chatHistory.scrollTop = chatHistory.scrollHeight; }
  if (sideHistory) { const clone = container.cloneNode(true); sideHistory.appendChild(clone); sideHistory.scrollTop = sideHistory.scrollHeight; }
}

export function showTypingIndicator() {
  const chatHistory = document.getElementById('chatHistory');
  if (!chatHistory) return;
  const typingDiv = document.createElement('div');
  typingDiv.className = 'message ai typing-message';
  typingDiv.id = 'typingIndicator';
  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  typingDiv.appendChild(indicator);
  chatHistory.appendChild(typingDiv);
  chatHistory.classList.add('visible');
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

export function removeTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) typingIndicator.remove();
}

export function clearChat() {
  const chatHistory = document.getElementById('chatHistory');
  const ageIndicator = document.getElementById('ageIndicator');
  const chatInput = document.getElementById('chatInput');
  const newAnalysisBtn = document.getElementById('newAnalysisBtn');
  if (chatHistory) { chatHistory.innerHTML = ''; chatHistory.classList.remove('visible'); }
  if (ageIndicator) ageIndicator.classList.remove('visible');
  if (chatInput) chatInput.style.display = 'none';
  if (newAnalysisBtn) newAnalysisBtn.style.display = 'none';
  currentSessionId = null;
}
