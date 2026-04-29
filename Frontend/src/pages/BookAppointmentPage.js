import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function BookAppointmentPage() {
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchCity, setSearchCity] = useState("");
  const [searchPincode, setSearchPincode] = useState("");
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [takenTimes, setTakenTimes] = useState([]);
  const [hospitalPrices, setHospitalPrices] = useState({});
  const [hospitalReviews, setHospitalReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [formData, setFormData] = useState({
    hospitalId: "",
    date: "",
    time: "",
    doctorSpecialty: "",
    notes: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  })();

  const doctorSpecialties = [
    "Pulmonologist",
    "General Physician",
    "Chest Specialist",
    "Internal Medicine",
    "Cardiologist",
    "Neurologist",
  ];

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
  ];

  // Fetch hospitals
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setHospitalsLoading(true);
        const response = await axios.get("http://localhost:5001/api/doctors/");

        let list = [];
        if (Array.isArray(response.data)) {
          list = response.data;
        } else if (Array.isArray(response.data.doctors)) {
          list = response.data.doctors;
        }

        setHospitals(list);
        setFilteredHospitals(list);

        // Fetch prices for all hospitals
        await fetchHospitalPrices(list);
      } catch (err) {
        setError("Failed to load hospitals");
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  // Fetch prices for all hospitals
  const fetchHospitalPrices = async (hospitalsList) => {
    const pricesMap = {};

    for (const hospital of hospitalsList) {
      try {
        const response = await axios.get(`http://localhost:5001/api/prices/hospital/${hospital._id}`);
        const prices = response.data.prices;
        const priceObj = {};
        prices.forEach(price => {
          priceObj[price.specialty] = price.charges;
        });
        pricesMap[hospital._id] = priceObj;
      } catch (err) {
        pricesMap[hospital._id] = {};
      }
    }

    setHospitalPrices(pricesMap);
  };

  // Fetch hospital reviews when hospital is selected
  const fetchHospitalReviews = async (hospitalId) => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(`http://localhost:5001/api/reviews/hospital/${hospitalId}`);
      setHospitalReviews(response.data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setHospitalReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Get price for specific hospital and specialty
  const getPrice = (hospitalId, specialty) => {
    const price = hospitalPrices[hospitalId]?.[specialty];
    return price || 500; // Default price 500
  };

  // Get minimum price for hospital (for display)
  const getMinimumPrice = (hospitalId) => {
    const prices = hospitalPrices[hospitalId] || {};
    const values = Object.values(prices);
    if (values.length === 0) return 500;
    return Math.min(...values);
  };

  // Fetch taken times
useEffect(() => {
  const fetchTakenTimes = async () => {
    if (!selectedHospital || !formData.date) {
      console.log('Missing: selectedHospital or date');
      return;
    }
    
    if (!formData.doctorSpecialty) {
      console.log('No specialty selected yet, skipping availability fetch');
      setTakenTimes([]); // Clear taken times when no specialty selected
      return;
    }
    
    try {
      console.log('Fetching availability for:', {
        doctorId: selectedHospital._id,
        date: formData.date,
        specialty: formData.doctorSpecialty
      });
      
      const response = await axios.get(
        `http://localhost:5001/api/appointments/availability`,
        {
          params: {
            doctorId: selectedHospital._id,
            date: formData.date,
            specialty: formData.doctorSpecialty
          }
        }
      );
      
      console.log('Availability response:', response.data);
      
      if (response.data.appointments) {
        const bookedTimes = response.data.appointments.map(a => a.time);
        console.log('Booked times for this specialty:', bookedTimes);
        setTakenTimes(bookedTimes);
      } else {
        setTakenTimes([]);
      }
    } catch (err) {
      console.error("Failed to fetch taken times", err);
      setTakenTimes([]);
    }
  };
  
  fetchTakenTimes();
}, [selectedHospital, formData.date, formData.doctorSpecialty]);

  // Fetch reviews when hospital is selected
  useEffect(() => {
    if (selectedHospital) {
      fetchHospitalReviews(selectedHospital._id);
    }
  }, [selectedHospital]);

  // Filter hospitals
  useEffect(() => {
    let filtered = hospitals;
    if (searchCity) {
      filtered = filtered.filter(h =>
        h.location?.toLowerCase().includes(searchCity.toLowerCase())
      );
    }
    if (searchPincode) {
      filtered = filtered.filter(h =>
        h.pincode?.toString().includes(searchPincode)
      );
    }
    setFilteredHospitals(filtered);
  }, [searchCity, searchPincode, hospitals]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null);
  setSuccess(null);

  if (!formData.hospitalId || !formData.date || !formData.time || !formData.doctorSpecialty) {
    setError("Please fill in all required fields");
    return;
  }

  // Double-check if time slot is still available
  if (takenTimes.includes(formData.time)) {
    setError(`Sorry, ${formData.time} slot for ${formData.doctorSpecialty} is no longer available. Please select another time.`);
    return;
  }

  try {
    setLoading(true);
    const token = localStorage.getItem("token");
    const appointmentData = {
      doctorId: formData.hospitalId,
      date: formData.date,
      time: formData.time,
      doctorSpecialty: formData.doctorSpecialty,
      notes: formData.notes,
    };

    console.log('Submitting appointment:', appointmentData);

    const response = await axios.post("http://localhost:5001/api/appointments/", appointmentData, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    console.log('Booking response:', response.data);

    setSuccess("Appointment booked successfully!");
    setTimeout(() => navigate("/profile"), 1500);
  } catch (err) {
    console.error("Booking error:", err);
    setError(err.response?.data?.error || "Failed to book appointment");
  } finally {
    setLoading(false);
  }
};
  const today = new Date().toISOString().split("T")[0];
  const maxDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to book an appointment.</p>
          <button onClick={() => navigate("/register")} className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📅 Book an Appointment
          </h1>
          <p className="text-gray-600">Select hospital, specialty, and time slot</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Search Filters */}
          {!selectedHospital && (
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-4">🔍 Search Hospitals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Search by city..."
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Search by pincode..."
                  value={searchPincode}
                  onChange={(e) => setSearchPincode(e.target.value)}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">Found {filteredHospitals.length} hospital(s)</p>
            </div>
          )}

          {!selectedHospital ? (
            <>
              {hospitalsLoading ? (
                <div className="text-center py-8">Loading hospitals...</div>
              ) : filteredHospitals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No hospitals found</div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredHospitals.map((h) => (
                    <button
                      key={h._id}
                      onClick={() => {
                        setSelectedHospital(h);
                        setFormData(prev => ({ ...prev, hospitalId: h._id }));
                      }}
                      className="w-full text-left p-4 border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition"
                    >
                      <h4 className="font-bold text-gray-800">{h.hospitalName}</h4>
                      <p className="text-sm text-gray-600">📍 {h.location} | 📮 {h.pincode}</p>
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">⭐</span>
                          <span className="text-sm font-semibold">
                            {h.averageRating ? h.averageRating.toFixed(1) : "New"}
                          </span>
                          <span className="text-xs text-gray-500">({h.totalReviews || 0} reviews)</span>
                        </div>
                        <p className="text-sm text-green-600 font-semibold">
                          From ₹{getMinimumPrice(h._id)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Hospital Details */}
              <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl">
                <button
                  onClick={() => {
                    setSelectedHospital(null);
                    setFormData(prev => ({ ...prev, hospitalId: "" }));
                  }}
                  className="float-right px-3 py-1 bg-white text-blue-600 rounded hover:bg-gray-100 text-sm"
                >
                  ← Change Hospital
                </button>
                <h3 className="text-2xl font-bold mb-2">{selectedHospital.hospitalName}</h3>
                <p>{selectedHospital.location} | {selectedHospital.city}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-yellow-400">⭐</span>
                  <span className="font-semibold">
                    {selectedHospital.averageRating ? selectedHospital.averageRating.toFixed(1) : "No ratings yet"}
                  </span>
                  <span className="text-sm opacity-75">({selectedHospital.totalReviews || 0} reviews)</span>
                </div>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Specialty Selection with Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Doctor Specialty *
                  </label>
                  <select
                    name="doctorSpecialty"
                    value={formData.doctorSpecialty}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Select Specialty --</option>
                    {doctorSpecialties.map((specialty) => (
                      <option key={specialty} value={specialty}>
                        {specialty} - ₹{getPrice(selectedHospital._id, specialty)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Display */}
                {formData.doctorSpecialty && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold">
                      💰 Consultation Fee: ₹{getPrice(selectedHospital._id, formData.doctorSpecialty)}
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      This fee includes doctor consultation and basic services
                    </p>
                  </div>
                )}

                {/* Date Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={today}
                    max={maxDate}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Time Selection */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Time Slot *
                    {formData.doctorSpecialty && (
                      <span className="text-xs text-gray-500 ml-2">
                        (Showing availability for {formData.doctorSpecialty})
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => {
                      const isTaken = takenTimes.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => !isTaken && setFormData(prev => ({ ...prev, time: slot }))}
                          disabled={isTaken}
                          className={`py-2 px-3 rounded-lg font-semibold transition ${formData.time === slot
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                              : isTaken
                                ? "bg-red-200 text-red-800 cursor-not-allowed line-through"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                        >
                          {slot} {isTaken && "❌ Booked"}
                        </button>
                      );
                    })}
                  </div>
                  {!formData.doctorSpecialty && (
                    <p className="text-sm text-amber-600 mt-2">
                      ⚠️ Please select a specialty first to see available time slots
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Additional Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-3 border rounded-lg resize-none"
                    placeholder="Any special requirements or symptoms to share..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">❌ {error}</p>
                  </div>
                )}

                {success && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">✓ {success}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50"
                  >
                    {loading ? "Booking..." : "Book Appointment"}
                  </button>
                </div>
              </form>

              {/* Reviews Section - Display Patient Reviews */}
              <div className="mt-8 border-t pt-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  📝 Patient Reviews ({hospitalReviews.length})
                </h3>

                {reviewsLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin text-2xl">⏳</div>
                    <p className="text-gray-500 mt-2">Loading reviews...</p>
                  </div>
                ) : hospitalReviews.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-gray-500">No reviews yet. Be the first to review this hospital!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {hospitalReviews.map((review) => (
                      <div key={review._id} className="border rounded-lg p-4 bg-gray-50 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className="text-lg">
                                  {star <= review.rating ? "⭐" : "☆"}
                                </span>
                              ))}
                            </div>
                            <span className="font-semibold text-gray-800">
                              {review.patientId?.name || "Anonymous Patient"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 mt-2">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <span className="font-semibold">💡 Tip:</span> You can book multiple appointments and reschedule them from your profile.
                  After your appointment is completed, you can write a review from your profile page.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}