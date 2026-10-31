const mongoose = require('mongoose');

const STATUSES = ['Đang sử dụng', 'Hư hỏng', 'Đang sửa chữa', 'Ngừng sử dụng'];

const deviceSchema = new mongoose.Schema(
  {
    deviceId:   { type: String, required: [true, 'Mã thiết bị là bắt buộc'], unique: true, trim: true },
    name:       { type: String, required: [true, 'Tên thiết bị là bắt buộc'], trim: true },
    deviceType: { type: String, required: [true, 'Loại thiết bị là bắt buộc'], trim: true },
    room:       { type: String, required: [true, 'Phòng học là bắt buộc'], trim: true },
    brand:      { type: String, trim: true, default: '' },
    model:      { type: String, trim: true, default: '' },
    quantity:   { type: Number, required: [true, 'Số lượng là bắt buộc'], min: [0, 'Số lượng phải >= 0'] },
    status:     { type: String, enum: { values: STATUSES, message: 'Tình trạng không hợp lệ' }, default: 'Đang sử dụng' },
    purchaseDate: { type: Date },
    description:  { type: String, default: '' },
  },
  { timestamps: true, collection: 'devices' }
);

module.exports = mongoose.model('Device', deviceSchema);
module.exports.STATUSES = STATUSES;