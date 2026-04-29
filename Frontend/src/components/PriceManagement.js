import React, { useState, useEffect } from "react";
import axios from "axios";

export default function PriceManagement() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState("");

  const specialties = [
    "Pulmonologist",
    "General Physician",
    "Chest Specialist",
    "Internal Medicine",
    "Cardiologist",
    "Neurologist"
  ];

  useEffect(() => {
    fetchPrices();
  }, []);


const fetchPrices = async () => {
  try {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    const doctorStr = localStorage.getItem("doctor");
    
    if (!doctorStr) {
      setError("No hospital data found. Please login again.");
      setLoading(false);
      return;
    }
    
    const doctor = JSON.parse(doctorStr);
    const hospitalId = doctor._id || doctor.id;  // ← FIX: Check both
    
    if (!hospitalId) {
      setError("Invalid hospital data. Please login again.");
      setLoading(false);
      return;
    }
    
    const response = await axios.get(`http://localhost:5001/api/prices/hospital/${hospitalId}`);
    setPrices(response.data.prices || []);
  } catch (err) {
    console.error("Failed to load prices:", err);
    if (err.response?.status === 404) {
      setPrices([]);
    } else {
      setError(err.response?.data?.error || "Failed to load prices");
    }
  } finally {
    setLoading(false);
  }
};

  const handleSetPrice = async (specialty, charges) => {
    if (!charges || charges < 0) {
      setError("Please enter a valid amount");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token. Please login again.");
        return;
      }
      
      console.log("Setting price for:", specialty, charges);
      
      const response = await axios.post(
        "http://localhost:5001/api/prices",
        { specialty, charges: parseInt(charges) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Set price response:", response.data);
      setSuccess(`Price for ${specialty} set to ₹${charges}`);
      await fetchPrices();
      setTimeout(() => setSuccess(null), 3000);
      setEditingId(null);
      setEditValue("");
    } catch (err) {
      console.error("Failed to set price:", err);
      console.error("Error response:", err.response);
      setError(err.response?.data?.error || "Failed to set price");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getPriceForSpecialty = (specialty) => {
    const price = prices.find(p => p.specialty === specialty);
    return price ? price.charges : null;
  };

  // Show login prompt if no doctor data
  const doctorStr = localStorage.getItem("doctor");
  if (!doctorStr) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Manage Consultation Prices</h2>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Please login as a hospital to manage prices.</p>
          <button 
            onClick={() => window.location.href = "/doctor-register"}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading && prices.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Manage Consultation Prices</h2>
        <div className="text-center py-8">Loading prices...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">💰 Manage Consultation Prices</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button 
            onClick={fetchPrices}
            className="mt-2 text-sm text-red-600 underline"
          >
            Retry
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700 text-sm">{success}</p>
        </div>
      )}

      <div className="space-y-4">
        {specialties.map((specialty) => {
          const currentPrice = getPriceForSpecialty(specialty);
          const isEditing = editingId === specialty;

          return (
            <div key={specialty} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center flex-wrap gap-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{specialty}</h3>
                  {currentPrice ? (
                    <p className="text-sm text-green-600 mt-1">
                      Current Price: ₹{currentPrice}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">
                      No price set (Default: ₹500)
                    </p>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Amount"
                      className="px-3 py-2 border border-gray-300 rounded-lg w-32"
                      min="0"
                    />
                    <button
                      onClick={() => handleSetPrice(specialty, parseInt(editValue))}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setEditValue("");
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingId(specialty);
                      setEditValue(currentPrice?.toString() || "500");
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {currentPrice ? "Update Price" : "Set Price"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800 text-sm">
          💡 Tip: Set different prices for different specialties. Default price is ₹500 if not set.
        </p>
      </div>
    </div>
  );
}