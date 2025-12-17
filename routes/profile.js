const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const ProfileUser = require('../models/ProfileUser');

// --- Upload Configuration ---
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- Update Profile Route ---
router.put('/update', upload.single('profileImage'), async (req, res) => {
  try {
    const { email, firstName, lastName, alamat, telepon, tanggalLahir, lokasi, kodePos } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const updateData = {
      email,
      firstName,
      lastName,
      alamat,
      telepon,
      lokasi,
      kodePos,
      updatedAt: new Date()
    };

    if (tanggalLahir && tanggalLahir !== 'undefined') {
        updateData.tanggalLahir = new Date(tanggalLahir);
    }
    
    if (req.file) {
        updateData.profileImage = `/uploads/${req.file.filename}`;
    }

    // Upsert: Update if exists, Create if new
    const savedProfile = await ProfileUser.findOneAndUpdate(
      { email: email },
      { $set: updateData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
        success: true,
        message: 'Profile updated successfully',
        data: savedProfile
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Get Profile Route ---
router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email;

    // Check Main User Account
    const userAccount = await User.findOne({ email }).select('-password');
    if (!userAccount) {
        return res.status(404).json({ success: false, message: 'User account not found' });
    }

    // Check Profile Data
    const userProfile = await ProfileUser.findOne({ email });

    if (userProfile) {
      return res.json({ success: true, data: userProfile });
    } else {
      // Return basic data if profile not set
      return res.json({
        success: true,
        data: {
          email: userAccount.email,
          firstName: userAccount.firstName,
          lastName: userAccount.lastName,
          alamat: '',
          telepon: '',
          lokasi: '',
          kodePos: '',
          profileImage: ''
        }
      });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;