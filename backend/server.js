require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const devicesRouter = require('./routes/devices');

const app = express();
const PORT = process.env.PORT || 5000;

const origins = (process.env.CORS_ORIGIN || '*').split(',').map((s) => s.trim());
app.use(cors({ origin: origins.includes('*') ? '*' : origins }));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({
    status: 'ok',
    database: connected ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Chặn API khi mất kết nối DB
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Không kết nối được cơ sở dữ liệu' });
  }
  next();
});

app.use('/api/devices', devicesRouter);

app.use((req, res) => res.status(404).json({ message: 'Endpoint không tồn tại' }));

// Xử lý lỗi tập trung
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((e) => e.message).join('; ');
    return res.status(400).json({ message });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Mã thiết bị (deviceId) đã tồn tại' });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON không hợp lệ' });
  }
  console.error(err);
  res.status(500).json({ message: 'Lỗi máy chủ' });
});

mongoose
  .connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
  .then(() => console.log('Đã kết nối MongoDB Atlas'))
  .catch((err) => console.error('Lỗi kết nối MongoDB:', err.message));

app.listen(PORT, () => console.log(`Backend chạy tại cổng ${PORT}`));