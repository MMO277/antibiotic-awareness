import { useState } from 'react';
import { useLang } from './i18n';
import { Bi, pick, tr } from './types';

const FACTS: Bi[] = [
  {
    ar: 'المضادات الحيوية لا تقتل الفيروسات. استخدامها لنزلات البرد أو الإنفلونزا لا يفيد وقد يضر.',
    en: 'Antibiotics do not kill viruses. Using them for colds or flu is ineffective and can cause harm.',
    fr: 'Les antibiotiques ne tuent pas les virus. Les utiliser contre le rhume ou la grippe est inefficace et peut être nocif.',
    es: 'Los antibióticos no matan los virus. Usarlos para resfriados o gripe es ineficaz y puede causar daño.',
    de: 'Antibiotika töten keine Viren ab. Ihre Einnahme bei Erkältungen oder Grippe ist wirkungslos und kann schaden.',
  },
  {
    ar: 'اكتشف ألكسندر فليمنج البنسلين عام 1928 بالصدفة، وهو أول مضاد حيوي في التاريخ.',
    en: 'Alexander Fleming discovered penicillin in 1928 by accident — it was the world\'s first antibiotic.',
    fr: 'Alexander Fleming a découvert la pénicilline par hasard en 1928 — le tout premier antibiotique au monde.',
    es: 'Alexander Fleming descubrió la penicilina por accidente en 1928: fue el primer antibiótico del mundo.',
    de: 'Alexander Fleming entdeckte 1928 zufällig das Penicillin – das weltweit erste Antibiotikum der Geschichte.',
  },
  {
    ar: 'إكمال دورة المضاد الحيوي كاملاً يمنع نمو بكتيريا مقاومة، حتى لو شعرت بالتحسن مبكرًا.',
    en: 'Completing a full antibiotic course prevents resistant bacteria from growing, even if you feel better early.',
    fr: 'Terminer tout le traitement antibiotique prescrit empêche les bactéries résistantes de proliférer, même si vous vous sentez mieux.',
    es: 'Completar todo el ciclo de antibióticos evita que crezcan bacterias resistentes, incluso si te sientes mejor antes.',
    de: 'Das vollständige Beenden der verordneten Antibiotikatherapie verhindert das Wachstum resistenter Bakterien, selbst wenn Sie sich schon früher besser fühlen.',
  },
  {
    ar: 'الاستخدام المفرط للمضادات الحيوية في تربية الحيوانات يساهم في مشكلة المقاومة عالميًا.',
    en: 'Overuse of antibiotics in livestock farming contributes significantly to the global resistance problem.',
    fr: 'L’usage excessif d’antibiotiques dans l’élevage contribue fortement au problème mondial de l’antibiorésistance.',
    es: 'El uso excesivo de antibióticos en la ganadería contribuye significativamente al problema global de la resistencia.',
    de: 'Der übermäßige Einsatz von Antibiotika in der Tierhaltung trägt erheblich zum weltweiten Problem der Antibiotikaresistenz bei.',
  },
  {
    ar: 'لا تحفظ المضادات الحيوية في الحمام أو بجانب مصدر حرارة — الرطوبة والحرارة تتلفها.',
    en: 'Do not store antibiotics in the bathroom or near heat — humidity and heat can break them down.',
    fr: 'Ne conservez pas les antibiotiques dans la salle de bain ou près d’une source de chaleur — l’humidité et la chaleur les dégradent.',
    es: 'No guardes los antibióticos en el baño ni cerca del calor: la humedad y el calor pueden degradarlos.',
    de: 'Bewahren Sie Antibiotika niemals im Badezimmer oder in der Nähe von Wärmequellen auf – Feuchtigkeit und Hitze können den Wirkstoff zersetzen.',
  },
  {
    ar: 'بعض المضادات الحيوية تتفاعل مع منتجات الألبان أو الأطعمة وقد تقل فاعليتها. اقرأ التعليمات دائمًا.',
    en: 'Some antibiotics interact with dairy products or food and may lose effectiveness. Always read the instructions.',
    fr: 'Certains antibiotiques interagissent avec les produits laitiers ou les aliments et perdent en efficacité. Lisez toujours la notice.',
    es: 'Algunos antibióticos interactúan con los productos lácteos o alimentos y pueden perder eficacia. Lee siempre las instrucciones.',
    de: 'Einige Antibiotika treten in Wechselwirkung mit Milchprodukten oder Nahrungsmitteln und können ihre Wirkung verlieren. Lesen Sie stets die Packungsbeilage.',
  },
  {
    ar: 'مشاركة المضادات الحيوية مع شخص آخر ممارسة خطيرة — الجرعة ونوع البكتيريا يختلفان من شخص لآخر.',
    en: 'Sharing antibiotics with someone else is dangerous — the dose and type of bacteria differ from person to person.',
    fr: 'Partager des antibiotiques avec autrui est dangereux — la dose et le type de bactérie varient d’une personne à l’autre.',
    es: 'Compartir antibióticos con otra persona es peligroso: la dosis y el tipo de bacteria varían de una persona a otra.',
    de: 'Das Teilen von Antibiotika mit anderen Personen ist gefährlich – Dosierung und Erregertyp unterscheiden sich von Mensch zu Mensch.',
  },
  {
    ar: 'تُقدَّر وفيات المقاومة للمضادات الحيوية بأكثر من مليون حالة سنويًا حول العالم.',
    en: 'Deaths from antibiotic resistance are estimated at over one million cases annually worldwide.',
    fr: 'Les décès directement liés à l’antibiorésistance sont estimés à plus d’un million par an dans le monde.',
    es: 'Las muertes directas por resistencia a los antibióticos se estiman en más de un millón de casos anuales en todo el mundo.',
    de: 'Weltweit sterben jedes Jahr schätzungsweise mehr als eine Million Menschen direkt an den Folgen von Antibiotikaresistenzen.',
  },
  {
    ar: 'غسل اليدين بالصابون يقلل انتشار العدوى ويُقلل الحاجة للمضادات الحيوية.',
    en: 'Washing hands with soap reduces the spread of infection and lowers the need for antibiotics.',
    fr: 'Se laver les mains au savon réduit la propagation des infections et diminue le besoin d’antibiotiques.',
    es: 'Lavarse las manos con agua y jabón reduce la propagación de infecciones y disminuye la necesidad de antibióticos.',
    de: 'Gründliches Händewaschen mit Seife verringert die Ausbreitung von Infektionen und senkt den Bedarf an Antibiotika.',
  },
  {
    ar: 'يجب التخلص من بقايا المضادات الحيوية بإعادتها للصيدلية، لا برميها في القمامة أو صرف المياه.',
    en: 'Leftover antibiotics should be returned to a pharmacy for safe disposal, not thrown in the trash or flushed.',
    fr: 'Les restes d’antibiotiques doivent être rapportés en pharmacie et non jetés à la poubelle ou dans l’évier.',
    es: 'Los restos de antibióticos deben devolverse a la farmacia para su eliminación segura, no tirarse a la basura ni al desagüe.',
    de: 'Übrig gebliebene Antibiotika sollten zur sicheren Entsorgung in der Apotheke abgegeben und niemals über das Abwasser entsorgt werden.',
  },
];

export default function DidYouKnow() {
  const { lang } = useLang();
  const [fact] = useState(() => FACTS[Math.floor(Math.random() * FACTS.length)]);

  return (
    <div className="dyk-card">
      <div className="dyk-icon" aria-hidden="true">💡</div>
      <div>
        <p className="dyk-label">{tr(lang, 'هل تعلم؟', 'Did you know?', 'Le saviez-vous ?', '¿Sabías que...?', 'Wussten Sie schon?')}</p>
        <p className="dyk-text">{pick(fact, lang)}</p>
      </div>
    </div>
  );
}
