# MediNova-AI
*A Comprehensive Web-Based Healthcare Assistance System*

MediNova-AI is a massive graduation project for medical AI research and deployment. The repository encompasses extensive machine learning research and a decoupled frontend system that integrates diverse diagnostic models, medical OCR, a conversational LLM chatbot, and 3D anatomical rendering.

## Project Structure

```text
MediNova-AI/
├── Main_App/             # The primary frontend (Vanilla HTML/CSS/JS)
│   └── medinova-ai/      # Web app source code & 3D assets
├── Code/                 # Research notebooks & model training workflows
├── Documentations/       # Project reports and presentations
├── app.py                # Secondary Streamlit demo for specific local models
├── requirements.txt      # Python dependencies for the Streamlit demo and models
└── README.md
```

## Features & Supported Modules

The system connects to over 10 specialized AI models and features:
- **Chest X-Ray Analysis:** Pneumonia binary classification (ResNet50 + LoRA) and 6-class hybrid models.
- **Pathology (Breast Cancer):** BreakHis histopathology classification (EfficientNetB5) & image segmentation.
- **Skin Diseases:** 7-class dermoscopy image classifier (ResNet50).
- **Brain Tumor MRI:** Classification for brain MRI scans.
- **Heart Cancer CT:** Segmentation and detection.
- **Eye Diseases:** Imaging classification for various eye conditions.
- **Kidney Disease:** CT scan classification.
- **Prescription OCR:** Handwritten medical text recognition using TrOCR.
- **Medical Chatbot:** Conversational AI powered by an external LLM API (LangChain/Transformers).
- **3D Viewer:** In-browser WebGL rendering of 3D anatomical models (e.g., `.glb`).

## Running the Main Application

The primary frontend is built using standard web technologies (ES Modules) and does not require a build step, but it must be run on a local web server to enable the device camera (`getUserMedia`) and 3D rendering features.

1. Navigate to the frontend directory:
```bash
cd Main_App/medinova-ai
```

2. Start a local HTTP server:
```bash
python3 -m http.server 8000
```

3. Open your browser and navigate to `http://localhost:8000`.

*(Note: Endpoint URLs for the API and Chatbot are highly configurable inside `Main_App/medinova-ai/js/config.js`)*

## Code Notebooks

The `Code/` folder contains the extensive model development and training work behind the project.

| Notebook | Purpose |
| --- | --- |
| `brain-tumor-mri-classifier.ipynb` | Brain tumor MRI classification research notebook |
| `breast-cancer.ipynb` | Breast cancer image segmentation / classification experiments |
| `Chatbot.ipynb` | Medical chatbot and LLM training workflow |
| `chestx6-hybrid-model.ipynb` | Chest X-ray 6-class hybrid model experiments |
| `eye-diseases-classification-improved.ipynb` | Eye disease classification with TensorFlow / Keras |
| `heart-cancer-detection.ipynb` | Heart CT segmentation / detection notebook |
| `keandy (1).ipynb` | Kidney disease classification on the CT kidney dataset |
| `llm-chat.ipynb` | LangChain / Transformers medical chat pipeline |
| `Radiology.ipynb` | Pneumonia / chest X-ray classification with PEFT |
| `Skin_diseases.ipynb` | Skin disease classification research notebook |
| `skin-disease-cnn.ipynb` | CNN-based skin disease classifier |

## Secondary Streamlit Demo
If you wish to test the local PyTorch/Keras checkpoints for the initial 4 vision models directly via Streamlit:
```bash
pip install -r requirements.txt
streamlit run app.py
```

## Team
- Fady Youssif Esstemalk
- Salma zaghloul samak
- Rokia Hassan Ahmed Mohamed
- Fares Waleed Badawi
- Alaa Abdelhakeem
- Afnan Magdy Eweis

*Disclaimer: MediNova-AI is a research prototype intended for academic evaluation only. It is not a certified diagnostic device.*