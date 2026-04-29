const Appointment = require('../models/Appointment');

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, doctorSpecialty, notes } = req.body;

    if (!doctorId || !date || !time || !doctorSpecialty) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const conflict = await Appointment.findOne({
      hospitalId: doctorId,
      date,
      time,
      status: { $ne: 'cancelled' }
    });

    if (conflict) {
      return res.status(409).json({ error: 'Selected time slot is not available for this doctor' });
    }

    const appointment = new Appointment({
      patientId: req.user.userId,
      hospitalId: doctorId,
      date,
      time,
      doctorSpecialty,
      notes
    });

    await appointment.save();
    await appointment.populate('hospitalId', '-password');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.userId })
      .populate('hospitalId', '-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      appointments,
      count: appointments.length
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Replace the getHospitalAppointments function in appointmentController.js

exports.getHospitalAppointments = async (req, res) => {
  try {
    // Get hospital ID from the authenticated user
    const hospitalId = req.user.userId;
    
    console.log('Fetching appointments for hospital ID:', hospitalId);
    console.log('User object:', req.user);
    
    if (!hospitalId) {
      return res.status(401).json({ error: 'Hospital ID not found. Please login again.' });
    }
    
    // Find all appointments where hospitalId matches this hospital
    const appointments = await Appointment.find({ hospitalId: hospitalId })
      .populate('patientId', 'name email phone')  // Get patient details
      .populate('hospitalId', 'hospitalName location city')  // Get hospital details
      .sort({ date: -1, time: 1 });  // Sort by most recent date first

    console.log(`Found ${appointments.length} appointments for hospital ${hospitalId}`);
    
    if (appointments.length > 0) {
      console.log('First appointment:', {
        id: appointments[0]._id,
        patient: appointments[0].patientId?.name,
        date: appointments[0].date,
        time: appointments[0].time,
        status: appointments[0].status
      });
    }
    
    res.status(200).json({ 
      success: true, 
      appointments: appointments || [], 
      count: appointments.length 
    });
  } catch (error) {
    console.error('Get hospital appointments error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAppointmentsByHospitalAndDate = async (req, res) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({ error: 'doctorId and date query parameters are required' });
    }

    const appointments = await Appointment.find({ 
      hospitalId: doctorId, 
      date, 
      status: { $ne: 'cancelled' } 
    })
      .populate('patientId', '-password')
      .sort({ time: 1 });

    res.status(200).json({ 
      success: true, 
      appointments, 
      count: appointments.length 
    });
  } catch (error) {
    console.error('Get appointments by date error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', '-password')
      .populate('hospitalId', '-password');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.rescheduleAppointment = async (req, res) => {
  try {
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    appointment.date = date;
    appointment.time = time;
    appointment.status = 'rescheduled';
    appointment.updatedAt = new Date();

    await appointment.save();
    await appointment.populate('hospitalId', '-password');

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.patientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Appointment.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (appointment.hospitalId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ error: `Cannot mark ${appointment.status} appointment as completed` });
    }

    appointment.status = 'completed';
    appointment.updatedAt = new Date();
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed successfully',
      appointment
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({ error: error.message });
  }
};