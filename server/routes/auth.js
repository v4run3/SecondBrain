const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { 
  registerValidation, 
  verifyEmailValidation, 
  handleValidationErrors 
} = require('../middleware/validationMiddleware');
const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', registerValidation, handleValidationErrors, async (req, res) => {
  const { name, email, password, username } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      name,
      email,
      password,
      username,
      otp,
      otpExpires,
      isVerified: false // Explicitly set false
    });

    if (user) {
        try {
            await sendEmail({
              email: user.email,
              subject: 'SecondBrain - Verify your email',
              message: `Your verification code is: ${otp}`,
              html: `<h1>Welcome to SecondBrain</h1><p>Your verification code is:</p><h2>${otp}</h2><p>This code expires in 10 minutes.</p>`
            });
            
            res.status(201).json({
                message: 'Registration successful! Please verify your email.',
                email: user.email 
                // Do not send token yet, wait for verification
            });
        } catch (emailError) {
             console.error("Email send failed", emailError);
             // Optional: delete user if email fails? Or let them retry?
             // For now, return success but warn logs
             res.status(201).json({
                message: 'Registration successful, but failed to send verification email. Please contact support or try logging in to resend.',
                email: user.email
            });
        }

    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify OTP
// @access  Public
router.post('/verify-email', verifyEmailValidation, handleValidationErrors, async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    }
    
    if (user.isVerified) {
        return res.status(400).json({ message: 'User already verified' });
    }
    
    if (user.otp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }
    
    if (user.otpExpires < Date.now()) {
         return res.status(400).json({ message: 'OTP expired. Please register again.' });
         // Ideally implemented resend OTP logic
    }
    
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        token: generateToken(user._id),
    });

  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
// @route   POST /api/auth/login
// @desc    Auth user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body; // identifier can be email or username

  try {
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
          return res.status(401).json({ message: 'Please verify your email first.' });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
