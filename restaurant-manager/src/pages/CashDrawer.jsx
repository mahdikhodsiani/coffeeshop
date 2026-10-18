// ---- صندوق روزانه: باز/بسته کردن شیفت، شمارش نقدی، مغایرت ----
import { useState } from 'react';
import { toFa, money, uid, jDateStr, todayJ, jDayOf } from '../utils/helpers';

export default function CashDrawer({ db, setDb }) {
  const [openShift, setOpenShift] = useState(null); // {openingCash}
  const active = db.shifts.find(s => !s.endTs);

  const openNew = () => {
    if (!active) return;
    const s = { id: uid(), startTs: Date.now(), startDate: todayJ(), openingCash: Number(openShift.openingCash) || 0, endTs: null };
    setDb(d => ({ ...d, shifts: [...d.shifts, s] }));
    setOpenShift(null);
  };

  const closeShift = (s, countedCash, note) => {
    // فروش نقدی در بازه شیفت
    const cashSales = db.orders
      .filter(o => o.ts >= s.startTs && o.payMethod === 'cash')
      .reduce((a, o) => a + (o.total - o.change), 0); // خالص دریافتی نقدی
    const expected = s.openingCash + cashSales;
    setDb(d => ({
      ...d,
      shifts: d.shifts.map(x => x.id === s.id
        ? { ...x, endTs: Date.now(), endDate: todayJ(), countedCash: Number(countedCash) || 0, expected, diff: (Number(countedCash) || 0) - expected, note }
        : x)
    }));
  };

  return (
    <div>
      {/* وضعیت فعلی */}
      <div className="card">
        <div className="title">🔐 شیفت صندوق</div>
        {active ? (
          <CloseShiftPanel db={db} shift={active} onClose={closeShift} />
        ) : (
          <>
            <div className="muted" style={{ marginBottom: 10 }}>در حال حاضر شیفت بازی باز نیست. برای شروع ثبت فاکتورهای نقدی، شیفت جدید باز کنید.</div>
            <div className="row">
              <input style={{ maxWidth: 200 }} type="number" placeholder="موجودی اولیه کشو" value={openShift?.openingCash ?? ''}
                onChange={e => setOpenShift({ openingCash: e.target.value })} />
              <button className="btn green" onClick={openNew} disabled={!openShift}>▶️ باز کردن شیفت</button>
            </div>
          </>
        )}
      </div>

      {/* تاریخچه شیفت‌ها */}
      <div className="card">
        <div className="title">📜 تاریخچه شیفت‌ها</div>
        {db.shifts.length === 0 ? <div className="empty">شیفتی ثبت نشده است.</div> : (
          <table className="tbl">
            <thead><tr><th>شروع</th><th>پایان</th><th>موجودی اولیه</th><th>فروش نقدی</th><th>کشوی شمارش‌شده</th><th>مغایرت</th></tr></thead>
            <tbody>
              {db.shifts.slice().reverse().map(s => (
                <tr key={s.id}>
                  <td className="muted">{jDateStr(s.startTs)}</td>
                  <td className="muted">{s.endTs ? jDateStr(s.endTs) : <span className="badge green">باز</span>}</td>
                  <td>{money(s.openingCash)}</td>
                  <td>{money((s.expected ?? 0) - s.openingCash)}</td>
                  <td>{s.endTs ? money(s.countedCash) : '—'}</td>
                  <td style={{ fontWeight: 800, color: !s.endTs ? 'var(--muted)' : s.diff === 0 ? 'var(--green)' : 'var(--red)' }}>
                    {s.endTs ? (s.diff > 0 ? '+' : '') + money(s.diff) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function CloseShiftPanel({ db, shift, onClose }) {
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');

  const cashSales = db.orders
    .filter(o => o.ts >= shift.startTs && o.payMethod === 'cash')
    .reduce((a, o) => a + (o.total - o.change), 0);
  const cardSales = db.orders
    .filter(o => o.ts >= shift.startTs && o.payMethod !== 'cash')
    .reduce((a, o) => a + o.total, 0);
  const expected = shift.openingCash + cashSales;

  return (
    <div>
      <div className="grid4">
        <div className="stat"><div className="v">{jDateStr(shift.startTs)}</div><div className="l">شروع شیفت</div></div>
        <div className="stat"><div className="v">{money(shift.openingCash)}</div><div className="l">موجودی اولیه</div></div>
        <div className="stat"><div className="v" style={{ color: 'var(--green)' }}>{money(cashSales)}</div><div className="l">فروش نقدی شیفت</div></div>
        <div className="stat"><div className="v">{money(cardSales)}</div><div className="l">فروش کارت/آنلاین</div></div>
      </div>
      <div className="total-row final"><span>مانده انتظاری کشو</span><span>{money(expected)} {toFa(db.settings.currency)}</span></div>
      <div className="row" style={{ marginTop: 12 }}>
        <input style={{ maxWidth: 200 }} type="number" placeholder="مبلغ شمارش‌شده داخل کشو" value={counted} onChange={e => setCounted(e.target.value)} />
        <input style={{ flex: 1, minWidth: 160 }} placeholder="توضیحات (اختیاری)" value={note} onChange={e => setNote(e.target.value)} />
        <button className="btn" style={{ background: 'var(--red)' }} onClick={() => onClose(shift, counted, note)}>⏹️ بستن شیفت</button>
      </div>
    </div>
  );
}
