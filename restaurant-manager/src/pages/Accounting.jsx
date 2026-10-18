// ---- حسابداری: ثبت هزینه‌ها، لیخ فاکتورها، بستن حساب روزانه ----
import { useMemo, useState } from 'react';
import { toFa, money, uid, jDateStr, todayJ, jDayOf } from '../utils/helpers';

const EXP_CATS = ['خرید مواد اولیه', 'اجاره', 'حقوق و دستمزد', 'قبوض (آب/برق/گاز)', 'تجهیزات', 'بازاریابی', 'سایر'];

export default function Accounting({ db, setDb, printInvoice }) {
  const [tab, setTab] = useState('expenses'); // expenses | invoices
  const [exp, setExp] = useState(null);       // {id?, title, category, amount, date}
  const [filterDay, setFilterDay] = useState('');

  const saveExp = () => {
    if (!exp.title?.trim() || !Number(exp.amount)) return;
    const e = { id: exp.id || uid(), title: exp.title, category: exp.category, amount: Number(exp.amount), date: exp.date || todayJ(), ts: Date.now() };
    setDb(d => d.expenses.some(x => x.id === e.id)
      ? { ...d, expenses: d.expenses.map(x => x.id === e.id ? e : x) }
      : { ...d, expenses: [...d.expenses, e] });
    setExp(null);
  };

  const totals = useMemo(() => {
    const rev = db.orders.reduce((s, o) => s + o.total, 0);
    const taxSum = db.orders.reduce((s, o) => s + o.tax, 0);
    const expSum = db.expenses.reduce((s, e) => s + e.amount, 0);
    return { rev, taxSum, expSum, net: rev - expSum };
  }, [db.orders, db.expenses]);

  const filteredInvoices = useMemo(() =>
    db.orders.filter(o => !filterDay || jDayOf(o.ts).replace(/-/g, '/') === filterDay.trim().replace(/\//g, '-'))
      .slice().reverse(),
    [db.orders, filterDay]);

  return (
    <div>
      {/* خلاصه مالی */}
      <div className="grid4">
        <div className="card stat"><div className="v" style={{ color: 'var(--green)' }}>{money(totals.rev)}</div><div className="l">فروش کل ({toFa(db.settings.currency)})</div></div>
        <div className="card stat"><div className="v">{money(totals.taxSum)}</div><div className="l">مالیات دریافتی</div></div>
        <div className="card stat"><div className="v" style={{ color: 'var(--red)' }}>{money(totals.expSum)}</div><div className="l">هزینه‌های کل</div></div>
        <div className="card stat"><div className="v" style={{ color: totals.net >= 0 ? 'var(--green)' : 'var(--red)' }}>{money(totals.net)}</div><div className="l">سود خالص</div></div>
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <button className={`btn small ${tab === 'expenses' ? '' : 'gray'}`} onClick={() => setTab('expenses')}>💸 هزینه‌ها</button>
        <button className={`btn small ${tab === 'invoices' ? '' : 'gray'}`} onClick={() => setTab('invoices')}>🧾 فاکتورها</button>
        {tab === 'expenses' && <button className="btn small" style={{ marginInlineStart: 'auto' }} onClick={() => setExp({ category: EXP_CATS[0], date: todayJ() })}>+ ثبت هزینه</button>}
      </div>

      {tab === 'expenses' ? (
        <div className="card">
          {db.expenses.length === 0 ? <div className="empty">هنوز هزینه‌ای ثبت نشده است.</div> : (
            <table className="tbl">
              <thead><tr><th>تاریخ</th><th>عنوان</th><th>دسته</th><th>مبلغ</th><th></th></tr></thead>
              <tbody>
                {db.expenses.slice().reverse().map(e => (
                  <tr key={e.id}>
                    <td className="muted">{e.date}</td>
                    <td style={{ fontWeight: 700 }}>{e.title}</td>
                    <td className="muted">{e.category}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 800 }}>{money(e.amount)}</td>
                    <td className="row" style={{ width: 130 }}>
                      <button className="btn small gray" onClick={() => setExp({ ...e })}>ویرایش</button>
                      <button className="btn small" style={{ background: 'var(--red)' }}
                        onClick={() => { if (confirm('حذف شود؟')) setDb(d => ({ ...d, expenses: d.expenses.filter(x => x.id !== e.id) })); }}>حذف</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="row spread" style={{ marginBottom: 10 }}>
            <input style={{ maxWidth: 190 }} placeholder="فیلتر تاریخ ۱۴۰۴/۰۷/۲۶" value={filterDay} onChange={e => setFilterDay(e.target.value)} />
            <span className="muted">{toFa(filteredInvoices.length)} فاکتور</span>
          </div>
          {filteredInvoices.length === 0 ? <div className="empty">فاکتوری یافت نشد.</div> : (
            <table className="tbl">
              <thead><tr><th>شماره</th><th>تاریخ</th><th>نوع</th><th>پرداخت</th><th>مبلغ</th><th></th></tr></thead>
              <tbody>
                {filteredInvoices.map(o => (
                  <tr key={o.id}>
                    <td>{toFa(o.no)}</td>
                    <td className="muted">{jDateStr(o.ts)}</td>
                    <td>{o.type === 'table' ? `میز ${db.tables.find(t => t.id === o.tableId)?.name?.replace('میز ', '') ?? '—'}` : o.type === 'takeout' ? 'بیرون‌بر' : 'ارسال'}</td>
                    <td>{o.payMethod === 'cash' ? 'نقدی' : o.payMethod === 'card' ? 'کارت' : 'آنلاین'}</td>
                    <td style={{ fontWeight: 800 }}>{money(o.total)}</td>
                    <td><button className="btn small gray" onClick={() => printInvoice(o)}>🖨️ چاپ</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {exp && (
        <div className="modal-bg" onClick={() => setExp(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{exp.id ? 'ویرایش هزینه' : 'ثبت هزینه جدید'}</h3>
            <div className="field"><label>عنوان</label>
              <input autoFocus value={exp.title || ''} onChange={e => setExp({ ...exp, title: e.target.value })} /></div>
            <div className="field"><label>دسته هزینه</label>
              <select value={exp.category} onChange={e => setExp({ ...exp, category: e.target.value })}>
                {EXP_CATS.map(c => <option key={c}>{c}</option>)}
              </select></div>
            <div className="field"><label>مبلغ ({db.settings.currency})</label>
              <input type="number" value={exp.amount || ''} onChange={e => setExp({ ...exp, amount: e.target.value })} /></div>
            <div className="field"><label>تاریخ (شمسی)</label>
              <input value={exp.date || ''} onChange={e => setExp({ ...exp, date: e.target.value })} /></div>
            <button className="btn" style={{ width: '100%' }} onClick={saveExp}>ذخیره</button>
          </div>
        </div>
      )}
    </div>
  );
}
