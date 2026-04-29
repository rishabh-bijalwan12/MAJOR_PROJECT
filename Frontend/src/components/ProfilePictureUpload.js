import React, { useState } from "react";
import axios from "axios";

export default function ProfilePictureUpload({ currentPicture, onUploadSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(currentPicture || null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      const response = await axios.post(
        "http://localhost:5001/api/doctors/upload-profile-pic",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        onUploadSuccess(response.data.profilePicture);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Are you sure you want to remove your profile picture?")) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      await axios.delete("http://localhost:5001/api/doctors/remove-profile-pic", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPreview(null);
      onUploadSuccess('');
    } catch (err) {
      console.error("Remove error:", err);
      setError(err.response?.data?.error || "Failed to remove image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Profile Picture Preview */}
        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
          {preview ? (
            <img 
              src={`http://localhost:5001${preview}`} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl">🏥</span>
          )}
        </div>

        {/* Edit Button */}
        <label 
          htmlFor="profile-pic-input"
          className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition shadow-lg"
        >
          📷
        </label>
        <input
          id="profile-pic-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={loading}
        />
      </div>

      {preview && (
        <button
          onClick={handleRemove}
          disabled={loading}
          className="mt-3 text-sm text-red-600 hover:text-red-700 transition"
        >
          {loading ? "Processing..." : "Remove Picture"}
        </button>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Click the camera icon to upload a profile picture (Max 5MB)
      </p>
    </div>
  );
}