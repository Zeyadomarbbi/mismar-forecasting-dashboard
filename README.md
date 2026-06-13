# mismar-forecasting-dashboard

التطبيق الأساسي في هذا المستودع أصبح واجهة **Next.js** داخل المجلد [frontend](./frontend).

## التطبيق الأساسي

- الواجهة الرئيسية: `frontend/`
- مبنية بـ Next.js + React + TypeScript + Tailwind
- تعتمد على ملفات CSV الحقيقية الموجودة في المستودع
- قابلة للنشر على Vercel بدون Python أو Streamlit

## نسخة Streamlit

ملفات Streamlit القديمة ما زالت موجودة في الجذر حاليًا كنسخة legacy ولم يتم حذفها حتى يتم التحقق الكامل من الواجهة الجديدة.

## تشغيل الواجهة الجديدة

```bash
cd frontend
npm install
npm run prepare:data
npm run dev
```

## التحقق والبناء

```bash
cd frontend
npm run lint
npm run typecheck
npm test
npm run build
```

## النشر على Vercel

1. ارفع المستودع إلى GitHub.
2. افتح Vercel واختر Import Repository.
3. اجعل `Root Directory` = `frontend`.
4. اختر `Next.js`.
5. استخدم `npm run build`.
6. انشر التطبيق.
