# 🍴 مدیر رستوران (Restaurant Manager)

نرم‌افزار مدیریت رستوران و کافه برای **ویندوز** و **اندروید** با قابلیت‌های:

| ماژول | امکانات |
|---|---|
| 🧾 صندوق (POS) | ثبت سفارش میز / بیرون‌بر / ارسال، تخفیف، مالیات و سرویس، پرداخت نقدی/کارت/آنلاین، محاسبه باقی، صدور و چاپ فاکتور حرارتی ۷۶mm |
| 🍽️ منوی دیجیتال | دسته‌بندی‌ها، جستجو، افزودن/ویرایش/غیرفعال‌سازی آیتم‌ها و قیمت‌ها، مدیریت میزها |
| 💰 حسابداری | ثبت هزینه‌ها (مواد اولیه، اجاره، حقوق…)، لیست و فیلتر فاکتورها، فروش کل / مالیات / هزینه / سود خالص |
| 🔐 کشو (Cash Drawer) | باز و بسته کردن شیفت صندوق، شمارش نقدی، محاسبه مغایرت |
| 📊 گزارش‌گیری | نمودار فروش روزانه (۷/۱۴/۳۰ روزه)، پرفروش‌ترین آیتم‌ها، سهم دسته‌بندی‌ها، تفکیک روش پرداخت، میانگین سبد |
| ⚙️ تنظیمات | نام فروشگاه، واحد پول، درصد مالیات/سرویس، رمز صندوق‌دار، پشتیبان‌گیری و بازیابی JSON |

ویژگی‌های مشترک: رابط فارسی راست‌چین (RTL)، اعداد و تاریخ **شمسی (جلالالی)**، کارکرد **کاملاً آفلاین** با ذخیره‌سازی محلی.

## 🚀 اجرای نسخه وب / توسعه

```bash
cd restaurant-manager
npm install
npm run dev          # http://localhost:5173
```

## 🖥️ ساخت نسخه ویندوز (Electron)

```bash
npm i -D electron electron-builder concurrently wait-on cross-env
npm run electron:build     # خروجی نصب‌کننده NSIS در پوشه release/
```

`electron/main.cjs` پنجره برنامه را ساخته و `dist/index.html` را بارگذاری می‌کند. تنظیمات بسته‌بندی در `electron-builder.json` است (منوی Start، میانبر دسکتاپ، انتخاب محل نصب).

## 📱 ساخت نسخه اندروید (Capacitor)

```bash
npm i @capacitor/core @capacitor/cli @capacitor/android
npx cap init "مدیر رستوران" com.example.restaurantmanager --web-dir dist
npm run build
npx cap add android
npm run android:sync
npm run android:open       # باز کردن در Android Studio → Build APK/AAB
```

## 🗂 ساختار پروژه

```
restaurant-manager/
├── index.html                 # صفحه اصلی RTL
├── vite.config.js
├── capacitor.config.json      # کانفیگ اندروید
├── electron-builder.json      # کانفیگ ویندوز
├── electron/main.cjs          # پروسه اصلی Electron
└── src/
    ├── main.jsx / App.jsx     # ناوبری تب‌ها + ناحیه چاپ فاکتور
    ├── styles.css             # استایل موبایل-دوست و چاپ
    ├── utils/helpers.js       # تاریخ شمسی، اعداد فارسی، دیتابیس محلی، بکاپ
    └── pages/
        ├── Dashboard.jsx      # نمای کلی امروز
        ├── POS.jsx            # صندوق و منوی دیجیتال
        ├── MenuManager.jsx    # مدیریت منو/دسته/میز
        ├── Accounting.jsx     # هزینه‌ها و فاکتورها
        ├── CashDrawer.jsx     # شیفت صندوق و مغایرت
        ├── Reports.jsx        # گزارش‌ها و نمودارها
        └── Settings.jsx       # تنظیمات و پشتیبان‌گیری
```

## 💾 داده‌ها

اطلاعات در `localStorage` با کل `rms_db_v1` ذخیره می‌شود. برای انتقال بین دستگاه‌ها از **تنظیمات ← دریافت فایل پشتیبان** استفاده کنید و در دستگاه مقصد **بازیابی از فایل** را بزنید.

> نمونه داده: منوی پیش‌فرض فارسی (کباب، خورشت، نوشیدنی…) از قبل پر شده تا بلافاصله قابل تست باشد.
