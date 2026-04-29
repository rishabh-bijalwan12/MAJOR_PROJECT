const Doctor = require('../models/Doctor');
const { generateToken } = require('../config/jwt');

exports.loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
    }

    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isPasswordCorrect = await doctor.matchPassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    console.log('Doctor logged in, ID:', doctor._id.toString());

    // Generate token with both userId and id
    const token = generateToken(doctor._id.toString(), 'doctor');

    res.status(200).json({
      success: true,
      token,
      doctor: {
        id: doctor._id,
        _id: doctor._id,
        email: doctor.email,
        phone: doctor.phone,
        hospitalName: doctor.hospitalName,
        location: doctor.location,
        city: doctor.city,
        pincode: doctor.pincode,
        licenseNumber: doctor.licenseNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.registerDoctor = async (req, res) => {
  try {
    const { email, password, phone, hospitalName, location, city, pincode, licenseNumber } = req.body;

    if (!email || !password || !phone || !hospitalName || !location || !city || !pincode || !licenseNumber) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        error: 'Doctor with this email already exists'
      });
    }

    const doctor = await Doctor.create({
      email,
      password,
      phone,
      hospitalName,
      location,
      city,
      pincode,
      licenseNumber
    });

    console.log('Doctor registered, ID:', doctor._id.toString());

    const token = generateToken(doctor._id.toString(), 'doctor');

    res.status(201).json({
      success: true,
      token,
      doctor: {
        id: doctor._id,
        _id: doctor._id,
        email: doctor.email,
        phone: doctor.phone,
        hospitalName: doctor.hospitalName,
        location: doctor.location,
        city: doctor.city,
        pincode: doctor.pincode,
        licenseNumber: doctor.licenseNumber
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({}, '-password');
    res.status(200).json({
      success: true,
      doctors,
      count: doctors.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.userId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        email: doctor.email,
        phone: doctor.phone,
        hospitalName: doctor.hospitalName,
        location: doctor.location,
        city: doctor.city,
        pincode: doctor.pincode,
        licenseNumber: doctor.licenseNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateDoctorProfile = async (req, res) => {
  try {
    const { hospitalName, phone, location, city, pincode, licenseNumber } = req.body;
    const doctor = await Doctor.findByIdAndUpdate(
      req.user.userId,
      { hospitalName, phone, location, city, pincode, licenseNumber, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(200).json({
      success: true,
      doctor: {
        id: doctor._id,
        email: doctor.email,
        phone: doctor.phone,
        hospitalName: doctor.hospitalName,
        location: doctor.location,
        city: doctor.city,
        pincode: doctor.pincode,
        licenseNumber: doctor.licenseNumber
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};