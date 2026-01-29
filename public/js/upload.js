export let currentFile = null;

export function initUpload() {
  const fileInput = document.getElementById("imageInput");
  const uploadLabel = document.getElementById("uploadLabel");
  const fileName = document.getElementById("fileName");
  const previewWrapper = document.getElementById("previewWrapper");
  const imagePreview = document.getElementById("imagePreview");
  const removeBtn = document.getElementById("removeBtn");
  const askBtn = document.getElementById("askBtn");

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
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

  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    resetUpload();
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

  function resetUpload() {
    currentFile = null;
    fileInput.value = "";
    fileName.classList.remove("visible");
    previewWrapper.classList.remove("visible");
    uploadLabel.style.display = "flex";
    askBtn.disabled = true;
  }

  return { getCurrentFile: () => currentFile, clearUpload: resetUpload };
}

export function getCurrentFile() { return currentFile; }

export function clearUpload() {
  const fileInput = document.getElementById("imageInput");
  const uploadLabel = document.getElementById("uploadLabel");
  const fileName = document.getElementById("fileName");
  const previewWrapper = document.getElementById("previewWrapper");
  const askBtn = document.getElementById("askBtn");
  currentFile = null;
  if (fileInput) fileInput.value = "";
  if (fileName) fileName.classList.remove("visible");
  if (previewWrapper) previewWrapper.classList.remove("visible");
  if (uploadLabel) uploadLabel.style.display = "flex";
  if (askBtn) askBtn.disabled = true;
}
