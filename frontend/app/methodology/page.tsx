import { PageHeader } from "@/components/layout/page-header";

export default function MethodologyPage() {
  return (
    <>
      <PageHeader
        title="المنهجية"
        description="شرح موجز لطبيعة السلاسل، بنية الموديل، وكيفية إنتاج Forecast الأسبوع القادم وحدود استخدامه."
      />
      <div className="surface-card space-y-6 p-6 text-sm leading-8 text-navy">
        <section>
          <h2 className="text-lg font-extrabold">السلاسل المدربة</h2>
          <p className="mt-2 text-muted">
            الرياض، الشرقية، جدة، الأحساء، وكل المدن.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold">بنية الموديل</h2>
          <p className="mt-2 text-muted">
            يعتمد النهج على Conv1D لاستخراج الأنماط المحلية، ثم Stacked LSTM
            لتعلم العلاقات الزمنية، مع خصائص تقويمية مثل يوم الأسبوع والشهر،
            ثم Forecast تكراري لمدة سبعة أيام.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold">إنتاج التوقع الأسبوعي</h2>
          <p className="mt-2 text-muted">
            يتم توليد Forecast للأيام السبعة المقبلة لكل مدينة رئيسية، إضافة
            إلى موديل كل المدن، ثم عرض الملخص اليومي والأسبوعي في الواجهة.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-extrabold">القيود</h2>
          <p className="mt-2 text-muted">
            Forecast هو تقدير مبني على النمط التاريخي. قد تتأثر الدقة
            بالعروض، الإجازات، الأعطال، أو الأحداث التشغيلية والخارجية. كما
            أن موديل كل المدن مستقل عن موديلات المدن المنفصلة.
          </p>
        </section>
      </div>
    </>
  );
}
