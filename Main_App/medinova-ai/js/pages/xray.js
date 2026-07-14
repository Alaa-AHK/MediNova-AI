import { predictXray } from "../api.js";
import { mountUploadWidget, setScanning } from "../uploadWidget.js";
import { CONFIG } from "../config.js";
import { t } from "../app.js";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}
function pct(v) { const n = Number(v) || 0; return n <= 1 ? n * 100 : n; }

export function render(root) {
  root.innerHTML = `
    <div class="page-header">
      <span class="page-eyebrow">🫁 Radiology</span>
      <h2>Chest X-Ray Analysis</h2>
      <p>Upload a chest radiograph for AI-powered pneumonia screening. The model will provide a prediction with Grad-CAM visualization showing regions of concern.</p>
    </div>

    <div class="scan-layout">
      <!-- Upload Panel -->
      <div class="scan-upload-card">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);margin-bottom:14px;">Step 1 — Upload X-Ray</div>
        <div id="upload-container"></div>

        <div style="margin-top:16px;padding:12px 14px;background:var(--surface-2);border:1px solid var(--border);border-radius:10px;">
          <label style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--ink-muted);display:block;margin-bottom:8px;">
            Decision Threshold: <span id="threshold-display">${CONFIG.XRAY_DEFAULT_THRESHOLD}</span>
          </label>
          <input type="range" id="threshold" min="0" max="1" step="0.05" value="${CONFIG.XRAY_DEFAULT_THRESHOLD}" style="width:100%;accent-color:var(--primary);" />
          <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--ink-faint);margin-top:4px;"><span>Sensitive (0)</span><span>Specific (1)</span></div>
        </div>

        <button class="btn btn-primary" id="analyze-btn" style="margin-top:16px;width:100%;" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h.01M8 12h.01M8 16h.01"/><path d="M12 8h4M12 12h4M12 16h4"/></svg>
          Analyze X-Ray
        </button>

        <div style="margin-top:12px;padding:10px 12px;background:var(--warn-soft);border:1px solid rgba(217,119,6,0.2);border-radius:8px;font-size:12px;color:var(--warn-text);">
          ⏱️ Note: First analysis may take up to 60 seconds while the model server wakes up.
        </div>
      </div>

      <!-- Result Panel -->
      <div class="scan-result-card">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--ink-muted);margin-bottom:14px;">Step 2 — Radiology Report</div>
        <div id="result-slot">
          <div class="scan-empty">
            <div class="scan-empty-icon">🫁</div>
            <p>Upload a chest X-ray and run analysis<br/>to see the AI radiology report here</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const resultSlot = root.querySelector("#result-slot");
  const analyzeBtn = root.querySelector("#analyze-btn");
  const threshold  = root.querySelector("#threshold");
  const threshDisp = root.querySelector("#threshold-display");
  let currentFile = null, previewEl = null;

  threshold.addEventListener("input", () => { threshDisp.textContent = threshold.value; });

  mountUploadWidget(root.querySelector("#upload-container"), {
    onFileSelected: (file, wrap) => {
      currentFile = file; previewEl = wrap;
      analyzeBtn.disabled = false;
      resultSlot.innerHTML = `<div class="scan-empty"><div class="scan-empty-icon">⏳</div><p>X-ray loaded. Click <strong>Analyze X-Ray</strong> to proceed.</p></div>`;
    },
  });

  analyzeBtn.addEventListener("click", async () => {
    if (!currentFile) return;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `<span class="spinner"></span> Analyzing…`;
    setScanning(previewEl, true);
    resultSlot.innerHTML = `<div class="scan-empty"><div class="scan-empty-icon" style="animation:spin 1s linear infinite">⚙️</div><p>AI model processing radiograph…<br/><small style="color:var(--ink-faint)">This may take up to 60 seconds</small></p></div>`;

    try {
      const result = await predictXray(currentFile, Number(threshold.value));
      resultSlot.innerHTML = renderXrayResult(result);
    } catch (err) {
      resultSlot.innerHTML = `<div class="error-box">⚠️ Analysis failed: ${esc(err.message)}</div>`;
    } finally {
      setScanning(previewEl, false);
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 8h.01M8 12h.01M8 16h.01"/><path d="M12 8h4M12 12h4M12 16h4"/></svg> Analyze X-Ray`;
    }
  });
}

function renderXrayResult({ label, confidence, probabilities, gradcamImage }) {
  const isPneumo   = (label || "").toUpperCase().includes("PNEUMONIA");
  const confPct    = confidence != null ? pct(confidence).toFixed(1) : null;
  const riskCls    = isPneumo ? "danger" : "ok";
  const riskIcon   = isPneumo ? "🔴" : "🟢";
  const riskLabel  = isPneumo ? "Pneumonia — Abnormal Findings" : "Normal — No Pneumonia Detected";
  const clinicalNote = isPneumo
    ? "Radiographic findings are consistent with pneumonia. Immediate clinical evaluation is recommended."
    : "No evidence of pneumonia identified in this radiograph. Clinical correlation advised.";

  // Confidence bars per class
  let barsHtml = "";
  if (Array.isArray(probabilities) && probabilities.length) {
    barsHtml = `
      <div class="finding-section">
        <div class="finding-section-title">Prediction Probability</div>
        ${probabilities.map(p => {
          const v = pct(p.confidence ?? p.value ?? 0);
          const isActive = (p.label || "").toUpperCase() === (label || "").toUpperCase();
          const barColor = (p.label || "").toUpperCase().includes("PNEUMONIA") ? "var(--danger)" : "var(--ok)";
          return `
            <div class="result-bar-row ${isActive ? "result-bar-top" : ""}">
              <span class="result-bar-label">${esc(p.label ?? p.name ?? "")}</span>
              <div class="result-bar-track">
                <div class="result-bar-fill" style="width:${v.toFixed(1)}%;background:${barColor}"></div>
              </div>
              <span class="result-bar-pct">${v.toFixed(1)}%</span>
            </div>`;
        }).join("")}
      </div>`;
  }

  const gradcamHtml = gradcamImage ? `
    <div class="gradcam-section">
      <div class="gradcam-title">Grad-CAM Attention Heatmap</div>
      <img class="gradcam-img" src="${gradcamImage}" alt="Grad-CAM visualization" />
      <p style="font-size:12px;color:var(--ink-faint);margin-top:8px;text-align:center;">Highlighted areas indicate regions the AI model identified as diagnostically significant</p>
    </div>` : "";

  return `
    <div class="verdict-banner ${riskCls}">
      <span class="verdict-banner-icon">${riskIcon}</span>
      <div>
        <div class="verdict-banner-title">${esc(label ?? "Inconclusive")}</div>
        <div class="verdict-banner-sub">${riskLabel}</div>
      </div>
      ${confPct ? `<div style="margin-left:auto;text-align:center;flex-shrink:0;background:rgba(255,255,255,0.6);border-radius:10px;padding:8px 14px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:var(--ink-muted)">Confidence</div>
        <div style="font-size:22px;font-weight:800;color:var(--ink)">${confPct}%</div>
      </div>` : ""}
    </div>

    <div class="finding-section">
      <div class="finding-section-title">Clinical Interpretation</div>
      <p style="font-size:14px;color:var(--ink-2);line-height:1.7;margin:0;">${clinicalNote}</p>
    </div>

    ${barsHtml}
    ${gradcamHtml}

    <div class="scan-disclaimer">
      ⚕️ This AI analysis is a decision support tool only. All radiological findings must be reviewed and confirmed by a licensed <strong>radiologist or physician</strong> before clinical action is taken.
    </div>
  `;
}
