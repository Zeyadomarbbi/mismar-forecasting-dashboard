# لوحة توقع طلبات الغسيل

تطبيق `Streamlit` احترافي بواجهة عربية و`RTL` لعرض Forecast الطلب خلال الأيام السبعة القادمة حسب المدن الرئيسية وكذلك لموديل `كل المدن`.

## الملفات المعتمدة

يعتمد التطبيق فقط على ملفات CSV الحقيقية التالية:

- `01_all_series_next_7_days_forecast.csv`
- `02_presentation_forecast.csv`
- `03_weekly_forecast_summary.csv`
- `04_all_validation_results.csv`
- `05_all_test_results.csv`
- `06_model_metrics.csv`
- `07_training_summary.csv`

ويبحث عنها بالترتيب داخل:

1. `./data/`
2. `./`
3. `/content/lstm_forecasting_results/`

## التشغيل

```bash
pip install -r requirements.txt
streamlit run app.py
```

## هيكل المشروع

- `app.py`: التطبيق الرئيسي والصفحات والفلاتر.
- `data_loader.py`: اكتشاف الملفات، تنظيف الأعمدة، التحقق من الجودة، وتحضير البيانات.
- `charts.py`: كل الرسوم التفاعلية باستخدام `Plotly`.
- `components.py`: عناصر العرض المشتركة مثل الهيدر والكروت.
- `utils.py`: الألوان، التنسيقات، التصدير، وأسماء الأيام العربية.
- `styles.css`: النظام البصري والـRTL.

## الصفحات

- `Executive Forecast`
- `City Forecasts`
- `All Cities Forecast`
- `Model Performance`
- `Actual vs Predicted`
- `Data Details`
- `Methodology`

## ملاحظات

- لا يتم استخدام أي Mock Data.
- في حال غياب ملف أو عمود مهم، يظهر تحذير واضح للمستخدم.
- التصدير إلى CSV يتم بترميز `utf-8-sig` حتى تظهر العربية بشكل صحيح في Excel.
