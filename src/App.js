import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Play,
  Settings,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Info,
  HelpCircle,
  Keyboard,
  ArrowLeft,
  ArrowRight,
  X,
  Loader2,
  FolderDown,
  Save,
} from "lucide-react";

const OCRDatasetBuilder = () => {
  const [currentView, setCurrentView] = useState("home");
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [boxes, setBoxes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [currentBox, setCurrentBox] = useState(null);
  const [extractedData, setExtractedData] = useState([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Load settings from localStorage on initial render
  const [settings, setSettings] = useState(() => {
    const savedSettings = localStorage.getItem('ocrSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      apiKey: "",
      autoSave: true,
      parallelProcessing: true,
      autoDeskew: true,
    };
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ocrSettings', JSON.stringify(settings));
  }, [settings]);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (currentView === "annotate" && images.length > 0) {
      setImageLoaded(true);
    }
  }, [currentView, currentImageIndex, images]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (currentView === "annotate") {
        if (e.key === "s" && boxes.length > 0 && !isProcessing)
          extractTextFromBoxes();
        if (e.key === "u" && boxes.length > 0) setBoxes(boxes.slice(0, -1));
        if (e.key === "n" && currentImageIndex < images.length - 1) {
          setCurrentImageIndex(currentImageIndex + 1);
          setBoxes([]);
        }
      }
      if (currentView === "review" && extractedData.length > 0) {
        if (e.key === "a") handleApprove();
        if (e.key === "x") handleReject();
        if (e.key === "e") {
          setEditMode(!editMode);
          setEditText(extractedData[reviewIndex].text);
        }
        if (e.key === "ArrowLeft" && reviewIndex > 0)
          setReviewIndex(reviewIndex - 1);
        if (e.key === "ArrowRight" && reviewIndex < extractedData.length - 1)
          setReviewIndex(reviewIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    currentView,
    boxes,
    currentImageIndex,
    images.length,
    reviewIndex,
    extractedData,
    editMode,
    isProcessing,
  ]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));
    setImages(
      imageFiles.map((f, i) => ({
        id: i,
        file: f,
        name: f.name,
        url: URL.createObjectURL(f),
        processed: false,
      }))
    );
    setCurrentView("annotate");
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !imageLoaded) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();

    boxes.forEach((box, idx) => {
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);

      ctx.fillStyle = "#10b981";
      ctx.fillRect(box.x, box.y - 25, 50, 25);
      ctx.fillStyle = "white";
      ctx.font = "bold 14px Arial";
      ctx.fillText(`#${idx + 1}`, box.x + 5, box.y - 8);
    });

    if (currentBox) {
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(
        currentBox.x,
        currentBox.y,
        currentBox.width,
        currentBox.height
      );
      ctx.setLineDash([]);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [boxes, currentBox, zoom, rotation, imageLoaded]);

  const handleMouseDown = (e) => {
    if (currentView !== "annotate") return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawing(true);
    setStartPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!drawing || !startPoint) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentBox({
      x: Math.min(startPoint.x, x),
      y: Math.min(startPoint.y, y),
      width: Math.abs(x - startPoint.x),
      height: Math.abs(y - startPoint.y),
    });
  };

  const handleMouseUp = () => {
    if (!drawing || !currentBox) return;

    if (currentBox.width > 10 && currentBox.height > 10) {
      setBoxes([...boxes, { ...currentBox, id: Date.now() }]);
    }

    setDrawing(false);
    setStartPoint(null);
    setCurrentBox(null);
  };

  const extractCroppedImage = (box) => {
    const img = imageRef.current;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = box.width;
    tempCanvas.height = box.height;
    const ctx = tempCanvas.getContext("2d");

    ctx.drawImage(
      img,
      box.x,
      box.y,
      box.width,
      box.height,
      0,
      0,
      box.width,
      box.height
    );

    return tempCanvas.toDataURL("image/png");
  };

  const callGeminiOCR = async (imageDataUrl) => {
    if (!settings.apiKey) {
      return "⚠️ API Key not set";
    }

    try {
      const base64Data = imageDataUrl.split(",")[1];

      // Using correct Gemini model - gemini-1.5-pro or gemini-1.0-pro-vision
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${settings.apiKey}`;

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Extract all text from this image. Return ONLY the extracted text without any explanation. Support Nepali, Hindi, and English text.",
              },
              {
                inline_data: {
                  mime_type: "image/png",
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      };

      console.log("Calling Gemini API...");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", errorText);

        try {
          const errorData = JSON.parse(errorText);
          if (errorData.error?.message) {
            return `[API Error: ${errorData.error.message}]`;
          }
        } catch (e) {
          // ignore
        }

        if (response.status === 403) {
          return `[Error 403: Enable Generative Language API in Google Cloud Console]`;
        } else if (response.status === 400) {
          // Try alternative model if gemini-1.5-pro fails
          return await tryAlternativeModel(base64Data, settings.apiKey);
        }

        return `[HTTP ${response.status}]`;
      }

      const data = await response.json();
      console.log("API Success!");

      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];

        if (candidate.content?.parts && candidate.content.parts.length > 0) {
          const extractedText = candidate.content.parts[0].text?.trim();

          if (extractedText) {
            console.log("Extracted:", extractedText);
            return extractedText;
          }
        }
      }

      if (data.error) {
        return `[API Error: ${data.error.message}]`;
      }

      return "[No text detected]";
    } catch (error) {
      console.error("Exception:", error);
      return `[Error: ${error.message}]`;
    }
  };

  const tryAlternativeModel = async (base64Data, apiKey) => {
    // Try gemini-1.0-pro-vision as alternative
    const alternativeUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-vision:generateContent?key=${apiKey}`;
    
    try {
      const response = await fetch(alternativeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Extract all text from this image. Return ONLY the extracted text without any explanation. Support Nepali, Hindi, and English text.",
                },
                {
                  inline_data: {
                    mime_type: "image/png",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Alternative model failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        if (candidate.content?.parts && candidate.content.parts.length > 0) {
          const extractedText = candidate.content.parts[0].text?.trim();
          if (extractedText) {
            return extractedText;
          }
        }
      }
      
      return "[No text detected with alternative model]";
    } catch (error) {
      return `[Alternative model failed: ${error.message}]`;
    }
  };

  const extractTextFromBoxes = async () => {
    if (boxes.length === 0) {
      alert("⚠️ Please draw at least one bounding box!");
      return;
    }

    if (!settings.apiKey) {
      alert("⚠️ Please set your Gemini API key in Settings first!");
      setCurrentView("settings");
      return;
    }

    setIsProcessing(true);
    const currentImage = images[currentImageIndex];
    const results = [];

    for (let idx = 0; idx < boxes.length; idx++) {
      const box = boxes[idx];

      const croppedImageUrl = extractCroppedImage(box);
      const extractedText = await callGeminiOCR(croppedImageUrl);

      results.push({
        id: `${Date.now()}_${idx}`,
        imageId: currentImage.id,
        imageName: currentImage.name,
        boxIndex: idx,
        box: box,
        croppedImage: croppedImageUrl,
        text: extractedText,
        confidence: 0.95,
        status: "pending",
      });
    }

    setExtractedData([...extractedData, ...results]);

    const updatedImages = [...images];
    updatedImages[currentImageIndex].processed = true;
    setImages(updatedImages);

    setBoxes([]);
    setIsProcessing(false);

    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    } else {
      setCurrentView("review");
      setReviewIndex(0);
    }
  };

  const handleApprove = () => {
    const updated = [...extractedData];
    updated[reviewIndex].status = "approved";
    if (editMode) {
      updated[reviewIndex].text = editText;
    }
    setExtractedData(updated);
    setEditMode(false);

    if (reviewIndex < extractedData.length - 1) {
      setReviewIndex(reviewIndex + 1);
    }
  };

  const handleReject = () => {
    const updated = [...extractedData];
    updated[reviewIndex].status = "rejected";
    setExtractedData(updated);
    setEditMode(false);

    if (reviewIndex < extractedData.length - 1) {
      setReviewIndex(reviewIndex + 1);
    }
  };

  const exportDatasetAsFolder = () => {
    const approved = extractedData.filter((d) => d.status === "approved");

    if (approved.length === 0) {
      alert("No approved data to export!");
      return;
    }

    approved.forEach((item, index) => {
      setTimeout(() => {
        const uniqueId = `${Date.now()}_${index}`;

        const imgLink = document.createElement("a");
        imgLink.href = item.croppedImage;
        imgLink.download = `${uniqueId}.png`;
        imgLink.click();

        const textBlob = new Blob([item.text], {
          type: "text/plain;charset=utf-8",
        });
        const textUrl = URL.createObjectURL(textBlob);
        const txtLink = document.createElement("a");
        txtLink.href = textUrl;
        txtLink.download = `${uniqueId}.gt.txt`;
        txtLink.click();

        setTimeout(() => URL.revokeObjectURL(textUrl), 100);
      }, index * 200);
    });

    setTimeout(() => {
      alert(
        `✅ Exported ${approved.length} image-text pairs!\n\nCheck your Downloads folder.`
      );
    }, approved.length * 200 + 500);
  };

  const saveSettings = () => {
    localStorage.setItem('ocrSettings', JSON.stringify(settings));
    alert("Settings saved successfully!");
    setCurrentView("home");
  };

  return (
    <div>
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">How to Use</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-blue-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3">
                  Step 1: Setup API Key
                </h3>
                <p className="text-gray-700">
                  Go to Settings and enter your Gemini API key from{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3">
                  Step 2: Upload Images
                </h3>
                <p className="text-gray-700">
                  Upload Nepali/Hindi/English text images
                </p>
              </div>
              <div className="bg-purple-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3">Step 3: Annotate</h3>
                <p className="text-gray-700">
                  Draw boxes and press S to extract
                </p>
              </div>
              <div className="bg-pink-50 p-6 rounded-xl">
                <h3 className="font-bold text-lg mb-3">
                  Step 4: Review & Export
                </h3>
                <p className="text-gray-700">
                  Check text, approve accurate ones, then export all
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-2xl">
              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {showKeyboard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowKeyboard(false)}
                  className="hover:bg-white hover:bg-opacity-20 p-2 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Extract text</span>
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded">
                  S
                </kbd>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Undo box</span>
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded">
                  U
                </kbd>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Next image</span>
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded">
                  N
                </kbd>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Approve</span>
                <kbd className="px-3 py-1 bg-green-600 text-white rounded">
                  A
                </kbd>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Reject</span>
                <kbd className="px-3 py-1 bg-red-600 text-white rounded">X</kbd>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span>Edit</span>
                <kbd className="px-3 py-1 bg-gray-800 text-white rounded">
                  E
                </kbd>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-b-2xl">
              <button
                onClick={() => setShowKeyboard(false)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {currentView === "home" && (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
          <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-semibold mb-4">
                Professional OCR Solution
              </div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                OCR Dataset Builder
              </h1>
              <p className="text-xl text-gray-600">
                Create OCR datasets • Nepali Text Support
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-2xl text-center border-2 border-blue-200">
                <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">1. Upload</h3>
                <p className="text-gray-600">Nepali text images</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-2xl text-center border-2 border-green-200">
                <Edit2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">2. Annotate</h3>
                <p className="text-gray-600">Draw & extract</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl text-center border-2 border-purple-200">
                <FolderDown className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">3. Export</h3>
                <p className="text-gray-600">Download all</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <div className="flex items-center justify-center w-full h-56 border-4 border-dashed border-blue-400 rounded-2xl cursor-pointer hover:border-blue-600 transition-all">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="text-center">
                    <Upload className="w-20 h-20 text-blue-600 mx-auto mb-4" />
                    <p className="text-2xl font-bold text-gray-800">
                      Click to upload images
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      JPG, PNG • Nepali text
                    </p>
                  </div>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setCurrentView("settings")}
                  className="py-4 bg-gray-200 hover:bg-gray-300 rounded-xl flex items-center justify-center gap-2 font-semibold"
                >
                  <Settings className="w-5 h-5" />
                  Settings{" "}
                  {!settings.apiKey && <span className="text-red-600">⚠️</span>}
                </button>
                <button
                  onClick={() => setShowHelp(true)}
                  className="py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold"
                >
                  <HelpCircle className="w-5 h-5" />
                  How to Use
                </button>
                <button
                  onClick={() => setShowKeyboard(true)}
                  className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 font-semibold"
                >
                  <Keyboard className="w-5 h-5" />
                  Shortcuts
                </button>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200">
              <div className="flex gap-3">
                <Info className="w-7 h-7 text-amber-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-900 mb-2">Quick Tips:</h4>
                  <p className="text-amber-800 text-sm">
                    • Set API key in Settings first
                  </p>
                  <p className="text-amber-800 text-sm">
                    • Works with Nepali, Hindi, English
                  </p>
                  <p className="text-amber-800 text-sm">
                    • Export downloads all approved files
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === "annotate" && images.length > 0 && (
        <div className="flex h-screen bg-gray-100">
          <div className="w-80 bg-white shadow-xl p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Annotation</h2>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Progress</span>
                <span className="text-sm text-gray-500">
                  {currentImageIndex + 1} / {images.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((currentImageIndex + 1) / images.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">Boxes ({boxes.length})</h3>
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                {boxes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No boxes
                  </p>
                ) : (
                  boxes.map((box, idx) => (
                    <div
                      key={box.id}
                      className="flex justify-between items-center mb-2 p-2 bg-white rounded"
                    >
                      <span className="text-sm">Box #{idx + 1}</span>
                      <button
                        onClick={() =>
                          setBoxes(boxes.filter((b) => b.id !== box.id))
                        }
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-2">View</h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setZoom(Math.min(zoom + 0.1, 3))}
                  className="py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center gap-1 text-sm"
                >
                  <ZoomIn className="w-4 h-4" /> In
                </button>
                <button
                  onClick={() => setZoom(Math.max(zoom - 0.1, 0.5))}
                  className="py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center gap-1 text-sm"
                >
                  <ZoomOut className="w-4 h-4" /> Out
                </button>
                <button
                  onClick={() => setRotation((rotation + 90) % 360)}
                  className="py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center gap-1 text-sm"
                >
                  <RotateCw className="w-4 h-4" /> Rotate
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  className="py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={extractTextFromBoxes}
                disabled={boxes.length === 0 || isProcessing}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    Extract (S)
                  </>
                )}
              </button>

              <button
                onClick={() => setCurrentView("review")}
                disabled={extractedData.length === 0}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <Eye className="w-5 h-5" />
                Review ({extractedData.length})
              </button>

              <button
                onClick={() => setCurrentView("home")}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
              >
                Back
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative">
              <img
                ref={imageRef}
                src={images[currentImageIndex].url}
                alt="Current"
                className="hidden"
                onLoad={() => setImageLoaded(true)}
              />
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                className="border-4 border-gray-300 rounded-lg shadow-2xl cursor-crosshair bg-white"
                style={{ width: "800px", height: "600px" }}
              />
              <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg text-sm">
                Draw boxes • {boxes.length} drawn
              </div>
              {isProcessing && (
                <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader2
                    className="w-4 h
                  4 h-4 animate-spin"
                  />
                  Extracting...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {currentView === "review" && extractedData.length > 0 && (
        <div className="flex h-screen bg-gray-100">
          <div className="w-80 bg-white shadow-xl p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Review</h2>

            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold">Progress</span>
                <span className="text-sm text-gray-500">
                  {reviewIndex + 1} / {extractedData.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${
                      ((reviewIndex + 1) / extractedData.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Statistics</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 p-3 rounded border-2 border-green-200">
                  <p className="text-2xl font-bold text-green-600">
                    {
                      extractedData.filter((d) => d.status === "approved")
                        .length
                    }
                  </p>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
                <div className="bg-red-50 p-3 rounded border-2 border-red-200">
                  <p className="text-2xl font-bold text-red-600">
                    {
                      extractedData.filter((d) => d.status === "rejected")
                        .length
                    }
                  </p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
                <div className="bg-blue-50 p-3 rounded border-2 border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">
                    {extractedData.filter((d) => d.status === "pending").length}
                  </p>
                  <p className="text-xs text-gray-600">Pending</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold mb-3">Extracted Text</h3>
              {editMode ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-3 border-2 border-blue-300 rounded-lg h-32 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Edit extracted text..."
                />
              ) : (
                <div className="bg-gray-50 p-3 rounded-lg border-2 border-gray-200 min-h-[80px]">
                  <p className="text-sm whitespace-pre-wrap">
                    {extractedData[reviewIndex].text}
                  </p>
                </div>
              )}
              <button
                onClick={() => {
                  if (editMode) {
                    setEditMode(false);
                  } else {
                    setEditMode(true);
                    setEditText(extractedData[reviewIndex].text);
                  }
                }}
                className="mt-2 w-full py-2 bg-gray-200 hover:bg-gray-300 rounded flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                {editMode ? "Cancel" : "Edit (E)"}
              </button>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleApprove}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <CheckCircle className="w-5 h-5" />
                Approve (A)
              </button>

              <button
                onClick={handleReject}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <XCircle className="w-5 h-5" />
                Reject (X)
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                  disabled={reviewIndex === 0}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Prev
                </button>
                <button
                  onClick={() =>
                    setReviewIndex(
                      Math.min(extractedData.length - 1, reviewIndex + 1)
                    )
                  }
                  disabled={reviewIndex === extractedData.length - 1}
                  className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 rounded flex items-center justify-center gap-1"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={exportDatasetAsFolder}
                disabled={
                  extractedData.filter((d) => d.status === "approved")
                    .length === 0
                }
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg flex items-center justify-center gap-2 font-semibold"
              >
                <FolderDown className="w-5 h-5" />
                Export All (
                {extractedData.filter((d) => d.status === "approved").length})
              </button>

              <button
                onClick={() => setCurrentView("home")}
                className="w-full py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold"
              >
                Back
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative max-w-4xl">
              <img
                src={extractedData[reviewIndex].croppedImage}
                alt="Review"
                className="rounded-lg shadow-2xl max-w-full border-4 border-gray-300"
              />
              <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white px-4 py-3 rounded-lg shadow-lg">
                <p className="text-sm font-semibold">
                  Box #{extractedData[reviewIndex].boxIndex + 1}
                </p>
                <p className="text-xs text-gray-300">
                  {extractedData[reviewIndex].imageName}
                </p>
              </div>
              <div className="absolute bottom-4 left-4 bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold">
                Status: {extractedData[reviewIndex].status.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentView === "settings" && (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-8">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Settings</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={settings.apiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, apiKey: e.target.value })
                  }
                  placeholder="Enter your Gemini API key"
                  className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get from:{" "}
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Google AI Studio
                  </a>
                </p>
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-red-700 font-semibold">
                    ⚠️ Keep your API key private! It's saved locally in your browser.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div>
                  <p className="font-semibold">Auto-save Progress</p>
                  <p className="text-sm text-gray-600">
                    Save work automatically
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) =>
                    setSettings({ ...settings, autoSave: e.target.checked })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div>
                  <p className="font-semibold">Parallel Processing</p>
                  <p className="text-sm text-gray-600">
                    Process multiple boxes
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.parallelProcessing}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      parallelProcessing: e.target.checked,
                    })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div>
                  <p className="font-semibold">Auto-deskew Images</p>
                  <p className="text-sm text-gray-600">
                    Correct image rotation
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoDeskew}
                  onChange={(e) =>
                    setSettings({ ...settings, autoDeskew: e.target.checked })
                  }
                  className="w-5 h-5 cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={saveSettings}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save & Continue
              </button>
              <button
                onClick={() => setCurrentView("home")}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OCRDatasetBuilder;