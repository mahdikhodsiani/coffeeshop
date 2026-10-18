import { useEffect, useState } from 'react';
import { loadDB, saveDB, toFa, money, jDateStr, todayJ } from './utils/helpers';
import POS from './pages/POS';
import MenuManager from './pages/MenuManager';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';
import CashDrawer from './pages/CashDrawer';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';

const TABS = [
  { key: 'home', label: 'خانه', ico: '🏠', C: Dashboard },
  { key: 'pos', label: 'صندوق', ico: '🧾', C: POS },
  { key: 'menu', label: 'منو', ico: '🍽️', C: MenuManager },
  { key: 'acc', label: 'حسابداری', ico: '💰', C: Accounting },
  { key: 'drawer', label: 'کشو', ico: '🔐', C: CashDrawer },
  { key: 'rep', label: 'گزارش‌ها', ico: '📊', C: Reports },
  { key: 'set', label: 'تنظیمات', ico: '⚙️', C: Settings }
];

export default function App() {
  const [db, setDbState] = useState(loadDB);
  const [tab, setTab] = useState('home');
  const [invoice, setInvoice] = useState(null); // فاکتور در حال چاپ

  const setDb = (updater) => setDbState(prev => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    saveDB(next);
    return next;
  });

  // چاپ با تاخیر تا DOM آماده شود
  const printInvoice = (order) => {
    setInvoice(order);
    setTimeout(() => window.print(), 150);
  };

  useEffect(() => {
    if (!invoice) return;
    const after = () => setInvoice(null);
    window.addEventListener('afterprint', after);
    return () => window.removeEventListener('afterprint', after);
  }, [invoice]);

  const Active = TABS.find(t => t.key === tab).C;

  return (
    <div className="app">
      <header className="header">
        <h1>🍴 {db.settings.restaurantName}</h1>
        <span className="date">{todayJ()}</span>
      </header>

      <nav className="nav">
        {TABS.map(t => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
            <span className="ico">{t.ico}</span>{t.label}
          </button>
        ))}
      </nav>

      <main className="page">
        <Active db={db} setDb={setDb} go={setTab} printInvoice={printInvoice} />
      </main>

      {/* ناحیه چاپ فاکتور */}
      <div id="print-area">
        {invoice && (
          <div className="receipt">
            <h2>{db.settings.restaurantName}</h2>
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              فاکتور شماره {toFa(invoice.no)} — {jDateStr(invoice.ts)}
            </div>
            <div style={{ textAlign: 'center', fontSize: 11 }}>
              {invoice.type === 'table' ? `میز: ${db.tables.find(t => t.id === invoice.tableId)?.name || '-'}` :
                invoice.type === 'takeout' ? 'بیرون‌بر' : `ارسال: ${invoice.customer || '-'}`}
            </div>
            <div className="line" />
            <table>
              <tbody>
                {invoice.lines.map(l => (
                  <tr key={l.itemId}>
                    <td>{l.name}</td>
                    <td style={{ textAlign: 'center' }}>{toFa(l.count)}</td>
                    <td style={{ textAlign: 'left' }}>{money(l.price * l.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="line" />
            <table>
              <tbody>
                <tr><td>جمع کل</td><td style={{ textAlign: 'left' }}>{money(invoice.subtotal)}</td></tr>
                {invoice.service > 0 && <tr><td>سرویس</td><td style={{ textAlign: 'left' }}>{money(invoice.service)}</td></tr>}
                <tr><td>مالیات</td><td style={{ textAlign: 'left' }}>{money(invoice.tax)}</td></tr>
                {invoice.discount > 0 && <tr><td>تخفیف</td><td style={{ textAlign: 'left' }}>{money(-invoice.discount)}</td></tr>}
                <tr><td><b>قابل پرداخت ({db.settings.currency})</b></td><td style={{ textAlign: 'left' }}><b>{money(invoice.total)}</b></td></tr>
                <tr><td>نحوه پرداخت</td><td style={{ textAlign: 'left' }}>{invoice.payMethod === 'cash' ? 'نقدی' : invoice.payMethod === 'card' ? 'کارت‌خوان' : 'آنلاین'}</td></tr>
                {invoice.change > 0 && <tr><td>باقی مشتری</td><td style={{ textAlign: 'left' }}>{money(invoice.change)}</td></tr>}
              </tbody>
            </table>
            <div className="line" />
            <div style={{ textAlign: 'center', fontSize: 11 }}>از بازدید شما سپاسگزاریم 🌹</div>
          </div>
        )}
      </div>
    </div>
  );
}
