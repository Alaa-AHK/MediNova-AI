/**
 * app.js
 * -------------------------------------------------------
 * Minimal hash-based router. No framework, no build step —
 * just swaps the contents of #app based on the URL hash.
 * Includes Theme and Language toggling logic.
 * -------------------------------------------------------
 */

import { render as renderHome } from "./pages/home.js";
import { render as renderChatbot } from "./pages/chatbot.js?v=10";
import { render as renderSkin } from "./pages/skin.js";
import { render as renderXray } from "./pages/xray.js";
import { render as renderGuide } from "./pages/guide.js?v=9";
import { render as renderBody } from "./pages/body.js?v=15";

const routes = {
  home: renderHome,
  chatbot: renderChatbot,
  skin: renderSkin,
  xray: renderXray,
  guide: renderGuide,
  body: renderBody,
};

const appEl = document.getElementById("app");

// --- Drawer Logic ---
const hamburgerBtn = document.getElementById("hamburger-btn");
const closeDrawerBtn = document.getElementById("close-drawer-btn");
const settingsDrawer = document.getElementById("settings-drawer");
const drawerOverlay = document.getElementById("drawer-overlay");

function toggleDrawer() {
  settingsDrawer.classList.toggle("active");
  drawerOverlay.classList.toggle("active");
}

hamburgerBtn.addEventListener("click", toggleDrawer);
closeDrawerBtn.addEventListener("click", toggleDrawer);
drawerOverlay.addEventListener("click", toggleDrawer);

// --- Global Settings Logic ---
const elGender = document.getElementById("global-voice-gender");
const elPitch = document.getElementById("global-voice-pitch");
const elSpeed = document.getElementById("global-voice-speed");
const elApi = document.getElementById("global-api-url");
const elSession = document.getElementById("global-session-id");
const elPitchVal = document.getElementById("global-pitch-val");
const elSpeedVal = document.getElementById("global-speed-val");

// Load saved settings
elGender.value = localStorage.getItem("voice_gender") || "female";
elPitch.value = localStorage.getItem("voice_pitch") || "1.0";
elSpeed.value = localStorage.getItem("voice_speed") || "0.9";
elApi.value = localStorage.getItem("api_url") || "";
elSession.value = localStorage.getItem("session_id") || "";
elPitchVal.textContent = elPitch.value;
elSpeedVal.textContent = elSpeed.value;

// Save on change
elGender.addEventListener("change", () => localStorage.setItem("voice_gender", elGender.value));
elPitch.addEventListener("input", () => {
  localStorage.setItem("voice_pitch", elPitch.value);
  elPitchVal.textContent = elPitch.value;
});
elSpeed.addEventListener("input", () => {
  localStorage.setItem("voice_speed", elSpeed.value);
  elSpeedVal.textContent = elSpeed.value;
});
elApi.addEventListener("input", () => localStorage.setItem("api_url", elApi.value));
elSession.addEventListener("input", () => localStorage.setItem("session_id", elSession.value));

// --- Theme Logic ---
const themeBtn = document.getElementById("theme-toggle");
let currentTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", currentTheme);

themeBtn.addEventListener("click", () => {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", currentTheme);
  localStorage.setItem("theme", currentTheme);
});

// --- i18n Logic ---
const langBtn = document.getElementById("lang-toggle");
export let currentLang = localStorage.getItem("lang") || "en";
document.documentElement.lang = currentLang;
document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";

export const i18n = {
  en: {
    brand_name: "MediNova-AI", brand_sub: "Graduation Project",
    nav_home: "Home", nav_chatbot: "Chatbot", nav_skin: "Skin Analysis", nav_xray: "X-ray Analysis",
    footer_brand: "MediNova-AI &middot; v1.0", footer_disclaimer: "Research prototype — not a medical device.",
    chatbot_title: "Talk to the MediNova-AI assistant",
    chatbot_desc: "Describe how you feel. The assistant will ask a few follow-up questions, then give you a report.",
    chatbot_placeholder: "Type a message…",
    chatbot_send: "Send",
    chatbot_restart: "Start a new conversation",
    chatbot_initial: "Hi! I'm the MediNova-AI assistant. Tell me what's bothering you (e.g. \"I have a headache on one side of my face\").",
    theme_btn: "Theme",
    lang_btn: "عربي",
    skin_eyebrow: "Skin Disease Analysis",
    skin_title: "Analyze a skin lesion image",
    skin_desc: "Model: ResNet50 fine-tuned on HAM10000 (7 classes). Connects to your FastAPI Space.",
    skin_btn: "Analyze Image",
    skin_analyzing: "Analyzing…",
    xray_eyebrow: "X-ray Analysis",
    xray_title: "Analyze a chest X-ray",
    xray_desc: "Model: Swin Transformer for detecting Pneumonia vs Normal. Connects to your Gradio Space.",
    xray_btn: "Analyze X-ray"
  },
  ar: {
    brand_name: "ميدينوفا", brand_sub: "مشروع تخرج",
    nav_home: "الرئيسية", nav_chatbot: "المحادثة", nav_skin: "فحص الجلد", nav_xray: "فحص الأشعة",
    footer_brand: "ميدينوفا &middot; إصدار ١.٠", footer_disclaimer: "نموذج بحثي — ليس جهازاً طبياً.",
    chatbot_title: "تحدث مع المساعد الطبي ميدينوفا",
    chatbot_desc: "صف ما تشعر به. سيسألك المساعد بعض الأسئلة الإضافية ثم يقدم لك تقريراً.",
    chatbot_placeholder: "اكتب رسالة…",
    chatbot_send: "إرسال",
    chatbot_restart: "ابدأ محادثة جديدة",
    chatbot_initial: "مرحباً! أنا المساعد الذكي لميدينوفا. أخبرني بم تشعر؟ (مثال: أشعر بصداع في الجانب الأيمن من وجهي).",
    theme_btn: "المظهر",
    lang_btn: "EN",
    skin_eyebrow: "تحليل أمراض الجلد",
    skin_title: "فحص صورة آفة جلدية",
    skin_desc: "نموذج ResNet50 مصمم لتشخيص 7 أنواع من الأمراض الجلدية.",
    skin_btn: "فحص الصورة",
    skin_analyzing: "جاري الفحص…",
    xray_eyebrow: "تحليل الأشعة السينية",
    xray_title: "فحص أشعة الصدر",
    xray_desc: "نموذج Swin Transformer لاكتشاف الالتهاب الرئوي.",
    xray_btn: "فحص الأشعة"
  }
};

export function t(key) {
  return i18n[currentLang][key] || key;
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (i18n[currentLang][key]) {
      el.innerHTML = i18n[currentLang][key];
    }
  });
}

langBtn.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "ar" : "en";
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
  localStorage.setItem("lang", currentLang);
  applyTranslations();
  renderRoute(); // Re-render the current page to apply translations in the JS
});

// --- Router Logic ---
function currentRoute() {
  const hash = window.location.hash.replace("#/", "");
  return routes[hash] ? hash : "home";
}

function setActiveLink(route) {
  // Navigation sidebar is removed, so we do nothing here.
}

function renderRoute() {
  const route = currentRoute();
  setActiveLink(route);
  appEl.innerHTML = "";
  routes[route](appEl);
}

window.addEventListener("hashchange", renderRoute);
window.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  renderRoute();
});
