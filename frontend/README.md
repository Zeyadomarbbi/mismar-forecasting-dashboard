# Mismar Forecasting Dashboard Frontend

واجهة Next.js عربية وRTL بنسخة تجريبية MVP لعرض Forecast طلبات الغسيل بشكل مبسط.

## المتطلبات

- Node.js 18+
- npm

## التشغيل المحلي

```bash
npm install
npm run prepare:data
npm run dev
```

## أوامر التحقق

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Vercel Deployment

1. ادفع المستودع إلى GitHub.
2. افتح Vercel ثم Import Repository.
3. اختر `Root Directory` = `frontend`.
4. اختر Framework Preset = `Next.js`.
5. Build Command = `npm run build`.
6. لا توجد أسرار مطلوبة للبيانات العامة.
7. اضغط Deploy.

## تحضير البيانات

يعتمد المشروع على سكربت:

```bash
npm run prepare:data
```

السكربت يبحث عن ملفات CSV السبعة في جذر المستودع ثم ينسخها إلى:

`public/data/`

مع إخراج ملخص واضح عن عدد الصفوف والقيم المفقودة والتكرارات والتواريخ غير الصالحة.
