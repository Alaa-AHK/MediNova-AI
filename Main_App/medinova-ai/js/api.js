/**
 * api.js
 * -------------------------------------------------------
 * Every network call the app makes, grouped by feature.
 * Each function does one thing: send a request, return a
 * clean, predictable JS object. UI code never touches
 * fetch() directly — it just calls these functions.
 *
 * To add a new AI model later: copy one of the predictWith*
 * functions, point it at the new Space/endpoint, and wire it
 * up in a new page (see js/pages/skin.js as a template).
 * -------------------------------------------------------
 */

import { CONFIG } from "./config.js";

/* ---------------------------------------------------------
 * 1) CHATBOT — talks to your own backend (FastAPI on Kaggle,
 * exposed through an ngrok tunnel).
 *
 * Real contract (confirmed from your backend script):
 *   POST /chat   body: { session_id, message }
 *   response either:
 *     { status: "question", content: "..." }
 *     { status: "report", content: "Diagnosis Ready", report_data: {...} }
 * ------------------------------------------------------- */
export async function sendChatMessage(message, sessionId, customBaseUrl, abortSignal = null) {
  let base = customBaseUrl || CONFIG.BACKEND_BASE_URL;
  // Clean up user input in case they pasted the full URL including /chat or \chat
  base = base.replace(/[\\/]chat\/?$/, "").replace(/\/+$/, "");
  
  const directUrl = `${base}${CONFIG.CHAT_ENDPOINT}`;
  
  // -----------------------------------------------------------------------
  // The browser blocks cross-origin requests to Kaggle/Ngrok servers unless
  // the server adds CORS headers. Since we can't modify the backend, we send
  // the request through a CORS proxy that calls the API server-side.
  // allorigins.win accepts POST via its /post endpoint.
  // -----------------------------------------------------------------------
  const body = JSON.stringify({ session_id: sessionId, message });

  // Silent auto-retry: keep trying in the background until we get a response.
  // The user only sees the typing bubble — never an in-between error.
  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 8_000;  // 8 seconds between retries
  const PER_REQUEST_TIMEOUT_MS = 5 * 60 * 1000; // 5 min per attempt

  let data;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (abortSignal?.aborted) throw new Error("Request aborted by user");
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PER_REQUEST_TIMEOUT_MS);
      
      const onExternalAbort = () => controller.abort();
      if (abortSignal) abortSignal.addEventListener("abort", onExternalAbort);

      const directRes = await fetch(directUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (abortSignal) abortSignal.removeEventListener("abort", onExternalAbort);

      if (!directRes.ok) throw new Error(`HTTP ${directRes.status}`);
      data = await directRes.json();
      break; // ✅ Got a response — exit retry loop

    } catch (directErr) {
      lastError = directErr;
      console.warn(`[Chat] Attempt ${attempt} failed:`, directErr.message);

      if (attempt < MAX_RETRIES) {
        // Wait before retrying (silently)
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
        continue;
      }

      // All direct attempts exhausted — nothing to show
      throw new Error(
        `Server didn't respond after ${MAX_RETRIES} attempts. ` +
        `Make sure your Kaggle server is running and the Ngrok URL is correct. ` +
        `Last error: ${lastError.message}`
      );
    }
  }

  if (data.status === "report") {
    return { status: "report", content: data.content ?? "Diagnosis Ready", reportData: data.report_data ?? null, raw: data };
  }

  const content =
    data.content ?? data.reply ?? data.answer ?? data.message ?? data.response ?? null;

  if (content == null) {
    return { status: "question", content: JSON.stringify(data), raw: data };
  }

  if (content.includes("FINAL REPORT RECEIVED") || content.includes("Diagnosis Ready")) {
    try {
      const jsonStr = content.substring(content.indexOf("{"), content.lastIndexOf("}") + 1);
      const parsedReport = JSON.parse(jsonStr);
      return { status: "report", content: "Diagnosis Ready", reportData: parsedReport, raw: data };
    } catch (e) {
      console.warn("Found report text but failed to parse JSON", e);
    }
  }

  return { status: "question", content, raw: data };
}

/* ---------------------------------------------------------
 * 2) SKIN DISEASE ANALYSIS — FastAPI Space
 * ------------------------------------------------------- */
export async function predictSkinDisease(imageFile, abortSignal = null) {
  const url = `${CONFIG.SKIN_MODEL_URL}${CONFIG.SKIN_PREDICT_PATH}`;

  const formData = new FormData();
  formData.append(CONFIG.SKIN_IMAGE_FIELD, imageFile);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    signal: abortSignal,
  });

  if (!res.ok) {
    throw new Error(`Model API responded with ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return normalizeSkinResponse(data);
}

// Normalizes the skin model's confirmed real response shape into a
// consistent object the UI can render as a clean report (no raw JSON):
// { label, confidence, probabilities, isLesionDetected, description, recommendations, risks, raw }
function normalizeSkinResponse(data) {
  const label =
    data.predicted_class ?? data.prediction ?? data.class ?? data.label ?? null;

  const confidence = data.confidence ?? data.probability ?? data.score ?? null;

  const rawProbs =
    data.all_probabilities ?? data.probabilities ?? data.class_probabilities ?? data.scores ?? null;

  let probabilities = null;
  if (Array.isArray(rawProbs)) {
    probabilities = rawProbs.map((p, i) => {
      if (p && typeof p === "object") {
        return {
          name: p.class_name ?? p.name ?? p.label ?? CONFIG.SKIN_CLASSES[p.class_index ?? i] ?? `Class ${i}`,
          value: p.confidence ?? p.probability ?? p.score ?? p.value ?? 0,
        };
      }
      return { name: CONFIG.SKIN_CLASSES[i] ?? `Class ${i}`, value: p };
    });
  } else if (rawProbs && typeof rawProbs === "object") {
    probabilities = Object.entries(rawProbs).map(([name, value]) => ({ name, value }));
  }

  return {
    label,
    confidence,
    probabilities,
    isLesionDetected: data.is_skin_lesion_detected ?? null,
    description: data.description ?? null,
    recommendations: Array.isArray(data.recommendations) ? data.recommendations : null,
    risks: Array.isArray(data.risks) && data.risks.length ? data.risks : null,
    raw: data,
  };
}

/* ---------------------------------------------------------
 * 3) CHEST X-RAY ANALYSIS — Gradio Space (direct REST API, no library)
 *
 * Gradio HTTP API flow:
 *   1. POST /gradio_api/upload  → get a file path token
 *   2. POST /gradio_api/call/predict → get an event_id
 *   3. GET  /gradio_api/call/predict/{event_id} (SSE stream) → read result
 * ------------------------------------------------------- */
const XRAY_BASE = "https://salmazaghloul12-xray.hf.space";

export async function predictXray(
  imageFile,
  threshold = CONFIG.XRAY_DEFAULT_THRESHOLD,
  abortSignal = null
) {
  // ── Step 1: upload the image file (retry 5x — space may be waking up) ──
  const formData = new FormData();
  formData.append("files", imageFile, imageFile.name || "xray.jpg");

  let uploadedPath;
  const MAX_UPLOAD_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_UPLOAD_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      const onExternalAbort = () => controller.abort();
      if (abortSignal) abortSignal.addEventListener("abort", onExternalAbort);

      const upRes = await fetch(`${XRAY_BASE}/gradio_api/upload`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (abortSignal) abortSignal.removeEventListener("abort", onExternalAbort);

      if (!upRes.ok) throw new Error(`Upload HTTP ${upRes.status}`);
      const upData = await upRes.json();
      uploadedPath = Array.isArray(upData) ? upData[0] : upData;
      break; // success — exit retry loop
    } catch (err) {
      if (attempt === MAX_UPLOAD_RETRIES) {
        throw new Error(
          `Couldn't upload image after ${MAX_UPLOAD_RETRIES} attempts (space may still be loading). Details: ${err.message}`
        );
      }
      // wait 15 seconds before retrying
      await new Promise(r => setTimeout(r, 15_000));
    }
  }

  // ── Step 2: call /predict (retry 3x) ───────────────────────────────────
  const payload = {
    data: [
      { path: uploadedPath, meta: { _type: "gradio.FileData" } }, // pil_img
      threshold,                                                     // threshold slider
    ],
  };

  let eventId;
  const MAX_PREDICT_RETRIES = 3;
  for (let attempt = 1; attempt <= MAX_PREDICT_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60_000);
      const onExternalAbort = () => controller.abort();
      if (abortSignal) abortSignal.addEventListener("abort", onExternalAbort);

      const callRes = await fetch(`${XRAY_BASE}/gradio_api/call/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (abortSignal) abortSignal.removeEventListener("abort", onExternalAbort);

      if (!callRes.ok) throw new Error(`Predict HTTP ${callRes.status}`);
      const callData = await callRes.json();
      eventId = callData.event_id;
      if (!eventId) throw new Error("No event_id: " + JSON.stringify(callData));
      break; // success
    } catch (err) {
      if (attempt === MAX_PREDICT_RETRIES) {
        throw new Error(`Prediction call failed after ${MAX_PREDICT_RETRIES} attempts: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 10_000));
    }
  }

  // ── Step 3: SSE stream — wait up to 5 minutes for GPU inference ─────────
  const RESULT_TIMEOUT_MS = 300_000; // 5 minutes
  const resultData = await new Promise((resolve, reject) => {
    const sseUrl = `${XRAY_BASE}/gradio_api/call/predict/${eventId}`;
    const es = new EventSource(sseUrl);

    const timeout = setTimeout(() => {
      es.close();
      reject(new Error("X-ray prediction timed out after 5 minutes. The space may be very busy — try again."));
    }, RESULT_TIMEOUT_MS);

    es.addEventListener("complete", (e) => {
      clearTimeout(timeout);
      es.close();
      try { resolve(JSON.parse(e.data)); } catch { resolve(e.data); }
    });

    es.addEventListener("generating", () => {
      // still processing — keep waiting, reset nothing
    });

    es.addEventListener("error", () => {
      // SSE fires 'error' when the stream closes normally too.
      // Only reject if we never got a 'complete' event (timeout handles the rest).
    });
  });

  return normalizeXrayResponse(Array.isArray(resultData) ? resultData : [resultData]);
}

// Normalise the 3-item array the Gradio Space returns:
//   [0] text  → "Prediction: PNEUMONIA\nConfidence: 99.53%\nDecision Threshold: 0.50"
//   [1] label → { label: "PNEUMONIA", confidences: [{label, confidence}, ...] }
//   [2] image → { url: "...", path: "..." }  ← Grad-CAM
function normalizeXrayResponse(dataArray = []) {
  let label = null;
  let confidence = null;
  let probabilities = null;
  let gradcamImage = null;

  for (const item of dataArray) {
    if (!item) continue;

    if (typeof item === "string") {
      // Text output: "Prediction: PNEUMONIA\nConfidence: 99.53%\nDecision Threshold: 0.50"
      const predMatch = item.match(/Prediction:\s*([^\n]+)/i);
      const confMatch = item.match(/Confidence:\s*([\d.]+)/i);
      if (predMatch) label = predMatch[1].trim();
      if (confMatch) confidence = parseFloat(confMatch[1]) / 100;

    } else if (typeof item === "object" && item.confidences) {
      // Gradio Label component: { label, confidences: [{label, confidence}] }
      label = label ?? item.label;
      probabilities = item.confidences; // [{label:"PNEUMONIA", confidence:0.9953}, ...]

    } else if (typeof item === "object" && (item.url || item.path)) {
      // Image component → Grad-CAM overlay
      gradcamImage = item.url || (`${XRAY_BASE}/gradio_api/file=${item.path}`);
    }
  }

  // Build probabilities array if we only got the text output
  if (!probabilities && label && confidence !== null) {
    probabilities = [{ label, confidence }];
  }

  return { label, confidence, probabilities, gradcamImage, raw: dataArray };
}

/* ---------------------------------------------------------
 * 4) NEW 7-MODEL MEDICAL API — FastAPI Space
 * Contains models for: skin, breast, eye, brain, heart, lung, kidney
 * ------------------------------------------------------- */
const MULTI_MODEL_BASE = "https://morefaat69-medical-ai-api.hf.space";

export async function predictMultiModelAPI(modelEndpoint, imageFile, abortSignal = null) {
  const url = `${MULTI_MODEL_BASE}/predict/${modelEndpoint}`;

  const formData = new FormData();
  formData.append("file", imageFile);

  const res = await fetch(url, {
    method: "POST",
    body: formData,
    signal: abortSignal,
  });

  if (!res.ok) {
    throw new Error(`Model API (${modelEndpoint}) responded with ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

