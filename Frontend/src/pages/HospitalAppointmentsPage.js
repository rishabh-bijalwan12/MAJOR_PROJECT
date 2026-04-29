import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function HospitalAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const navigate = useNavigate();
  
  // Get doctor data once
  const doctor = (() => {
    try {
      const doc = JSON.parse(localStorage.getItem("doctor"));
      return doc;
    } catch (e) {
      return null;
    }
  })();

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please login again.");
        setLoading(false);
        return;
      }
      
      if (!doctor) {
        setError("Hospital data not found. Please login again.");
        setLoading(false);
        return;
      }
      
      console.log("Fetching appointments...");
      
      const response = await axios.get("http://localhost:5001/api/appointments/hospital", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log("Appointments found:", response.data.appointments?.length || 0);
      
      setAppointments(response.data.appointments || []);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError(err.response?.data?.error || "Failed to fetch appointments");
    } finally {
      setLoading(false);
    }
  };

  const markAsCompleted = async (appointmentId) => {
    if (!window.confirm("Mark this appointment as completed? Patient will be able to leave a review.")) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5001/api/appointments/${appointmentId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Appointment marked as completed!");
      await fetchAppointments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.error || "Failed to mark as completed");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5001/api/appointments/${appointmentId}/cancel`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess("Appointment cancelled!");
      await fetchAppointments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.error || "Failed to cancel appointment");
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (doctor && (doctor.id || doctor._id)) {
      fetchAppointments();
    } else {
      setLoading(false);
      setError("Please login as a hospital to view appointments.");
    }
  }, []);

  if (!doctor || (!doctor.id && !doctor._id)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please login as a hospital to view appointments.</p>
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">Confirmed</span>;
      case "rescheduled":
        return <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded-full">Rescheduled</span>;
      case "completed":
        return <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded-full">Completed</span>;
      case "cancelled":
        return <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500 text-white text-xs rounded-full">{status}</span>;
    }
  };

  // Check if appointment can be marked as completed (confirmed OR rescheduled)
  const canMarkAsCompleted = (status) => {
    return status === "confirmed" || status === "rescheduled";
  };

  // Check if appointment can be cancelled (confirmed OR rescheduled)
  const canCancel = (status) => {
    return status === "confirmed" || status === "rescheduled";
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus === "all") return true;
    return apt.status === filterStatus;
  });

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === "confirmed").length,
    rescheduled: appointments.filter(a => a.status === "rescheduled").length,
    completed: appointments.filter(a => a.status === "completed").length,
    cancelled: appointments.filter(a => a.status === "cancelled").length,
  };

  const hospitalId = doctor.id || doctor._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            🏥 Hospital Appointments
          </h1>
          <p className="text-gray-600 mt-2">Manage patient appointments and mark them as completed</p>
          <p className="text-sm text-indigo-600 mt-1">Logged in as: {doctor.hospitalName}</p>
          <p className="text-xs text-gray-500">Hospital ID: {hospitalId}</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-500">Total</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
            <p className="text-sm text-green-600">Confirmed</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.rescheduled}</p>
            <p className="text-sm text-orange-600">Rescheduled</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            <p className="text-sm text-purple-600">Completed</p>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow-md text-center">
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
            <p className="text-sm text-red-600">Cancelled</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            All ({stats.total})
          </button>
          <button
            onClick={() => setFilterStatus("confirmed")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === "confirmed"
                ? "bg-green-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Confirmed ({stats.confirmed})
          </button>
          <button
            onClick={() => setFilterStatus("rescheduled")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === "rescheduled"
                ? "bg-orange-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Rescheduled ({stats.rescheduled})
          </button>
          <button
            onClick={() => setFilterStatus("completed")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === "completed"
                ? "bg-purple-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Completed ({stats.completed})
          </button>
          <button
            onClick={() => setFilterStatus("cancelled")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              filterStatus === "cancelled"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Cancelled ({stats.cancelled})
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">❌ {error}</p>
            <button 
              onClick={fetchAppointments}
              className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">✓ {success}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-4xl mb-4">⏳</div>
            <p>Loading appointments...</p>
          </div>
        )}

        {!loading && !error && filteredAppointments.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="text-gray-500 text-lg">No appointments found</p>
            <p className="text-sm text-gray-400 mt-2">
              When patients book appointments with your hospital, they will appear here.
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
            >
              Go to Home
            </button>
          </div>
        )}

        {!loading && !error && filteredAppointments.length > 0 && (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => (
              <div key={apt._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-800">
                        {apt.patientId?.name || "Patient"}
                      </h3>
                      {getStatusBadge(apt.status)}
                    </div>
                    <p className="text-gray-600 text-sm">{apt.patientId?.email}</p>
                    <p className="text-gray-600 text-sm">📞 {apt.patientId?.phone || "No phone"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-800">{apt.date}</p>
                    <p className="text-2xl font-bold text-indigo-600">{apt.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">SPECIALTY</p>
                    <p className="font-semibold">{apt.doctorSpecialty || "General"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-semibold">BOOKED ON</p>
                    <p className="text-sm">{new Date(apt.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {apt.notes && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 font-semibold mb-1">PATIENT NOTES</p>
                    <p className="text-sm text-gray-700">{apt.notes}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-end flex-wrap">
                  {canMarkAsCompleted(apt.status) && (
                    <button
                      onClick={() => markAsCompleted(apt._id)}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition font-semibold"
                    >
                      ✓ Mark as Completed
                    </button>
                  )}
                  {canCancel(apt.status) && (
                    <button
                      onClick={() => cancelAppointment(apt._id)}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition font-semibold"
                    >
                      ❌ Cancel
                    </button>
                  )}
                  {apt.status === "completed" && (
                    <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                      ✓ Patient can now review
                    </div>
                  )}
                  {apt.status === "cancelled" && (
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                      Cancelled
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm">
            <span className="font-semibold">💡 How it works:</span>
            <br />
            1. When a patient books an appointment, status is "Confirmed"
            <br />
            2. If patient reschedules, status becomes "Rescheduled"
            <br />
            3. After the appointment is done, click "Mark as Completed" (works for both Confirmed and Rescheduled)
            <br />
            4. Patient can then write a review from their profile page
          </p>
        </div>
      </div>
    </div>
  );
}