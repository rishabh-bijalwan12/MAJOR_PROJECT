import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import RescheduleModal from "../components/Appointment/RescheduleModal";
import ReviewModal from "../components/ReviewModal";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  });
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    localStorage.removeItem("user");
    localStorage.removeItem("doctor");
    setUser(null);
    setAppointments([]);
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:5001/api/appointments/my-appointments", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (response.data.appointments) {
        // Fetch reviews for each appointment to check if review exists
        const appointmentsWithReviewStatus = await Promise.all(
          response.data.appointments.map(async (apt) => {
            try {
              const reviewResponse = await axios.get(
                `http://localhost:5001/api/reviews/appointment/${apt._id}`,
                {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );
              return { ...apt, hasReview: reviewResponse.data.exists };
            } catch {
              return { ...apt, hasReview: false };
            }
          })
        );
        setAppointments(appointmentsWithReviewStatus.map((apt) => ({ id: apt._id, ...apt })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      setCancelLoading(appointmentId);
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/appointments/${appointmentId}/cancel`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId));
    } catch (err) {
      throw err;
    } finally {
      setCancelLoading(null);
    }
  };

  const rescheduleAppointment = async (appointmentId, date, time) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5001/api/appointments/${appointmentId}/reschedule`, { date, time }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAppointments((prev) => prev.map((apt) => (apt.id === appointmentId ? { ...apt, date, time, status: "rescheduled" } : apt)));
      return true;
    } catch (err) {
      throw err;
    }
  };

  const handleReviewClick = (appointment) => {
    setSelectedAppointment(appointment);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    fetchAppointments(); // Refresh appointments to update review status
  };

  // Fetch appointments on mount
  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please register or login first to view your profile.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg"
          >
            Go to Registration
          </button>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/");
    }
  };

  const handleCancel = async (appointmentId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        setCancelLoading(appointmentId);
        setError(null);
        await cancelAppointment(appointmentId);
      } catch (err) {
        setError(err.message || "Failed to cancel appointment");
      } finally {
        setCancelLoading(null);
      }
    }
  };

  const handleReschedule = async (appointmentId, newDate, newTime) => {
    try {
      setError(null);
      await rescheduleAppointment(appointmentId, newDate, newTime);
      setRescheduleId(null);
    } catch (err) {
      setError(err.message || "Failed to reschedule appointment");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-l-4 border-green-500";
      case "rescheduled":
        return "bg-blue-100 text-blue-800 border-l-4 border-blue-500";
      case "completed":
        return "bg-purple-100 text-purple-800 border-l-4 border-purple-500";
      case "cancelled":
        return "bg-red-100 text-red-800 border-l-4 border-red-500";
      default:
        return "bg-gray-100 text-gray-800 border-l-4 border-gray-500";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Confirmed</span>;
      case "rescheduled":
        return <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">Rescheduled</span>;
      case "completed":
        return <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">Completed</span>;
      case "cancelled":
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-3xl">
                  👤
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{user.name}</h1>
                  <p className="text-blue-100 text-sm">Patient ID: {user.id?.substring(0, 8)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Email</p>
                  <p className="font-semibold">{user.email}</p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm mb-1">Phone</p>
                  <p className="font-semibold">{user.phone}</p>
                </div>
                {user.age && (
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Age</p>
                    <p className="font-semibold">{user.age} years</p>
                  </div>
                )}
                {user.location && (
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Location</p>
                    <p className="font-semibold">{user.location}</p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold shadow-lg"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">⚠️ {error}</p>
          </div>
        )}

        {/* Appointments Section */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-1">
                📅 My Appointments
              </h2>
              <p className="text-gray-600 text-sm">
                Total: {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => navigate("/book-appointment")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg"
            >
              ➕ New Appointment
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
              <p className="text-gray-600">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="p-12 text-center bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
              <p className="text-6xl mb-4">📭</p>
              <p className="text-gray-600 text-lg mb-4 font-medium">
                No appointments booked yet
              </p>
              <p className="text-gray-500 text-sm mb-6">
                Start your journey to better healthcare by booking your first appointment.
              </p>
              <button
                onClick={() => navigate("/book-appointment")}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition font-semibold shadow-lg"
              >
                Book Your First Appointment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className={`rounded-xl p-6 hover:shadow-lg transition ${getStatusColor(
                    appointment.status
                  )}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">
                          🏥 {appointment.hospitalId?.hospitalName || "Hospital"}
                        </h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="opacity-75 text-xs font-semibold mb-1">SPECIALTY</p>
                          <p className="font-bold">
                            {appointment.doctorSpecialty || "General"}
                          </p>
                        </div>
                        <div>
                          <p className="opacity-75 text-xs font-semibold mb-1">DATE</p>
                          <p className="font-bold">{appointment.date}</p>
                        </div>
                        <div>
                          <p className="opacity-75 text-xs font-semibold mb-1">TIME</p>
                          <p className="font-bold text-lg">{appointment.time}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {appointment.hospitalId && (
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4 pb-4 border-b border-current border-opacity-20">
                      <div>
                        <p className="opacity-75 text-xs font-semibold">Location</p>
                        <p>{appointment.hospitalId.location}</p>
                      </div>
                      <div>
                        <p className="opacity-75 text-xs font-semibold">City</p>
                        <p>{appointment.hospitalId.city}</p>
                      </div>
                    </div>
                  )}

                  {appointment.notes && (
                    <div className="mb-4 pb-4 border-b border-current border-opacity-20">
                      <p className="opacity-75 text-xs font-semibold mb-1">NOTES</p>
                      <p className="text-sm">{appointment.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setRescheduleId(appointment.id)}
                      className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition font-semibold text-sm"
                      disabled={appointment.status === "cancelled" || appointment.status === "completed"}
                    >
                      📅 Reschedule
                    </button>
                    <button
                      onClick={() => handleCancel(appointment.id)}
                      disabled={
                        cancelLoading === appointment.id ||
                        appointment.status === "cancelled" ||
                        appointment.status === "completed"
                      }
                      className={`px-4 py-2 text-white rounded-lg transition font-semibold text-sm ${
                        cancelLoading === appointment.id
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                    >
                      {cancelLoading === appointment.id ? "⏳ Canceling..." : "❌ Cancel"}
                    </button>
                    
                    {/* Review Button - Only show for completed appointments without review */}
                    {appointment.status === "completed" && !appointment.hasReview && (
                      <button
                        onClick={() => handleReviewClick(appointment)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold text-sm"
                      >
                        ⭐ Write a Review
                      </button>
                    )}
                    
                    {/* Already Reviewed Badge */}
                    {appointment.status === "completed" && appointment.hasReview && (
                      <button
                        disabled
                        className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold text-sm cursor-not-allowed"
                      >
                        ✓ Already Reviewed
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleId && (
        <RescheduleModal
          appointmentId={rescheduleId}
          onClose={() => setRescheduleId(null)}
          onReschedule={handleReschedule}
        />
      )}

      {/* Review Modal */}
      {showReviewModal && selectedAppointment && (
        <ReviewModal
          appointment={selectedAppointment}
          hospitalId={selectedAppointment.hospitalId?._id || selectedAppointment.hospitalId}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedAppointment(null);
          }}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}