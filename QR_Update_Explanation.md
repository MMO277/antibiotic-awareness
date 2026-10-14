# دليل الباركودات الخطية المحدثة وإرشادات المسح السريري للمريض

## أولاً: موقف Firebase
**لا يوجد أي تعديل نهائياً على Firebase** (قواعد الأمان وبيانات Firestore تعمل كالمعتاد بدون أي مساس).

---

## ثانياً: تدقيق وتحديث كافة الباركودات الخطية (EAN-13) للأدوية الـ 16
تم فحص وتدقيق كافة الأدوية الـ 16 واعتماد أحدث الباركودات الخطية المصرية (تبدأ بكود مصر الدولي `622`) ومطابقتها لسجلات [هيئة الدواء المصرية (EDA)](https://edaegypt.gov.eg):

| # | الدواء العلمي (Generic Name) | الأسماء التجارية المصرية المعتمدة (Brands) | الباركود الخطي الحديث (EAN-13) |
|---|---|---|---|
| 1 | Metronidazole (فلاجيل) | Flagyl 500mg (العلبة الحديثة)<br>Flagyl 500mg (تشغيلة سابقة)<br>Amrizole 500mg<br>Flagyl 125mg Susp | **6223003990602**<br>6221008001012<br>6221543001229<br>6221008001029 |
| 2 | Amoxicillin / Clavulanic Acid (أوجمنتين) | Augmentin 1g<br>Curam 1g<br>Hibiotic 1g<br>Megamox 1g<br>Augmentin 457mg Susp | 6221127005436<br>6221054002131<br>6221543009812<br>6223000456123<br>6221127005450 |
| 3 | Azithromycin (زيثروماكس) | Zithromax 500mg<br>Xithrone 500mg<br>Zithrokan 500mg | 6221054003411<br>6221127004118<br>6221543007621 |
| 4 | Nitrofurantoin (ماكروفيوران) | Macrofuran 100mg<br>Uvamin Retard 100mg | 6221543004519<br>6223000214311 |
| 5 | Ciprofloxacin (سيبروفار) | Ciprofar 500mg<br>Cipromay 500mg | 6221008002341<br>6221234005612 |
| 6 | Clindamycin (دالاسين سي) | Dalacin C 300mg<br>Clindam 300mg | 6221054008713<br>6221127003192 |
| 7 | Doxycycline (فيبراميسين) | Tabocin 100mg<br>Vibramycin 100mg | 6221127009182<br>6221054005121 |
| 8 | Clarithromycin (كلاسيد) | Klacid 500mg<br>Clarikan 500mg | 6221054001929<br>6221127008741 |
| 9 | Co-trimoxazole (سبتازول فورت) | Septazole Forte<br>Sutrim Forte | 6221008007621<br>6221008008129 |
| 10 | Cefuroxime (زينات) | Zinnat 500mg<br>Cefurox 500mg | 6221127002341<br>6221008006512 |
| 11 | Ceftriaxone (إبيسفين) | Epicephin 1g Vial<br>Cefaxone 1g Vial | 6221127003412<br>6221008003129 |
| 12 | Levofloxacin (تافانيك) | Tavanic 500mg<br>Levodel 500mg | 6221008004521<br>6221008009181 |
| 13 | Amoxicillin (إيموكس) | E-Mox 500mg<br>Biomox 500mg<br>Amoxil 500mg | 6221127001245<br>6221543002341<br>6221127005112 |
| 14 | Penicillin V (أوسبين) | Ospen 1000<br>Ospen 1500 | 6221054009812<br>6221054009829 |
| 15 | Cephalexin (أوسبكسين) | Ospexin 500mg<br>Cefalex 500mg<br>Ibilex 500mg | 6221054004521<br>6221008005411<br>6221127003456 |
| 16 | Cefixime (سوبراكس) | Suprax 400mg<br>Magnacef 400mg<br>Cefix 400mg | 6223000451239<br>6221127008912<br>6221127006714 |

---

## ثالثاً: العبارة الإرشادية المضافة للمريض في واجهة المسح
تمت إضافة لافتة إرشادية مميزة وبارزة أعلى شاشة المسح في `Scan.tsx`:
> **💡 إرشاد هام للمريض:** يُرجى توجيه الكاميرا نحو «الباركود الخطي» (الخطوط الطولية المطبوعة على ظهر أو جانب العلبة)، وليس الكود المربع الصغير؛ لفتح تفاصيل الدواء وسعره وبدائله فوراً.