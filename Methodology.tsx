import { useLang } from './i18n';
import Disclaimer from './Disclaimer';

export default function Methodology() {
  const { lang } = useLang();
  const ar = lang === 'ar';
  return (
    <main className="wrap narrow stack prose">
      <h1>{ar ? 'المنهجية والخصوصية' : 'Methodology and privacy'}</h1>

      <h2>{ar ? 'الغرض والجمهور' : 'Purpose and audience'}</h2>
      <p>
        {ar
          ? 'هذا الموقع مشروع تخرج في التمريض لنشر التوعية بالاستخدام الآمن للمضادات الحيوية ومقاومة المضادات. يستهدف عامة الناس والطلاب، وهو تعليمي فقط ولا يشخّص ولا يصف علاجًا ولا يحسب جرعات شخصية، ولا يغني عن الطبيب أو الصيدلي.'
          : 'This website is a nursing graduation project that raises awareness of safe antibiotic use and antimicrobial resistance. It is for the general public and students. It is educational only: it does not diagnose, prescribe, or calculate personal doses, and it does not replace a doctor or pharmacist.'}
      </p>

      <h2>{ar ? 'كيف يُعدّ المحتوى' : 'How content is prepared'}</h2>
      <p>
        {ar
          ? 'تُقرأ صفحة المصدر الرسمي كاملة، ثم يُلخَّص ما فيها بصياغة المشروع دون إضافة معلومات من خارجها. لا تُدرج جرعات بالمليغرام أو تراكيز أو أسماء تجارية أو شركات أو باركود ما لم تكن موجودة في مصدر رسمي مذكور. الترجمة العربية تتم بمساعدة الذكاء الاصطناعي وتحتاج إلى مراجعة بشرية.'
          : 'The full official source page is read and then summarised in the project’s own words, without adding information from outside it. Milligram doses, strengths, brand names, manufacturers and barcodes are not included unless they appear in a cited official source. The Arabic is translated with AI assistance and needs human review.'}
      </p>

      <h2>{ar ? 'المصادر المستخدمة حاليًا' : 'Sources used so far'}</h2>
      <ul>
        <li><a href="https://medlineplus.gov/" target="_blank" rel="noopener noreferrer">MedlinePlus (US National Library of Medicine)</a> {ar ? '– صفحات معلومات الأدوية للمرضى' : '– patient drug information pages'}</li>
        <li><a href="https://www.cdc.gov/antibiotic-use/data-research/facts-stats/index.html" target="_blank" rel="noopener noreferrer">CDC – Antibiotic Use and Antimicrobial Resistance Facts</a></li>
      </ul>
      <p>
        {ar
          ? 'تظهر تحت كل سجل دوائي تفاصيل المصدر وتاريخ تحديثه وتاريخ الاطلاع عليه. الصفحات الأمريكية قد تختلف عن النشرات المعتمدة في بلدك.'
          : 'Each medicine record shows the source, its update date, and the date it was read. US pages may differ from the labelling approved in your country.'}
      </p>

      <h2>{ar ? 'حالة المراجعة' : 'Review status'}</h2>
      <p>
        {ar
          ? 'لم تُراجَع أي مادة في الموقع سريريًا حتى الآن. السجلات غير المراجعة تظهر بشارة واضحة «غير مراجع سريريًا». يمكن لمختص مؤهل مراجعة السجل واعتماده من لوحة الإدارة بعد إدخال اسمه وتاريخ المراجعة الحقيقيين. آخر تاريخ مراجعة: لا يوجد.'
          : 'No content on this site has been clinically reviewed yet. Unreviewed records carry a clear “Not clinically reviewed” badge. A qualified professional can review and approve a record in the admin dashboard after entering their real name and review date. Last review date: none.'}
      </p>

      <h2>{ar ? 'الذكاء الاصطناعي' : 'Artificial intelligence'}</h2>
      <p>
        {ar
          ? 'يحتوي الموقع على مساعد تعليمي يجيب من محتوى الموقع نفسه (المقالات وخرافة أم حقيقة وسجلات الأدوية) ويعرض مصدر كل إجابة، ولا يستخدم نموذج ذكاء اصطناعي ولا بحثًا مباشرًا في الإنترنت حاليًا. استُخدم الذكاء الاصطناعي في المساعدة على التلخيص والترجمة فقط، وقد يخطئ، ولذلك تُعرض المصادر الأصلية.'
          : 'The site has a learning assistant that answers from the site’s own content (articles, myth or fact, and medicine records) and shows the source of each answer. It does not use an AI model or live web search at the moment. AI was used only to help summarise and translate, and it can make mistakes, which is why the original sources are linked.'}
      </p>

      <h2>{ar ? 'الخصوصية' : 'Privacy'}</h2>
      <ul>
        <li>{ar ? 'لا حسابات للزوار، ولا نجمع أي بيانات شخصية إلا في الاستبيان البحثي الاختياري (انظر أدناه).' : 'Visitors have no accounts, and we collect no personal data except in the optional research survey (see below).'}</li>
        <li>{ar ? 'تقدّم رحلة التعلم يُحفظ على جهازك فقط (مساحة تخزين المتصفح).' : 'Learning-journey progress is stored only on your device (browser storage).'}</li>
        <li>{ar ? 'تُحمَّل الخطوط من Google Fonts، وقد يرى مزوّد الخط عنوان IP الخاص بك.' : 'Fonts are loaded from Google Fonts, so the font provider may see your IP address.'}</li>
        <li>{ar ? 'الاستبيان البحثي (إن فُعّل) يحفظ اسمك وعمرك وإجاباتك ولغتك ووقت الإرسال، ولا يراها إلا مسؤول الموقع، ولا تُنشر الأسماء. المشاركة طوعية، ويلزم موافقة ولي الأمر لمن هم دون 18 عامًا. لا يُفعَّل إلا بعد موافقة الجامعة ولجنة الأخلاقيات. مدة الاحتفاظ بالبيانات تحددها الجامعة ولم تُحدَّد بعد. المحادثة مع المساعد لا تُحفظ.' : 'The research survey (if enabled) stores your name, age, answers, language and submission time. Only the site administrator can see them and names are not published. Taking part is voluntary, and under-18s need a parent or guardian’s permission. It is enabled only after university and ethics approval. The retention period is set by the university and has not been decided yet. Chats with the assistant are not saved.'}</li>
      </ul>

      <h2>{ar ? 'حدود المشروع' : 'Limits'}</h2>
      <p>
        {ar
          ? 'الاختبارات وأنشطة «خرافة أم حقيقة» للتعلم الذاتي وليست أدوات قياس معتمدة، ولا يدّعي المشروع تأييدًا من جامعة أو مستشفى أو وزارة أو لجنة أخلاقيات.'
          : 'The quizzes and the Myth-or-fact activity are for self-learning, not validated instruments, and the project does not claim endorsement from any university, hospital, ministry, or ethics committee.'}
      </p>
      <Disclaimer />
    </main>
  );
}
