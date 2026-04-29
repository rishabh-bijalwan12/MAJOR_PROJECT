import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PriceManagement from "../components/PriceManagement";
import ProfilePictureUpload from "../components/ProfilePictureUpload";

export default function DoctorProfilePage() {
  const navigate = useNavigate();
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateData, setUpdateData] = useState({
    hospitalName: "",
    phone: "",
    location: "",
    city: "",
    pincode: "",
    licenseNumber: "",
  });

  // Load hospital data from localStorage on mount
  useEffect(() => {
    const loadHospitalData = () => {
      try {
        let doctorData = localStorage.getItem("doctor");
        
        if (doctorData) {
          const parsedData = JSON.parse(doctorData);
          setHospital(parsedData);
          setUpdateData({
            hospitalName: parsedData.hospitalName || "",
            phone: parsedData.phone || "",
            location: parsedData.location || "",
            city: parsedData.city || "",
            pincode: parsedData.pincode || "",
            licenseNumber: parsedData.licenseNumber || "",
          });
        }
      } catch (e) {
        console.error("Error loading hospital data:", e);
      }
    };
    
    loadHospitalData();
  }, []);

  const handleProfilePictureUpdate = (newPictureUrl) => {
    setHospital(prev => ({ ...prev, profilePicture: newPictureUrl }));
    // Update localStorage
    const updatedDoctor = { ...hospital, profilePicture: newPictureUrl };
    localStorage.setItem("doctor", JSON.stringify(updatedDoctor));
  };

  if (!hospital) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Logged In</h2>
          <p className="text-gray-600 mb-6">Please login as a hospital to access your profile.</p>
          <button
            onClick={() => navigate("/doctor-register")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Login as Hospital
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("doctor");
    navigate("/doctor-register");
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put("http://localhost:5001/api/doctors/profile", updateData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.data.doctor) {
        const updatedDoctor = response.data.doctor;
        setHospital(updatedDoctor);
        localStorage.setItem("doctor", JSON.stringify(updatedDoctor));
      }
      setShowUpdateForm(false);
      setError(null);
    } catch (err) {
      console.error("Update failed", err);
      setError(err.response?.data?.error || err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const hospitalId = hospital.id || hospital._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            🏥 Hospital Profile
          </h1>
          <button
            onClick={handleLogout}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
          >
            Logout
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-600"></div>

          <div className="px-8 py-6 relative">
            {/* Profile Picture Upload */}
            <div className="flex justify-center -mt-16 mb-6">
              <ProfilePictureUpload 
                currentPicture={hospital.profilePicture}
                onUploadSuccess={handleProfilePictureUpdate}
              />
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{hospital.hospitalName}</h2>
              <p className="text-gray-500">{hospital.email}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {hospitalId}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Phone</p>
                <p className="text-lg text-gray-800 font-semibold">{hospital.phone || "Not set"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Pincode</p>
                <p className="text-lg text-gray-800 font-semibold">{hospital.pincode || "Not set"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">License Number</p>
                <p className="text-lg text-gray-800 font-semibold">{hospital.licenseNumber || "Not set"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Location</p>
                <p className="text-lg text-gray-800 font-semibold">{hospital.location || "Not set"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">City</p>
                <p className="text-lg text-gray-800 font-semibold">{hospital.city || "Not set"}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowUpdateForm(!showUpdateForm)}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition"
              >
                {showUpdateForm ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={() => navigate("/hospital-appointments")}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
              >
                View Appointments
              </button>
            </div>
          </div>
        </div>

        {/* Price Management Section */}
        <div className="mt-6">
          <PriceManagement />
        </div>

        {/* Update Form */}
        {showUpdateForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mt-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Update Profile</h3>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={updateData.hospitalName}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={updateData.phone}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location / Address
                </label>
                <input
                  type="text"
                  name="location"
                  value={updateData.location}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={updateData.city}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={updateData.pincode}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License Number
                </label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={updateData.licenseNumber}
                  onChange={handleUpdateChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}