// FILE: models/ProfileUser.js
const mongoose = require('mongoose');

const ProfileUserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true // Menghubungkan dengan akun login
  },
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  alamat:    { type: String, default: '' },
  telepon:   { type: String, default: '' },
  tanggalLahir: { type: Date },
  lokasi:    { type: String, default: '' },
  kodePos:   { type: String, default: '' },
  profileImage: { type: String, default: '' }, // Menyimpan URL gambar
  updatedAt: { type: Date, default: Date.now }
}, { 
  collection: 'profileusers' // Nama tabel di database 'tudungsaji'
});

module.exports = mongoose.model('ProfileUser', ProfileUserSchema);
