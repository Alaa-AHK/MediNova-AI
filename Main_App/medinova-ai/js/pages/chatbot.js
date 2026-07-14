import { sendChatMessage, predictSkinDisease, predictXray, predictMultiModelAPI } from "../api.js";
import { renderReportCard } from "../reportCard.js";
import { t } from "../app.js";
import { CONFIG } from "../config.js";

function makeSessionId() {
  return (crypto.randomUUID?.() ?? `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

function pct(v) { const n = Number(v) || 0; return n <= 1 ? n * 100 : n; }

// ── Arabic detection ─────────────────────────────────────────────────────────
function isArabic(text) {
  const stripped = text.replace(/\s/g, "");
  if (!stripped.length) return false;
  const arabicChars = (stripped.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length;
  return arabicChars / stripped.length > 0.25;
}

// ── Google Translate API (Free Endpoint) ───────────────────────────────────
// Reliable and doesn't hit the 500 word limit of MyMemory.
async function translate(text, fromLang, toLang, abortSignal) {
  if (!text || !text.trim()) return text;
  const chunks = chunkText(text, 1000); // Google allows more text
  const results = [];
  for (const chunk of chunks) {
    if (abortSignal?.aborted) throw new Error("Request aborted by user");
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(chunk)}`;
      const res  = await fetch(url, { signal: abortSignal || AbortSignal.timeout(8000) });
      const data = await res.json();
      // Google returns an array of arrays: [ [ ["translated", "original"], ... ] ]
      const translated = data[0].map(item => item[0]).join("");
      results.push(translated || chunk);
    } catch (err) {
      console.warn("Translation failed for chunk:", err);
      results.push(chunk);
    }
  }
  return results.join(" ");
}

function chunkText(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [], sentences = text.split(/(?<=[.!?؟])\s+/);
  let current = "";
  for (const s of sentences) {
    if ((current + " " + s).trim().length > maxLen && current) {
      chunks.push(current.trim()); current = s;
    } else {
      current = current ? current + " " + s : s;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks.length ? chunks : [text.slice(0, maxLen)];
}

export function render(root) {
  root.innerHTML = `
    <div class="consult-shell">
      <!-- HEADER -->
      <div class="consult-header">
        <div class="consult-header-left">
          <button id="back-btn" class="hdr-btn" title="Back to Dashboard" style="margin-right:8px; width: 36px; height: 36px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="consult-ai-orb" style="box-shadow: none; background: transparent; overflow: hidden; width: 44px; height: 44px; margin-right: 4px;">
            <img src="robot.png" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
          <div>
            <div class="consult-ai-name">MediNova Clinical Assistant</div>
            <div class="consult-ai-status"><span class="online-dot"></span><span id="status-label">Online &mdash; AI Medical Support</span></div>
          </div>
        </div>
        <div class="consult-header-right">
          <button id="tts-toggle-btn" class="hdr-btn tts-on" title="Voice responses ON — click to mute">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
          </button>
          <button id="restart-btn" class="hdr-btn" title="New Session">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        </div>
      </div>

      <!-- CHAT BODY -->
      <div class="consult-body">
        <div class="consult-log" id="chat-log"></div>
      </div>

      <!-- REPORT -->
      <div id="report-section" style="display:none;padding:0 20px 20px;">
        <div id="report-content"></div>
      </div>

      <!-- INPUT BAR -->
      <div class="consult-input-bar">
        
        <!-- Model Picker -->
        <div class="model-picker-bar" id="model-picker" style="display:none;">
          <span class="model-picker-label" style="width: 100%;">🩺 Analyze image with:</span>
          <button class="model-pick-btn" id="pick-skin-v1">🔬 Skin (V1)</button>
          <button class="model-pick-btn" id="pick-xray-v1">🫁 X-Ray (V1)</button>
          <button class="model-pick-btn" id="pick-skin-v2">🩺 Skin (V2)</button>
          <button class="model-pick-btn" id="pick-breast">🎗️ Breast</button>
          <button class="model-pick-btn" id="pick-eye">👁️ Eye</button>
          <button class="model-pick-btn" id="pick-brain">🧠 Brain</button>
          <button class="model-pick-btn" id="pick-heart">❤️ Heart</button>
          <button class="model-pick-btn" id="pick-lung">🫁 Lung (V2)</button>
          <button class="model-pick-btn" id="pick-kidney">🫘 Kidney</button>
          <button class="model-pick-cancel" id="pick-cancel" style="width: 100%; margin-top: 8px;">✕ Cancel</button>
        </div>

        <div class="consult-input-wrap">
          
          <!-- Image Upload -->
          <label class="input-tool-btn" title="Upload image for AI analysis">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <input type="file" id="img-upload" accept="image/*" style="display:none;" />
          </label>

          <textarea id="chat-input" placeholder="Type your symptoms… or press the mic to speak" rows="1"></textarea>

          <button class="input-tool-btn voice-btn" id="voice-btn" title="Hold to speak — response will be read aloud">
            <svg class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="17" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>
            <svg class="stop-icon" style="display:none;" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>
          </button>

          <div style="display:flex; gap:6px;">
            <!-- Stop Processing Button -->
            <button class="input-tool-btn" id="chat-stop" style="display:none; color:var(--danger); background:var(--danger-soft); border-radius:50%;" title="Stop generating">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
            </button>
            
            <button class="input-send-btn" id="chat-send">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>

        </div>

        <div class="voice-mode-hint" id="voice-hint" style="display:none;">🎤 Listening… speak now — your message will send automatically when you stop</div>
        <div class="consult-disclaimer">🎤 Voice mode: AI responds with voice &nbsp;|&nbsp; ⌨️ Text mode: AI responds with text</div>
      </div>

      <!-- CONTINUOUS VOICE OVERLAY -->
      <div class="voice-overlay" id="voice-overlay">
        <button class="voice-overlay-close" id="voice-close-btn" title="End Voice Conversation">✕</button>
        <div class="voice-orb-container">
          <div class="voice-orb orb-idle" id="voice-orb"></div>
        </div>
        <div class="voice-status-text" id="voice-overlay-status">Tap to start speaking</div>
      </div>

    </div>
  `;

  // ── Element refs ──────────────────────────────────────────────────────────
  const log          = root.querySelector("#chat-log");
  const input        = root.querySelector("#chat-input");
  const sendBtn      = root.querySelector("#chat-send");
  const stopBtn      = root.querySelector("#chat-stop");
  const restartBtn   = root.querySelector("#restart-btn");
  const backBtn      = root.querySelector("#back-btn");
  const statusLabel  = root.querySelector("#status-label");

  backBtn.addEventListener("click", () => {
    window.location.hash = "#/home";
  });
  const reportSec    = root.querySelector("#report-section");
  const reportContent= root.querySelector("#report-content");
  const voiceBtn     = root.querySelector("#voice-btn");
  const micIcon      = voiceBtn.querySelector(".mic-icon");
  const stopIcon     = voiceBtn.querySelector(".stop-icon");
  const voiceHint    = root.querySelector("#voice-hint");
  const ttsToggleBtn = root.querySelector("#tts-toggle-btn");
  
  const imgUpload    = root.querySelector("#img-upload");
  const modelPicker  = root.querySelector("#model-picker");
  const pickCancel   = root.querySelector("#pick-cancel");

  const voiceOverlay = root.querySelector("#voice-overlay");
  const voiceOrb     = root.querySelector("#voice-orb");
  const overlayStatus= root.querySelector("#voice-overlay-status");
  const closeVoiceBtn= root.querySelector("#voice-close-btn");

  // ── Persisted settings ────────────────────────────────────────────────────
  // ── State & Queue ─────────────────────────────────────────────────────────
  let ended = false;
  let isListening = false;
  let continuousVoiceActive = false; // Tracks if the full-screen voice loop is active
  let ttsEnabled = true;
  let recognition = null;
  let pendingFile = null;

  // Queue system for sequential processing
  let messageQueue = [];
  let isProcessingQueue = false;
  let currentAbortController = null;

  // ── TTS ───────────────────────────────────────────────────────────────────
  ttsToggleBtn.addEventListener("click", () => {
    ttsEnabled = !ttsEnabled;
    ttsToggleBtn.classList.toggle("tts-on",  ttsEnabled);
    ttsToggleBtn.classList.toggle("tts-off", !ttsEnabled);
    ttsToggleBtn.title = ttsEnabled ? "Voice responses ON — click to mute" : "Voice responses OFF — click to enable";
    if (!ttsEnabled) window.speechSynthesis?.cancel();
  });

  function speak(text) {
    if (!ttsEnabled || !window.speechSynthesis) {
      // If TTS is disabled but continuous mode is on, we should auto-resume listening immediately.
      if (continuousVoiceActive && !ended) setTimeout(() => startListening(), 500);
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/<[^>]+>/g, " ").replace(/[*_`#>\-]/g, " ").replace(/\s+/g, " ").trim();
    if (!clean) {
      if (continuousVoiceActive && !ended) setTimeout(() => startListening(), 500);
      return;
    }
    window.speechSynthesis.resume();
    const utt = new SpeechSynthesisUtterance(clean);
    
    // Dynamically detect the language of the text to read
    const isAr = isArabic(clean);
    utt.lang   = isAr ? "ar-SA" : "en-US";
    
    const gender = localStorage.getItem("voice_gender") || "female";
    utt.rate   = parseFloat(localStorage.getItem("voice_speed")) || 0.9;
    utt.pitch  = parseFloat(localStorage.getItem("voice_pitch")) || 1.0;
    utt.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const langPrefix = utt.lang.split("-")[0];
    
    // First try to match language and gender name
    let preferred = voices.find(v => v.lang.startsWith(langPrefix) && v.name.toLowerCase().includes(gender));
    // Fallback: match language and skip low quality voices
    if (!preferred) preferred = voices.find(v => v.lang.startsWith(langPrefix) && !v.name.toLowerCase().includes("espeak") && !v.name.toLowerCase().includes("compact"));
    
    if (preferred) utt.voice = preferred;

    utt.onstart = () => { 
      statusLabel.textContent = "🔊 Speaking…"; ttsToggleBtn.classList.add("speaking"); 
      setOrbState("orb-speaking", "Speaking...");
    };
    utt.onend = () => { 
      statusLabel.innerHTML = `Online &mdash; AI Medical Support`; ttsToggleBtn.classList.remove("speaking"); 
      // Continuous loop logic: once speech finishes, start listening again
      if (continuousVoiceActive && !ended) {
        startListening();
      } else {
        setOrbState("orb-idle", "Tap to start speaking");
      }
    };
    utt.onerror = () => { 
      ttsToggleBtn.classList.remove("speaking"); statusLabel.innerHTML = `Online &mdash; AI Medical Support`; 
      if (continuousVoiceActive && !ended) setTimeout(() => startListening(), 1000);
    };
    window.speechSynthesis.speak(utt);
    setTimeout(() => { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); }, 300);
  }
  if (window.speechSynthesis) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices(); }

  // ── Overlay Orb State Management ──────────────────────────────────────────
  function setOrbState(stateClass, text) {
    if (!continuousVoiceActive) return;
    voiceOrb.className = "voice-orb " + stateClass;
    overlayStatus.textContent = text;
  }

  // ── UI Helpers ────────────────────────────────────────────────────────────
  const AI_AVATAR = `<div class="msg-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M12 4v16M4 12h16"/></svg></div>`;

  function addMsg(content, who, html = false, voiceMode = false) {
    const row = document.createElement("div");
    row.className = `msg-row ${who === "user" ? "msg-row-user" : ""}`;
    if (who === "ai") {
      row.innerHTML = `${AI_AVATAR}<div class="msg-bubble msg-bubble-ai"></div>`;
      const b = row.querySelector(".msg-bubble-ai");
      if (html) b.innerHTML = content; else b.textContent = content;
    } else {
      row.innerHTML = `<div class="msg-bubble msg-bubble-user"></div>`;
      const b = row.querySelector(".msg-bubble-user");
      if (voiceMode && who === "user") {
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;align-items:center;gap:8px;";
        wrap.innerHTML = `<span style="font-size:12px;opacity:0.7;">🎤</span><span></span>`;
        wrap.querySelector("span:last-child").textContent = content;
        b.appendChild(wrap);
      } else {
        if (html) b.innerHTML = content; else b.textContent = content;
      }
    }
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }

  function addImgMsg(dataUrl) {
    const row = document.createElement("div");
    row.className = "msg-row msg-row-user";
    row.innerHTML = `<div class="msg-bubble msg-bubble-img"><img src="${dataUrl}" alt="Uploaded medical image"/></div>`;
    log.appendChild(row); log.scrollTop = log.scrollHeight;
  }

  function addTyping() {
    const row = document.createElement("div");
    row.className = "msg-row";
    row.innerHTML = `${AI_AVATAR}<div class="msg-bubble msg-bubble-ai typing-bubble"><span></span><span></span><span></span></div>`;
    log.appendChild(row); log.scrollTop = log.scrollHeight;
    return row;
  }

  // Initial greeting
  const greeting = "Hello! I'm the MediNova Clinical Assistant. Describe your symptoms and I'll help assess your condition. You can type, use the microphone, or upload an image.";
  addMsg(greeting, "ai");

  function reset() {
    window.speechSynthesis?.cancel();
    if (currentAbortController) currentAbortController.abort();
    if (!sessionInput.value.trim()) { sessionInput.value = makeSessionId(); localStorage.setItem("medinova_chat_session", sessionInput.value); }
    ended = false; pendingFile = null; messageQueue = []; isProcessingQueue = false;
    continuousVoiceActive = false;
    voiceOverlay.classList.remove("active");
    modelPicker.style.display = "none"; stopBtn.style.display = "none";
    statusLabel.innerHTML = `Online &mdash; AI Medical Support`;
    reportSec.style.display = "none"; reportContent.innerHTML = ""; log.innerHTML = "";
    addMsg(greeting, "ai"); input.focus();
  }
  restartBtn.addEventListener("click", reset);

  // ── Input events ──────────────────────────────────────────────────────────
  input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px"; });
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitText(); } });
  sendBtn.addEventListener("click", submitText);

  function submitText() {
    if (ended) return;
    const text = input.value.trim();
    if (!text) return;
    addMsg(text, "user", false, false);
    input.value = ""; input.style.height = "auto";
    messageQueue.push({ type: "text", text, voiceMode: false });
    processQueue();
  }

  function submitVoice(text) {
    if (ended || !text.trim()) return;
    addMsg(text, "user", false, true);
    input.value = ""; input.style.height = "auto";
    messageQueue.push({ type: "text", text, voiceMode: true });
    processQueue();
  }

  // ── Stop Button Logic ─────────────────────────────────────────────────────
  stopBtn.addEventListener("click", () => {
    messageQueue = []; // Clear the queue
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
    }
    stopBtn.style.display = "none";
    isProcessingQueue = false;
    window.speechSynthesis?.cancel();
    statusLabel.innerHTML = `Online &mdash; AI Medical Support`;
  });

  // ── Queue Processor ───────────────────────────────────────────────────────
  async function processQueue() {
    if (isProcessingQueue || messageQueue.length === 0) return;
    isProcessingQueue = true;
    stopBtn.style.display = "block";

    while (messageQueue.length > 0) {
      const task = messageQueue.shift();
      currentAbortController = new AbortController();
      try {
        if (task.type === "text") {
          await doSend(task.text, task.voiceMode, currentAbortController.signal);
        } else if (task.type === "image") {
          await doAnalyzeImg(task.file, task.modelName, currentAbortController.signal);
        }
      } catch (err) {
        if (err.name === "AbortError" || err.message === "Request aborted by user") {
          console.log("Processing aborted by user.");
          break; // break the queue processing loop
        }
        addMsg(`⚠️ Error: ${err.message}`, "ai");
      }
      currentAbortController = null;
    }

    isProcessingQueue = false;
    stopBtn.style.display = "none";
    statusLabel.innerHTML = `Online &mdash; AI Medical Support`;
  }

  // ── Chat Network Logic ────────────────────────────────────────────────────
  async function doSend(text, voiceMode, abortSignal) {
    const userIsArabic = isArabic(text);
    let textForModel = text;

    if (userIsArabic) {
      statusLabel.textContent = "🌐 Translating…";
      try { 
        textForModel = await translate(text, "ar", "en", abortSignal); 
        // Append a hint so the English LLM avoids idioms that break machine translation
        textForModel += "\n\n[System Note: The user is communicating via an Arabic-to-English translator. Please reply in simple, clear, direct English. Avoid idioms (like 'tight band', 'pins and needles'), metaphors, or overly complex medical jargon so your response translates back to Arabic flawlessly.]";
      } catch (_) {}
    }

    if (abortSignal?.aborted) return;
    statusLabel.textContent = "Processing…";
    setOrbState("orb-processing", "Processing...");
    const typing = addTyping();

    try {
      const sessionVal = localStorage.getItem("session_id") || "";
      const apiVal = localStorage.getItem("api_url") || "";
      const sid = sessionVal.trim() || makeSessionId();
      const url = apiVal.trim() || CONFIG.BACKEND_BASE_URL;
      const res = await sendChatMessage(textForModel, sid, url, abortSignal);
      typing.remove();

      if (res.status === "report" && res.reportData) {
        endSession(res.reportData, voiceMode, text);
        return;
      }

      let displayContent = res.content;
      let ttsContent     = res.content;

      if (userIsArabic && res.content) {
        statusLabel.textContent = "🌐 Translating response…";
        try {
          displayContent = await translate(res.content, "en", "ar", abortSignal);
          ttsContent     = displayContent;
        } catch (_) {}
      }

      if (abortSignal?.aborted) return;

      addMsg(displayContent, "ai");
      if (voiceMode) speak(ttsContent);

    } catch (err) {
      typing.remove();
      throw err;
    }
  }

  function endSession(reportData, voiceMode, originalText) {
    ended = true;
    statusLabel.textContent = "Session complete";
    reportSec.style.display = "block";
    reportContent.innerHTML = renderReportCard(reportData);
    const msg = addMsg(`
      <div class="report-cta-card">
        <div class="report-cta-icon">📋</div>
        <div class="report-cta-title">Clinical Report Ready</div>
        <div class="report-cta-sub">Your medical assessment has been completed</div>
        <button class="btn btn-primary" id="view-report-btn" style="width:100%;margin-top:12px;">View Full Report ↓</button>
      </div>`, "ai", true);
    msg.querySelector("#view-report-btn").addEventListener("click", () => reportSec.scrollIntoView({ behavior: "smooth" }));
    const reportMsg = voiceMode ? (isArabic(originalText) ? "تقريرك الطبي جاهز. انتقل للأسفل لرؤية التقرير." : "Your clinical report is ready. Scroll down to view your medical assessment.") : null;
    if (voiceMode && reportMsg) speak(reportMsg);
  }

  // ── Image Upload & Analysis ───────────────────────────────────────────────
  let pendingDataUrl = null;

  imgUpload.addEventListener("change", () => {
    const file = imgUpload.files[0]; if (!file) return; imgUpload.value = "";
    const reader = new FileReader();
    reader.onload = e => {
      pendingDataUrl = e.target.result;
      pendingFile = file;
      modelPicker.style.display = "flex"; // show picker
    };
    reader.readAsDataURL(file);
  });

  pickCancel.addEventListener("click", () => {
    modelPicker.style.display = "none";
    pendingFile = null;
    pendingDataUrl = null;
  });

  const pickBtns = root.querySelectorAll(".model-pick-btn");
  pickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      if (!pendingFile) return;
      const modelId = btn.id.replace("pick-", ""); // e.g., "skin-v1", "skin-v2", "breast", etc.
      
      addImgMsg(pendingDataUrl);
      modelPicker.style.display = "none";
      messageQueue.push({ type: "image", file: pendingFile, modelName: modelId });
      
      pendingFile = null;
      pendingDataUrl = null;
      processQueue();
    });
  });

  async function doAnalyzeImg(file, model, abortSignal) {
    statusLabel.textContent = "Analyzing image…";
    const typing = addTyping();
    try {
      if (model === "skin-v1") {
        const r = await predictSkinDisease(file, abortSignal);
        typing.remove(); if (abortSignal?.aborted) return;
        addMsg(buildSkinCard(r), "ai", true);
      } else if (model === "xray-v1") {
        const r = await predictXray(file, CONFIG.XRAY_DEFAULT_THRESHOLD, abortSignal);
        typing.remove(); if (abortSignal?.aborted) return;
        addMsg(buildXrayCard(r), "ai", true);
      } else {
        // Multi-Model API (skin-v2, breast, eye, brain, heart, lung, kidney)
        let endpoint = model;
        if (model === "skin-v2") endpoint = "skin";
        
        const r = await predictMultiModelAPI(endpoint, file, abortSignal);
        typing.remove(); if (abortSignal?.aborted) return;
        addMsg(buildMultiModelCard(r, endpoint), "ai", true);
      }
    } catch (err) {
      typing.remove();
      throw err;
    }
  }

  function buildSkinCard({ label, confidence, probabilities, description, recommendations }) {
    const confPct = confidence != null ? pct(confidence).toFixed(1) : null;
    const isMelanoma = (label || "").toLowerCase().includes("melanoma");
    const isBenign   = (label || "").toLowerCase().includes("benign") || (label || "").toLowerCase().includes("nevi");
    const severity   = isMelanoma ? "danger" : isBenign ? "ok" : "warn";
    const severityIcon = isMelanoma ? "🔴" : isBenign ? "🟢" : "🟡";
    const severityLabel= isMelanoma ? "High Risk" : isBenign ? "Likely Benign" : "Requires Review";

    let barsHtml = "";
    if (Array.isArray(probabilities) && probabilities.length) {
      const sorted = [...probabilities].sort((a, b) => pct(b.value ?? 0) - pct(a.value ?? 0));
      barsHtml = `<div class="result-bars-section"><div class="result-bars-title">Model Confidence by Class</div>${sorted.map(({ name, value }) => {
        const p = pct(value ?? 0);
        return `<div class="result-bar-row"><span class="result-bar-label">${esc(name)}</span><div class="result-bar-track"><div class="result-bar-fill" style="width:${p.toFixed(1)}%;background:${p > 50 ? "var(--primary-light)" : "var(--border-strong)"}"></div></div><span class="result-bar-pct">${p.toFixed(1)}%</span></div>`;
      }).join("")}</div>`;
    }
    const recsHtml = Array.isArray(recommendations) && recommendations.length ? `<div class="result-recs"><div class="result-recs-title">Clinical Recommendations</div>${recommendations.map(r => `<div class="result-rec-item"><span class="result-rec-dot"></span><span>${esc(r)}</span></div>`).join("")}</div>` : "";
    return `<div class="analysis-result-card"><div class="result-card-header result-header-${severity}"><div class="result-header-left"><span class="result-icon">🔬</span><div><div class="result-model-label">Dermatology AI</div><div class="result-diagnosis">${esc(label ?? "Inconclusive")}</div></div></div><div class="result-header-right"><div class="result-severity-badge severity-${severity}">${severityIcon} ${severityLabel}</div>${confPct ? `<div class="result-confidence">Confidence<br><strong>${confPct}%</strong></div>` : ""}</div></div>${description ? `<div class="result-description">${esc(description)}</div>` : ""}${barsHtml}${recsHtml}<div class="result-footer">⚠️ For clinical support only. Verify with dermatologist.</div></div>`;
  }

  function buildXrayCard({ label, confidence, probabilities, gradcamImage }) {
    const confPct   = confidence != null ? (pct(confidence)).toFixed(1) : null;
    const isPneumo  = (label || "").toUpperCase().includes("PNEUMONIA");
    const severity  = isPneumo ? "danger" : "ok";
    const severityLabel = isPneumo ? "Pneumonia Detected" : "Normal — No Pneumonia";
    const severityIcon  = isPneumo ? "🔴" : "🟢";

    let barsHtml = "";
    if (Array.isArray(probabilities) && probabilities.length) {
      barsHtml = `<div class="result-bars-section"><div class="result-bars-title">Confidence by Diagnosis</div>${probabilities.map(p => {
        const val = pct(p.confidence ?? p.value ?? 0);
        return `<div class="result-bar-row"><span class="result-bar-label">${esc(p.label ?? p.name ?? "")}</span><div class="result-bar-track"><div class="result-bar-fill" style="width:${val.toFixed(1)}%;background:${(p.label || "").toUpperCase().includes("PNEUMONIA") ? "var(--danger)" : "var(--ok)"}"></div></div><span class="result-bar-pct">${val.toFixed(1)}%</span></div>`;
      }).join("")}</div>`;
    }
    const gradcamHtml = gradcamImage ? `<div class="result-gradcam"><div class="result-gradcam-title">Grad-CAM Heatmap</div><img src="${gradcamImage}" alt="Grad-CAM"/></div>` : "";
    return `<div class="analysis-result-card"><div class="result-card-header result-header-${severity}"><div class="result-header-left"><span class="result-icon">🫁</span><div><div class="result-model-label">Radiology AI</div><div class="result-diagnosis">${esc(label ?? "Inconclusive")}</div></div></div><div class="result-header-right"><div class="result-severity-badge severity-${severity}">${severityIcon} ${severityLabel}</div>${confPct ? `<div class="result-confidence">Confidence<br><strong>${confPct}%</strong></div>` : ""}</div></div>${barsHtml}${gradcamHtml}<div class="result-footer">⚠️ For clinical support only. Verify with radiologist.</div></div>`;
  }

  function buildMultiModelCard(data, endpoint) {
    const label = data.predicted_class || data.assessment || "Unknown";
    const confPct = data.confidence != null ? data.confidence.toFixed(1) : (data.heart_area_ratio_percent ? data.heart_area_ratio_percent.toFixed(1) : null);
    
    // Determine severity based on label or assessment
    let severity = "warn";
    let severityIcon = "🟡";
    const labelLower = label.toLowerCase();
    if (labelLower.includes("normal") || labelLower.includes("benign") || labelLower.includes("notumor")) {
      severity = "ok"; severityIcon = "🟢";
    } else if (labelLower.includes("malignant") || labelLower.includes("melanoma") || labelLower.includes("covid") || labelLower.includes("pneumonia") || labelLower.includes("tumor") || labelLower.includes("abnormally_large")) {
      severity = "danger"; severityIcon = "🔴";
    }

    let barsHtml = "";
    if (data.all_probabilities) {
      const sorted = Object.entries(data.all_probabilities).sort((a, b) => b[1] - a[1]);
      barsHtml = `<div class="result-bars-section"><div class="result-bars-title">Confidence by Class</div>${sorted.map(([name, value]) => {
        return `<div class="result-bar-row"><span class="result-bar-label">${esc(name)}</span><div class="result-bar-track"><div class="result-bar-fill" style="width:${value.toFixed(1)}%;background:${value > 50 ? "var(--primary-light)" : "var(--border-strong)"}"></div></div><span class="result-bar-pct">${value.toFixed(1)}%</span></div>`;
      }).join("")}</div>`;
    }

    let segHtml = "";
    if (data.segmentation && data.segmentation.overlay_image_base64) {
      segHtml = `<div class="result-gradcam"><div class="result-gradcam-title">Segmentation Analysis</div><img src="data:image/png;base64,${data.segmentation.overlay_image_base64}" style="width: 100%; border-radius: 8px; margin-top: 8px;" alt="Segmentation"/></div>`;
    }

    const info = data.disease_info || {};
    const diseaseName = info.disease_name || label;
    const desc = info.description ? `<div class="result-description">${esc(info.description)}</div>` : "";
    const recs = (Array.isArray(info.recommendations) && info.recommendations.length) ? `<div class="result-recs"><div class="result-recs-title">Recommendations</div>${info.recommendations.map(r => `<div class="result-rec-item"><span class="result-rec-dot"></span><span>${esc(r)}</span></div>`).join("")}</div>` : "";

    return `<div class="analysis-result-card"><div class="result-card-header result-header-${severity}"><div class="result-header-left"><span class="result-icon">🤖</span><div><div class="result-model-label">Medical AI (${endpoint})</div><div class="result-diagnosis">${esc(diseaseName)}</div></div></div><div class="result-header-right"><div class="result-severity-badge severity-${severity}">${severityIcon}</div>${confPct ? `<div class="result-confidence">Confidence<br><strong>${confPct}%</strong></div>` : ""}</div></div>${desc}${barsHtml}${segHtml}${recs}<div class="result-footer">⚠️ For clinical support only. Verify with doctor.</div></div>`;
  }

  // ── Speech Recognition & Continuous Loop ──────────────────────────────────
  let startListening;
  let stopListening;

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { voiceBtn.style.opacity = "0.3"; voiceBtn.disabled = true; voiceBtn.title = "Voice not supported"; }
  else {
    recognition = new SR(); recognition.continuous = false; recognition.interimResults = true;
    recognition.onresult = e => {
      let transcript = "";
      for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      input.value = transcript; input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 140) + "px";
    };
    recognition.onend = () => {
      stopListening();
      const captured = input.value.trim();
      if (captured) {
        setOrbState("orb-processing", "Sending...");
        setTimeout(() => submitVoice(captured), 350);
      } else {
        // If they didn't say anything and we are still in continuous mode, keep listening
        if (continuousVoiceActive && !isProcessingQueue && !ended) {
          setTimeout(() => startListening(), 500);
        } else {
          setOrbState("orb-idle", "Listening paused");
        }
      }
    };
    recognition.onerror = e => { 
      stopListening(); 
      if (e.error !== "no-speech" && e.error !== "aborted") {
        addMsg(`🎤 Error: ${e.error}`, "ai"); 
      }
      if (continuousVoiceActive && !ended) setTimeout(() => startListening(), 1000);
    };

    startListening = function() {
      if (ended) return; isListening = true;
      recognition.lang = document.documentElement.lang === "ar" ? "ar-EG" : "en-US";
      window.speechSynthesis?.cancel();
      voiceBtn.classList.add("voice-active"); micIcon.style.display = "none"; stopIcon.style.display = "block"; voiceHint.style.display = "block";
      statusLabel.textContent = "🎤 Listening…"; 
      setOrbState("orb-listening", "Listening...");
      try { recognition.start(); } catch (_) {}
    };

    stopListening = function() {
      isListening = false;
      voiceBtn.classList.remove("voice-active"); micIcon.style.display = "block"; stopIcon.style.display = "none"; voiceHint.style.display = "none";
      statusLabel.innerHTML = `Online &mdash; AI Medical Support`; 
      try { recognition.abort(); } catch (_) {}
    };

    // Open Continuous Voice Mode Overlay
    voiceBtn.addEventListener("click", () => {
      if (isListening) {
        stopListening();
        continuousVoiceActive = false;
        voiceOverlay.classList.remove("active");
      } else {
        continuousVoiceActive = true;
        voiceOverlay.classList.add("active");
        if (window.speechSynthesis && ttsEnabled) { const primer = new SpeechSynthesisUtterance(""); primer.volume = 0; window.speechSynthesis.cancel(); window.speechSynthesis.speak(primer); }
        startListening();
      }
    });

    closeVoiceBtn.addEventListener("click", () => {
      continuousVoiceActive = false;
      voiceOverlay.classList.remove("active");
      stopListening();
      window.speechSynthesis?.cancel();
    });
  }

  const cleanup = () => { window.speechSynthesis?.cancel(); try { recognition?.abort(); } catch (_) {} document.removeEventListener("routechange", cleanup); };
  document.addEventListener("routechange", cleanup);

  // Auto-send initial prompt from 3D body picker in the background
  const initialPrompt = sessionStorage.getItem("initial_prompt");
  if (initialPrompt) {
    sessionStorage.removeItem("initial_prompt");
    setTimeout(() => {
      // Send the prompt hidden from the UI, so it feels like the AI just knows!
      submitText(true, initialPrompt);
    }, 500);
  }
}

