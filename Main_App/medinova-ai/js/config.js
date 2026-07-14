/**
 * config.js
 * -------------------------------------------------------
 * Single source of truth for every URL, token, and endpoint
 * path the app talks to. If a backend route changes, or you
 * add a new AI model page later, this is the only file you
 * should need to touch.
 *
 * ⚠️ IMPORTANT — please read:
 * I could not inspect your live backend's exact route names
 * (only its homepage), so a few values below are marked
 * "ASSUMED". Open your browser dev tools → Network tab while
 * testing each page; if a call 404s, fix the matching value
 * here — the rest of the app does not need to change.
 * -------------------------------------------------------
 */

export const CONFIG = {
  // ---- Your own backend (chatbot) ----
  BACKEND_BASE_URL: "https://segmentary-unpunctual-jazlynn.ngrok-free.dev",
  // NOTE: your Kaggle script's NGROK_AUTH_TOKEN is what authenticates the
  // ngrok *tunnel* to ngrok's own service — it is not an API key for your
  // FastAPI backend, and your /chat route doesn't check any Authorization
  // header. So it was removed from here: it did nothing useful, and
  // shipping it to every visitor's browser is an unnecessary exposure of
  // a credential tied to your ngrok account.
  // Confirmed from your backend script: POST /chat, body { session_id, message }
  CHAT_ENDPOINT: "/chat",

  // ---- Skin Disease model (FastAPI Space) ----
  SKIN_MODEL_URL: "https://fady-50-skin-cv.hf.space",
  // Confirmed from the Space's root JSON response ({"predict_endpoint":"POST /predict"})
  SKIN_PREDICT_PATH: "/predict",
  // Confirmed working — you tested this and got a real prediction back.
  SKIN_IMAGE_FIELD: "file",
  // The 7 HAM10000 classes your model was trained on (from your notebook)
  SKIN_CLASSES: [
    "Actinic Keratoses",
    "Basal Cell Carcinoma",
    "Benign Keratosis-like Lesions",
    "Dermatofibroma",
    "Melanocytic Nevi (Moles)",
    "Melanoma",
    "Vascular Lesions",
  ],

  // ---- Chest X-ray model (Gradio Space) ----
  XRAY_MODEL_URL: "https://salmazaghloul12-xray.hf.space",
  // ASSUMED — the Gradio API name for the predict function.
  // If calls fail, open the Space, scroll down and click
  // "Use via API" to see the exact endpoint name & input order.
  XRAY_API_NAME: "/predict",
  XRAY_DEFAULT_THRESHOLD: 0.5,
  XRAY_CLASSES: ["NORMAL", "PNEUMONIA"],
};
