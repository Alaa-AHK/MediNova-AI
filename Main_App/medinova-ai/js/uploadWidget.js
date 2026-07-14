/**
 * uploadWidget.js
 * -------------------------------------------------------
 * Small reusable piece of UI: an upload dropzone that shows
 * an image preview once a file is chosen. Both analysis pages
 * (skin.js, xray.js) use this so drag/drop logic isn't
 * duplicated.
 * -------------------------------------------------------
 */

export function mountUploadWidget(container, { onFileSelected }) {
  container.innerHTML = `
    <label class="upload-zone" id="upload-zone">
      <span class="icon-badge" style="margin:0 auto 10px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 16V4M12 4 7 9M12 4l5 5"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>
        </svg>
      </span>
      <div><strong>Click to upload</strong> or drag an image here</div>
      <div class="hint">JPG or PNG</div>
      <input type="file" accept="image/*" id="upload-input" />
    </label>

    <div class="upload-alt-row">
      <span class="upload-alt-sep"><span class="line"></span>or<span class="line"></span></span>
      <button type="button" class="btn btn-ghost" id="camera-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 8a2 2 0 0 1 2-2h1.2a1 1 0 0 0 .87-.5l.66-1.15A1 1 0 0 1 9.6 4h4.8a1 1 0 0 1 .87.5l.66 1.15a1 1 0 0 0 .87.5H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"/>
          <circle cx="12" cy="13" r="3.4"/>
        </svg>
        Take a photo
      </button>
    </div>

    <div id="camera-panel" class="camera-panel" style="display:none;">
      <video id="camera-video" autoplay playsinline muted></video>
      <div class="camera-controls">
        <button type="button" class="btn btn-primary" id="camera-capture-btn">Capture</button>
        <button type="button" class="btn btn-ghost" id="camera-cancel-btn">Cancel</button>
      </div>
      <div class="camera-error error-box" id="camera-error" style="display:none;"></div>
    </div>

    <div id="preview-slot" style="margin-top:16px;"></div>
  `;

  const zone = container.querySelector("#upload-zone");
  const fileInput = container.querySelector("#upload-input");
  const previewSlot = container.querySelector("#preview-slot");
  const cameraBtn = container.querySelector("#camera-btn");
  const cameraPanel = container.querySelector("#camera-panel");
  const cameraVideo = container.querySelector("#camera-video");
  const cameraCaptureBtn = container.querySelector("#camera-capture-btn");
  const cameraCancelBtn = container.querySelector("#camera-cancel-btn");
  const cameraError = container.querySelector("#camera-error");

  let stream = null;

  function handleFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    previewSlot.innerHTML = `
      <div class="preview-wrap" id="preview-wrap">
        <img src="${url}" alt="Selected image preview" />
      </div>
    `;
    onFileSelected(file, previewSlot.querySelector("#preview-wrap"));
  }

  fileInput.addEventListener("change", (e) => handleFile(e.target.files[0]));

  ["dragenter", "dragover"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.add("drag-over");
    })
  );
  ["dragleave", "drop"].forEach((evt) =>
    zone.addEventListener(evt, (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
    })
  );
  zone.addEventListener("drop", (e) => {
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  async function openCamera() {
    cameraError.style.display = "none";
    cameraPanel.style.display = "block";
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraVideo.srcObject = stream;
    } catch (err) {
      cameraError.textContent =
        "Couldn't access the camera (permission denied, no camera found, or the page isn't served over HTTPS/localhost).";
      cameraError.style.display = "block";
    }
  }

  function closeCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    cameraPanel.style.display = "none";
  }

  cameraBtn.addEventListener("click", openCamera);
  cameraCancelBtn.addEventListener("click", closeCamera);

  cameraCaptureBtn.addEventListener("click", () => {
    if (!stream) return;
    const canvas = document.createElement("canvas");
    canvas.width = cameraVideo.videoWidth;
    canvas.height = cameraVideo.videoHeight;
    canvas.getContext("2d").drawImage(cameraVideo, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      handleFile(file);
      closeCamera();
    }, "image/jpeg", 0.92);
  });

  return { previewSlot };
}

// Adds/removes the animated "scanning" line over the image preview
export function setScanning(previewWrapEl, isScanning) {
  if (!previewWrapEl) return;
  let line = previewWrapEl.querySelector(".scan-line");
  if (isScanning && !line) {
    line = document.createElement("div");
    line.className = "scan-line";
    previewWrapEl.appendChild(line);
  } else if (!isScanning && line) {
    line.remove();
  }
}
