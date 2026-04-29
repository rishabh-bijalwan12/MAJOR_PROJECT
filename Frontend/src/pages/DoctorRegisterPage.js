import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function DoctorRegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    hospitalName: "",
    location: "",
    city: "",
    pincode: "",
    licenseNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (isLogin) {
      // Login mode
      if (!formData.email || !formData.password) {
        setFormError("Please fill in all fields");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.post("http://localhost:5001/api/doctors/login", {
          email: formData.email,
          password: formData.password,
        });
        
        console.log("Login response:", response.data);
        
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userType", "doctor");
          
          // Make sure we store the complete doctor object with _id
          const doctorData = {
            _id: response.data.doctor.id,
            id: response.data.doctor.id,
            hospitalName: response.data.doctor.hospitalName,
            email: response.data.doctor.email,
            phone: response.data.doctor.phone,
            location: response.data.doctor.location,
            city: response.data.doctor.city,
            pincode: response.data.doctor.pincode,
            licenseNumber: response.data.doctor.licenseNumber
          };
          
          localStorage.setItem("doctor", JSON.stringify(doctorData));
          console.log("Stored doctor:", doctorData);
        }
        setSuccessMessage("Login successful! Redirecting...");
        setTimeout(() => navigate("/doctor-profile"), 1500);
      } catch (err) {
        console.error("Login error:", err);
        setFormError(err.response?.data?.error || err.message || "Login failed");
        setError(err.response?.data?.error || err.message || null);
      } finally {
        setLoading(false);
      }
    } else {
      // Register mode
      if (
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword ||
        !formData.phone ||
        !formData.hospitalName ||
        !formData.location ||
        !formData.city ||
        !formData.pincode ||
        !formData.licenseNumber
      ) {
        setFormError("Please fill in all fields");
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setFormError("Passwords do not match");
        return;
      }

      if (formData.password.length < 6) {
        setFormError("Password must be at least 6 characters");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.post("http://localhost:5001/api/doctors/register", {
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          hospitalName: formData.hospitalName,
          location: formData.location,
          city: formData.city,
          pincode: formData.pincode,
          licenseNumber: formData.licenseNumber,
        });
        
        console.log("Register response:", response.data);
        
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("userType", "doctor");
          
          // Make sure we store the complete doctor object with _id
          const doctorData = {
            _id: response.data.doctor.id,
            id: response.data.doctor.id,
            hospitalName: response.data.doctor.hospitalName,
            email: response.data.doctor.email,
            phone: response.data.doctor.phone,
            location: response.data.doctor.location,
            city: response.data.doctor.city,
            pincode: response.data.doctor.pincode,
            licenseNumber: response.data.doctor.licenseNumber
          };
          
          localStorage.setItem("doctor", JSON.stringify(doctorData));
          console.log("Stored doctor:", doctorData);
        }
        setSuccessMessage("Registration successful! Redirecting...");
        setTimeout(() => navigate("/doctor-profile"), 1500);
      } catch (err) {
        console.error("Registration error:", err);
        setFormError(err.response?.data?.error || err.message || "Registration failed");
        setError(err.response?.data?.error || err.message || null);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleModeToggle = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      hospitalName: "",
      location: "",
      city: "",
      pincode: "",
      licenseNumber: "",
    });
    setFormError("");
    setSuccessMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🏥 Hospital Portal
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Welcome back" : "Join our medical network"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex gap-2 mb-6">
            <button
              onClick={handleModeToggle}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                !isLogin
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Register
            </button>
            <button
              onClick={handleModeToggle}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                isLogin
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Login
            </button>
          </div>

          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm font-medium">{successMessage}</p>
            </div>
          )}
          {formError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm font-medium">{formError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hospital Name
              </label>
              <input
                type="text"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                placeholder="City Hospital"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="hospital@example.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location / Address
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="123 Main St"
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
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Bangalore"
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
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="560001"
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
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="LIC123456"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-medium rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Register"}
            </button>
          </form>
        </div>

        <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <p className="text-indigo-700 text-sm">
            <strong>Demo:</strong> Register as a Hospital and manage your patients through the portal.
          </p>
        </div>
      </div>
    </div>
  );
}