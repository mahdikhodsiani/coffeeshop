// ---- صفحه صندوق (POS): ثبت سفارش، فاکتور، پرداخت، چاپ ----
import { useMemo, useState } from 'react';
import { toFa, money, uid, jDateStr, todayJ } from '../utils/helpers';

export default function POS({ db, setDb, printInvoice }) {
  const [cart, setCart] = useState([]);           // {itemId,name,price,count,note}
  const [catId, setCatId] = useState('all');
  const [search, setSearch] = useState('');
  const [tableId, setTableId] = useState(null);
  const [orderType, setOrderType] = useState('table'); // table | takeout | delivery
  const [discount, setDiscount] = useState(0);
  const [payMethod, setPayMethod] = useState('cash');
  const [paidAmount, setPaidAmount] = useState('');
  const [customer, setCustomer] = useState('');
  const [openBill, setOpenBill] = useState(false);

  const items = useMemo(() =>
    db.items.filter(i =>
      (catId === 'all' || i.catId === catId) &&
      (!search || i.name.includes(search))
    ), [db.items, catId, search]);

  const add = (it) => {
    if (!it.active) return;
    setCart(c => {
      const ex = c.find(l => l.itemId === it.id);
      if (ex) return c.map(l => l.itemId === it.id ? { ...l, count: l.count + 1 } : l);
      return [...c, { itemId: it.id, name: it.name, price: it.price, count: 1 }];
    });
  };
  const changeQty = (id, d) =>
    setCart(c => c.map(l => l.itemId === id ? { ...l, count: Math.max(1, l.count + d) } : l));
  const removeLine = (id) => setCart(c => c.filter(l => l.itemId !== id));

  const subtotal = cart.reduce((s, l) => s + l.price * l.count, 0);
  const service = db.settings.serviceEnabled ? subtotal * (db.settings.servicePercent / 100) : 0;
  const taxBase = subtotal + service;
  const tax = taxBase * (db.settings.taxPercent / 100);
  const disc = Math.min(Number(discount) || 0, subtotal);
  const total = Math.max(0, taxBase + tax - disc);

  const billCount = cart.reduce((s, l) => s + l.count, 0);

  const settle = () => {
    if (!cart.length) return;
    const order = {
      id: uid(),
      no: db.orders.length + 1,
      ts: Date.now(),
      date: todayJ(),
      type: orderType,
      tableId,
      customer,
      lines: cart,
      subtotal, service, tax, discount: disc, total,
      payMethod,
      paid: payMethod === 'cash' ? Number(paidAmount) || total : total,
      status: 'paid'
    };
    order.change = Math.max(0, order.paid - order.total);
    setDb(d => ({ ...d, orders: [...d.orders, order] }));
    printInvoice(order);
    setCart([]); setDiscount(0); setPaidAmount(''); setTableId(null); setCustomer('');
    setOpenBill(false);
  };

  const typeName = { table: 'میز', takeout: 'فروش بیرون‌بر', delivery: 'ارسال' }[orderType];
  const payName = { cash: 'نقدی', card: 'کارت‌خوان', online: 'آنلاین' }[payMethod];

  return (
    <div className="pos">
      {/* ===== منوی دیجیتال ===== */}
      <div>
        <div className="card">
          <div className="row spread">
            <div className="title" style={{ marginBottom: 0 }}>🍽️ منو</div>
            <input style={{ maxWidth: 200 }} placeholder="جستجوی غذا…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="cat-tabs" style={{ marginTop: 10 }}>
            <button className={catId === 'all' ? 'active' : ''} onClick={() => setCatId('all')}>همه</button>
            {db.categories.map(c => (
              <button key={c.id} className={catId === c.id ? 'active' : ''} onClick={() => setCatId(c.id)}>{c.name}</button>
            ))}
          </div>
          <div className="menu-grid">
            {items.map(it => (
              <button key={it.id} className={`menu-item ${it.active ? '' : 'off'}`} onClick={() => add(it)}>
                <div className="nm">{it.name}</div>
                <div className="pr">{money(it.price)} {toFa(db.settings.currency)}</div>
              </button>
            ))}
            {!items.length && <div className="empty">موردی یافت نشد</div>}
          </div>
        </div>
      </div>

      {/* ===== سبد / فاکتور ===== */}
      <div>
        <div className="card">
          <div className="title">🧾 سفارش جاری — {toFa(billCount)} قلم</div>

          <div className="row" style={{ marginBottom: 8 }}>
            {[['table', '🪑 میز'], ['takeout', '🥡 بیرون‌بر'], ['delivery', '🛵 ارسال']].map(([v, l]) => (
              <button key={v} className={`btn small ${orderType === v ? '' : 'gray'}`} onClick={() => setOrderType(v)}>{l}</button>
            ))}
          </div>

          {orderType === 'table' && (
            <div className="table-pick">
              {db.tables.map(t => (
                <button key={t.id} className={tableId === t.id ? 'sel' : ''}
                  onClick={() => setTableId(tableId === t.id ? null : t.id)}>{t.name}</button>
              ))}
            </div>
          )}
          {orderType === 'delivery' && (
            <input style={{ marginTop: 8 }} placeholder="نام / آدرس مشتری"
              value={customer} onChange={e => setCustomer(e.target.value)} />
          )}

          <div className="cart-lines" style={{ marginTop: 10 }}>
            {cart.length === 0 && <div className="empty">از منو آیتم اضافه کنید</div>}
            {cart.map(l => (
              <div key={l.itemId} className="cart-line">
                <button className="qty-btn" onClick={() => changeQty(l.itemId, 1)}>+</button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 800 }}>{toFa(l.count)}</span>
                <button className="qty-btn" onClick={() => changeQty(l.itemId, -1)}>−</button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.85rem', fontWeight: 700 }}>{l.name}</div>
                  <div className="muted">{money(l.price)} × {toFa(l.count)}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '.85rem' }}>{money(l.price * l.count)}</div>
                <button className="qty-btn" style={{ background: '#fdecea', color: 'var(--red)' }}
                  onClick={() => removeLine(l.itemId)}>×</button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <div className="total-row"><span>جمع کل</span><span>{money(subtotal)}</span></div>
            {service > 0 && <div className="total-row"><span>servis {toFa(db.settings.servicePercent)}٪</span><span>{money(service)}</span></div>}
            <div className="total-row"><span>مالیات {toFa(db.settings.taxPercent)}٪</span><span>{money(tax)}</span></div>
            <div className="total-row">
              <span>تخفیف ({toFa(db.settings.currency)})</span>
              <input style={{ width: 110, textAlign: 'center', padding: '4px 8px' }} type="number"
                value={discount} onChange={e => setDiscount(e.target.value)} />
            </div>
            <div className="total-row final"><span>مبلغ قابل پرداخت</span><span>{money(total)} {toFa(db.settings.currency)}</span></div>
          </div>

          <div className="pay-methods">
            {[['cash', '💵 نقدی'], ['card', '💳 کارت'], ['online', '🌐 آنلاین']].map(([v, l]) => (
              <button key={v} className={payMethod === v ? 'sel' : ''} onClick={() => setPayMethod(v)}>{l}</button>
            ))}
          </div>

          {payMethod === 'cash' && (
            <div className="row spread">
              <input style={{ flex: 1 }} type="number" placeholder="مبلغ دریافتی"
                value={paidAmount} onChange={e => setPaidAmount(e.target.value)} />
              <div className="muted">باقی: {money(Math.max(0, (Number(paidAmount) || total) - total))}</div>
            </div>
          )}

          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn green" style={{ flex: 2 }} onClick={settle} disabled={!cart.length}>
              ✅ ثبت و صدور فاکتور
            </button>
            <button className="btn ghost" style={{ flex: 1 }} onClick={() => setOpenBill(true)} disabled={!cart.length}>
              پیش‌نمایش
            </button>
            <button className="btn gray" onClick={() => setCart([])} disabled={!cart.length}>پاک‌کردن</button>
          </div>
        </div>
      </div>

      {/* ===== پیش‌نمایش فاکتور ===== */}
      {openBill && (
        <div className="modal-bg" onClick={() => setOpenBill(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>پیش‌نمایش فاکتور</h3>
            <div className="receipt" style={{ fontFamily: 'inherit' }}>
              <h2>{db.settings.restaurantName}</h2>
              <div className="muted" style={{ textAlign: 'center' }}>{jDateStr(Date.now())} — {typeName}{tableId ? ` (${db.tables.find(t => t.id === tableId)?.name})` : ''}</div>
              <div className="line" />
              <table>
                <tbody>
                  {cart.map(l => (
                    <tr key={l.itemId}><td>{l.name}</td><td style={{ textAlign: 'center' }}>{toFa(l.count)}</td><td style={{ textAlign: 'left' }}>{money(l.price * l.count)}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="line" />
              <div className="total-row"><span>جمع</span><span>{money(subtotal)}</span></div>
              <div className="total-row"><span>مالیات</span><span>{money(tax)}</span></div>
              {disc > 0 && <div className="total-row"><span>تخفیف</span><span>{money(-disc)}</span></div>}
              <div className="total-row final"><span>قابل پرداخت ({payName})</span><span>{money(total)}</span></div>
            </div>
            <div className="row" style={{ marginTop: 14 }}>
              <button className="btn green" style={{ flex: 1 }} onClick={settle}>پرداخت و چاپ</button>
              <button className="btn gray" style={{ flex: 1 }} onClick={() => setOpenBill(false)}>بستن</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
