const express = require('express');
const mongoose = require('mongoose');
const Device = require('../models/Device');

const router = express.Router();

const FIELDS = ['deviceId', 'name', 'deviceType', 'room', 'brand', 'model',
                'quantity', 'status', 'purchaseDate', 'description'];

const pick = (body) =>
  FIELDS.reduce((o, k) => (body[k] !== undefined ? { ...o, [k]: body[k] } : o), {});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const checkId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: 'ID thiết bị không hợp lệ' });
  }
  next();
};

// GET /api/devices  và  GET /api/devices?search=projector
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    const search = (req.query.search || '').trim();
    if (search) {
      const re = new RegExp(escapeRegex(search), 'i');
      filter.$or = ['deviceId', 'name', 'deviceType', 'room'].map((f) => ({ [f]: re }));
    }
    const devices = await Device.find(filter).sort({ createdAt: -1 });
    res.json(devices);
  } catch (err) { next(err); }
});

// GET /api/devices/:id
router.get('/:id', checkId, async (req, res, next) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json(device);
  } catch (err) { next(err); }
});

// POST /api/devices
router.post('/', async (req, res, next) => {
  try {
    const device = await Device.create(pick(req.body));
    res.status(201).json(device);
  } catch (err) { next(err); }
});

// PUT /api/devices/:id
router.put('/:id', checkId, async (req, res, next) => {
  try {
    const device = await Device.findByIdAndUpdate(req.params.id, pick(req.body), {
      new: true, runValidators: true,
    });
    if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json(device);
  } catch (err) { next(err); }
});

// DELETE /api/devices/:id
router.delete('/:id', checkId, async (req, res, next) => {
  try {
    const device = await Device.findByIdAndDelete(req.params.id);
    if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });
    res.json({ message: 'Đã xóa thiết bị', id: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;