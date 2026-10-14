import { useState } from 'react';
import { useLang } from './i18n';
import { Link } from 'react-router-dom';

type DosageForm = 'suspension' | 'tablets' | 'injections' | 'topicals';

export default function SafeDisposal() {
  const { lang } = useLang();
  const [selectedForm, setSelectedForm] = useState<DosageForm>('suspension');
  const [bottlesCount, setBottlesCount] = useState<number>(1);
  const [blistersCount, setBlistersCount] = useState<number>(2);

  const isAr = lang === 'ar';

  // Environmental impact estimate: 1 suspension bottle flushed contaminates ~2,500 L of water with sub-inhibitory antibiotic levels
  const estimatedWaterSaved = bottlesCount * 2500 + blistersCount * 500;

  return (
    <main className="wrap stack">
      <Link to="/">← {isAr ? 'الرئيسية' : 'Home'}</Link>

      <header className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2.5rem' }}>♻️</span>
          <div>
            <h1>
              {isAr
                ? 'دليل التخلص الآمن من بقايا الأدوية والرعاية الصحية الخضراء'
                : 'Safe Antibiotic Disposal & Green Healthcare Guide'}
            </h1>
            <p className="muted">
              {isAr
                ? 'مبادرة التمريض السريري لحماية مياه النيل والبيئة المصرية من انتشار السلالات البكتيرية المقاومة (Eco-Stewardship).'
                : 'Clinical nursing initiative to protect ecosystems and water supplies from antimicrobial resistance.'}
            </p>
          </div>
        </div>
      </header>

      {/* Primary Alert Banner */}
      <section className="notice urgent" style={{ borderLeft: '5px solid #ef4444', padding: '16px' }}>
        <h3 style={{ color: '#b91c1c', margin: '0 0 8px' }}>
          ⚠️ {isAr ? 'لماذا يُمنع سكب المضاد الحيوي في الحوض أو المرحاض؟' : 'Why Never Flush Antibiotics Down the Drain?'}
        </h3>
        <p style={{ margin: 0, lineHeight: 1.6 }}>
          {isAr
            ? 'سكب الأدوية في شبكات الصرف الصحي يُعرّض البكتيريا في المياه والتربة لجرعات خفيفة مزمنة دون أن يقتلها؛ مما يحفزها على تحوير جيناتها وتكوين مناعة شرسة تتحول معها إلى «سوبر بكتيريا» مقاومة لا تستجيب لأعتى الأدوية في المستشفيات!'
            : 'Flushing antibiotics exposes environmental microbes to chronic sub-lethal concentrations. Bacteria develop mutated resistance genes, evolving into superbugs that contaminate rivers, irrigation, and tap water.'}
        </p>
      </section>

      {/* Interactive Disposal Navigator */}
      <section className="card highlight-card">
        <h2>🛠️ {isAr ? 'فاحص الطريقة الصحيحة للتخلص من دوائك' : 'Interactive Medicine Disposal Guide'}</h2>
        <p className="small muted">
          {isAr
            ? 'اختر شكل ونوع الدواء المتبقي لديك لمعرفة الخطوات التمريضية الدقيقة للتخلص منه دون تلويث البيئة:'
            : 'Select the dosage form of your leftover medication to view precise step-by-step nursing guidelines:'}
        </p>

        {/* Tab Buttons */}
        <div className="row wrapRow" style={{ gap: '8px', margin: '14px 0 20px' }}>
          <button
            className={`btn ${selectedForm === 'suspension' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('suspension')}
          >
            🍼 {isAr ? 'شراب الأطفال المعلق' : 'Pediatric Suspensions'}
          </button>
          <button
            className={`btn ${selectedForm === 'tablets' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('tablets')}
          >
            💊 {isAr ? 'أقراص وكبسولات صلبة' : 'Tablets & Capsules'}
          </button>
          <button
            className={`btn ${selectedForm === 'injections' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('injections')}
          >
            💉 {isAr ? 'حقن وأمبولات وسرنجات' : 'Injections & Sharps'}
          </button>
          <button
            className={`btn ${selectedForm === 'topicals' ? '' : 'ghost'}`}
            onClick={() => setSelectedForm('topicals')}
          >
            🧴 {isAr ? 'مراهم وقطرات عيون' : 'Ointments & Eye Drops'}
          </button>
        </div>

        {/* Dynamic Detail Card */}
        {selectedForm === 'suspension' && (
          <div className="card" style={{ background: 'var(--bg-subtle, #f8fafc)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ color: '#0369a1' }}>
              🍼 {isAr ? 'البروتوكول السريري لشراب الأطفال (أوجمنتين، كلافيموكس، فلاجيل شراب):' : 'Protocol for Pediatric Suspensions:'}
            </h3>
            <ul style={{ paddingRight: isAr ? '20px' : '0', paddingLeft: isAr ? '0' : '20px', lineHeight: 1.8 }}>
              <li>
                <b>{isAr ? 'مدة الصلاحية الصارمة:' : 'Strict Expiry Window:'} </b>
                {isAr
                  ? 'بمجرد إضافة الماء لبودرة المضاد الحيوي، تنتهي صلاحيته تماماً خلال 7 إلى 14 يوماً فقط (حتى لو كانت الزجاجة محفوظة في الثلاجة). تناول الدواء بعد هذا التاريخ يسبب تسمماً وتكاثراً بكتيرياً!'
                  : 'Once reconstituted with water, oral antibiotic suspensions expire strictly within 7-14 days, even when refrigerated.'}
              </li>
              <li>
                <b>{isAr ? 'طريقة الامتصاص الآمنة:' : 'Absorption Technique:'} </b>
                {isAr
                  ? 'لا تسكب الشراب في الحوض! افتح الزجاجة وأفرغ الشراب في كيس بلاستيكي يحتوي على مادة ماصة منفرة (مثل تفل القهوة المستعمل، نشارة خشب، تراب نظيف، أو فضلات قطط).'
                  : 'Never pour into the sink. Mix remaining syrup with unpalatable absorbent material (used coffee grounds, cat litter, sawdust).'}
              </li>
              <li>
                <b>{isAr ? 'إغلاق وإلقاء الكيس:' : 'Sealing & Bagging:'} </b>
                {isAr
                  ? 'اربط الكيس البلاستيكي بإحكام وضعه في سلة المهملات المنزلية العادية حتى لا تتمكن الحيوانات الضالة أو الأطفال من تذوقه أو ابتلاعه.'
                  : 'Seal the bag tightly and place into regular household trash away from pets and children.'}
              </li>
              <li>
                <b>{isAr ? 'طمس البيانات الشخصية:' : 'Privacy Protection:'} </b>
                {isAr
                  ? 'اشطب اسم الطفل وتفاصيل الروشتة المكتوبة على الزجاجة بالقلم الجاف لحماية خصوصية أسرتك قبل رمي العبوة الكرتونية.'
                  : 'Scratch out patient name and prescription labels before recycling packaging.'}
              </li>
            </ul>
          </div>
        )}

        {selectedForm === 'tablets' && (
          <div className="card" style={{ background: 'var(--bg-subtle, #f8fafc)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ color: '#0369a1' }}>
              💊 {isAr ? 'البروتوكول السريري للأقراص والكبسولات (سيبروفار، كلاسيد، زيثروماكس):' : 'Protocol for Solid Tablets & Capsules:'}
            </h3>
            <ul style={{ paddingRight: isAr ? '20px' : '0', paddingLeft: isAr ? '0' : '20px', lineHeight: 1.8 }}>
              <li>
                <b>{isAr ? 'استخراج الحبوب دون طحنها:' : 'Do Not Crush:'} </b>
                {isAr
                  ? 'أخرج الحبوب أو الكبسولات من الشريط الفضي وضعها في كيس قابل للقفل (Ziploc). إياك وطحن الحبوب؛ لأن تطاير الغبار الدوائي في هواء المنزل قد يسبب حساسية واختناقاً للأطفال.'
                  : 'Remove tablets from blisters into a sealable plastic bag. Do NOT crush them to avoid airborne exposure.'}
              </li>
              <li>
                <b>{isAr ? 'الخلط بمادة منفرة (Coffee Grounds Method):' : 'Coffee Grounds Mixture:'} </b>
                {isAr
                  ? 'أضف تفل شاي أو قهوة أو رمل إلى الكيس، واخلط الحبوب برفق حتى تفقد شكلها الجذاب ولا يغري أي طفل أو حيوان بابتلاعها.'
                  : 'Mix with coffee grounds or soil to make it undesirable for children or scavengers.'}
              </li>
              <li>
                <b>{isAr ? 'إغلاق الكيس بالقمامة:' : 'Sealing:'} </b>
                {isAr
                  ? 'أغلق الكيس بإحكام ثم ألقه في كيس القمامة العادي.'
                  : 'Seal the bag and place it in the household trash bin.'}
              </li>
            </ul>
          </div>
        )}

        {selectedForm === 'injections' && (
          <div className="card" style={{ background: 'var(--bg-subtle, #f8fafc)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ color: '#0369a1' }}>
              💉 {isAr ? 'البروتوكول السريري للأمبولات وسرنجات الحقن (سيفوتاكس، سيفترياكسون، جاراميسين):' : 'Protocol for Sharps, Vials & Injections:'}
            </h3>
            <ul style={{ paddingRight: isAr ? '20px' : '0', paddingLeft: isAr ? '0' : '20px', lineHeight: 1.8 }}>
              <li>
                <b>{isAr ? 'خطر وخز الإبر القاتل:' : 'Sharps Needle-Stick Hazard:'} </b>
                {isAr
                  ? 'رمي الإبر مكشوفة في أكياس القمامة الخفيفة يتسبب في وخز عمال النظافة ونقل فيروسات خطيرة مثل التهاب الكبد B وC وفيروس نقص المناعة.'
                  : 'Loose needles puncture thin garbage bags and cause life-threatening accidental needle-stick injuries to sanitation workers.'}
              </li>
              <li>
                <b>{isAr ? 'حاوية الأدوات الحادة المنزلية:' : 'Improvised Sharps Container:'} </b>
                {isAr
                  ? 'ضع السنون والسرنجات المستعملة داخل وعاء بلاستيكي سميك وصلب ومقاوم للثقب (مثل زجاجة مسحوق غسيل سميكة أو زجاجة مياه مقوى) وليس في كيس شيبسي أو بلاستيك خفيف.'
                  : 'Place needles into a heavy-duty, puncture-resistant plastic container (e.g. laundry detergent bottle).'}
              </li>
              <li>
                <b>{isAr ? 'إحكام الغطاء بشريط لاصق:' : 'Tape Closure:'} </b>
                {isAr
                  ? 'عند امتلاء ثلاثة أرباع الزجاجة، أحكم إغلاق الغطاء وثبّته بشريط لاصق قوي (Duct Tape) واكتب عليه بخط واضح «مخلفات حادة - خطر» قبل رميها.'
                  : 'When 3/4 full, secure cap with heavy tape, label clearly “BIOHAZARD / SHARPS - DO NOT RECYCLE”, and dispose.'}
              </li>
            </ul>
          </div>
        )}

        {selectedForm === 'topicals' && (
          <div className="card" style={{ background: 'var(--bg-subtle, #f8fafc)', border: '1px solid #cbd5e1' }}>
            <h3 style={{ color: '#0369a1' }}>
              🧴 {isAr ? 'البروتوكول السريري لقطرات العيون والأذن والمراهم الحيوية:' : 'Protocol for Eye Drops & Topical Ointments:'}
            </h3>
            <ul style={{ paddingRight: isAr ? '20px' : '0', paddingLeft: isAr ? '0' : '20px', lineHeight: 1.8 }}>
              <li>
                <b>{isAr ? 'قاعدة الـ 28 يوماً للقطرات:' : 'The 28-Day Rule:'} </b>
                {isAr
                  ? 'قطرات العيون والأذن المحتوية على مضادات حيوية تصبح ملوثة بكتيرياً وتفقد تعقيمها بعد 28 يوماً من فتحها، حتى لو كان المحلول يبدو رائقاً وشفافاً.'
                  : 'Eye and ear antibiotic drops lose sterility and must be discarded 28 days post-opening to prevent severe corneal infections.'}
              </li>
              <li>
                <b>{isAr ? 'التخلص الصحي:' : 'Safe Disposal:'} </b>
                {isAr
                  ? 'أفرغ المتبقي على منديل ورقي سميك وضعه في كيس بلاستيكي، ولا تسكب المحاليل في أحواض غسيل الوجه.'
                  : 'Express remaining liquid onto paper towels, place into a sealed bag, and throw in trash.'}
              </li>
            </ul>
          </div>
        )}
      </section>

      {/* 4 Cardinal Sins to Avoid */}
      <section className="card">
        <h2>🚫 {isAr ? 'المحظورات الأربعة الشائعة في المنازل المصرية' : 'The 4 Dangerous Practices to Avoid'}</h2>
        <div className="grid2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginTop: '12px' }}>
          <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
            <h4>❌ {isAr ? '«سيب الباقي في التلاجة للمرة الجاية»' : 'Saving Leftovers for Next Sickness'}</h4>
            <p className="small muted">
              {isAr
                ? 'إعطاء بواقي الشراب القديم لطفلك عند تكرار الكحة أو الحرارة بعد شهر يجعله يتناول جرعة غير فعالة أو دواء فاسداً، ويؤخر تشخيص المرض الحقيقي.'
                : 'Leftover doses are inadequate to cure recurrent infections and only select for resistant pathogen strains.'}
            </p>
          </div>
          <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
            <h4>❌ {isAr ? '«إدي باقي المضاد لأخوه أو جارك»' : 'Sharing Prescriptions with Family/Neighbors'}</h4>
            <p className="small muted">
              {isAr
                ? 'كل مريض يختلف وزنه ووظائف كلاه وحساسيته الدوائية؛ مشاركة المضاد الحيوي قد تسبب صدمة حساسية أو فشلاً كلوياً لقريبك!'
                : 'Dosing depends on individual weight and organ function. Sharing may trigger fatal anaphylaxis or acute toxicity.'}
            </p>
          </div>
          <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
            <h4>❌ {isAr ? 'سكب الدواء في مجرى الصرف والمرحاض' : 'Flushing Liquid Down the Toilet'}</h4>
            <p className="small muted">
              {isAr
                ? 'محطات تنقية مياه الصرف الصحي لا تستطيع إزالة جزيئات المضادات الحيوية، فتعود للمصارف والترع ملوثة للثروة السمكية والزراعية.'
                : 'Municipal water treatment plants cannot eliminate antibiotic molecules, contaminating rivers and agriculture.'}
            </p>
          </div>
          <div className="card" style={{ borderTop: '4px solid #ef4444' }}>
            <h4>❌ {isAr ? 'رمي الحقن مكشوفة السن' : 'Discarding Uncapped Sharps'}</h4>
            <p className="small muted">
              {isAr
                ? 'وخز عمال النظافة بالإبر المكشوفة يمثل كارثة مهنية وإنسانية؛ دائماً استخدم علبة بلاستيكية صلبة مغلقة.'
                : 'Needle sticks pose severe viral and bacterial infection risks to sanitation teams. Always use a rigid container.'}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Eco Impact Calculator */}
      <section className="card highlight-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '2rem' }}>🌿</span>
          <div>
            <h3 style={{ color: '#166534', margin: 0 }}>
              {isAr ? 'حاسبة أثرك البيئي كصديق للصحة والطبيعة' : 'Your Eco-Health Impact Calculator'}
            </h3>
            <p className="small muted" style={{ margin: '4px 0 0' }}>
              {isAr
                ? 'شاهد كيف يحمي التزامك البسيط البيئة المائية في محافظة الدقهلية ومصر:'
                : 'Calculate the volume of freshwater ecosystems you protect from antimicrobial contamination:'}
            </p>
          </div>
        </div>

        <div className="row wrapRow" style={{ gap: '20px', margin: '16px 0', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
              {isAr ? 'عدد زجاجات الشراب التي تخلصت منها بأمان:' : 'Suspension bottles safely disposed:'}
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={bottlesCount}
              onChange={(e) => setBottlesCount(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: '90px', padding: '6px 10px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '4px' }}>
              {isAr ? 'عدد شرائط الأقراص التي أعدمتها بطريقة الكيس المنفر:' : 'Tablet blister strips safely disposed:'}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={blistersCount}
              onChange={(e) => setBlistersCount(Math.max(0, parseInt(e.target.value) || 0))}
              style={{ width: '90px', padding: '6px 10px' }}
            />
          </div>
        </div>

        <div style={{ padding: '14px', background: '#fff', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <p style={{ margin: 0, fontSize: '1.05rem', color: '#15803d', fontWeight: 600 }}>
            💧 {isAr
              ? `بفضل وعيك اليوم، حميت ما يُقدّر بـ ${estimatedWaterSaved.toLocaleString()} لتر من المياه والبيئة من التلوث الدوائي وبكتيريا السوبر!`
              : `Through your conscious disposal, you saved an estimated ${estimatedWaterSaved.toLocaleString()} Liters of freshwater ecosystems from superbug proliferation!`}
          </p>
        </div>
      </section>

      {/* Community Take-back Pharmacy Guidance */}
      <section className="card">
        <h3>🏥 {isAr ? 'مبادرة صيدليات الاسترداد الآمن (Take-Back Programs)' : 'Pharmacy Medicine Take-Back Programs'}</h3>
        <p style={{ lineHeight: 1.6 }}>
          {isAr
            ? 'تتعاون نقابة الصيادلة وهيئة الدواء المصرية مع مستشفيات وزارة الصحة والجامعات لإطلاق صناديق خاصة لاستلام الأدوية منتهية الصلاحية والتالفة من المنازل وإعدامها بالمحارق الطبية الرسمية بدرجات حرارة عالية تكسر المادة الفعالة دون تلويث الهواء أو الماء.'
            : 'National health authorities and teaching hospitals encourage returning expired pharmaceuticals to designated collection receptacles for high-temperature incineration, neutralizing active substances safely.'}
        </p>
        <p className="small muted">
          {isAr
            ? '💡 اسأل صيدليتك المحلية أو المستشفى الجامعي بالمنصورة عن توفر صندوق استرجاع الأدوية المنتهية قبل التخلص المنزلي منها.'
            : '💡 Ask your local pharmacy or university hospital about active disposal drop-boxes before disposing at home.'}
        </p>
      </section>
    </main>
  );
}
