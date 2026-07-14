# MediNova-AI

A simple, clean, modern web app for your graduation project: a Home page, a
Chatbot, a Skin Disease Analysis page, and a Chest X-ray Analysis page.

**Tech stack:** plain HTML/CSS/JavaScript (ES modules). No framework, no
build step, no `npm install` — just static files. This keeps it easy to
read, run, and extend.

## How to run it

Because it uses ES modules, open it through a local server (not by
double-clicking the file):

```bash
cd medinova-ai
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## Project structure

```
medinova-ai/
├── index.html          # App shell: sidebar + a single mount point
├── style.css            # All styling, design tokens at the top
└── js/
    ├── config.js         # ⚠️ every URL / token / endpoint path — edit here
    ├── api.js             # All network calls (chat, skin model, xray model)
    ├── app.js              # Tiny hash router (#/home, #/chatbot, ...)
    ├── uploadWidget.js      # Shared drag/drop + preview UI
    └── pages/
        ├── home.js           # Home page
        ├── chatbot.js         # Chat UI
        ├── skin.js             # Skin Disease Analysis page
        └── xray.js              # Chest X-ray Analysis page
```

## Uploading vs. taking a live photo

Both the Skin Analysis and X-ray Analysis pages let you either:
- upload an existing image (click or drag-and-drop), or
- click **"Take a photo"** to open your device's camera, capture a frame,
  and use that directly.

The camera feature needs `getUserMedia`, which browsers only allow on
`https://` pages or on `http://localhost`. Running the app with
`python3 -m http.server` on your own machine (see below) satisfies this,
so the camera button will work. It will not work if you open `index.html`
directly as a `file://` path, or if you serve it over plain `http://` from
a non-localhost address.

## ⚠️ Your ngrok backend URL changes every time you restart it

`BACKEND_BASE_URL` in `js/config.js` points at an ngrok free-tier tunnel
(`https://segmentary-unpunctual-jazlynn.ngrok-free.dev`). Free ngrok URLs
are randomly generated and change every time you restart `ngrok`. If the
chatbot stops working, it's almost always because the ngrok URL changed —
copy the new one from your terminal and paste it into `BACKEND_BASE_URL`.
The same applies to `BACKEND_TOKEN` if your backend regenerates it.

## ⚠️ Three things to double-check before you demo it

I built this against the information available to me, but I could not fully
inspect your live services, so please verify these three points — each is a
single line to fix in `js/config.js` or `js/api.js` if something doesn't
match:

1. **Your backend's chat route** (`js/config.js` → `CHAT_ENDPOINT`).
   I assumed `POST /chat` with body `{ message, history }`, returning
   `{ reply: "..." }`. If your FastAPI/Flask route is named differently,
   update `CHAT_ENDPOINT`. If the response field isn't `reply`, either
   rename it on your backend or extend the fallback list in
   `sendChatMessage()` in `js/api.js`.

2. **The skin model's upload field name** (`js/config.js` →
   `SKIN_IMAGE_FIELD`). I confirmed the Space is a FastAPI app with
   `POST /predict`, but not the exact `UploadFile` parameter name — I
   defaulted to `"file"`. Check your `app.py` (e.g.
   `async def predict(file: UploadFile = ...)`) and match it here.

3. **The X-ray model's Gradio API name** (`js/config.js` →
   `XRAY_API_NAME`). Your X-ray Space is a Gradio app. Open
   `https://salmazaghloul12-xray.hf.space`, scroll down, and click
   **"Use via API"** — it will show you the exact endpoint name and input
   order. I assumed `/predict` with inputs `[image, threshold]`, matching
   the image upload + threshold slider visible on your Space's page.

If any call fails, open your browser's DevTools → Console/Network tab —
the app shows the raw error and, where possible, the raw JSON response so
you can quickly see what shape to expect and adjust the matching
`normalize...()` function in `js/api.js`.

## How to add another AI model later

1. Add its URL/endpoint to `js/config.js`.
2. Add a `predictWithYourModel()` function to `js/api.js`.
3. Copy `js/pages/skin.js` as a starting point for a new page (it already
   handles upload, preview, loading state, and result display).
4. Register the page in `js/app.js`'s `routes` map and add a sidebar link
   in `index.html`.

## Notes

- The chatbot, skin, and X-ray pages all show a clear disclaimer that
  results are from a research prototype, not a medical diagnosis.
- The X-ray page's connection uses the official `@gradio/client` library
  (loaded from a CDN, no install needed) — this is the correct way to call
  a Gradio Space's API from the browser.
- Your backend token is used as a `Bearer` header. Since it's a secret,
  keep in mind that any token placed in frontend JavaScript is visible to
  anyone using the deployed site — fine for a graduation demo, but not for
  production.
