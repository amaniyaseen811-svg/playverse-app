/* ===== نظام موحد لكل الألعاب (Universal Game System) ===== */

/**
 * 🎮 هذا النظام بينطبق على كل ألعاب PlayVerse
 * الحل الصحيح للمشاكل:
 * 1. اتجاه ثابت RTL (لحد ما تكمل الترجمات)
 * 2. نظام ترجمات موحد
 * 3. حفظ اللغة المختارة
 */

// ═══════════════════════════════════════════════════════════
// 1️⃣ نظام الاتجاه الموحد
// ═══════════════════════════════════════════════════════════

const GameDirectionSystem = {
  /**
   * الوضع الحالي: RTL ثابت
   * السبب: الترجمات ما كاملة بعد
   * لما تكمل: غيّري ALWAYS_RTL إلى false
   */
  ALWAYS_RTL: true,  // ✅ اتركيها true الآن
  
  /**
   * تطبيق الاتجاه على الصفحة
   */
  apply: function(langCode) {
    if (this.ALWAYS_RTL) {
      // ✅ الحل الحالي: RTL دائماً
      document.documentElement.dir = 'rtl';
    } else {
      // للمستقبل: تقليب ديناميكي
      const rtlLangs = ['ar', 'he', 'fa'];
      document.documentElement.dir = rtlLangs.includes(langCode) ? 'rtl' : 'ltr';
    }
    
    document.documentElement.lang = langCode;
  },
  
  /**
   * تفعيل الترجمات الحقيقية (لما تكمل)
   */
  enableDynamicDirection: function() {
    console.log('✅ تم تفعيل الاتجاه الديناميكي - الترجمات كاملة الآن!');
    this.ALWAYS_RTL = false;
  }
};

// ═══════════════════════════════════════════════════════════
// 2️⃣ نظام الترجمات الموحد
// ═══════════════════════════════════════════════════════════

const GameTranslationSystem = {
  /**
   * الترجمات الأساسية لكل لعبة
   * استخدمي هذا الهيكل في كل لعبة
   */
  translations: {
    ar: {
      start: 'ابدأي',
      next: 'التالي',
      back: 'السابق',
      score: 'النقاط',
      level: 'المرحلة',
      correct: 'إجابة صحيحة!',
      wrong: 'إجابة خاطئة!',
      hint: 'تلميح:',
      fact: 'حقيقة:',
      submit: 'إرسال',
      retry: 'حاولي مجدداً',
      finish: 'انتهيت',
      loading: 'جاري التحميل...',
      error: 'حدثت مشكلة'
    },
    en: {
      start: 'Start',
      next: 'Next',
      back: 'Back',
      score: 'Score',
      level: 'Level',
      correct: 'Correct!',
      wrong: 'Wrong!',
      hint: 'Hint:',
      fact: 'Fact:',
      submit: 'Submit',
      retry: 'Try Again',
      finish: 'Finish',
      loading: 'Loading...',
      error: 'An error occurred'
    },
    fr: {
      start: 'Commencer',
      next: 'Suivant',
      back: 'Précédent',
      score: 'Points',
      level: 'Niveau',
      correct: 'Correct!',
      wrong: 'Faux!',
      hint: 'Indice:',
      fact: 'Fait:',
      submit: 'Soumettre',
      retry: 'Réessayer',
      finish: 'Terminer',
      loading: 'Chargement...',
      error: 'Une erreur est survenue'
    },
    es: {
      start: 'Comenzar',
      next: 'Siguiente',
      back: 'Atrás',
      score: 'Puntos',
      level: 'Nivel',
      correct: '¡Correcto!',
      wrong: '¡Incorrecto!',
      hint: 'Pista:',
      fact: 'Hecho:',
      submit: 'Enviar',
      retry: 'Intentar de nuevo',
      finish: 'Terminar',
      loading: 'Cargando...',
      error: 'Ocurrió un error'
    }
  },
  
  /**
   * الحصول على الترجمة
   */
  get: function(key, langCode = 'ar') {
    const lang = this.translations[langCode] || this.translations.ar;
    return lang[key] || key;
  },
  
  /**
   * الحصول على جميع الترجمات للغة
   */
  getAll: function(langCode = 'ar') {
    return this.translations[langCode] || this.translations.ar;
  }
};

// ═══════════════════════════════════════════════════════════
// 3️⃣ نظام تبديل اللغات الموحد
// ═══════════════════════════════════════════════════════════

window.setLang = function(langCode) {
  // حفظ اللغة المختارة
  try { 
    localStorage.setItem('pv_lang', langCode);
  } catch(e) { 
    console.error('❌ خطأ في حفظ اللغة:', e);
  }
  
  // تطبيق الاتجاه
  GameDirectionSystem.apply(langCode);
  
  // تحديث أزرار اللغات
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === langCode);
  });
  
  // إعادة تحميل الصفحة
  location.reload();
};

// ═══════════════════════════════════════════════════════════
// 4️⃣ تهيئة النظام عند التحميل
// ═══════════════════════════════════════════════════════════

function initGameSystem() {
  // الحصول على اللغة المحفوظة
  const savedLang = localStorage.getItem('pv_lang') || 'ar';
  
  // تطبيق الاتجاه
  GameDirectionSystem.apply(savedLang);
  
  // تحديث أزرار اللغات
  document.querySelectorAll('.lang-btn').forEach(btn => {
    const isActive = btn.getAttribute('data-lang') === savedLang;
    btn.classList.toggle('active', isActive);
  });
  
  console.log('✅ تم تهيئة نظام اللعبة الموحد');
}

// تنفيذ التهيئة
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGameSystem);
} else {
  setTimeout(initGameSystem, 100);
}

// ═══════════════════════════════════════════════════════════
// 5️⃣ أدوات تطوير (للاختبار)
// ═══════════════════════════════════════════════════════════

window.GameSystem = {
  /**
   * معلومات النظام الحالي
   */
  info: function() {
    console.clear();
    console.log('╔════════════════════════════════════════╗');
    console.log('║     معلومات نظام اللعبة الموحد        ║');
    console.log('╚════════════════════════════════════════╝');
    console.log(`
🔧 الإعدادات:
   • اتجاه ثابت RTL: ${GameDirectionSystem.ALWAYS_RTL ? '✅ مفعّل' : '❌ معطّل'}
   • اللغة الحالية: ${localStorage.getItem('pv_lang') || 'ar'}
   • الاتجاه الحالي: ${document.documentElement.dir}
   
🌐 اللغات المدعومة: ar, en, fr, es
   (يمكن إضافة المزيد في GameTranslationSystem.translations)

💡 الأوامر:
   • GameSystem.info() - هذه المعلومات
   • GameSystem.testLang('en') - اختبري لغة
   • GameSystem.enableDynamicDirection() - فعّلي الاتجاه الديناميكي
    `);
  },
  
  /**
   * اختبار لغة معينة
   */
  testLang: function(langCode) {
    console.log(`🔄 اختبار اللغة: ${langCode}`);
    setLang(langCode);
  },
  
  /**
   * تفعيل الاتجاه الديناميكي
   */
  enableDynamicDirection: function() {
    GameDirectionSystem.enableDynamicDirection();
    location.reload();
  }
};

// عرض المساعدة تلقائياً (مرة واحدة فقط)
if (!localStorage.getItem('game_system_help_shown')) {
  console.log('💡 نصيحة: اكتبي GameSystem.info() في console للمساعدة');
  localStorage.setItem('game_system_help_shown', 'true');
}
