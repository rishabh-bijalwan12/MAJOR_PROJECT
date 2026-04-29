import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";


export default function UploadPage() {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  })();

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const files = fileRef.current.files;
    if (!files || files.length === 0) {
      setError("Please choose a file first.");
      return;
    }

    const file = files[0];
    const form = new FormData();
    form.append("file", file);

    try {
      setUploading(true);
      const resp = await axios.post("http://localhost:5000/predict", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(resp.data);
      try {
        localStorage.setItem("predictResult", JSON.stringify(resp.data));
      } catch (e) {
        // ignore
      }

      // Redirect to registration if not logged in
      if (!user) {
        setTimeout(() => {
          navigate("/register");
        }, 5500);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to process image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      fileRef.current.files = files;
      handleFileChange({ target: { files } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            🩺 Pneumonia Detection
          </h1>
          <p className="text-gray-600 text-lg">
            Upload a chest X-ray image for AI-powered pneumonia detection
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-3 border-dashed border-blue-300 rounded-2xl p-12 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input" className="cursor-pointer block">
                <div className="text-6xl mb-4 animate-bounce">📷</div>
                <p className="text-gray-800 font-bold text-lg mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-gray-500 text-sm">
                  PNG, JPG, GIF up to 10MB
                </p>
              </label>
            </div>

            {/* Image Preview */}
            {preview && (
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-80 rounded-xl shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null);
                      fileRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* File Name Display */}
            {fileRef.current?.files?.[0] && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">Selected file:</span>{" "}
                  {fileRef.current.files[0].name}
                </p>
                <p className="text-blue-700 text-sm mt-1">
                  <span className="font-semibold">Size:</span>{" "}
                  {(fileRef.current.files[0].size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || !fileRef.current?.files?.length}
              className={`w-full py-4 px-4 rounded-lg font-bold text-white transition text-lg shadow-lg ${
                uploading || !fileRef.current?.files?.length
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              }`}
            >
              {uploading ? (
                <>
                  <span className="inline-block animate-spin mr-2 text-xl">⏳</span>
                  Analyzing X-Ray...
                </>
              ) : (
                "🚀 Upload & Predict"
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">
                <span className="font-bold text-lg">⚠️ Error:</span> {error}
              </p>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div
              className={`mt-6 p-6 rounded-xl border-2 shadow-lg ${
                result.prediction === "Pneumonia"
                  ? "bg-red-50 border-red-300"
                  : "bg-green-50 border-green-300"
              }`}
            >
              <h3 className="text-xl font-bold mb-4 text-gray-800">
                ✨ Prediction Result:
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  {result.prediction === "Pneumonia" ? (
                    <>
                      <div className="text-4xl">🚨</div>
                      <div>
                        <p className="text-2xl font-bold text-red-700">
                          Pneumonia Detected
                        </p>
                        <p className="text-red-600 text-sm">
                          Please consult a healthcare professional
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-4xl">✅</div>
                      <div>
                        <p className="text-2xl font-bold text-green-700">
                          Normal - No Pneumonia Detected
                        </p>
                        <p className="text-green-600 text-sm">
                          Your X-ray looks healthy
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-1">
                      CONFIDENCE
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            result.prediction === "Pneumonia"
                              ? "bg-red-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${result.confidence * 100}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold text-lg">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-1">
                      PROBABILITY
                    </p>
                    <p className="font-bold text-lg">
                      {((result.probability || result.confidence) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>

              {!user && (
                <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded-lg">
                  <p className="text-blue-900 text-sm font-medium break-words">
                    💡 <span className="font-bold">Next Step:</span> Register or
                    login to book an appointment with a healthcare professional.
                  </p>
                </div>
              )}

              {user && (
                <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-900 text-sm font-medium break-words">
                    ✓ <span className="font-bold">Ready:</span> You can now book an
                    appointment. Go to{" "}
                    <button
                      onClick={() => navigate("/book-appointment")}
                      className="underline font-bold hover:text-green-700"
                    >
                      Book Appointment
                    </button>
                  </p>
                </div>
              )}

              {!user && (
                <button
                  onClick={() => navigate("/register")}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition"
                >
                  Register & Book Appointment
                </button>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-indigo-800 text-sm">
              <span className="font-bold">💡 How to use:</span> Upload a clear chest
              X-ray image in PNG, JPG, or GIF format. The AI model will analyze it
              within seconds.
            </p>
          </div>

          {/* Navigation */}
          <div className="mt-6 text-center">
            {user ? (
              <div className="space-y-2">
                <p className="text-gray-600 text-sm">
                  Logged in as <span className="font-semibold">{user.name}</span>
                </p>
                <button
                  onClick={() => navigate("/profile")}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
                >
                  View My Profile
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-sm">
                <button
                  onClick={() => navigate("/register")}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Register
                </button>
                {" to get started"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
