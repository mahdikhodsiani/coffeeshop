// ---- خانه داشبورد: نمای کلی امروز ----
import { useMemo } from 'react';
import { toFa, money, todayJ, jDayOf } from '../utils/helpers';

export default function Dashboard({ db, go }) {
  const stats = useMemo(() => {
    const today = todayJ().replace(/\//g, '-');
    const todays = db.orders.filter(o => jDayOf(o.ts) === today);
    const rev = todays.reduce((s, o) => s + o.total, 0);
    const cash = todays.filter(o => o.payMethod === 'cash').reduce((s, o) => s + o.total - o.change, 0);
    const openShift = db.shifts.find(s => !s.endTs);
    return { count: todays.length, rev, cash, openShift };
  }, [db]);

  const activeTables = useMemo(() => {
    const used = new Set(db.orders.filter(o => o.type === 'table' && Date.now() - o.ts < 3 * 3600e3).map(o => o.tableId));
    return db.tables.filter(t => used.has(t.id));
  }, [db]);

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#b3261e,#8c1d17)', color: '#fff' }}>
        <div className="row spread">
          <div>
            <h2 style={{ fontSize: '1.2rem' }}>{db.settings.restaurantName}</h2>
            <div style={{ opacity: .9, marginTop: 6 }}>امروز: {todayJ()} | وضعیت شیفت: {stats.openShift ? '🟢 باز' : '⚪ بسته'}</div>
          </div>
          <button className="btn" style={{ background: '#fff', color: 'var(--primary)' }} onClick={() => go('pos')}>
            🧾 شروع فروش جدید
          </button>
        </div>
      </div>

      <div className="grid4">
        <div className="card stat"><div className="v">{money(stats.rev)}</div><div className="l">فروش امروز ({toFa(db.settings.currency)})</div></div>
        <div className="card stat"><div className="v">{toFa(stats.count)}</div><div className="l">فاکتور امروز</div></div>
        <div className="card stat"><div className="v" style={{ color: 'var(--green)' }}>{money(stats.cash)}</div><div className="l">نقد داخل کشو (امروز)</div></div>
        <div className="card stat"><div className="v">{toFa(activeTables.length)}/{toFa(db.tables.length)}</div><div className="l">میزهای فعال (۳ ساعت اخیر)</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="title">⚡ دسترسی سریع</div>
          <div className="row">
            {[['pos', '🧾 صندوق'], ['menu', '🍽️ منو'], ['acc', '💰 حسابداری'], ['rep', '📊 گزارش‌ها'], ['drawer', '🔐 کشو']].map(([k, l]) => (
              <button key={k} className="btn ghost" onClick={() => go(k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="title">🆕 آخرین فاکتورها</div>
          {db.orders.length === 0 ? <div className="empty">هنوز فروشی ثبت نشده — از صفحه صندوق شروع کنید.</div> : (
            db.orders.slice(-5).reverse().map(o => (
              <div key={o.id} className="row spread" style={{ padding: '7px 0', borderBottom: '1px dashed var(--border)' }}>
                <span style={{ fontWeight: 700 }}>فاکتور #{toFa(o.no)}</span>
                <span className="muted">{o.type === 'table' ? 'میز' : o.type === 'takeout' ? 'بیرون‌بر' : 'ارسال'}</span>
                <span style={{ color: 'var(--green)', fontWeight: 800 }}>{money(o.total)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
