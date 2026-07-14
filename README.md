# MediNova-AI

MediNova-AI is a graduation project for medical AI research and demoing. The repository combines a Streamlit application with a set of training and experimentation notebooks covering image classification, segmentation, OCR, and medical chatbot workflows.

The main app is [app.py](app.py), which currently acts as a unified demo console for four local models plus one external chatbot endpoint. The research notebooks in [Code/](Code) document the model development work behind the project.

## What the app covers

- Chest X-ray pneumonia classification with LoRA on ResNet50
- BreakHis breast histopathology classification with EfficientNetB5
- Skin lesion classification for HAM10000-style dermoscopy images
- Prescription OCR with TrOCR
- Medical chatbot integration through an external API

## Code notebooks

The [Code/](Code) folder contains the project notebooks below.

| Notebook | Purpose |
| --- | --- |
| [brain-tumor-mri-classifier.ipynb](Code/brain-tumor-mri-classifier.ipynb) | Brain tumor MRI classification research notebook |
| [breast-cancer.ipynb](Code/breast-cancer.ipynb) | Breast cancer image segmentation / classification experiments |
| [Chatbot.ipynb](Code/Chatbot.ipynb) | Medical chatbot and LLM training workflow |
| [chestx6-hybrid-model.ipynb](Code/chestx6-hybrid-model.ipynb) | Chest X-ray 6-class hybrid model experiments |
| [eye-diseases-classification-improved.ipynb](Code/eye-diseases-classification-improved.ipynb) | Eye disease classification with TensorFlow / Keras |
| [heart-cancer-detection.ipynb](Code/heart-cancer-detection.ipynb) | Heart CT segmentation / detection notebook |
| [keandy (1).ipynb](Code/keandy%20(1).ipynb) | Kidney disease classification on the CT kidney dataset |
| [llm-chat.ipynb](Code/llm-chat.ipynb) | LangChain / Transformers medical chat pipeline |
| [Radiology.ipynb](Code/Radiology.ipynb) | Pneumonia / chest X-ray classification with PEFT |
| [Skin_diseases.ipynb](Code/Skin_diseases.ipynb) | Skin disease classification research notebook |
| [skin-disease-cnn.ipynb](Code/skin-disease-cnn.ipynb) | CNN-based skin disease classifier |

## Repository layout

```text
MediNova-AI/
├── app.py
├── requirements.txt
├── README.md
├── Code/
├── Documentations/
└── Main_App/
```

## Setup

1. Clone the repository.

```bash
git clone https://github.com/Alaa-AHK/MediNova-AI.git
cd MediNova-AI
```

2. Install the Python dependencies.

```bash
pip install -r requirements.txt
```

3. Make sure the expected model files are available under `models/` as referenced by [app.py](app.py).

4. Start the demo.

```bash
streamlit run app.py
```

## Notes

- The notebooks are research and training artifacts; not all of them are wired into the Streamlit app.
- The project is intended for educational and research use only and is not a certified medical device.

## Team

- Fady Yousef
- Salma Samak
- Rokia Hassan
- Fares Waleed
- Alaa Abdelhakeem
- Afnan Magdy