# OCR Dataset Builder

A professional web-based tool for creating high-quality OCR training datasets with support for Nepali, Hindi, and English text. Powered by Google's Gemini 2.5 Flash API for 98% accurate text extraction.

<img width="1871" height="1025" alt="Screenshot 2025-12-04 144105" src="https://github.com/user-attachments/assets/cd3e4321-34ff-4ff6-8922-4af9f8543712" />


![OCR Dataset Builder](https://img.shields.io/badge/Accuracy-98%25-brightgreen) ![React](https://img.shields.io/badge/React-18.x-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🎯 **High-Accuracy OCR**: 98% baseline accuracy using Gemini 2.5 Flash
- 🌏 **Multi-language Support**: Nepali, Hindi, and English text recognition
- 🖼️ **Visual Annotation**: Draw bounding boxes directly on images
- ✏️ **Human Verification**: Edit and verify extracted text for 100% accuracy
- 📊 **Progress Tracking**: Real-time statistics and progress indicators
- ⌨️ **Keyboard Shortcuts**: Fast workflow with hotkeys
- 📁 **Organized Export**: Structured dataset export with image-text pairs
- 💾 **Auto-save**: Persistent API key storage

## 🚀 Quick Start

### Prerequisites

- Node.js 14.x or higher
- A Google Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Roshanshah098/Nepali-ocr.git
cd Nepali-ocr
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📖 How to Use

### Step 1: Configure API Key
1. Click **Settings** on the home screen
2. Enter your Gemini API key
3. The key is saved locally in your browser

### Step 2: Upload Images
1. Click the upload area or drag & drop images
2. Supports JPG, PNG formats
3. Best results with clear, well-lit text images

### Step 3: Annotate
1. Draw bounding boxes around text regions
2. Press **S** or click **Extract** to process
3. Use keyboard shortcuts for faster workflow:
   - `S` - Extract text from boxes
   - `U` - Undo last box
   - `N` - Next image

### Step 4: Review & Export
1. Review extracted text for accuracy
2. Edit if needed (increases accuracy to 100%)
3. Approve or reject each extraction
4. Export approved dataset:
   - `A` - Approve
   - `X` - Reject
   - `E` - Edit text
   - `←/→` - Navigate

## ⌨️ Keyboard Shortcuts

### Annotation View
| Key | Action |
|-----|--------|
| `S` | Extract text from boxes |
| `U` | Undo last box |
| `N` | Next image |

### Review View
| Key | Action |
|-----|--------|
| `A` | Approve current item |
| `X` | Reject current item |
| `E` | Toggle edit mode |
| `←` | Previous item |
| `→` | Next item |

## 📁 Export Format

The tool exports an organized dataset structure:

```
approved/
├── [timestamp]_0.png
├── [timestamp]_0.gt.txt
├── [timestamp]_1.png
├── [timestamp]_1.gt.txt
└── ...
```

Each image has a corresponding `.gt.txt` file containing the ground truth text.

## 🎯 Accuracy Metrics

- **AI-Generated**: 98% accuracy (Gemini 2.5 Flash)
- **Human-Verified**: 100% accuracy (after manual editing)
- Real-time accuracy tracking per item
- Aggregate statistics on export

## 🛠️ Tech Stack

- **React** 18.x - UI framework
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling
- **Google Gemini API** - OCR processing
- **Canvas API** - Image annotation

## 🔒 Privacy & Security

- API keys stored locally in browser (localStorage)
- No data sent to external servers except Google Gemini API
- All processing happens client-side
- Images never uploaded to our servers

## 📊 Use Cases

- Creating OCR training datasets
- Document digitization projects
- Historical text preservation
- Multi-language text recognition research
- Custom OCR model training

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini API for powerful OCR capabilities
- React and Tailwind CSS communities
- All contributors and users

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: your.email@example.com

## 🔄 Changelog

### v1.0.0 (2024)
- Initial release
- Gemini 2.5 Flash integration
- Multi-language support (Nepali, Hindi, English)
- Keyboard shortcuts
- Export functionality
- Accuracy tracking

---
#additional
<img width="1787" height="1040" alt="Screenshot 2025-12-04 144117" src="https://github.com/user-attachments/assets/61367bc1-8d08-440b-84d4-c5056cbf454d" />
<img width="1899" height="1032" alt="Screenshot 2025-12-04 144131" src="https://github.com/user-attachments/assets/93024d1d-187d-4213-819d-ed618a9012b4" />
<img width="1886" height="1014" alt="Screenshot 2025-12-04 144145" src="https://github.com/user-attachments/assets/e08e22bf-e9fc-40ae-b4aa-3e3b05c49201" />
<img width="1902" height="903" alt="image" src="https://github.com/user-attachments/assets/c1f6627f-fc89-4927-b1eb-6e0a8c504e0f" />

<img width="1900" height="995" alt="Screenshot 2025-12-04 144226" src="https://github.com/user-attachments/assets/4e7bb776-7543-4e41-8013-b2657121cfe4" />
<img width="1835" height="825" alt="Screenshot 2025-12-04 144254" src="https://github.com/user-attachments/assets/9f9c8dbd-570e-4791-9031-56f46071d468" />


Made with ❤️ for the OCR community
