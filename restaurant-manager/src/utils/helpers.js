// ---- ابزارهای کمکی: اعداد فارسی، تاریخ شمسی، ذخیره‌سازی محلی ----

export const toFa = (n) =>
  String(n ?? '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);

export const money = (n) =>
  toFa(Math.round(n || 0).toLocaleString('en-US'));

// تبدیل میلادی به شمسی — الگوریتم جلال‌الالدینی (دقیق تا سال ۱۵۰۴ شمسی)
export function toJalali(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor(gy2 / 100) +
    Math.floor(gy2 / 400) + gd + gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = days < 186 ? days % 31 : (days - 186) % 30;
  return [jy, jm, jd + 1];
}

// تبدیل شمسی به میلادی — با استفاده از کتابخانه معتبر jalaali-js (الگوریتم جلال‌الالدینی، دقیق تا ۱۵۰۴ شمسی)
import * as jalaali from 'jalaali-js';

export function toGregorian(jy, jm, jd) {
  const g = jalaali.toGregorian(jy, jm, jd);
  return [g.gy, g.gm, g.gd];
}

export const todayJ = () => {
  const d = new Date();
  return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()).join('/');
};

export const jDateStr = (isoOrTs) => {
  const d = new Date(isoOrTs);
  const [y, m, day] = toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${toFa(y)}/${toFa(String(m).padStart(2, '0'))}/${toFa(String(day).padStart(2, '0'))} - ${toFa(hh)}:${toFa(mm)}`;
};

export const jDayOf = (ts) => {
  const d = new Date(ts);
  return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()).join('-');
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ---- ذخیره‌سازی (localStorage برای وب/اندروید/الکترون) ----
const KEY = 'rms_db_v1';
const defaults = {
  settings: {
    restaurantName: 'رستوران و کافه نمونه',
    taxPercent: 9,           // مالیات بر ارزش افزوده %
    serviceEnabled: true,
    servicePercent: 0,
    currency: 'تومان',
    cashierCode: '1234'
  },
  categories: [
    { id: 'c1', name: 'غذاهای اصلی' },
    { id: 'c2', name: 'کباب‌ها' },
    { id: 'c3', name: 'پیش‌غذا' },
    { id: 'c4', name: 'نوشیدنی' },
    { id: 'c5', name: 'دسر' }
  ],
  items: [
    { id: 'i1', catId: 'c1', name: 'چلوکباب کوبیده', price: 185000, active: true },
    { id: 'i2', catId: 'c1', name: 'جوجه‌کباب زعفرانی', price: 165000, active: true },
    { id: 'i3', catId: 'c1', name: 'قورمه‌سبزی با برنج', price: 145000, active: true },
    { id: 'i4', catId: 'c1', name: 'زرشک‌پلو با مرغ', price: 155000, active: true },
    { id: 'i5', catId: 'c2', name: 'کباب برگ', price: 320000, active: true },
    { id: 'i6', catId: 'c2', name: 'شیشلیک', price: 290000, active: true },
    { id: 'i7', catId: 'c3', name: 'سالاد سزار', price: 95000, active: true },
    { id: 'i8', catId: 'c3', name: 'سوپ جو', price: 55000, active: true },
    { id: 'i9', catId: 'c3', name: 'کشک بادمجان', price: 88000, active: true },
    { id: 'i10', catId: 'c4', name: 'نوشابه', price: 35000, active: true },
    { id: 'i11', catId: 'c4', name: 'دوغ محلی', price: 42000, active: true },
    { id: 'i12', catId: 'c4', name: 'چای', price: 25000, active: true },
    { id: 'i13', catId: 'c4', name: 'قهوه اسپرسو', price: 65000, active: true },
    { id: 'i14', catId: 'c4', name: 'آبمیوه پرتقال', price: 75000, active: true },
    { id: 'i15', catId: 'c5', name: 'بستنی سنتی', price: 68000, active: true },
    { id: 'i16', catId: 'c5', name: 'هلکه', price: 45000, active: true }
  ],
  tables: Array.from({ length: 12 }, (_, i) => ({ id: `t${i + 1}`, name: `میز ${i + 1}`, seats: i < 8 ? 4 : 6 })),
  orders: [],      // فاکتورها
  expenses: [],    // هزینه‌ها
  shifts: []       // شیفت‌های صندوق
};

export function loadDB() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(defaults);
    const db = JSON.parse(raw);
    return { ...structuredClone(defaults), ...db };
  } catch {
    return structuredClone(defaults);
  }
}

export function saveDB(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

// خروجی پشتیبان‌گیری JSON
export function exportBackup(db) {
  const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rms-backup-${todayJ().replace(/\//g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importBackup(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try { res(JSON.parse(r.result)); } catch (e) { rej(e); }
    };
    r.onerror = rej;
    r.readAsText(file);
  });
}
