import { Bi } from './types';

export interface CampaignPoster {
  id: string;
  icon: string;
  badge: Bi;
  title: Bi;
  myth: Bi;
  fact: Bi;
  actionTip: Bi;
  gradient: string;
  accentColor: string;
}

export interface VideoScene {
  icon: string;
  bg: string;
  caption: Bi;
}

export interface ShortVideoReel {
  id: string;
  duration: string;
  icon: string;
  title: Bi;
  summary: Bi;
  narrationScript: Bi;
  keyTakeaway: Bi;
  youtubeId: string;
  youtubeUrl: string;
  scenes: VideoScene[];
}

export interface SocialCampaignPost {
  id: string;
  platform: Bi;
  icon: string;
  title: Bi;
  content: Bi;
  hashtags: string;
}

export const CAMPAIGN_POSTERS: CampaignPoster[] = [
  {
    id: 'poster-cold-virus',
    icon: '🦠',
    badge: { ar: 'بوستر توعوي #1', en: 'Infographic #1' },
    title: {
      ar: 'نزلات البرد والإنفلونزا فيروسات.. والمضاد الحيوي لا يعالج الفيروس!',
      en: 'Colds & Flu Are Viruses — Antibiotics Never Cure Viruses!',
    },
    myth: {
      ar: '❌ الخرافة: «أول ما يجيلي برد أو رشح لازم آخد شريط مضاد حيوي عشان أخف بسرعة»',
      en: '❌ Myth: "Taking an antibiotic as soon as I get a cold helps me recover faster."',
    },
    fact: {
      ar: '✅ الحقيقة العلمية: المضادات الحيوية مصممة لقتل البكتيريا فقط، ولا تؤثر نهائياً على فيروسات البرد والإنفلونزا، بل تقتل البكتيريا النافعة في أمعائك وتضعف مناعتك.',
      en: '✅ Scientific Fact: Antibiotics only target bacteria. They have zero effect on cold or flu viruses and destroy beneficial gut flora.',
    },
    actionTip: {
      ar: '💡 البديل الآمن: استخدم الراحة، السوائل الدافئة، وبخاخ محلول الملح، وجرب «الروشتة الخضرا الذكية» على منصتنا.',
      en: '💡 Safe Alternative: Rest, warm fluids, saline spray, and follow our Green Prescription self-care plan.',
    },
    gradient: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
    accentColor: '#0284c7',
  },
  {
    id: 'poster-cold-shot',
    icon: '💉',
    badge: { ar: 'بوستر تحذيري #2', en: 'Infographic #2' },
    title: {
      ar: 'احذر «حقنة البرد الثلاثية» (الخلطة السحرية) — خطر يهدد الحياة!',
      en: 'Beware of the "3-in-1 Cold Shot Mixture" — A Hidden Health Hazard!',
    },
    myth: {
      ar: '❌ الخرافة: «حقنة البرد في الصيدلية بتقضي على التكسير والسخونية في ساعة واحدة»',
      en: '❌ Myth: "The mixed cold injection cures fever and body aches in one hour."',
    },
    fact: {
      ar: '✅ الحقيقة العلمية: خلط مضاد حيوي + كورتيزون + مسكن قوي في سرنجة واحدة يسبب صدمة تحسسية قاتلة، نزيف المعدة، قصوراً كلوياً حاداً، ويخلق سلالات بكتيرية شرسة.',
      en: '✅ Scientific Fact: Mixing an antibiotic, steroid, and NSAID in one syringe risks fatal anaphylaxis, GI bleeding, kidney injury, and superbugs.',
    },
    actionTip: {
      ar: '💡 التوجيه الصحي: لا تقبل أبداً أخذ أي حقنة مخلوطة بدون وصفة طبية واختبار حساسية.',
      en: '💡 Health Guidance: Never accept unprescribed mixed injections.',
    },
    gradient: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
    accentColor: '#dc2626',
  },
  {
    id: 'poster-full-course',
    icon: '⏱️',
    badge: { ar: 'بوستر توعوي #3', en: 'Infographic #3' },
    title: {
      ar: 'شعرت بتحسن بعد يومين؟ إياك أن توقف المضاد الحيوي من تلقاء نفسك!',
      en: 'Feeling Better After 2 Days? Never Stop Your Antibiotic Course Early!',
    },
    myth: {
      ar: '❌ الخرافة: «طالما الحرارة نزلت والألم راح، هوقف المضاد عشان متعبش جسمي»',
      en: '❌ Myth: "Once the fever drops, I should stop the antibiotic to spare my body."',
    },
    fact: {
      ar: '✅ الحقيقة العلمية: التوقف المبكر يقتل البكتيريا الضعيفة فقط ويترك البكتيريا الأقوى حية لتتحور وتكتسب مناعة ضد الدواء، فتعود العدوى أشد وأصعب في العلاج.',
      en: '✅ Scientific Fact: Stopping early leaves the strongest bacteria alive to mutate into drug-resistant superbugs.',
    },
    actionTip: {
      ar: '💡 التوجيه الصحي: التزم بمواعيد الجرعات وأكمل المدة التي حددها الطبيب بالكامل.',
      en: '💡 Health Guidance: Complete the full prescribed duration on schedule.',
    },
    gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
    accentColor: '#059669',
  },
  {
    id: 'poster-no-sharing',
    icon: '🚫',
    badge: { ar: 'بوستر توعوي #4', en: 'Infographic #4' },
    title: {
      ar: 'لا تشارك مضادك الحيوي ولا تحتفظ ببواقي الشراب للمرة القادمة!',
      en: 'Never Share Antibiotics or Save Leftover Syrups for Next Time!',
    },
    myth: {
      ar: '❌ الخرافة: «أخوه عنده نفس الكحة، هديله من نفس زجاجة المضاد اللي في التلاجة»',
      en: '❌ Myth: "His sibling has the same cough, so I will give him the leftover syrup from the fridge."',
    },
    fact: {
      ar: '✅ الحقيقة العلمية: شراب المضاد الحيوي بعد حله بالماء يفسد خلال 7–14 يوماً، كما أن الجرعة ونوع الدواء يختلفان حسب الوزن والسن ووظائف الكلى والحساسية.',
      en: '✅ Scientific Fact: Reconstituted suspensions expire in 7-14 days, and dosing is strictly individualized by weight and allergy history.',
    },
    actionTip: {
      ar: '💡 التوجيه الصحي: استخدم حاسبة جرعات الأطفال ومتتبع الصلاحية، وتخلص من البواقي بأمان.',
      en: '💡 Health Guidance: Track suspension expiry and dispose of leftovers safely.',
    },
    gradient: 'linear-gradient(135deg, #312e81 0%, #4f46e5 100%)',
    accentColor: '#4f46e5',
  },
  {
    id: 'poster-water-environment',
    icon: '♻️',
    badge: { ar: 'بوستر بيئي #5', en: 'Infographic #5' },
    title: {
      ar: 'لا تسكب بقايا المضادات الحيوية في الحوض أو الصرف الصحي!',
      en: 'Never Flush Leftover Antibiotics Down the Sink or Drain!',
    },
    myth: {
      ar: '❌ الخرافة: «أفضل طريقة للتخلص من الدواء القديم هي كبّه في الحوض»',
      en: '❌ Myth: "Pouring expired syrup down the sink is the cleanest way to dispose of it."',
    },
    fact: {
      ar: '✅ الحقيقة العلمية: تسرب المضادات للمياه والتربة يعرض بكتيريا البيئة لجرعات منخفضة تحفزها على إنتاج جينات مقاومة شرسة تنتقل للإنسان عبر الماء والغذاء.',
      en: '✅ Scientific Fact: Flushed antibiotics contaminate waterways and breed environmental superbugs.',
    },
    actionTip: {
      ar: '💡 التوجيه الصحي: امزج البواقي بتفل القهوة أو الرمل في كيس محكم الغلق قبل رميها.',
      en: '💡 Health Guidance: Mix leftovers with coffee grounds in a sealed bag before disposal.',
    },
    gradient: 'linear-gradient(135deg, #134e4a 0%, #0d9488 100%)',
    accentColor: '#0d9488',
  },
  {
    id: 'poster-go-blue',
    icon: '🌍',
    badge: { ar: 'حملة نوفمبر السنوية #6', en: 'WAAW Campaign #6' },
    title: {
      ar: 'الأسبوع العالمي للتوعية بمقاومة الميكروبات (18 – 24 نوفمبر)',
      en: 'World AMR Awareness Week (18 – 24 November) — Go Blue!',
    },
    myth: {
      ar: '❌ الخرافة: «مقاومة البكتيريا مشكلة مستقبلية بعيدة ومش هتأثر علينا دلوقتي»',
      en: '❌ Myth: "Antimicrobial resistance is a distant future problem that does not affect us today."',
    },
    fact: {
      ar: '✅ الحقيقة العلمية: تتسبب البكتيريا المقاومة للمضادات الحيوية في وفاة أكثر من 1.27 مليون إنسان سنوياً حول العالم، وحماية فعالية المضادات مسؤوليتنا جميعاً.',
      en: '✅ Scientific Fact: Drug-resistant bacteria directly cause over 1.27 million deaths annually worldwide.',
    },
    actionTip: {
      ar: '💡 شارك في الحملة: انشر الوعي في عائلتك ومجتمعك تحت شعار «تعامل مع المضادات الحيوية بحرص».',
      en: '💡 Join the Campaign: Share awareness with family and friends — Antimicrobials: Handle With Care!',
    },
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    accentColor: '#2563eb',
  },
];

export const SHORT_VIDEO_REELS: ShortVideoReel[] = [
  {
    id: 'reel-superbug-60s',
    duration: '02:15',
    icon: '🎬',
    title: {
      ar: 'فيديو توعوي (إنفوجرافيك عربي): مقاومة المضادات الحيوية وكيف تتحول البكتيريا إلى «سوبر بكتيريا»',
      en: 'Arabic Infographic Video: Antibiotic Resistance & Superbug Evolution',
    },
    summary: {
      ar: 'فيديو موشن جرافيك مبسط باللغة العربية يشرح كيف تنشأ مقاومة البكتيريا للمضادات الحيوية بسبب الاستخدام العشوائي أو عدم إكمال الكورس.',
      en: 'Animated explainer showing how random antibiotic use and incomplete courses create resistant superbugs.',
    },
    narrationScript: {
      ar: 'تخيل أن المضاد الحيوي هو سلاح مخصص فقط لقتل البكتيريا الضارة. عندما تتناوله لعلاج دور برد فيروسي، أو عندما تتوقف عن تناوله بعد يومين فقط لأنك شعرت بتحسن، فإن البكتيريا القوية التي لم تمت تتعلم كيف تقاوم هذا الدواء، وتورث هذه المناعة لأجيال جديدة من البكتيريا تسمى السوبر بكتيريا. احمِ نفسك وأسرتك: لا تتناول مضاداً حيوياً إلا بوصفة طبيب، وأكمل الجرعة للنهاية!',
      en: 'Imagine an antibiotic as a specialized weapon that only targets bacteria. When taken for a viral cold, or stopped after just two days, surviving bacteria adapt and pass resistance genes to new generations of superbugs. Protect your family: only use antibiotics when prescribed, and always finish the full course!',
    },
    keyTakeaway: {
      ar: 'الالتزام بالوصفة الطبية يحمي قوة المضادات الحيوية لإنقاذ الأرواح.',
      en: 'Following prescriptions preserves life-saving antibiotics.',
    },
    youtubeId: 'qj0JR5jKcUs',
    youtubeUrl: 'https://www.youtube.com/watch?v=qj0JR5jKcUs',
    scenes: [
      {
        icon: '💊 ➡️ 🦠',
        bg: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        caption: {
          ar: 'المشهد 1: المضاد الحيوي سلاح دقيق مصمم للقضاء على البكتيريا فقط ولا يؤثر على الفيروسات.',
          en: 'Scene 1: Antibiotics are precision weapons against bacteria, not viruses.',
        },
      },
      {
        icon: '⚠️ ⏱️ 🛑',
        bg: 'linear-gradient(135deg, #7c2d12, #b45309)',
        caption: {
          ar: 'المشهد 2: عند إيقاف الدواء بعد يومين فقط من التحسن، تبقى البكتيريا الأقوى على قيد الحياة!',
          en: 'Scene 2: Stopping after 2 days leaves the strongest bacteria alive!',
        },
      },
      {
        icon: '🧬 👾 💥',
        bg: 'linear-gradient(135deg, #7f1d1d, #dc2626)',
        caption: {
          ar: 'المشهد 3: تتحور البكتيريا الناجية وتكوّن درعاً جينياً ضد الدواء لتتحول إلى «سوبر بكتيريا».',
          en: 'Scene 3: Surviving bacteria mutate into drug-resistant Superbugs.',
        },
      },
      {
        icon: '🛡️ 👨‍👩‍👧‍👦 ✅',
        bg: 'linear-gradient(135deg, #064e3b, #059669)',
        caption: {
          ar: 'المشهد 4: الحل في يدك: لا مضاد بدون روشتة، وأكمل الكورس للنهاية!',
          en: 'Scene 4: The solution: No antibiotic without a prescription, and finish the full course!',
        },
      },
    ],
  },
  {
    id: 'reel-who-egypt-tv',
    duration: '03:10',
    icon: '📺',
    title: {
      ar: 'تقرير التليفزيون المصري ومنظمة الصحة العالمية: تحذير عاجل من ارتفاع معدلات مقاومة المضادات الحيوية',
      en: 'Egyptian TV & WHO Report: Urgent Warning on Rising Antimicrobial Resistance',
    },
    summary: {
      ar: 'تغطية خاصة توضح مخاطر الإفراط في تناول المضادات الحيوية وحقن البرد في مصر وتوصيات منظمة الصحة العالمية في شهر نوفمبر.',
      en: 'Special broadcast report on the dangers of antibiotic overuse in Egypt and WHO November campaign recommendations.',
    },
    narrationScript: {
      ar: 'تحذر منظمة الصحة العالمية وهيئة الدواء المصرية من الخطر المتزايد لمقاومة المضادات الحيوية نتيجة صرفها بدون وصفة طبية أو استخدام ما يُعرف بحقنة البرد الثلاثية. الاستخدام العشوائي يفقد المضادات الحيوية قدرتها على علاج الالتهابات البكتيرية الحرجة. استشر طبيبك دائماً ولا تستخدم بواقي الأدوية.',
      en: 'The World Health Organization and Egyptian Drug Authority warn against the rising threat of antimicrobial resistance driven by over-the-counter misuse and mixed cold shots.',
    },
    keyTakeaway: {
      ar: 'تجنب صرف المضادات الحيوية دون وصفة طبية أو أخذ حقن البرد المخلوطة.',
      en: 'Avoid OTC antibiotic use and unprescribed cold shot mixtures.',
    },
    youtubeId: 'epML-5yWhXQ',
    youtubeUrl: 'https://www.youtube.com/watch?v=epML-5yWhXQ',
    scenes: [
      {
        icon: '🌍 🏥 📢',
        bg: 'linear-gradient(135deg, #0c4a6e, #0284c7)',
        caption: {
          ar: 'المشهد 1: تحذير عالمي ومصري من فقدان المضادات الحيوية لفعاليتها بسبب سوء الاستخدام.',
          en: 'Scene 1: Global and national alert on declining antibiotic effectiveness.',
        },
      },
      {
        icon: '🚫 💉 🧪',
        bg: 'linear-gradient(135deg, #7f1d1d, #b91c1c)',
        caption: {
          ar: 'المشهد 2: حقنة البرد الثلاثية (مضاد + كورتيزون + مسكن) خطر داهم على المناعة والكلى.',
          en: 'Scene 2: The 3-in-1 cold shot mixture poses severe risks to kidneys and immunity.',
        },
      },
      {
        icon: '🌿 📋 👨‍⚕️',
        bg: 'linear-gradient(135deg, #064e3b, #0d9488)',
        caption: {
          ar: 'المشهد 3: نزلات البرد الفيروسية تُعالج بالرعاية الذاتية الآمنة والراحة والسوائل الدافئة.',
          en: 'Scene 3: Viral colds are safely managed with rest, fluids, and self-care.',
        },
      },
      {
        icon: '💙 🤝 🇪🇬',
        bg: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        caption: {
          ar: 'المشهد 4: معاً في الأسبوع العالمي للوعي بالمضادات الحيوية لحماية صحة أطفالنا.',
          en: 'Scene 4: Together during World AMR Awareness Week to protect our future.',
        },
      },
    ],
  },
  {
    id: 'reel-how-bacteria-win',
    duration: '04:12',
    icon: '🔬',
    title: {
      ar: 'فيديو علمي مبسط بالعربية: كيف تهزم البكتيريا المضادات الحيوية؟ (Antimicrobial Resistance)',
      en: 'Clinical Explainer in Arabic: How Bacteria Defeat Antibiotics (AMR)',
    },
    summary: {
      ar: 'شرح علمي شيق باللغة العربية لطلبة التمريض والطب والجمهور حول آليات مقاومة البكتيريا للمضادات الحيوية وكيف نوقف انتشارها.',
      en: 'Engaging Arabic scientific explainer on bacterial resistance mechanisms and infection control.',
    },
    narrationScript: {
      ar: 'كيف تستطيع خلية بكتيرية مجهرية أن تهزم أقوى المضادات الحيوية؟ تمتلك البكتيريا قدرة مذهلة على تطوير مضخات تطرد الدواء خارجها، أو إفراز إنزيمات مثل البيتا لاكتاماز لتكسير المضاد الحيوي، أو تغيير شكل جدارها الخلوي. كل مرة نستخدم فيها مضاداً حيوياً بلا حاجة، نحن ندرب هذه البكتيريا على هزيمة أدويتنا!',
      en: 'How does a microscopic bacterial cell defeat our strongest antibiotics? By developing efflux pumps, beta-lactamase enzymes, and target modifications whenever antibiotics are misused.',
    },
    keyTakeaway: {
      ar: 'ترشيد المضادات الحيوية ومكافحة العدوى هما خط الدفاع الأول.',
      en: 'Antibiotic stewardship and infection control are our first line of defense.',
    },
    youtubeId: '-JyciqkCxQk',
    youtubeUrl: 'https://www.youtube.com/watch?v=-JyciqkCxQk',
    scenes: [
      {
        icon: '🔬 🦠 🛡️',
        bg: 'linear-gradient(135deg, #312e81, #4f46e5)',
        caption: {
          ar: 'المشهد 1: البكتيريا تطور إنزيمات ومضخات دفاعية لتكسير وطرد المضاد الحيوي.',
          en: 'Scene 1: Bacteria evolve enzymes and efflux pumps to neutralize antibiotics.',
        },
      },
      {
        icon: '🔄 🧬 📈',
        bg: 'linear-gradient(135deg, #831843, #db2777)',
        caption: {
          ar: 'المشهد 2: تنقل البكتيريا جينات المقاومة لبعضها البعض بسرعة مذهلة.',
          en: 'Scene 2: Bacteria transfer resistance genes horizontally to other strains.',
        },
      },
      {
        icon: '🍼 📏 ❄️',
        bg: 'linear-gradient(135deg, #065f46, #10b981)',
        caption: {
          ar: 'المشهد 3: ضبط الجرعة بالسرنجة المدرجة وإتمام المدة المقررة يقضي على البكتيريا تماماً.',
          en: 'Scene 3: Accurate dosing and full course completion eradicate the infection.',
        },
      },
    ],
  },
];

export const SOCIAL_CAMPAIGN_POSTS: SocialCampaignPost[] = [
  {
    id: 'post-whatsapp-family',
    platform: { ar: 'رسالة واتساب للعائلة والجروبات', en: 'WhatsApp Family Message' },
    icon: '💬',
    title: { ar: 'رسالة توعية سريعة لجروبات العائلة والأمهات', en: 'Quick Family & Mothers WhatsApp Share' },
    content: {
      ar: '🌿 معلومة طبية مهمة لكل بيت مع دخول الشتاء:\nنزلات البرد والرشح والإنفلونزا سببها «فيروسات» ومش بكتيريا، عشان كده المضاد الحيوي مش بيعالج البرد ولا بيخففه!\n❌ بلاش نشتري مضاد حيوي من نفسنا أو ناخد «حقنة البرد المخلوطة».\n✅ تقدروا تفحصوا الأدوية وبدائلها وتطبعوا «الروشتة الخضرا للرعاية الذاتية» مجاناً من منصة الوعي بالمضادات الحيوية:',
      en: '🌿 Important Winter Health Tip:\nColds and flu are caused by viruses, not bacteria — antibiotics will not help you recover faster!\n❌ Avoid self-medicating with antibiotics or mixed cold shots.\n✅ Check safe self-care plans and verified drug info on the Antibiotic Awareness Platform:',
    },
    hashtags: '#الأسبوع_العالمي_للمضادات_الحيوية #الوعي_بالمضادات_الحيوية #WAAW #GoBlue',
  },
  {
    id: 'post-facebook-stewardship',
    platform: { ar: 'منشور فيسبوك وإنستجرام', en: 'Facebook & Instagram Post' },
    icon: '📱',
    title: { ar: 'منشور حملة الأسبوع العالمي للوعي بالمضادات الحيوية (نوفمبر)', en: 'World AMR Awareness Week Social Post' },
    content: {
      ar: '💙 في الأسبوع العالمي للتوعية بمقاومة الميكروبات (18–24 نوفمبر)، لنتذكر 4 قواعد ذهبية تحمي حياتنا وحياة أطفالنا:\n1️⃣ لا تتناول مضاداً حيوياً إلا بوصفة طبيب.\n2️⃣ لا تطلب مضاداً حيوياً لعلاج نزلات البرد والإنفلونزا الفيروسية.\n3️⃣ أكمل كورس المضاد الحيوي الموصوف للنهاية حتى لو شعرت بتحسن.\n4️⃣ لا تشارك مضادك الحيوي مع غيرك ولا تحتفظ ببواقي الشراب للمرة القادمة.\nامسح باركود دوائك وتعرف على بدائله وتفاعلاته عبر منصة الوعي بالمضادات الحيوية:',
      en: '💙 During World AMR Awareness Week (18–24 November), remember 4 golden rules to protect our future:\n1️⃣ Never take antibiotics without a prescription.\n2️⃣ Do not use antibiotics for viral colds or flu.\n3️⃣ Always finish your prescribed course.\n4️⃣ Never share leftover antibiotics.\nExplore the Antibiotic Awareness Platform:',
    },
    hashtags: '#HandleWithCare #WAAW #AntimicrobialResistance #ترشيد_المضادات_الحيوية',
  },
  {
    id: 'post-short-tweet',
    platform: { ar: 'تغريدة قصيرة / حالة واتساب (Status)', en: 'Short Status / X Post' },
    icon: '✨',
    title: { ar: 'حالة قصيرة (Status / Story)', en: 'Quick Story / Status Caption' },
    content: {
      ar: '💊 المضاد الحيوي سلاح ثمين لإنقاذ الحياة من العدوى البكتيرية الخطيرة.. لا تفقده مفعوله باستخدامه في نزلات البرد العادية! #تعامل_معها_بحرص',
      en: '💊 Antibiotics are precious life-saving medicines — do not make them powerless by using them for common colds! #HandleWithCare',
    },
    hashtags: '#WAAW #GoBlue #الوعي_بالمضادات_الحيوية',
  },
];

export function getNovemberCampaignStatus(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  const isNovember = month === 10;
  const isOfficialWeek = month === 10 && date >= 18 && date <= 24;

  let targetYear = year;
  if (month > 10 || (month === 10 && date > 24)) {
    targetYear = year + 1;
  }
  const targetDate = new Date(targetYear, 10, 18, 0, 0, 0);
  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  return {
    isNovember,
    isOfficialWeek,
    targetYear,
    days,
    hours,
    minutes,
  };
}
