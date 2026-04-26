import { t } from '../../i18n';

export interface LandingTranslations {
  nav: {
    features: string;
    caseStudy: string;
    tryFree: string;
    closeMenu: string;
    openMenu: string;
  };
  hero: {
    badge: string;
    alert: string;
    headline: string;
    sub: string;
    cta: string;
    placeholder: string;
    ctaNoSignup: string;
    noCreditCard: string;
    instantReport: string;
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
    cafeReport: string;
    pharmacyReport: string;
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
  dataSources: {
    title: string;
    sub: string;
    andMore: string;
  };
  cta: {
    title: string;
    sub: string;
    btn: string;
  };
  footer: string;
}

export const getLandingTranslations = (lang: 'en' | 'ar'): LandingTranslations => {
  const tr = (key: string) => t(key, { lng: lang });

  return {
    nav: {
      features: tr('features'),
      caseStudy: tr('success-story'),
      tryFree: tr('get-report'),
      closeMenu: tr('close-menu'),
      openMenu: tr('open-menu'),
    },
    hero: {
      badge: tr('ai-powered-location-intelligence'),
      alert: tr('60-of-retail-businesses-fail-due-to-location'),
      headline: tr('validate-your-investment-before-you-build'),
      sub: tr('stop-guessing-get-a-comprehensive-ai-location-report-that-predicts-demand-analyzes-competitors-and-validates-your-success-with-95-accuracy'),
      cta: tr('start-analysis'),
      placeholder: tr('enter-a-location-or-city'),
      ctaNoSignup: tr('expansion-report-without-sign-up'),
      noCreditCard: tr('no-credit-card'),
      instantReport: tr('instant-report'),
    },
    features: {
      title: tr('powerful-features'),
      sub: tr('data-driven-insights-tailored-for-retail-expansion'),
      visualLabel: tr('comprehensive-site-report'),
      visualDesc: tr('get-a-detailed-pdf-report-containing-all-critical-data-points-for-your-decision-making'),
      visualBadge: tr('downloadable-pdf'),
      visualTag1: tr('executive-summary'),
      visualTag2: tr('detailed-analytics'),
      visualOverlay: tr('view-sample-report'),
      cafeReport: tr('cafe-report'),
      pharmacyReport: tr('pharmacy-report'),
      list: [
        {
          title: tr('ai-scoring-engine'),
          desc: tr('instant-0-100-score-based-on-50-data-points-including-traffic-and-cost'),
        },
        {
          title: tr('demographics'),
          desc: tr('deep-dive-into-spending-power-age-groups-and-resident-behavior'),
        },
        {
          title: tr('traffic-heatmaps'),
          desc: tr('visualize-high-footfall-zones-with-real-time-mobility-data'),
        },
      ],
    },
    report: {
      title: tr('inside-the-intelligence-report'),
      sub: tr('what-you-get-when-you-generate-an-s-locator-analysis'),
      cards: [
        { title: tr('executive-decision'), desc: tr('clear-go-no-go-recommendation') },
        { title: tr('demand-prediction'), desc: tr('estimated-daily-and-monthly-demand-analysis') },
        { title: tr('competitor-radar'), desc: tr('saturation-market-gap-analysis') },
        { title: tr('risk-detector'), desc: tr('hidden-zoning-accessibility-risks') },
      ],
    },
    caseStudy: {
      label: tr('success-story'),
      title: tr('coffee-expansion-success'),
      text1: tr('a-popular-coffee-chain-planned-a-new-branch-in-a-high-rent-district-the-foot-traffic-looked-good-but-the-analysis-data-was-missing'),
      text2: tr('s-locator-analysis-revealed-the-area-was-oversaturated-we-identified-a-hidden-gem-location-3km-away-with-40-lower-rent'),
      stat1: tr('40-lower-opex'),
      stat2: tr('2-5x-roi-year-1'),
      orig: tr('proposed-site'),
      risk: tr('high-saturation'),
      pick: tr('s-locator-choice'),
      rec: tr('high-potential'),
    },
    dataSources: {
      title: tr('trusted-data-sources'),
      sub: tr('we-aggregate-data-from-verified-government-and-private-entities'),
      andMore: tr('more-data-sources'),
    },
    cta: {
      title: tr('ready-to-expand-confidently'),
      sub: tr('join-leading-saudi-businesses-using-s-locator-to-find-their-next-branch-location'),
      btn: tr('try-without-sign-up'),
    },
    footer: tr('copyright-2025-s-locator-intelligence-all-rights-reserved'),
  };
};
