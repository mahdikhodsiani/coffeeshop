// ---- گزارش‌گیری: فروش روزانه، پرفروش‌ترین‌ها، دسته‌بندی، بازه زمانی ----
import { useMemo, useState } from 'react';
import { toFa, money, jDayOf, todayJ, toJalali, toGregorian } from '../utils/helpers';

export default function Reports({ db }) {
  const [rangeDays, setRangeDays] = useState(7);

  // بازه زمانی بر اساس روزهای شمسی
  const dayKeys = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const [y, m, dd] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      arr.push(`${y}-${String(m).padStart(2, '0')}-${String(dd).padStart(2, '0')}`);
    }
    return arr;
  }, [rangeDays]);

  const daily = useMemo(() => {
    const map = Object.fromEntries(dayKeys.map(k => [k, 0]));
    db.orders.forEach(o => { const k = jDayOf(o.ts); if (k in map) map[k] += o.total; });
    return dayKeys.map(k => ({ k, v: map[k] }));
  }, [db.orders, dayKeys]);

  const maxDay = Math.max(1, ...daily.map(d => d.v));
  const periodTotal = daily.reduce((s, d) => s + d.v, 0);

  // پرفروش‌ترین آیتم‌ها در کل
  const topItems = useMemo(() => {
    const map = {};
    db.orders.forEach(o => o.lines.forEach(l => {
      map[l.itemId] = map[l.itemId] || { name: l.name, count: 0, revenue: 0 };
      map[l.itemId].count += l.count;
      map[l.itemId].revenue += l.price * l.count;
    }));
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [db.orders]);

  // فروش به تفکیک دسته
  const byCat = useMemo(() => {
    const map = {};
    db.orders.forEach(o => o.lines.forEach(l => {
      const it = db.items.find(i => i.id === l.itemId);
      const cn = db.categories.find(c => c.id === it?.catId)?.name || 'حذف‌شده';
      map[cn] = (map[cn] || 0) + l.price * l.count;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [db.orders, db.items, db.categories]);

  const paySplit = useMemo(() => {
    const m = { cash: 0, card: 0, online: 0 };
    db.orders.forEach(o => m[o.payMethod] += o.total);
    return m;
  }, [db.orders]);

  const invoiceCount = db.orders.filter(o => dayKeys.includes(jDayOf(o.ts))).length;

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        {[7, 14, 30].map(n => (
          <button key={n} className={`btn small ${rangeDays === n ? '' : 'gray'}`} onClick={() => setRangeDays(n)}>
            {toFa(n)} روز اخیر
          </button>
        ))}
        <span className="muted" style={{ marginInlineStart: 'auto' }}>امروز: {todayJ()}</span>
      </div>

      <div className="grid4">
        <div className="card stat"><div className="v" style={{ color: 'var(--green)' }}>{money(periodTotal)}</div><div className="l">فروش بازه ({toFa(db.settings.currency)})</div></div>
        <div className="card stat"><div className="v">{toFa(invoiceCount)}</div><div className="l">تعداد فاکتور</div></div>
        <div className="card stat"><div className="v">{money(invoiceCount ? periodTotal / invoiceCount : 0)}</div><div className="l">میانگین سبد</div></div>
        <div className="card stat"><div className="v">{money(paySplit.cash)}</div><div className="l">نقدی</div></div>
      </div>

      {/* نمودار ستونی فروش روزانه */}
      <div className="card">
        <div className="title">📊 نمودار فروش روزانه</div>
        <div className="bars">
          {daily.map(d => (
            <div key={d.k} className="bar-wrap" title={`${d.k}: ${money(d.v)}`}>
              <div className="muted" style={{ fontSize: '.6rem' }}>{d.v ? money(d.v) : ''}</div>
              <div className="bar" style={{ height: `${(d.v / maxDay) * 100}%` }} />
              <div className="bar-lbl">{toFa(d.k.slice(-5))}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="title">🏆 پرفروش‌ترین آیتم‌ها</div>
          {topItems.length === 0 ? <div className="empty">داده‌ای برای نمایش نیست. ابتدا فاکتور صادر کنید.</div> : (
            <table className="tbl">
              <thead><tr><th>ردیف</th><th>نام</th><th>تعداد</th><th>درآمد</th></tr></thead>
              <tbody>
                {topItems.map((t, i) => (
                  <tr key={t.name}><td>{toFa(i + 1)}</td><td style={{ fontWeight: 700 }}>{t.name}</td>
                    <td>{toFa(t.count)}</td><td>{money(t.revenue)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="title">🧩 فروش به تفکیک دسته‌بندی</div>
          {byCat.length === 0 ? <div className="empty">داده‌ای نیست.</div> : byCat.map(([name, v]) => {
            const pct = periodTotal ? Math.round((v / (byCat.reduce((s, x) => s + x[1], 0))) * 100) : 0;
            return (
              <div key={name} style={{ marginBottom: 10 }}>
                <div className="row spread" style={{ fontSize: '.85rem', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{name}</span>
                  <span className="muted">{money(v)} — {toFa(pct)}٪</span>
                </div>
                <div style={{ background: '#eee', borderRadius: 8, height: 9 }}>
                  <div style={{ width: `${pct}%`, background: 'var(--accent)', height: 9, borderRadius: 8 }} />
                </div>
              </div>
            );
          })}
          <div className="line" style={{ borderTop: '1px dashed var(--border)', margin: '10px 0' }} />
          <div className="row spread muted"><span>کارت‌خوان: {money(paySplit.card)}</span><span>آنلاین: {money(paySplit.online)}</span></div>
        </div>
      </div>
    </div>
  );
}
