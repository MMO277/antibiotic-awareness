import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useLang } from './i18n';
import { tr } from './types';

export interface CertificateRecord {
  id: string;
  certNumber: string;
  recipientName: string;
  level: 'easy' | 'medium' | 'hard';
  score: number;
  total: number;
  percentage: number;
  issuedAtIso: string;
}

interface Props {
  cert: CertificateRecord;
  onClose: () => void;
  onUpdateName?: (newName: string) => void;
}

const LEVEL_BADGE: Record<
  'easy' | 'medium' | 'hard',
  { ar: string; en: string; fr: string; es: string; de: string; color: string }
> = {
  easy: {
    ar: 'المستوى التأسيسي (مبتدئ)',
    en: 'Foundation Level (Beginner)',
    fr: 'Niveau Fondamental (Débutant)',
    es: 'Nivel Básico (Principiante)',
    de: 'Grundstufe (Einsteiger)',
    color: '#10b981',
  },
  medium: {
    ar: 'المستوى المتقدم المتوسط',
    en: 'Intermediate Stewardship Level',
    fr: 'Niveau Intermédiaire',
    es: 'Nivel Intermedio',
    de: 'Mittelstufe (Fortgeschritten)',
    color: '#f59e0b',
  },
  hard: {
    ar: 'المستوى الإكلينيكي المتخصص (متقدم)',
    en: 'Advanced Clinical Stewardship Level',
    fr: 'Niveau Clinique Avancé',
    es: 'Nivel Clínico Avanzado',
    de: 'Klinische Expertenstufe (Profi)',
    color: '#ef4444',
  },
};

export default function AmbassadorCertificateModal({ cert, onClose, onUpdateName }: Props) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nameInput, setNameInput] = useState(cert.recipientName);
  const [downloading, setDownloading] = useState(false);

  const siteUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}#/quiz`
      : 'https://mmo277.github.io/antibiotic-awareness/#/quiz';

  // Draw High-Resolution Certificate on HTML5 Canvas (1600 x 1120)
  useEffect(() => {
    let active = true;
    async function renderCanvas() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = 1600;
      const H = 1120;
      canvas.width = W;
      canvas.height = H;

      // 1. Deep Royal Navy & Teal Gradient Background
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      bgGrad.addColorStop(0, '#061a29');
      bgGrad.addColorStop(0.5, '#0b3c5d');
      bgGrad.addColorStop(1, '#072235');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // Subtle Geometric Medical Grid Pattern
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.05)';
      ctx.lineWidth = 1;
      for (let x = 60; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 60; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // Ambient Glow Circles
      const radGlow = ctx.createRadialGradient(W / 2, 260, 30, W / 2, 260, 520);
      radGlow.addColorStop(0, 'rgba(23, 184, 196, 0.22)');
      radGlow.addColorStop(1, 'rgba(23, 184, 196, 0)');
      ctx.fillStyle = radGlow;
      ctx.fillRect(0, 0, W, H);

      // 2. Luxury Double Gold & Cyan Frame Border
      const goldGrad = ctx.createLinearGradient(0, 0, W, H);
      goldGrad.addColorStop(0, '#fde047');
      goldGrad.addColorStop(0.5, '#f59e0b');
      goldGrad.addColorStop(1, '#fef08a');

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 6;
      ctx.strokeRect(42, 42, W - 84, H - 84);

      ctx.strokeStyle = 'rgba(34, 211, 238, 0.55)';
      ctx.lineWidth = 2;
      ctx.strokeRect(58, 58, W - 116, H - 116);

      // Corner Ornaments
      const corners = [
        [42, 42, 1, 1],
        [W - 42, 42, -1, 1],
        [42, H - 42, 1, -1],
        [W - 42, H - 42, -1, -1],
      ];
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * 48, cy + dy * 10);
        ctx.lineTo(cx + dx * 10, cy + dy * 10);
        ctx.lineTo(cx + dx * 10, cy + dy * 48);
        ctx.stroke();
      });

      // 3. Top Crest / Shield Header
      ctx.save();
      ctx.translate(W / 2, 130);
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fillStyle = '#0e9aa7';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fde047';
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 40px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛡️', 0, 2);
      ctx.restore();

      // Platform Title
      ctx.fillStyle = '#67e8f9';
      ctx.font = '600 24px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        tr(
          lang,
          'منصة الوعي بالمضادات الحيوية • مبادرة الاستخدام الرشيد للدواء في مصر',
          'ANTIBIOTIC AWARENESS PLATFORM • EGYPT STEWARDSHIP INITIATIVE',
          'PLATEFORME DE SENSIBILISATION AUX ANTIBIOTIQUES • INITIATIVE AMR',
          'PLATAFORMA DE CONCIENCIA SOBRE ANTIBIÓTICOS • INICIATIVA RAM',
          'PLATTFORM FÜR ANTIBIOTIKA-BEWUSSTSEIN • STEWARDSHIP-INITIATIVE'
        ),
        W / 2,
        215
      );

      // Main Certificate Headline
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 50px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(
        tr(
          lang,
          'شهادة سفير الوعي بالمضادات الحيوية',
          'ANTIBIOTIC STEWARDSHIP AMBASSADOR',
          'AMBASSADEUR DU BON USAGE DES ANTIBIOTIQUES',
          'EMBAJADOR DEL USO PRUDENTE DE ANTIBIÓTICOS',
          'BOTSCHAFTER FÜR ANTIBIOTIKA-BEWUSSTSEIN'
        ),
        W / 2,
        290
      );

      // Subtitle
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '400 25px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(
        tr(
          lang,
          'تشهد المنصة بأن حامل هذه الشهادة قد اجتاز بنجاح التقييم المعرفي للاستخدام الآمن للمضادات الحيوية',
          'This certifies that the recipient named below has successfully passed the Antibiotic Stewardship Assessment',
          'Certifie que le titulaire ci-dessous a réussi l’évaluation sur le bon usage des antibiotiques',
          'Certifica que el titular nombrado abajo ha superado la evaluación sobre el uso seguro de antibióticos',
          'Hiermit wird bestätigt, dass die unten genannte Person die Prüfung zum sicheren Antibiotikaeinsatz erfolgreich bestanden hat'
        ),
        W / 2,
        350
      );

      // 4. Recipient Name Banner
      const displayRecipient =
        (nameInput || cert.recipientName || '').trim() ||
        tr(lang, 'سفير الوعي الدوائي', 'Stewardship Ambassador', 'Ambassadeur AMR', 'Embajador RAM', 'Stewardship-Botschafter');

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.65)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(W / 2 - 440, 390, 880, 110, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 52px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(displayRecipient, W / 2, 460);

      // 5. Level & Score Pill Badges
      const lvlInfo = LEVEL_BADGE[cert.level] || LEVEL_BADGE.easy;
      const lvlText =
        isAr
          ? lvlInfo.ar
          : lang === 'fr'
          ? lvlInfo.fr
          : lang === 'es'
          ? lvlInfo.es
          : lang === 'de'
          ? lvlInfo.de
          : lvlInfo.en;
      const scoreText = tr(
        lang,
        `النتيجة: ${cert.score} من ${cert.total} (${cert.percentage}%)`,
        `Score: ${cert.score}/${cert.total} (${cert.percentage}%)`,
        `Score : ${cert.score}/${cert.total} (${cert.percentage}%)`,
        `Puntuación: ${cert.score}/${cert.total} (${cert.percentage}%)`,
        `Ergebnis: ${cert.score}/${cert.total} (${cert.percentage}%)`
      );

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 28px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(`${lvlText}   •   ${scoreText}`, W / 2, 555);

      // 6. Official Stewardship Pledge Box
      ctx.fillStyle = 'rgba(14, 154, 167, 0.14)';
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(160, 600, W - 320, 175, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 25px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(
        tr(
          lang,
          '🤝 ميثاق وتعهد سفير الوعي الدوائي:',
          '🤝 Antibiotic Stewardship Ambassador Pledge:',
          '🤝 Engagement de l’Ambassadeur du Bon Usage :',
          '🤝 Compromiso del Embajador de Uso Prudente:',
          '🤝 Versprechen des Botschafters für Antibiotika-Bewusstsein:'
        ),
        W / 2,
        642
      );

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '400 21px "IBM Plex Sans Arabic", system-ui, sans-serif';
      const pledgeLine1 = tr(
        lang,
        '«أتعهد بعدم تناول أو مشاركة أي مضاد حيوي بدون وصفة طبية، وإكمال كورس العلاج الموصوف حتى النهاية،',
        '“I pledge never to use or share antibiotics without a medical prescription, to complete my full prescribed course,',
        '« Je m’engage à ne jamais prendre ni partager d’antibiotiques sans ordonnance, à suivre mon traitement jusqu’au bout,',
        '«Me comprometo a no usar ni compartir antibióticos sin receta médica, a completar todo mi tratamiento prescrito,',
        '„Ich verspreche, niemals Antibiotika ohne ärztliches Rezept einzunehmen oder weiterzugeben, meine Therapie vollständig zu beenden,'
      );
      const pledgeLine2 = tr(
        lang,
        'وتجنب "حقنة البرد" والمضادات في العدوى الفيروسية، والمساهمة في حماية مجتمعي من البكتيريا المقاومة.»',
        'to avoid antibiotics for viral colds, and to help protect my community from antimicrobial resistance.”',
        'à éviter les antibiotiques pour les rhumes viraux et à protéger ma communauté contre l’antibiorésistance. »',
        'a evitar los antibióticos en resfriados virales y a proteger a mi comunidad frente a la resistencia bacteriana.»',
        'auf Antibiotika bei viralen Erkältungen zu verzichten und meine Mitmenschen vor Antibiotikaresistenzen zu schützen.“'
      );

      ctx.fillText(pledgeLine1, W / 2, 690);
      ctx.fillText(pledgeLine2, W / 2, 732);

      // 7. Bottom Footer: Date + Golden Seal + Verification QR Code
      const dateLocale =
        isAr ? 'ar-EG' : lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : lang === 'de' ? 'de-DE' : 'en-GB';
      const dateFormatted = new Date(cert.issuedAtIso).toLocaleDateString(
        dateLocale,
        { day: '2-digit', month: 'long', year: 'numeric' }
      );

      // Left Footer: Issue Date & Certificate Serial ID
      ctx.textAlign = 'left';
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 20px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(tr(lang, 'تاريخ الإصدار:', 'Issued Date:', 'Date d’émission :', 'Fecha de emisión:', 'Ausstellungsdatum:'), 160, 880);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(dateFormatted, 160, 915);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 19px monospace';
      ctx.fillText(`ID: ${cert.certNumber}`, 160, 955);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '500 18px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText('WHO AWaRe & Egypt NAP-AMR Aligned', 160, 990);

      // Center Footer: Golden Seal Badge
      ctx.save();
      ctx.translate(W / 2, 920);
      ctx.beginPath();
      ctx.arc(0, 0, 68, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#fbbf24';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, 56, 0, Math.PI * 2);
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#fde047';
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 20px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText(tr(lang, 'معتمد', 'VERIFIED', 'VÉRIFIÉ', 'VERIFICADO', 'GEPRÜFT'), 0, -8);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px "IBM Plex Sans Arabic", system-ui, sans-serif';
      ctx.fillText('AMR STEWARD', 0, 18);
      ctx.restore();

      // Right Footer: Offline Generated QR Code via `qrcode` package
      try {
        const qrDataUrl = await QRCode.toDataURL(siteUrl, {
          width: 150,
          margin: 1,
          color: { dark: '#061a29', light: '#ffffff' },
        });
        if (!active) return;
        const qrImg = new Image();
        qrImg.onload = () => {
          if (!active) return;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(W - 310, 840, 150, 150, 12);
          ctx.fill();
          ctx.drawImage(qrImg, W - 305, 845, 140, 140);

          ctx.textAlign = 'center';
          ctx.fillStyle = '#cbd5e1';
          ctx.font = '600 16px "IBM Plex Sans Arabic", system-ui, sans-serif';
          ctx.fillText(
            tr(lang, 'امسح لاختبار وعيك الدوائي', 'Scan to Take the Quiz', 'Scannez pour faire le quiz', 'Escanea para hacer el test', 'Scannen zum Quiz-Start'),
            W - 235,
            1015
          );
        };
        qrImg.src = qrDataUrl;
      } catch {
        // Ignore QR generation errors if any
      }
    }

    renderCanvas();
    return () => {
      active = false;
    };
  }, [cert, nameInput, isAr, lang, siteUrl]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDownloading(true);
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `AMR-Certificate-${cert.certNumber}.png`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `AMR-Certificate-${cert.certNumber}.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: tr(
              lang,
              'شهادة سفير الوعي بالمضادات الحيوية',
              'Antibiotic Stewardship Certificate',
              'Certificat Ambassadeur AMR',
              'Certificado Embajador RAM',
              'Botschafter-Zertifikat für Antibiotika-Bewusstsein'
            ),
            text: tr(
              lang,
              `حصلت على شهادة سفير الوعي بالمضادات الحيوية بنتيجة ${cert.percentage}%! اختبر معلوماتك الآن:`,
              `I earned my Antibiotic Stewardship Ambassador Certificate (${cert.percentage}%)! Test your knowledge:`,
              `J'ai obtenu mon certificat d'Ambassadeur du Bon Usage des Antibiotiques (${cert.percentage}%) !`,
              `¡Obtuve mi Certificado de Embajador del Uso Prudente de Antibióticos (${cert.percentage}%)!`,
              `Ich habe mein Botschafter-Zertifikat für Antibiotika-Bewusstsein (${cert.percentage} %) erhalten! Teste dein Wissen:`
            ),
            files: [file],
          });
          return;
        }
      }
    } catch {}
    handleDownloadPng();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(4, 16, 24, 0.82)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="card stack"
        style={{
          maxWidth: '820px',
          width: '100%',
          background: '#081e2e',
          color: '#f8fafc',
          border: '1.5px solid rgba(251, 191, 36, 0.5)',
          borderRadius: '18px',
          padding: '20px',
          maxHeight: '94dvh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="head" style={{ borderBottom: '1px solid rgba(148,163,184,0.2)', paddingBottom: '10px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fde047', fontSize: '1.15rem' }}>
              🏅{' '}
              {tr(
                lang,
                'شهادة سفير الوعي بالمضادات الحيوية',
                'Antibiotic Stewardship Ambassador Certificate',
                'Certificat d’Ambassadeur AMR',
                'Certificado de Embajador RAM',
                'Botschafter-Zertifikat für Antibiotika-Bewusstsein'
              )}
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              ☁️{' '}
              {tr(
                lang,
                'محفوظة في سجل شهاداتك — يمكنك تعديل الاسم وتحميلها كصورة عالية الجودة',
                'Saved to your certificate history — customize your name & download in HD',
                'Enregistré dans votre historique — téléchargez en HD',
                'Guardado en tu historial — descarga en HD',
                'In Ihrem Zertifikatsverlauf gespeichert — Namen anpassen & in HD herunterladen'
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Name Customization Input */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(15, 39, 56, 0.85)', padding: '10px 14px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.25)' }}>
          <label htmlFor="cert-recipient-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7dd3fc', whiteSpace: 'nowrap' }}>
            ✍️ {tr(lang, 'الاسم المطبوع على الشهادة:', 'Name on Certificate:', 'Nom sur le certificat :', 'Nombre en el certificado:', 'Name auf dem Zertifikat:')}
          </label>
          <input
            id="cert-recipient-name"
            type="text"
            value={nameInput}
            maxLength={48}
            onChange={(e) => {
              setNameInput(e.target.value);
              if (onUpdateName) onUpdateName(e.target.value);
            }}
            placeholder={tr(lang, 'اكتب اسمك الثلاثي هنا...', 'Enter your full name...', 'Votre nom complet...', 'Escribe tu nombre completo...', 'Ihren vollständigen Namen eingeben...')}
            style={{
              flex: '1 1 220px',
              background: '#041018',
              color: '#ffffff',
              border: '1px solid #38bdf8',
              borderRadius: '8px',
              padding: '8px 12px',
            }}
          />
        </div>

        {/* Live High-Resolution Canvas Preview */}
        <div style={{ width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid rgba(251, 191, 36, 0.45)', background: '#041018' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', color: '#94a3b8', fontFamily: 'monospace' }}>
            Serial: {cert.certNumber}
          </span>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={downloading}
              className="btn"
              style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#041018', fontWeight: 800 }}
            >
              📥 {tr(lang, 'تحميل الشهادة كصورة (HD PNG)', 'Download Certificate (HD PNG)', 'Télécharger (PNG HD)', 'Descargar Certificado (PNG HD)', 'Zertifikat herunterladen (HD PNG)')}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="btn"
              style={{ background: '#0e9aa7', borderColor: '#0e9aa7', color: '#ffffff' }}
            >
              📤 {tr(lang, 'مشاركة الشهادة', 'Share Certificate', 'Partager', 'Compartir', 'Zertifikat teilen')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
