import React, { useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";

export default function ReviewModal({ appointment, hospitalId, onClose, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError("Please write a review comment");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5001/api/reviews",
        {
          hospitalId,
          appointmentId: appointment._id,
          rating,
          comment
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      onReviewSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Rate Your Experience</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hospital Info */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Hospital</p>
            <p className="font-semibold text-gray-800">{appointment.hospitalId?.hospitalName || "Hospital"}</p>
            <p className="text-sm text-gray-500 mt-1">
              Appointment Date: {appointment.date} at {appointment.time}
            </p>
          </div>

          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Rating *
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="focus:outline-none"
                >
                  <Star
                    size={32}
                    className={`transition ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {rating === 5 && "Excellent! ⭐⭐⭐⭐⭐"}
              {rating === 4 && "Very Good! ⭐⭐⭐⭐"}
              {rating === 3 && "Good ⭐⭐⭐"}
              {rating === 2 && "Fair ⭐⭐"}
              {rating === 1 && "Poor ⭐"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Share your experience with this hospital..."
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}