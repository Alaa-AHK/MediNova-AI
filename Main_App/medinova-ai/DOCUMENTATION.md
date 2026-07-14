#  Medical AI API — Technical Documentation

**Version:** 1.0.0  
**Base URL:** `https://morefaat69-medical-ai-api.hf.space`  
**Swagger UI:** `https://morefaat69-medical-ai-api.hf.space/docs`

---

##  Overview

The Medical AI API is a unified REST API that wraps **7 Deep Learning models** for medical image diagnosis. Each model accepts an image file and returns a prediction with confidence score and Arabic medical recommendations.

All endpoints use `multipart/form-data` and accept the following optional patient fields:

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Medical image **(required)** |
| `age` | Integer | Patient age (optional) |
| `gender` | String | `male` or `female` (optional) |
| `symptoms` | String | Patient symptoms in Arabic or English (optional) |

> When `age`, `gender`, and `symptoms` are provided, the API generates a **personalized Arabic medical report** via Gemini AI. Otherwise, it falls back to a predefined report.

---

## 🔍 General Endpoints

### `GET /`
Returns API info and list of loaded models.

**Response:**
```json
{
  "name": "Medical AI API",
  "version": "1.0.0",
  "loaded_models": ["skin", "breast_seg", "breast_cls", "eye", "brain", "heart", "lung", "kidney"]
}
```

---

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

---

## 🩺 1. Skin Cancer — `/predict/skin`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** Dermatoscopy image (RGB)  
**Input Size:** 28×28 (auto-resized)  
**Model:** Custom CNN — TensorFlow  
**Dataset:** 25,000 images — ISIC Dataset  
**Accuracy:** 96.2%

### Classes

| Class | Full Name |
|-------|-----------|
| `AK` | Actinic Keratosis |
| `BCC` | Basal Cell Carcinoma |
| `BKL` | Benign Keratosis-like Lesions |
| `DF` | Dermatofibroma |
| `MEL` | Melanoma |
| `NV` | Melanocytic Nevi |
| `SCC` | Squamous Cell Carcinoma |
| `VASC` | Vascular Lesions |

### Request Example (Postman / curl)
```bash
curl -X POST https://morefaat69-medical-ai-api.hf.space/predict/skin \
  -F "file=@skin.jpg" \
  -F "age=45" \
  -F "gender=male" \
  -F "symptoms=تغير في لون الجلد وحكة"
```

### Response Example
```json
{
  "model": "skin",
  "predicted_class": "MEL",
  "predicted_name": "Melanoma",
  "confidence": 94.32,
  "severity": "high",
  "all_probabilities": {
    "AK": 0.5,
    "BCC": 1.2,
    "BKL": 0.8,
    "DF": 0.3,
    "MEL": 94.32,
    "NV": 2.1,
    "SCC": 0.6,
    "VASC": 0.18
  },
  "disease_info": {
    "disease_name": "Melanoma — ورم الخلايا الميلانينية",
    "description": "...",
    "recommendations": ["...", "..."],
    "emergency_signs": ["...", "..."],
    "prevention_tips": ["...", "..."]
  }
}
```

---

## 🫀 2. Breast Cancer — `/predict/breast`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** Ultrasound image (RGB)  
**Model:** U-Net (Segmentation) + MobileNetV2 (Classification) — TensorFlow  
**Dataset:** 15,000 images — BUSI Dataset  
**Accuracy:** 96.7%

### Classes

| Class | Description |
|-------|-------------|
| `benign` | حميد |
| `malignant` | خبيث |
| `normal` | طبيعي |

### Response Example
```json
{
  "model": "breast",
  "predicted_class": "malignant",
  "confidence": 91.5,
  "all_probabilities": {
    "benign": 5.2,
    "malignant": 91.5,
    "normal": 3.3
  },
  "segmentation": {
    "mask_mean_activation": 0.6231,
    "lesion_coverage_percent": 18.4,
    "mask_image_base64": "iVBORw0KGgo...",
    "overlay_image_base64": "iVBORw0KGgo..."
  },
  "disease_info": {
    "disease_name": "Malignant — ورم خبيث",
    "description": "...",
    "recommendations": ["...", "..."]
  }
}
```

> **Note:** `mask_image_base64` and `overlay_image_base64` are PNG images encoded in Base64. To display them in the frontend:
> ```html
> <img src="data:image/png;base64,{mask_image_base64}" />
> ```

---

## 👁️ 3. Eye Diseases — `/predict/eye`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** Fundus image (RGB)  
**Input Size:** 224×224 (auto-resized)  
**Model:** EfficientNetB3 + Dense layers — TensorFlow  
**Dataset:** 15,000 images  
**Accuracy:** 97.8%

### Classes

| Class | Description |
|-------|-------------|
| `Cataract` | الماء الأبيض |
| `Diabetic Retinopathy` | اعتلال الشبكية السكري |
| `Glaucoma` | الجلوكوما |
| `Normal` | طبيعي |

### Response Example
```json
{
  "model": "eye",
  "predicted_class": "Glaucoma",
  "confidence": 88.7,
  "all_probabilities": {
    "Cataract": 3.1,
    "Diabetic Retinopathy": 5.4,
    "Glaucoma": 88.7,
    "Normal": 2.8
  },
  "disease_info": {
    "disease_name": "Glaucoma — الجلوكوما",
    "description": "...",
    "recommendations": ["...", "..."]
  }
}
```

---

## 🧠 4. Brain Tumor — `/predict/brain`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** MRI image (RGB)  
**Input Size:** 224×224 (auto-resized)  
**Model:** VGG-like CNN — TensorFlow  
**Dataset:** 7,000 images  
**Accuracy:** 98.1%

### Classes

| Class | Description |
|-------|-------------|
| `glioma` | ورم الغليوما |
| `meningioma` | ورم السحايا |
| `notumor` | لا يوجد ورم |
| `pituitary` | ورم الغدة النخامية |

### Response Example
```json
{
  "model": "brain",
  "predicted_class": "glioma",
  "confidence": 95.1,
  "all_probabilities": {
    "glioma": 95.1,
    "meningioma": 2.3,
    "notumor": 1.8,
    "pituitary": 0.8
  },
  "disease_info": {
    "disease_name": "Glioma — ورم الغليوما",
    "description": "...",
    "recommendations": ["...", "..."]
  }
}
```

---

## ❤️ 5. Heart Segmentation — `/predict/heart`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** Echocardiography image (Grayscale)  
**Input Size:** 128×128 (auto-resized)  
**Model:** U-Net — TensorFlow  
**Dataset:** 13,000 images  
**Accuracy:** 97.3%

### Assessments

| Assessment | Description |
|------------|-------------|
| `normal` | حجم طبيعي |
| `slightly_large` | كبير قليلاً |
| `abnormally_large` | كبير بشكل غير طبيعي |
| `not_detected` | لم يتم اكتشاف القلب |

### Response Example
```json
{
  "model": "heart",
  "task": "segmentation",
  "heart_area_ratio_percent": 22.5,
  "assessment": "slightly_large",
  "mask_stats": {
    "mean_activation": 0.4821,
    "max_activation": 0.9931,
    "detected_pixels": 3686
  },
  "segmentation": {
    "mask_image_base64": "iVBORw0KGgo...",
    "overlay_image_base64": "iVBORw0KGgo..."
  },
  "disease_info": {
    "disease_name": "Slightly Large Heart",
    "description": "...",
    "recommendations": ["...", "..."]
  }
}
```

---

## 🫁 6. Chest X-Ray — `/predict/lung`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** X-Ray image (RGB)  
**Input Size:** 224×224 (auto-resized)  
**Model:** Hybrid ResNet-152 + EfficientNetB5 + Attention — **PyTorch**  
**Dataset:** 22,000 images  
**Accuracy:** 96.9%

### Classes

| Class | Description |
|-------|-------------|
| `Covid-19` | كوفيد-19 |
| `Pneumonia-Viral` | التهاب رئوي فيروسي |
| `Pneumonia-Bacterial` | التهاب رئوي بكتيري |
| `Normal` | طبيعي |
| `Emphysema` | انتفاخ الرئة |
| `Tuberculosis` | السل الرئوي |

### Response Example
```json
{
  "model": "lung",
  "predicted_class": "Covid-19",
  "confidence": 87.3,
  "all_probabilities": {
    "Covid-19": 87.3,
    "Emphysema": 4.1,
    "Normal": 3.2,
    "Pneumonia-Bacterial": 2.9,
    "Pneumonia-Viral": 1.8,
    "Tuberculosis": 0.7
  },
  "disease_info": {
    "disease_name": "Covid-19 — كوفيد-19",
    "description": "...",
    "recommendations": ["...", "..."]
  }
}
```

---

## 🫘 7. Kidney Disease — `/predict/kidney`

**Method:** `POST`  
**Content-Type:** `multipart/form-data`  
**Image:** CT Scan image (Grayscale)  
**Input Size:** 200×200 (auto-resized)  
**Model:** Custom CNN — TensorFlow  
**Dataset:** 8,000 images  
**Accuracy:** 97.5%

### Classes

| Class | Description |
|-------|-------------|
| `Cyst` | كيس الكلى |
| `Normal` | طبيعي |
| `Stone` | حصوة الكلى |
| `Tumor` | ورم الكلى |

### Response Example
```json
{
  "model": "kidney",
  "predicted_class": "Stone",
  "confidence": 92.8,
  "all_probabilities": {
    "Cyst": 2.1,
    "Normal": 3.4,
    "Stone": 92.8,
    "Tumor": 1.7
  },
  "disease_info": {
    "disease_name": "Stone — حصوة الكلى",
    "description": "...",
    "recommendations": ["...", "..."]
  }
}
```

---

## ⚠️ Error Responses

### 503 — Model Not Loaded
```json
{
  "detail": "Model 'eye' is not loaded. Check weight file."
}
```

### 400 — Invalid Image
```json
{
  "detail": "Could not read image file."
}
```

---

## 🔧 Frontend Integration Guide

### JavaScript / Fetch
```javascript
const formData = new FormData();
formData.append("file", imageFile);         // required
formData.append("age", 35);                 // optional
formData.append("gender", "male");          // optional
formData.append("symptoms", "حكة وألم");   // optional

const response = await fetch(
  "https://morefaat69-medical-ai-api.hf.space/predict/skin",
  {
    method: "POST",
    body: formData,
  }
);

const result = await response.json();
console.log(result.predicted_class);        // e.g. "MEL"
console.log(result.confidence);             // e.g. 94.32
console.log(result.disease_info);           // Arabic report
```

---

### Axios (React / Vue)
```javascript
import axios from "axios";

const BASE_URL = "https://morefaat69-medical-ai-api.hf.space";

export const predictDisease = async (model, imageFile, patientData = {}) => {
  const formData = new FormData();
  formData.append("file", imageFile);

  if (patientData.age)      formData.append("age", patientData.age);
  if (patientData.gender)   formData.append("gender", patientData.gender);
  if (patientData.symptoms) formData.append("symptoms", patientData.symptoms);

  const { data } = await axios.post(`${BASE_URL}/predict/${model}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
};

// Usage
const result = await predictDisease("brain", mriFile, {
  age: 42,
  gender: "female",
  symptoms: "صداع شديد ودوخة",
});
```

---

### Display Segmentation Images (Breast & Heart)
```javascript
// بعد ما تجيب الـ response
const { segmentation } = result;

// عرض الـ mask
maskImg.src = `data:image/png;base64,${segmentation.mask_image_base64}`;

// عرض الـ overlay
overlayImg.src = `data:image/png;base64,${segmentation.overlay_image_base64}`;
```

---

##  Architecture Overview

```
┌─────────────────────────────────────────────┐
│              FastAPI Server             │   
│                 main.py                 │
├──────────┬──────────┬────────────────────────┤
│  /skin   │  /eye    │  /brain  │  /kidney│
│  /breast │  /heart  │  /lung   │          │
├──────────┴──────────┴────────────────────────┤
│           Model Loading (startup)            │
│   HuggingFace Hub → weights/ folder          │
├─────────────────────────────────────────────┤
│         TensorFlow (6 models)                │
│         PyTorch   (1 model — lung)           │
├─────────────────────────────────────────────┤
│         Gemini AI (Arabic Reports)           │
│         Fallback: Hardcoded Dictionary       │
└─────────────────────────────────────────────┘
```

---

## 🚀 Local Development

```bash
# 1. Clone the repo
git clone https://github.com/Refaat62/medical-project
cd medical-project

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set Gemini API Key
set GEMINI_API_KEY=AIza...          # Windows CMD
$env:GEMINI_API_KEY="AIza..."       # PowerShell

# 4. Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 5. Open Swagger UI
# http://localhost:8000/docs
```

---

## 📦 Model Weights

All weights are hosted on HuggingFace and downloaded automatically at startup:

| File | Size | Model |
|------|------|-------|
| `skin_model.h5` | 5.3 MB | Skin CNN |
| `Final Final Breast Cancer Segmentation.h5` | 26.3 MB | Breast U-Net |
| `bes__model.h5` | 24.4 MB | Breast Classifier |
| `eye_model_fixed.h5` | 135 MB | Eye EfficientNetB3 |
| `brain_model.h5` | 254 MB | Brain CNN |
| `heart_segmentation_model.h5` | 23.5 MB | Heart U-Net |
| `final_ChestX6_hybrid_model.pth` | 368 MB | Lung Hybrid PyTorch |
| `kidney_model1.h5` | 4.33 MB | Kidney CNN |

**Total:** ~841 MB

---

*Built with ❤️ — Ahmed Refaat*
