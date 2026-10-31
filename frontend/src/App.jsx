import { useEffect, useState, useCallback } from 'react';
import './App.css';

const API_URL = (
  window.APP_CONFIG?.API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000'
).replace(/\/$/, '');

const STATUSES = ['Đang sử dụng', 'Hư hỏng', 'Đang sửa chữa', 'Ngừng sử dụng'];

const STATUS_CLASS = {
  'Đang sử dụng': 'ok',
  'Hư hỏng': 'bad',
  'Đang sửa chữa': 'warn',
  'Ngừng sử dụng': 'off',
};

const EMPTY = {
  deviceId: '',
  name: '',
  deviceType: '',
  room: '',
  brand: '',
  model: '',
  quantity: 1,
  status: 'Đang sử dụng',
  purchaseDate: '',
  description: '',
};

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Không kết nối được tới máy chủ');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Lỗi ${res.status}`);
  return data;
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('vi-VN') : '—');

function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASS[status] || 'off'}`}>{status}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="link" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DeviceForm({ initial, onSubmit, onCancel, saving }) {
  const [f, setF] = useState(initial);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      deviceId: f.deviceId,
      name: f.name,
      deviceType: f.deviceType,
      room: f.room,
      brand: f.brand,
      model: f.model,
      quantity: Number(f.quantity),
      status: f.status,
      purchaseDate: f.purchaseDate || undefined,
      description: f.description,
    });
  };

  return (
    <form onSubmit={submit} className="form">
      <label>Mã thiết bị *
        <input required value={f.deviceId} onChange={set('deviceId')} />
      </label>
      <label>Tên thiết bị *
        <input required value={f.name} onChange={set('name')} />
      </label>
      <label>Loại thiết bị *
        <input required value={f.deviceType} onChange={set('deviceType')} />
      </label>
      <label>Phòng học *
        <input required value={f.room} onChange={set('room')} />
      </label>
      <label>Hãng
        <input value={f.brand} onChange={set('brand')} />
      </label>
      <label>Model
        <input value={f.model} onChange={set('model')} />
      </label>
      <label>Số lượng *
        <input type="number" min="0" required value={f.quantity} onChange={set('quantity')} />
      </label>
      <label>Tình trạng
        <select value={f.status} onChange={set('status')}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </label>
      <label>Ngày mua
        <input type="date" value={f.purchaseDate} onChange={set('purchaseDate')} />
      </label>
      <label className="full">Mô tả
        <textarea rows="3" value={f.description} onChange={set('description')} />
      </label>
      <div className="actions full">
        <button type="button" onClick={onCancel}>Hủy</button>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>
    </form>
  );
}

export default function App() {
  const [devices, setDevices] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(null); // { mode: 'add' | 'edit', id, data }
  const [saving, setSaving] = useState(false);

  const flash = (msg) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  };

  const load = useCallback(async (q) => {
    setLoading(true);
    setError('');
    try {
      const qs = q ? `?search=${encodeURIComponent(q)}` : '';
      setDevices(await request(`/api/devices${qs}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Tìm kiếm tự động sau khi ngừng gõ 400ms
  useEffect(() => {
    const t = setTimeout(() => load(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search, load]);

  const openDetail = async (id) => {
    setError('');
    try {
      setDetail(await request(`/api/devices/${id}`));
    } catch (e) {
      setError(e.message);
    }
  };

  const openAdd = () => {
    setError('');
    setForm({ mode: 'add', data: EMPTY });
  };

  const openEdit = (d) => {
    setError('');
    setForm({
      mode: 'edit',
      id: d._id,
      data: {
        ...EMPTY,
        ...d,
        purchaseDate: d.purchaseDate ? d.purchaseDate.slice(0, 10) : '',
      },
    });
  };

  const save = async (data) => {
    setSaving(true);
    setError('');
    try {
      if (form.mode === 'add') {
        await request('/api/devices', { method: 'POST', body: JSON.stringify(data) });
        flash('Thêm thiết bị thành công');
      } else {
        await request(`/api/devices/${form.id}`, { method: 'PUT', body: JSON.stringify(data) });
        flash('Cập nhật thiết bị thành công');
      }
      setForm(null);
      load(search.trim());
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Xóa thiết bị "${d.name}"?`)) return;
    setError('');
    try {
      await request(`/api/devices/${d._id}`, { method: 'DELETE' });
      flash('Xóa thiết bị thành công');
      load(search.trim());
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container">
      <h1>Quản lý thiết bị phòng học</h1>

      <div className="toolbar">
        <input
          placeholder="Tìm theo mã, tên, loại, phòng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="primary" onClick={openAdd}>+ Thêm thiết bị</button>
      </div>

      {notice && <div className="alert success">{notice}</div>}
      {error && !form && <div className="alert error">{error}</div>}
      {loading && <p>Đang tải dữ liệu...</p>}

      {!loading && (
        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tên thiết bị</th>
              <th>Loại</th>
              <th>Phòng</th>
              <th>SL</th>
              <th>Tình trạng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 && (
              <tr><td colSpan="7" className="center">Không có thiết bị nào</td></tr>
            )}
            {devices.map((d) => (
              <tr key={d._id}>
                <td>{d.deviceId}</td>
                <td>{d.name}</td>
                <td>{d.deviceType}</td>
                <td>{d.room}</td>
                <td>{d.quantity}</td>
                <td><StatusBadge status={d.status} /></td>
                <td className="row-actions">
                  <button onClick={() => openDetail(d._id)}>Xem</button>
                  <button onClick={() => openEdit(d)}>Sửa</button>
                  <button className="danger" onClick={() => remove(d)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detail && (
        <Modal title="Chi tiết thiết bị" onClose={() => setDetail(null)}>
          <dl className="detail">
            <dt>Mã thiết bị</dt><dd>{detail.deviceId}</dd>
            <dt>Tên</dt><dd>{detail.name}</dd>
            <dt>Loại</dt><dd>{detail.deviceType}</dd>
            <dt>Phòng</dt><dd>{detail.room}</dd>
            <dt>Hãng</dt><dd>{detail.brand || '—'}</dd>
            <dt>Model</dt><dd>{detail.model || '—'}</dd>
            <dt>Số lượng</dt><dd>{detail.quantity}</dd>
            <dt>Tình trạng</dt><dd><StatusBadge status={detail.status} /></dd>
            <dt>Ngày mua</dt><dd>{fmtDate(detail.purchaseDate)}</dd>
            <dt>Mô tả</dt><dd>{detail.description || '—'}</dd>
          </dl>
        </Modal>
      )}

      {form && (
        <Modal
          title={form.mode === 'add' ? 'Thêm thiết bị' : 'Cập nhật thiết bị'}
          onClose={() => setForm(null)}
        >
          {error && <div className="alert error">{error}</div>}
          <DeviceForm
            initial={form.data}
            onSubmit={save}
            onCancel={() => setForm(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  );
}