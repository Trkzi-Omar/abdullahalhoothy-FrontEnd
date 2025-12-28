export interface LandingTranslations {
  nav: {
    features: string;
    caseStudy: string;
    tryFree: string;
  };
  hero: {
    badge: string;
    alert: string;
    headline: string;
    sub: string;
    cta: string;
    placeholder: string;
  };
  features: {
    title: string;
    sub: string;
    visualLabel: string;
    visualDesc: string;
    visualBadge: string;
    visualTag1: string;
    visualTag2: string;
    visualOverlay: string;
    list: Array<{ title: string; desc: string }>;
  };
  report: {
    title: string;
    sub: string;
    cards: Array<{ title: string; desc: string }>;
  };
  caseStudy: {
    label: string;
    title: string;
    text1: string;
    text2: string;
    stat1: string;
    stat2: string;
    orig: string;
    risk: string;
    pick: string;
    rec: string;
  };
  cta: {
    title: string;
    sub: string;
    btn: string;
  };
  footer: string;
}

export const translations: Record<'en' | 'ar', LandingTranslations> = {
  en: {
    nav: { features: 'Features', caseStudy: 'Success Story', tryFree: 'Launch App' },
    hero: {
      badge: 'AI-Powered Location Intelligence',
      alert: '60% of retail businesses fail due to location.',
      headline: 'Validate Your Investment Before You Build.',
      sub: 'Stop guessing. Get a comprehensive AI Location Report that predicts demand, analyzes competitors, and validates your success with 95% accuracy.',
      cta: 'Start Analysis',
      placeholder: 'Enter a location or city...',
    },
    features: {
      title: 'Powerful Features',
      sub: 'Data-driven insights tailored for retail expansion.',
      visualLabel: 'Comprehensive Site Report',
      visualDesc: 'Get a detailed PDF report containing all critical data points for your decision making.',
      visualBadge: 'Downloadable PDF',
      visualTag1: 'Executive Summary',
      visualTag2: 'Detailed Analytics',
      visualOverlay: 'View Sample Report',
      list: [
        {
          title: 'AI Scoring Engine',
          desc: 'Instant 0-100 score based on 50+ data points including traffic and cost.',
        },
        { title: 'Demographics', desc: 'Deep dive into spending power, age groups, and resident behavior.' },
        { title: 'Traffic Heatmaps', desc: 'Visualize high-footfall zones with real-time mobility data.' },
      ],
    },
    report: {
      title: 'Inside The Intelligence Report',
      sub: 'What you get when you generate an S-LOC analysis.',
      cards: [
        { title: 'Executive Decision', desc: 'Clear GO/NO-GO recommendation.' },
        { title: 'Demand Prediction', desc: 'Estimated daily and monthly demand analysis.' },
        { title: 'Competitor Radar', desc: 'Saturation & market gap analysis.' },
        { title: 'Risk Detector', desc: 'Hidden zoning & accessibility risks.' },
      ],
    },
    caseStudy: {
      label: 'Success Story',
      title: 'Coffee Expansion Success',
      text1:
        'A popular coffee chain planned a new branch in a high-rent district. The foot traffic looked good, but the conversion data was missing.',
      text2:
        'S-LOC analysis revealed the area was oversaturated. We identified a "Hidden Gem" location 3km away with 40% lower rent.',
      stat1: '40% Lower OpEx',
      stat2: '2.5x ROI Year 1',
      orig: 'Proposed Site',
      risk: 'High Saturation',
      pick: 'S-LOC Choice',
      rec: 'High Potential',
    },
    cta: {
      title: 'Ready to Expand Confidently?',
      sub: 'Join leading Saudi businesses using S-LOC to validate their next branch.',
      btn: 'Try Without Sign-up',
    },
    footer: '© 2025 S-LOC Intelligence. All rights reserved.',
  },
  ar: {
    nav: { features: 'المميزات', caseStudy: 'قصة نجاح', tryFree: 'جرب المنصة' },
    hero: {
      badge: 'ذكاء اصطناعي للمواقع الجغرافية',
      alert: '٦٠٪ من مشاريع التجزئة تفشل بسبب الموقع.',
      headline: 'لا تغامر.. تحقق من موقعك بالأرقام.',
      sub: 'توقف عن التخمين. احصل على تقرير ذكي يتوقع الطلب، ويحلل المنافسين، ويقيم نسبة نجاح مشروعك بدقة ٩٥٪ قبل أن تدفع ريالاً واحداً.',
      cta: 'ابدأ التحليل الآن',
      placeholder: 'أدخل اسم الحي أو المدينة...',
    },
    features: {
      title: 'مميزات المنصة',
      sub: 'بيانات دقيقة مصممة لنمو قطاع التجزئة.',
      visualLabel: 'تقرير موقع شامل',
      visualDesc: 'احصل على تقرير PDF مفصل يحتوي على جميع البيانات الهامة لاتخاذ قرارك.',
      visualBadge: 'تقرير قابل للتحميل',
      visualTag1: 'ملخص تنفيذي',
      visualTag2: 'تحليلات تفصيلية',
      visualOverlay: 'معاينة نموذج التقرير',
      list: [
        { title: 'محرك التقييم الذكي', desc: 'تقييم فوري من ١٠٠ بناءً على الحركة والتكلفة.' },
        { title: 'التركيبة السكانية', desc: 'تحليل القوة الشرائية وسلوك السكان.' },
        { title: 'الخرائط الحرارية', desc: 'كشف مناطق الازدحام والكثافة البشرية.' },
      ],
    },
    report: {
      title: 'ماذا يوجد داخل التقرير؟',
      sub: 'تفاصيل دقيقة تكشف مستقبل استثمارك.',
      cards: [
        { title: 'القرار النهائي', desc: 'توصية واضحة (ابدأ/توقف).' },
        { title: 'توقعات الطلب', desc: 'تحليل تقديري للطلب اليومي والشهري.' },
        { title: 'رادار المنافسين', desc: 'تحليل التشبع والفجوات السوقية.' },
        { title: 'كشف المخاطر', desc: 'تنبيهات حول الوصول والرؤية.' },
      ],
    },
    caseStudy: {
      label: 'قصة نجاح',
      title: 'نجاح توسع سلسلة مقاهي',
      text1: 'خططت سلسلة مقاهي مشهورة لفرع في منطقة مرتفعة الإيجار. الحركة بدت جيدة، لكن البيانات الشرائية كانت مفقودة.',
      text2: 'كشف S-LOC أن المنطقة مشبعة تماماً. حددنا موقعاً بديلاً يبعد ٣ كم بتكلفة أقل وفرصة نمو أعلى.',
      stat1: '٤٠٪ خفض التكاليف',
      stat2: '٢.٥ ضعف العائد',
      orig: 'الموقع المقترح',
      risk: 'تشبع عالي',
      pick: 'توصية S-LOC',
      rec: 'فرصة ذهبية',
    },
    cta: {
      title: 'جاهز للتوسع بثقة؟',
      sub: 'انضم لكبرى الشركات السعودية التي تستخدم S-LOC للتحقق من فروعها.',
      btn: 'جرب بدون تسجيل',
    },
    footer: '© ٢٠٢٥ S-LOC. جميع الحقوق محفوظة.',
  },
};
