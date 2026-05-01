const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRATION = '24h';

const generateToken = (userId, userType) => {
  const token = jwt.sign(
    { 
      userId: userId, 
      id: userId,    
      userType: userType 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
};

module.exports = { generateToken, verifyToken, JWT_SECRET };