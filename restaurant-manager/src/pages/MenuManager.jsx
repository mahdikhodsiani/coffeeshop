// ---- مدیریت منوی دیجیتال: دسته‌بندی‌ها و آیتم‌ها + میزها ----
import { useState } from 'react';
import { toFa, money, uid } from '../utils/helpers';

export default function MenuManager({ db, setDb }) {
  const [editCat, setEditCat] = useState(null);   // {id?, name}
  const [editItem, setEditItem] = useState(null); // {_id?, id, catId, name, price, active}
  const [editTable, setEditTable] = useState(null);

  // ---------- دسته‌بندی ----------
  const saveCat = () => {
    if (!editCat.name.trim()) return;
    setDb(d => {
      if (editCat.id) {
        return { ...d, categories: d.categories.map(c => c.id === editCat.id ? { ...c, name: editCat.name } : c) };
      }
      return { ...d, categories: [...d.categories, { id: uid(), name: editCat.name }] };
    });
    setEditCat(null);
  };
  const delCat = (id) => {
    if (!confirm('حذف این دسته؟ آیتم‌های آن نیز حذف می‌شوند.')) return;
    setDb(d => ({ ...d, categories: d.categories.filter(c => c.id !== id), items: d.items.filter(i => i.catId !== id) }));
  };

  // ---------- آیتم ----------
  const saveItem = () => {
    if (!editItem.name.trim() || !Number(editItem.price)) return;
    const it = { id: editItem.id || uid(), catId: editItem.catId, name: editItem.name, price: Number(editItem.price), active: !!editItem.active };
    setDb(d => d.items.some(i => i.id === it.id)
      ? { ...d, items: d.items.map(i => i.id === it.id ? it : i) }
      : { ...d, items: [...d.items, it] });
    setEditItem(null);
  };
  const delItem = (id) => {
    if (!confirm('حذف این آیتم از منو؟')) return;
    setDb(d => ({ ...d, items: d.items.filter(i => i.id !== id) }));
  };

  // ---------- میز ----------
  const saveTable = () => {
    if (!editTable.name.trim()) return;
    const t = { id: editTable.id || uid(), name: editTable.name, seats: Number(editTable.seats) || 4 };
    setDb(d => d.tables.some(x => x.id === t.id)
      ? { ...d, tables: d.tables.map(x => x.id === t.id ? t : x) }
      : { ...d, tables: [...d.tables, t] });
    setEditTable(null);
  };
  const delTable = (id) => setDb(d => ({ ...d, tables: d.tables.filter(t => t.id !== id) }));

  return (
    <div className="grid2">
      {/* ستون راست: دسته‌بندی و میزها */}
      <div>
        <div className="card">
          <div className="row spread title">
            <span>📂 دسته‌بندی‌ها</span>
            <button className="btn small" onClick={() => setEditCat({ name: '' })}>+ افزودن</button>
          </div>
          <table className="tbl">
            <tbody>
              {db.categories.map(c => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="muted">{toFa(db.items.filter(i => i.catId === c.id).length)} آیتم</td>
                  <td style={{ width: 120 }} className="row">
                    <button className="btn small gray" onClick={() => setEditCat({ ...c })}>ویرایش</button>
                    <button className="btn small" style={{ background: 'var(--red)' }} onClick={() => delCat(c.id)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="row spread title">
            <span>🪑 میزها</span>
            <button className="btn small" onClick={() => setEditTable({ name: '', seats: 4 })}>+ افزودن میز</button>
          </div>
          <div className="row">
            {db.tables.map(t => (
              <span key={t.id} className="badge green" style={{ fontSize: '.8rem', padding: '6px 12px', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                {t.name} ({toFa(t.seats)} نفره)
                <b style={{ cursor: 'pointer' }} onClick={() => setEditTable({ ...t })}>✏️</b>
                <b style={{ cursor: 'pointer' }} onClick={() => delTable(t.id)}>🗑️</b>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ستون چپ: آیتم‌های منو */}
      <div className="card">
        <div className="row spread title">
          <span>🍽️ آیتم‌های منو</span>
          <button className="btn small" onClick={() => setEditItem({ catId: db.categories[0]?.id, name: '', price: '', active: true })}>
            + آیتم جدید
          </button>
        </div>
        <table className="tbl">
          <thead>
            <tr><th>نام</th><th>دسته</th><th>قیمت</th><th>وضعیت</th><th></th></tr>
          </thead>
          <tbody>
            {db.items.map(i => (
              <tr key={i.id}>
                <td style={{ fontWeight: 700 }}>{i.name}</td>
                <td className="muted">{db.categories.find(c => c.id === i.catId)?.name || '—'}</td>
                <td>{money(i.price)}</td>
                <td>
                  <button className={`badge ${i.active ? 'green' : ''}`} style={{ cursor: 'pointer' }}
                    onClick={() => setDb(d => ({ ...d, items: d.items.map(x => x.id === i.id ? { ...x, active: !x.active } : x) }))}>
                    {i.active ? 'فعال' : 'غیرفعال'}
                  </button>
                </td>
                <td className="row" style={{ width: 130 }}>
                  <button className="btn small gray" onClick={() => setEditItem({ ...i })}>ویرایش</button>
                  <button className="btn small" style={{ background: 'var(--red)' }} onClick={() => delItem(i.id)}>حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------- مودال‌ها ---------- */}
      {editCat && (
        <Modal title={editCat.id ? 'ویرایش دسته' : 'دسته جدید'} onClose={() => setEditCat(null)}>
          <input autoFocus value={editCat.name} placeholder="نام دسته"
            onChange={e => setEditCat({ ...editCat, name: e.target.value })} />
          <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={saveCat}>ذخیره</button>
        </Modal>
      )}

      {editItem && (
        <Modal title={editItem.id ? 'ویرایش آیتم' : 'آیتم جدید'} onClose={() => setEditItem(null)}>
          <div className="field"><label>نام غذا / نوشیدنی</label>
            <input autoFocus value={editItem.name} onChange={e => setEditItem({ ...editItem, name: e.target.value })} /></div>
          <div className="field"><label>دسته‌بندی</label>
            <select value={editItem.catId} onChange={e => setEditItem({ ...editItem, catId: e.target.value })}>
              {db.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="field"><label>قیمت ({db.settings.currency})</label>
            <input type="number" value={editItem.price} onChange={e => setEditItem({ ...editItem, price: e.target.value })} /></div>
          <label className="row" style={{ marginBottom: 12 }}>
            <input type="checkbox" style={{ width: 'auto' }} checked={!!editItem.active}
              onChange={e => setEditItem({ ...editItem, active: e.target.checked })} /> فعال باشد
          </label>
          <button className="btn" style={{ width: '100%' }} onClick={saveItem}>ذخیره</button>
        </Modal>
      )}

      {editTable && (
        <Modal title={editTable.id ? 'ویرایش میز' : 'میز جدید'} onClose={() => setEditTable(null)}>
          <div className="field"><label>نام میز</label>
            <input autoFocus value={editTable.name} onChange={e => setEditTable({ ...editTable, name: e.target.value })} /></div>
          <div className="field"><label>ظرفیت (نفر)</label>
            <input type="number" value={editTable.seats} onChange={e => setEditTable({ ...editTable, seats: e.target.value })} /></div>
          <button className="btn" style={{ width: '100%' }} onClick={saveTable}>ذخیره</button>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}
