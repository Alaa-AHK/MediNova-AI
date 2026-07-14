import { predictSkinDisease } from "../api.js";
import { mountUploadWidget, setScanning } from "../uploadWidget.js";
import { t } from "../app.js";
import { CONFIG } from "../config.js";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function pct(v) { const n = Number(v) || 0; return n <= 1 ? n * 100 : n; }

// Map class names to risk levels
function classRisk(label = "") {
  const l = label.toLowerCase();
  if (l.includes("melanoma"))  return "danger";
  if (l.includes("basal"))     return "danger";
  if (l.includes("actinic"))   return "warn";
  if (l.includes("vascular"))  return "warn";
  return "ok";
}

export function render(root) {
  root.innerHTML = `
    <div class="page-header">
      <span class="page-eyebrow">🔬 Dermatology</span>
      <h2>Skin Lesion Analysis</h2>
      <p>Upload a clear photo of the skin lesion. The AI model will classify it across 7 dermatological conditions with confidence scores.</p>
    </div>

    <div class="scan-layout">
      <!-- Upload Panel -->
      <div class="scan-upload-card">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);margin-bottom:14px;">Step 1 — Upload Image</div>
        <div id="upload-container"></div>
        <button class="btn btn-primary" id="analyze-btn" style="margin-top:18px;width:100%;" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
          Run AI Analysis
        </button>
      </div>

      <!-- Result Panel -->
      <div class="scan-result-card">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);margin-bottom:14px;">Step 2 — AI Diagnosis</div>
        <div id="result-slot">
          <div class="scan-empty">
            <div class="scan-empty-icon">🔬</div>
            <p>Upload an image and run analysis<br/>to see the AI diagnosis here</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const resultSlot = root.querySelector("#result-slot");
  const analyzeBtn = root.querySelector("#analyze-btn");
  let currentFile = null, previewEl = null;

  mountUploadWidget(root.querySelector("#upload-container"), {
    onFileSelected: (file, wrap) => {
      currentFile = file; previewEl = wrap;
      analyzeBtn.disabled = false;
      resultSlot.innerHTML = `<div class="scan-empty"><div class="scan-empty-icon">⏳</div><p>Image selected. Click <strong>Run AI Analysis</strong> to proceed.</p></div>`;
    },
  });

  analyzeBtn.addEventListener("click", async () => {
    if (!currentFile) return;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<span class="spinner"></span> Analyzing…`;
    setScanning(previewEl, true);
    resultSlot.innerHTML = `<div class="scan-empty"><div class="scan-empty-icon" style="animation:spin 1s linear infinite">⚙️</div><p>AI model is processing the image…<br/><small style="color:var(--ink-faint)">This may take a few seconds</small></p></div>`;

    try {
      const result = await predictSkinDisease(currentFile);
      resultSlot.innerHTML = renderSkinResult(result);
    } catch (err) {
      resultSlot.innerHTML = `<div class="error-box">⚠️ Analysis failed: ${esc(err.message)}</div>`;
    } finally {
      setScanning(previewEl, false);
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg> Run AI Analysis`;
    }
  });
}

function renderSkinResult({ label, confidence, probabilities, description, recommendations }) {
  const confPct  = confidence != null ? pct(confidence).toFixed(1) : null;
  const risk     = classRisk(label);
  const riskIcon = risk === "danger" ? "🔴" : risk === "warn" ? "🟡" : "🟢";
  const riskLabel= risk === "danger" ? "High Risk — Immediate Review" : risk === "warn" ? "Moderate Risk — Monitor" : "Likely Benign";
  const riskCls  = risk === "danger" ? "danger" : risk === "warn" ? "warn" : "ok";

  // Confidence bars for all classes
  let barsHtml = "";
  if (Array.isArray(probabilities) && probabilities.length) {
    const sorted = [...probabilities].sort((a, b) => pct(b.value ?? 0) - pct(a.value ?? 0));
    barsHtml = `
      <div class="finding-section">
        <div class="finding-section-title">Class Probability Breakdown</div>
        ${sorted.map(({ name, value }) => {
          const p = pct(value ?? 0);
          const isTop = name === label;
          return `
            <div class="result-bar-row ${isTop ? "result-bar-top" : ""}">
              <span class="result-bar-label">${esc(name)}</span>
              <div class="result-bar-track">
                <div class="result-bar-fill" style="width:${p.toFixed(1)}%;background:${isTop ? "var(--primary-light)" : "var(--border-strong)"}"></div>
              </div>
              <span class="result-bar-pct">${p.toFixed(1)}%</span>
            </div>`;
        }).join("")}
      </div>`;
  }

  const recsHtml = Array.isArray(recommendations) && recommendations.length
    ? `<div class="rec-section">
        <div class="rec-section-title">Clinical Recommendations</div>
        ${recommendations.map(r => `<div class="rec-item"><span class="rec-dot"></span><span>${esc(r)}</span></div>`).join("")}
      </div>` : "";

  return `
    <div class="verdict-banner ${riskCls}">
      <span class="verdict-banner-icon">${riskIcon}</span>
      <div>
        <div class="verdict-banner-title">${esc(label ?? "No result")}</div>
        <div class="verdict-banner-sub">${riskLabel}</div>
      </div>
      ${confPct ? `<div style="margin-left:auto;text-align:center;flex-shrink:0;background:rgba(255,255,255,0.6);border-radius:10px;padding:8px 14px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-muted)">Confidence</div>
        <div style="font-size:22px;font-weight:800;color:var(--ink)">${confPct}%</div>
      </div>` : ""}
    </div>

    ${description ? `<div class="finding-section">
      <div class="finding-section-title">Clinical Description</div>
      <p style="font-size:14px;color:var(--ink-2);line-height:1.7;margin:0;">${esc(description)}</p>
    </div>` : ""}

    ${barsHtml}
    ${recsHtml}

    <div class="scan-disclaimer">
      ⚕️ This result is generated by an AI research model and should not be used as a standalone medical diagnosis.
      Please consult a <strong>dermatologist</strong> for professional evaluation.
    </div>
  `;
}
