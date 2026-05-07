const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { generateVerificationToken, generateJWT } = require('../services/tokenService');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

const isProduction = process.env.NODE_ENV === 'production';

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = generateVerificationToken();

    const shouldAutoVerify = !process.env.RESEND_API_KEY && !isProduction;
    const user = new User({
      name,
      email,
      password: hashedPassword,
      verificationToken: shouldAutoVerify ? null : verificationToken,
      isVerified: shouldAutoVerify,
    });

    await user.save();

    if (!shouldAutoVerify) {
      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (error) {
        if (isProduction) throw error;

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();
        console.warn(
          `Verification email failed in development, so ${email} was auto-verified. Reason: ${error.message}`,
        );
      }
    }

    res.status(201).json({
      message: user.isVerified
        ? 'User created successfully. You can now log in.'
        : 'User created successfully. Please check your email for verification.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // For security, don't reveal if email exists
      return res
        .status(200)
        .json({ message: 'If your email is registered, you will receive a reset link.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    let emailSent = true;
    try {
      await sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      if (isProduction) throw error;
      emailSent = false;
      console.warn(
        `Password reset email failed in development. Reset URL: ${process.env.CLIENT_URL}/reset-password/${resetToken}`,
      );
    }

    res.status(200).json({
      message: emailSent ? 'Password reset email sent' : 'Password reset link generated',
      resetToken: !isProduction ? resetToken : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  if (!user.isVerified) return res.status(401).json({ message: 'Email not verified' });
  const token = generateJWT(user._id);
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      isVerified: user.isVerified,
    },
  });
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });
  if (!user) return res.status(400).json({ message: 'Invalid token' });
  user.isVerified = true;
  user.verificationToken = null;
  await user.save();
  res.json({ message: 'Email verified' });
};

exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();
  res.json({ message: 'Password reset successful' });
};

exports.getMe = async (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    avatar: req.user.avatar,
    bio: req.user.bio,
    isVerified: req.user.isVerified,
  });
};
