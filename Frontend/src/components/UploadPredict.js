import React, { useState, useRef } from "react";
import axios from "axios";

export default function UploadPredict() {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20 }}>
      <h2 style={{ textAlign: "center" }}>Pneumonia Detection</h2>

      <form onSubmit={handleSubmit}>
        <input ref={fileRef} type="file" accept="image/*" />
        <div style={{ marginTop: 10 }}>
          <button type="submit" disabled={uploading}>
            {uploading ? "Predicting..." : "Upload & Predict"}
          </button>
        </div>
      </form>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>Error: {error}</div>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: 12, background: "#f4f4f4" }}>
          <h3>Prediction:</h3>
          <p>
            {result.prediction === "Pneumonia"
              ? "🩺 Pneumonia detected"
              : "✅ Normal"}
          </p>
          <p>
            <b>Confidence:</b> {(result.confidence * 100).toFixed(2)}%
          </p>
        </div>
      )}
    </div>
  );
}
