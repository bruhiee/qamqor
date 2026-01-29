const fileInput = document.getElementById("imageInput");
const uploadLabel = document.getElementById("uploadLabel");
const fileName = document.getElementById("fileName");
const previewWrapper = document.getElementById("previewWrapper");
const imagePreview = document.getElementById("imagePreview");
const removeBtn = document.getElementById("removeBtn");
const askBtn = document.getElementById("askBtn");
const ageIndicator = document.getElementById("ageIndicator");
const chatHistory = document.getElementById("chatHistory");
const chatInput = document.getElementById("chatInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newAnalysisBtn = document.getElementById("newAnalysisBtn");

let currentFile = null;
let currentSessionId = null;

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
});

uploadLabel.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadLabel.classList.add("drag-over");
});

uploadLabel.addEventListener("dragleave", () => {
  uploadLabel.classList.remove("drag-over");
});

uploadLabel.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadLabel.classList.remove("drag-over");
  
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith("image/")) {
    handleFile(file);
  }
});

function handleFile(file) {
  currentFile = file;
  
  fileName.textContent = file.name;
  fileName.classList.add("visible");
  
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    previewWrapper.classList.add("visible");
    uploadLabel.style.display = "none";
  };
  reader.readAsDataURL(file);
  
  askBtn.disabled = false;
}

removeBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  resetUpload();
});

function resetUpload() {
  currentFile = null;
  fileInput.value = "";
  fileName.classList.remove("visible");
  previewWrapper.classList.remove("visible");
  uploadLabel.style.display = "flex";
  askBtn.disabled = true;
}

askBtn.addEventListener("click", async () => {
  if (!currentFile) {
    alert("Пожалуйста, выберите изображение");
    return;
  }

  askBtn.disabled = true;
  askBtn.innerHTML = '<span class="btn-text">Анализируем...</span>';
  
  clearChat();
  
  showTypingIndicator();

  try {
    const formData = new FormData();
    formData.append("image", currentFile);

    const res = await fetch("/analyze", {
      method: "POST",
      body: formData
    });

    if (!res.ok) {
      throw new Error("Ошибка при анализе изображения");
    }

    const data = await res.json();
    
    removeTypingIndicator();
    
    currentSessionId = data.sessionId;
    
    showAgeIndicator(data.ageCategory);
    
    addMessage("ai", data.result);
    
    chatInput.style.display = "flex";
    newAnalysisBtn.style.display = "block";
    chatHistory.classList.add("visible");

  } catch (error) {
    removeTypingIndicator();
    alert("Произошла ошибка: " + error.message);
  } finally {
    askBtn.disabled = false;
    askBtn.innerHTML = '<span class="btn-text">Анализировать</span><svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 5L20 12L13 19M4 12H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
});

sendBtn.addEventListener("click", sendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const message = messageInput.value.trim();
  
  if (!message || !currentSessionId) {
    return;
  }
  
  addMessage("user", message);
  
  messageInput.value = "";
  
  sendBtn.disabled = true;
  
  showTypingIndicator();

  try {
    const res = await fetch("/continue", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        message: message
      })
    });

    if (!res.ok) {
      throw new Error("Ошибка при отправке сообщения");
    }

    const data = await res.json();
    
    removeTypingIndicator();
    
    addMessage("ai", data.result);

  } catch (error) {
    removeTypingIndicator();
    addMessage("ai", "Извините, произошла ошибка: " + error.message);
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
  }
}

function showAgeIndicator(ageCategory) {
  ageIndicator.classList.remove("child", "adult", "unknown");
  
  let text = "";
  if (ageCategory === "child") {
    ageIndicator.classList.add("child");
    text = "👶 Обнаружен ребенок - используется детская консультация";
  } else if (ageCategory === "adult") {
    ageIndicator.classList.add("adult");
    text = "👤 Обнаружен взрослый - используется взрослая консультация";
  } else {
    ageIndicator.classList.add("unknown");
    text = "❓ Возраст не определен - используется общая консультация";
  }
  
  ageIndicator.textContent = text;
  ageIndicator.classList.add("visible");
}

function addMessage(type, text) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  
  const bubbleDiv = document.createElement("div");
  bubbleDiv.className = "message-bubble";
  bubbleDiv.textContent = text;
  
  messageDiv.appendChild(bubbleDiv);
  chatHistory.appendChild(messageDiv);
  
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showTypingIndicator() {
  const typingDiv = document.createElement("div");
  typingDiv.className = "message ai typing-message";
  typingDiv.id = "typingIndicator";
  
  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
  
  typingDiv.appendChild(indicator);
  chatHistory.appendChild(typingDiv);
  chatHistory.classList.add("visible");
  
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function removeTypingIndicator() {
  const typingIndicator = document.getElementById("typingIndicator");
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

function clearChat() {
  chatHistory.innerHTML = "";
  chatHistory.classList.remove("visible");
  ageIndicator.classList.remove("visible");
  chatInput.style.display = "none";
  newAnalysisBtn.style.display = "none";
  currentSessionId = null;
}

newAnalysisBtn.addEventListener("click", () => {
  clearChat();
  resetUpload();
  messageInput.value = "";
});