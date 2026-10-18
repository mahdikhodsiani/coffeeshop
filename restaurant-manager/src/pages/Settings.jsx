// ---- تنظیمات: مشخصات رستوران، مالیات/سرویس، واحد پول، پشتیبان‌گیری ----
import { useRef, useState } from 'react';
import { exportBackup, importBackup } from '../utils/helpers';

export default function Settings({ db, setDb }) {
  const [s, setS] = useState(db.settings);
  const [savedMsg, setSavedMsg] = useState('');
  const fileRef = useRef();

  const save = () => {
    setDb(d => ({ ...d, settings: s }));
    setSavedMsg('✅ تنظیمات ذخیره شد');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const doImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const data = await importBackup(f);
      if (confirm('با وارد کردن فایل پشتیبان، تمام اطلاعات فعلی جایگزین می‌شود. ادامه می‌دهید؟')) {
        setDb(() => data);
        alert('بکاپ با موفقیت بازیابی شد.');
      }
    } catch { alert('فایل نامعتبر است.'); }
    e.target.value = '';
  };

  return (
    <div className="grid2">
      <div className="card">
        <div className="title">🏪 مشخصات فروشگاه</div>
        <div className="field"><label>نام رستوران / کافه</label>
          <input value={s.restaurantName} onChange={e => setS({ ...s, restaurantName: e.target.value })} /></div>
        <div className="field"><label>واحد پول</label>
          <select value={s.currency} onChange={e => setS({ ...s, currency: e.target.value })}>
            <option value="تومان">تومان</option><option value="ریال">ریال</option>
          </select></div>
        <div className="field"><label>رمز صندوق‌دار (برای عملیات حساس)</label>
          <input value={s.cashierCode} onChange={e => setS({ ...s, cashierCode: e.target.value })} /></div>
      </div>

      <div className="card">
        <div className="title">💰 مالیات و سرویس</div>
        <div className="field"><label>مالیات بر ارزش افزوده (٪)</label>
          <input type="number" value={s.taxPercent} onChange={e => setS({ ...s, taxPercent: Number(e.target.value) })} /></div>
        <label className="row" style={{ marginBottom: 12 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={s.serviceEnabled}
            onChange={e => setS({ ...s, serviceEnabled: e.target.checked })} /> محاسبه هزینه سرویس
        </label>
        <div className="field"><label>سرویس (٪)</label>
          <input type="number" value={s.servicePercent} disabled={!s.serviceEnabled}
            onChange={e => setS({ ...s, servicePercent: Number(e.target.value) })} /></div>
        <div className="row">
          <button className="btn" onClick={save}>💾 ذخیره تنظیمات</button>
          <span className="muted">{savedMsg}</span>
        </div>
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <div className="title">💾 پشتیبان‌گیری و بازیابی اطلاعات</div>
        <div className="muted" style={{ marginBottom: 12 }}>
          همه اطلاعات (منو، فاکتورها، هزینه‌ها، شیفت‌ها) به‌صورت محلی روی همین دستگاه ذخیره می‌شود.
          برای انتقال بین ویندوز و اندروید یا محافظت در برابر حذف برنامه، منظم بکاپ JSON بگیرید.
        </div>
        <div className="row">
          <button className="btn ghost" onClick={() => exportBackup(db)}>⬇️ دریافت فایل پشتیبان</button>
          <button className="btn gray" onClick={() => fileRef.current?.click()}>⬆️ بازیابی از فایل</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={doImport} />
        </div>
      </div>
    </div>
  );
}
