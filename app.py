"""
========================================================================
 Hospital AI Diagnostics Suite - Streamlit Demo
========================================================================
Single-file Streamlit app for testing 4 locally-trained models plus one
external chatbot API, in a hospital-themed UI, for committee demo/testing.

Models:
  1. Chest X-Ray Pneumonia Classifier   (ResNet50 + LoRA)
  2. BreakHis Breast Histopathology     (EfficientNetB5, Keras)
  3. Skin Lesion Classifier (HAM10000)  (ResNet50, 7 classes)
  4. Prescription OCR                   (TrOCR, VisionEncoderDecoder)
  5. Medical Chatbot                    (external API via ngrok)

Run:
    pip install -r requirements.txt
    streamlit run app.py

Folder layout expected next to this file:
    models/chest_xray/best_model.pth
    models/breakhis/breakhis_efficientnetb5_baseline.keras
    models/skin/skin_resnet50_checkpoint.pth
    models/trocr/{config.json, generation_config.json, processor_config.json,
                  tokenizer.json, tokenizer_config.json, model.safetensors}
                  (model.safetensors / pytorch_model.bin must be added manually -
                   it was missing from the exported bundle, see README)
========================================================================
"""

import base64
import io
import os
import time

import numpy as np
import requests
import streamlit as st
from PIL import Image

# ------------------------------------------------------------------
# Page config + hospital theme
# ------------------------------------------------------------------
st.set_page_config(
    page_title="Hospital AI Diagnostics Suite",
    page_icon="\U0001F3E5",
    layout="wide",
    initial_sidebar_state="expanded",
)

HOSPITAL_CSS = """
<style>
:root {
    --hosp-blue: #0B5FA5;
    --hosp-teal: #0FA3A3;
    --hosp-light: #EAF4FB;
    --hosp-dark: #0B2E4A;
}
.stApp {
    background: linear-gradient(180deg, #F4FAFD 0%, #FFFFFF 45%);
}
section[data-testid="stSidebar"] {
    background: linear-gradient(180deg, var(--hosp-dark) 0%, var(--hosp-blue) 100%);
}
section[data-testid="stSidebar"] * {
    color: #F4FAFD !important;
}
.hosp-header {
    background: linear-gradient(90deg, var(--hosp-blue), var(--hosp-teal));
    padding: 22px 28px;
    border-radius: 14px;
    color: white;
    margin-bottom: 22px;
    box-shadow: 0 4px 18px rgba(11, 95, 165, 0.25);
}
.hosp-header h1 {
    margin: 0;
    font-size: 1.6rem;
}
.hosp-header p {
    margin: 4px 0 0 0;
    opacity: 0.9;
    font-size: 0.95rem;
}
.result-card {
    background: white;
    border: 1px solid #DCEBF5;
    border-left: 6px solid var(--hosp-teal);
    border-radius: 12px;
    padding: 18px 22px;
    margin-top: 14px;
    box-shadow: 0 2px 10px rgba(11, 95, 165, 0.08);
}
.result-card.positive {
    border-left-color: #D9534F;
}
.result-card.negative {
    border-left-color: #2E9E5B;
}
.badge {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 0.85rem;
    background: var(--hosp-light);
    color: var(--hosp-blue);
}
.disclaimer-box {
    background: #FFF7E6;
    border: 1px solid #F0C36D;
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 0.85rem;
    color: #7A5B00;
    margin-top: 14px;
}
.model-missing {
    background: #FDEDEC;
    border: 1px solid #E6A5A0;
    border-radius: 10px;
    padding: 14px 18px;
    color: #8A2C24;
}
</style>
"""
st.markdown(HOSPITAL_CSS, unsafe_allow_html=True)


def hosp_header(title, subtitle):
    st.markdown(
        f"""<div class="hosp-header"><h1>{title}</h1><p>{subtitle}</p></div>""",
        unsafe_allow_html=True,
    )


DISCLAIMER = (
    "Research prototype for academic evaluation only - not a certified "
    "diagnostic device. All outputs must be reviewed by a qualified "
    "clinician before any medical decision."
)

MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

# ------------------------------------------------------------------
# Sidebar navigation
# ------------------------------------------------------------------
st.sidebar.markdown("## \U0001F3E5 Hospital AI Suite")
st.sidebar.caption("Graduation committee demo build")

PAGE = st.sidebar.radio(
    "Select module",
    [
        "\U0001F3E0 Home",
        "\U0001FAC1 Chest X-Ray (Pneumonia)",
        "\U0001F397\uFE0F BreakHis (Breast Histopathology)",
        "\U0001FA79 Skin Lesion (HAM10000)",
        "\U0001F4DD Prescription OCR (TrOCR)",
        "\U0001F4AC Medical Chatbot",
    ],
)

st.sidebar.markdown("---")
st.sidebar.caption("All predictions are for demo/testing purposes only.")

# ========================================================================
# HOME PAGE
# ========================================================================
if PAGE == "\U0001F3E0 Home":
    hosp_header(
        "Hospital AI Diagnostics Suite",
        "Unified testing console for four diagnostic models and one medical chatbot.",
    )
    col1, col2 = st.columns(2)
    with col1:
        st.markdown("### Available modules")
        st.markdown(
            """
- **Chest X-Ray (Pneumonia)** - ResNet50 + LoRA, binary classifier with Grad-CAM
- **BreakHis (Breast Histopathology)** - EfficientNetB5, benign vs malignant
- **Skin Lesion (HAM10000)** - ResNet50, 7-class dermatology classifier
- **Prescription OCR (TrOCR)** - handwritten prescription text recognition
- **Medical Chatbot** - connected to an external LLM API
            """
        )
    with col2:
        st.markdown("### Status check")
        checks = [
            ("Chest X-Ray checkpoint", os.path.join(MODEL_DIR, "chest_xray", "best_model.pth")),
            ("BreakHis checkpoint", os.path.join(MODEL_DIR, "breakhis", "breakhis_efficientnetb5_baseline.keras")),
            ("Skin checkpoint", os.path.join(MODEL_DIR, "skin", "skin_resnet50_checkpoint.pth")),
            ("TrOCR weights (model.safetensors)", os.path.join(MODEL_DIR, "trocr", "model.safetensors")),
        ]
        for label, path in checks:
            ok = os.path.exists(path)
            icon = "\u2705" if ok else "\u274C"
            st.markdown(f"{icon} {label}")
        st.markdown(
            '<div class="disclaimer-box">' + DISCLAIMER + "</div>",
            unsafe_allow_html=True,
        )

# ========================================================================
# 1. CHEST X-RAY (Pneumonia) - ResNet50 + LoRA
# ========================================================================
if PAGE == "\U0001FAC1 Chest X-Ray (Pneumonia)":
    hosp_header("Chest X-Ray Pneumonia Classifier", "ResNet50 backbone fine-tuned with LoRA - binary classifier with Grad-CAM")

    CKPT_PATH = os.path.join(MODEL_DIR, "chest_xray", "best_model.pth")
    if not os.path.exists(CKPT_PATH):
        st.markdown(
            f'<div class="model-missing">Checkpoint not found at <code>{CKPT_PATH}</code>. '
            f"Place <code>best_model.pth</code> in <code>models/chest_xray/</code>.</div>",
            unsafe_allow_html=True,
        )
    else:
        @st.cache_resource(show_spinner="Loading Chest X-Ray model...")
        def load_chest_xray_model():
            import torch
            import torch.nn as nn
            from peft import LoraConfig, get_peft_model
            from torchvision import models

            IMG_SIZE = 224
            CLASSES = ["NORMAL", "PNEUMONIA"]
            LORA_TARGET_LAYERS = ["layer3", "layer4"]

            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            base = models.resnet50(weights=None)
            base.fc = nn.Linear(base.fc.in_features, len(CLASSES))

            target_modules = [
                name
                for name, module in base.named_modules()
                if isinstance(module, nn.Conv2d) and any(layer in name for layer in LORA_TARGET_LAYERS)
            ]
            lora_config = LoraConfig(
                r=8, lora_alpha=16, target_modules=target_modules,
                lora_dropout=0.1, bias="none", modules_to_save=["fc"],
            )
            model = get_peft_model(base, lora_config)
            state_dict = torch.load(CKPT_PATH, map_location=device)
            model.load_state_dict(state_dict, strict=True)
            model.to(device)
            model.eval()

            target_layer = None
            for name, module in model.named_modules():
                if name.endswith("layer4"):
                    target_layer = module

            return model, device, target_layer, CLASSES, IMG_SIZE

        class GradCAM:
            def __init__(self, model, target_layer):
                self.model = model
                self.activations = None
                self.gradients = None
                target_layer.register_forward_hook(self._save_activation)
                target_layer.register_full_backward_hook(self._save_gradient)

            def _save_activation(self, module, inputs, output):
                self.activations = output.detach()

            def _save_gradient(self, module, grad_input, grad_output):
                self.gradients = grad_output[0].detach()

            def generate(self, input_tensor, class_idx):
                import torch
                self.model.zero_grad()
                output = self.model(input_tensor)
                score = output[0, class_idx]
                score.backward()
                weights = self.gradients.mean(dim=(2, 3), keepdim=True)
                cam = torch.relu((weights * self.activations).sum(dim=1, keepdim=True))
                cam = cam.squeeze().detach().cpu().numpy()
                cam = cam - cam.min()
                cam = cam / (cam.max() + 1e-8)
                return cam

        uploaded = st.file_uploader("Upload a chest X-ray image", type=["png", "jpg", "jpeg"], key="cxr_upload")
        threshold = st.slider("Decision threshold (PNEUMONIA probability)", 0.05, 0.95, 0.5, 0.05)

        if uploaded is not None:
            pil_img = Image.open(uploaded).convert("RGB")
            col1, col2 = st.columns(2)
            with col1:
                st.image(pil_img, caption="Uploaded X-ray", use_container_width=True)

            if st.button("Analyze X-ray", type="primary"):
                import torch
                from scipy.ndimage import zoom
                import matplotlib.cm as cm
                from torchvision import transforms

                model, device, target_layer, CLASSES, IMG_SIZE = load_chest_xray_model()
                grad_cam = GradCAM(model, target_layer)

                eval_transforms = transforms.Compose([
                    transforms.Resize((IMG_SIZE, IMG_SIZE)),
                    transforms.ToTensor(),
                    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
                ])

                with st.spinner("Running inference..."):
                    input_tensor = eval_transforms(pil_img).unsqueeze(0).to(device)
                    input_tensor.requires_grad_(True)

                    with torch.no_grad():
                        logits = model(input_tensor)
                        probs = torch.softmax(logits, dim=1)[0]
                        pneumonia_prob = probs[1].item()

                    predicted_idx = int(pneumonia_prob >= threshold)
                    cam = grad_cam.generate(input_tensor, predicted_idx)

                    cam_resized = zoom(cam, (IMG_SIZE / cam.shape[0], IMG_SIZE / cam.shape[1]), order=1)
                    img_resized = np.array(pil_img.resize((IMG_SIZE, IMG_SIZE)), dtype=float) / 255
                    heatmap = cm.jet(cam_resized)[..., :3]
                    overlay = 0.55 * img_resized + 0.45 * heatmap
                    overlay = (np.clip(overlay, 0, 1) * 255).astype(np.uint8)

                prediction = CLASSES[predicted_idx]
                confidence = probs[predicted_idx].item()
                css_class = "positive" if prediction == "PNEUMONIA" else "negative"

                with col2:
                    st.image(overlay, caption="Grad-CAM overlay", use_container_width=True)

                st.markdown(
                    f"""<div class="result-card {css_class}">
                    <span class="badge">{prediction}</span>
                    <p style="margin-top:10px;">Confidence: <b>{confidence*100:.1f}%</b></p>
                    <p>NORMAL: {probs[0].item()*100:.1f}% &nbsp;|&nbsp; PNEUMONIA: {probs[1].item()*100:.1f}%</p>
                    <p>Threshold used: {threshold:.2f}</p>
                    </div>""",
                    unsafe_allow_html=True,
                )
                st.markdown(f'<div class="disclaimer-box">{DISCLAIMER}</div>', unsafe_allow_html=True)

# ========================================================================
# 2. BREAKHIS - Breast Histopathology (EfficientNetB5, Keras)
# ========================================================================
if PAGE == "\U0001F397\uFE0F BreakHis (Breast Histopathology)":
    hosp_header("BreakHis Breast Histopathology Classifier", "EfficientNetB5 (Keras) - benign vs malignant tissue classification")

    st.info(
        "Note: the exported model file has no embedded class-name metadata. "
        "Class order below assumes the standard alphabetical convention "
        "(benign=0, malignant=1) used by Keras' flow_from_directory / "
        "image_dataset_from_directory. Please verify this against your "
        "training notebook before presenting results.",
        icon="\u2139\uFE0F",
    )

    CKPT_PATH = os.path.join(MODEL_DIR, "breakhis", "breakhis_efficientnetb5_baseline.keras")
    if not os.path.exists(CKPT_PATH):
        st.markdown(
            f'<div class="model-missing">Model not found at <code>{CKPT_PATH}</code>. '
            f"Place <code>breakhis_efficientnetb5_baseline.keras</code> in "
            f"<code>models/breakhis/</code>.</div>",
            unsafe_allow_html=True,
        )
    else:
        @st.cache_resource(show_spinner="Loading BreakHis model...")
        def load_breakhis_model():
            import keras
            return keras.models.load_model(CKPT_PATH)

        IMG_SIZE = 456
        CLASSES = ["Benign", "Malignant"]

        uploaded = st.file_uploader("Upload a histopathology image", type=["png", "jpg", "jpeg"], key="breakhis_upload")
        threshold = st.slider("Decision threshold (Malignant probability)", 0.05, 0.95, 0.5, 0.05, key="breakhis_thresh")

        if uploaded is not None:
            pil_img = Image.open(uploaded).convert("RGB")
            st.image(pil_img, caption="Uploaded histopathology image", width=380)

            if st.button("Analyze slide", type="primary"):
                with st.spinner("Running inference..."):
                    model = load_breakhis_model()
                    resized = pil_img.resize((IMG_SIZE, IMG_SIZE))
                    # Model has an internal Rescaling(1/255) layer - feed raw 0-255 pixels
                    arr = np.array(resized, dtype=np.float32)[None, ...]
                    pred = model.predict(arr, verbose=0)
                    malignant_prob = float(pred.reshape(-1)[0])

                predicted_idx = int(malignant_prob >= threshold)
                prediction = CLASSES[predicted_idx]
                confidence = malignant_prob if predicted_idx == 1 else (1 - malignant_prob)
                css_class = "positive" if prediction == "Malignant" else "negative"

                st.markdown(
                    f"""<div class="result-card {css_class}">
                    <span class="badge">{prediction}</span>
                    <p style="margin-top:10px;">Confidence: <b>{confidence*100:.1f}%</b></p>
                    <p>Benign: {(1-malignant_prob)*100:.1f}% &nbsp;|&nbsp; Malignant: {malignant_prob*100:.1f}%</p>
                    <p>Threshold used: {threshold:.2f}</p>
                    </div>""",
                    unsafe_allow_html=True,
                )
                st.markdown(f'<div class="disclaimer-box">{DISCLAIMER}</div>', unsafe_allow_html=True)

# ========================================================================
# 3. SKIN LESION - HAM10000 (ResNet50, 7 classes)
# ========================================================================
if PAGE == "\U0001FA79 Skin Lesion (HAM10000)":
    hosp_header("Skin Lesion Classifier (HAM10000)", "ResNet50 - 7-class dermatology classifier")

    CKPT_PATH = os.path.join(MODEL_DIR, "skin", "skin_resnet50_checkpoint.pth")
    if not os.path.exists(CKPT_PATH):
        st.markdown(
            f'<div class="model-missing">Checkpoint not found at <code>{CKPT_PATH}</code>. '
            f"Place <code>skin_resnet50_checkpoint.pth</code> in <code>models/skin/</code>.</div>",
            unsafe_allow_html=True,
        )
    else:
        @st.cache_resource(show_spinner="Loading Skin Lesion model...")
        def load_skin_model():
            import torch
            import torch.nn as nn
            from torchvision import models

            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            model = models.resnet50(weights=None)
            model.fc = nn.Sequential(nn.Dropout(p=0.35), nn.Linear(model.fc.in_features, 7))

            checkpoint = torch.load(CKPT_PATH, map_location=device)
            model.load_state_dict(checkpoint["model_state_dict"])
            class_names = checkpoint.get("class_names", [
                "Actinic Keratoses", "Basal Cell Carcinoma", "Benign Keratosis-like Lesions",
                "Dermatofibroma", "Melanocytic Nevi (Moles)", "Melanoma", "Vascular Lesions",
            ])
            model.to(device)
            model.eval()
            return model, device, class_names

        IMG_SIZE = 224

        uploaded = st.file_uploader("Upload a skin lesion image", type=["png", "jpg", "jpeg"], key="skin_upload")

        if uploaded is not None:
            pil_img = Image.open(uploaded).convert("RGB")
            st.image(pil_img, caption="Uploaded skin lesion image", width=380)

            if st.button("Analyze lesion", type="primary"):
                import torch
                from torchvision import transforms

                with st.spinner("Running inference..."):
                    model, device, class_names = load_skin_model()
                    val_transform = transforms.Compose([
                        transforms.Resize((IMG_SIZE, IMG_SIZE)),
                        transforms.ToTensor(),
                        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
                    ])
                    tensor = val_transform(pil_img).unsqueeze(0).to(device)
                    with torch.no_grad():
                        probs = torch.softmax(model(tensor), dim=1)[0].cpu().numpy()
                    predicted_idx = int(np.argmax(probs))

                prediction = class_names[predicted_idx]
                confidence = float(probs[predicted_idx])
                is_concerning = prediction in ("Melanoma", "Basal Cell Carcinoma")
                css_class = "positive" if is_concerning else "negative"

                st.markdown(
                    f"""<div class="result-card {css_class}">
                    <span class="badge">{prediction}</span>
                    <p style="margin-top:10px;">Confidence: <b>{confidence*100:.1f}%</b></p>
                    </div>""",
                    unsafe_allow_html=True,
                )
                st.markdown("#### Full probability distribution")
                for name, p in sorted(zip(class_names, probs), key=lambda x: -x[1]):
                    st.write(f"{name}")
                    st.progress(float(p), text=f"{p*100:.1f}%")
                st.markdown(f'<div class="disclaimer-box">{DISCLAIMER}</div>', unsafe_allow_html=True)

# ========================================================================
# 4. PRESCRIPTION OCR - TrOCR
# ========================================================================
if PAGE == "\U0001F4DD Prescription OCR (TrOCR)":
    hosp_header("Handwritten Prescription OCR", "TrOCR (VisionEncoderDecoder) - reads handwritten prescription text")

    TROCR_DIR = os.path.join(MODEL_DIR, "trocr")
    WEIGHT_CANDIDATES = ["model.safetensors", "pytorch_model.bin"]
    weight_found = any(os.path.exists(os.path.join(TROCR_DIR, w)) for w in WEIGHT_CANDIDATES)

    if not weight_found:
        st.markdown(
            f"""<div class="model-missing">
            <b>Model weights missing.</b> The config/tokenizer/processor files are present in
            <code>{TROCR_DIR}</code>, but no <code>model.safetensors</code> or
            <code>pytorch_model.bin</code> was found. The exported bundle
            (<code>exported_model.zip</code>) only contained an empty
            <code>merged_model/</code> folder with no weight file inside it - it looks like the
            export/merge step didn't actually save the weights. Please re-export the model
            (e.g. <code>model.save_pretrained("merged_model")</code> after
            <code>merge_and_unload()</code>) and place the resulting weight file in
            <code>{TROCR_DIR}</code>.
            </div>""",
            unsafe_allow_html=True,
        )
    else:
        @st.cache_resource(show_spinner="Loading TrOCR model...")
        def load_trocr_model():
            import torch
            from transformers import VisionEncoderDecoderModel, TrOCRProcessor

            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            processor = TrOCRProcessor.from_pretrained(TROCR_DIR)
            model = VisionEncoderDecoderModel.from_pretrained(TROCR_DIR)
            model.to(device)
            model.eval()
            return model, processor, device

        uploaded = st.file_uploader("Upload a prescription image", type=["png", "jpg", "jpeg"], key="trocr_upload")

        if uploaded is not None:
            pil_img = Image.open(uploaded).convert("RGB")
            st.image(pil_img, caption="Uploaded prescription image", width=450)

            if st.button("Read prescription", type="primary"):
                import torch

                with st.spinner("Running OCR..."):
                    model, processor, device = load_trocr_model()
                    pixel_values = processor(images=pil_img, return_tensors="pt").pixel_values.to(device)
                    with torch.no_grad():
                        generated_ids = model.generate(pixel_values, max_length=64)
                    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

                st.markdown(
                    f"""<div class="result-card negative">
                    <p style="margin-top:0;">Recognized text:</p>
                    <p style="font-size:1.2rem;"><b>{text}</b></p>
                    </div>""",
                    unsafe_allow_html=True,
                )
                st.markdown(f'<div class="disclaimer-box">{DISCLAIMER}</div>', unsafe_allow_html=True)

# ========================================================================
# 5. MEDICAL CHATBOT - external API
# ========================================================================
if PAGE == "\U0001F4AC Medical Chatbot":
    hosp_header("Medical Chatbot", "Connected to an external LLM API")

    with st.expander("API connection settings", expanded=False):
        api_url = st.text_input(
            "Chat endpoint URL",
            value="https://segmentary-unpunctual-jazlynn.ngrok-free.dev/chat",
        )
        api_token = st.text_input(
            "API token",
            value="38YIqmgsWHFwzD4ykQoFV4bhOuF_4houKhQZVgCSJncunqURL",
            type="password",
        )
        st.caption(
            "Assumption: POST JSON body {'message': <text>}, Authorization: Bearer "
            "<token> header. If your backend expects a different schema (e.g. a "
            "different field name, or a chat history array), tell me the exact "
            "request/response format and I'll adjust this call."
        )

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    for msg in st.session_state.chat_history:
        with st.chat_message(msg["role"]):
            st.write(msg["content"])

    user_msg = st.chat_input("Ask the medical chatbot...")

    if user_msg:
        st.session_state.chat_history.append({"role": "user", "content": user_msg})
        with st.chat_message("user"):
            st.write(user_msg)

        with st.chat_message("assistant"):
            with st.spinner("Waiting for response..."):
                try:
                    headers = {
                        "Content-Type": "application/json",
                        "Authorization": f"Bearer {api_token}",
                        # ngrok free-tier URLs show an interstitial warning page to
                        # non-browser clients unless this header is set.
                        "ngrok-skip-browser-warning": "true",
                    }
                    payload = {"message": user_msg}
                    resp = requests.post(api_url, json=payload, headers=headers, timeout=60)
                    resp.raise_for_status()
                    try:
                        data = resp.json()
                    except ValueError:
                        data = None

                    reply = None
                    if isinstance(data, dict):
                        for key in ("response", "reply", "answer", "message", "text", "output"):
                            if key in data and isinstance(data[key], str):
                                reply = data[key]
                                break
                        if reply is None:
                            reply = str(data)
                    elif isinstance(data, str):
                        reply = data
                    else:
                        reply = resp.text

                except requests.exceptions.RequestException as e:
                    reply = f"Request failed: {e}"

                st.write(reply)
        st.session_state.chat_history.append({"role": "assistant", "content": reply})

    if st.session_state.chat_history:
        if st.button("Clear conversation"):
            st.session_state.chat_history = []
            st.rerun()
