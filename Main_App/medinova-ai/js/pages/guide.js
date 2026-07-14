import { currentLang } from "../app.js";

export function render(root) {
  const content = `
    <div class="guide-container fade-in">
      <div class="guide-header">
        <button id="guide-back-btn" class="hdr-btn" title="Back / العودة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1>دليل المستخدم الشامل | Comprehensive User Guide</h1>
      </div>
      
      <div class="guide-body">
        <div class="guide-intro">
          <p dir="rtl" style="margin-bottom: 0;">مرحباً بك في <strong>MediNova-AI</strong>، المساعد الطبي المتكامل الخاص بك. يوفر هذا النظام الذكي ثلاث خدمات رئيسية: تحديد مكان الألم عبر مجسم ثلاثي الأبعاد، محادثة طبية ذكية، وتحليل متقدم للصور والأشعة الطبية باستخدام 9 نماذج ذكاء اصطناعي.</p>
          <div class="lang-divider" style="margin: 15px auto;"></div>
          <p dir="ltr" style="margin-bottom: 0;">Welcome to <strong>MediNova-AI</strong>, your integrated medical assistant. This intelligent system provides three main services: 3D pain localization, an intelligent medical chatbot, and advanced medical imaging analysis using 9 AI models.</p>
        </div>

        <!-- Section 1: 3D Body & Chatbot -->
        <h2 dir="rtl" style="text-align: right; color: #06b6d4; margin-top: 50px; margin-bottom: 20px;">
          <svg style="width: 28px; height: 28px; vertical-align: middle; margin-left: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          النظام التفاعلي والمحادثة (Interactive System & Chatbot)
        </h2>
        
        <div class="features-grid">
          <div class="guide-card">
            <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
            <h3 dir="rtl">المجسم التفاعلي (3D Body Map)</h3>
            <p dir="rtl">يمكنك من خلال صفحة الطوارئ اختيار مكان الألم مباشرة على مجسم ثلاثي الأبعاد. بمجرد الضغط على العضو (مثل الصدر، الظهر، الرأس)، سيقوم النظام تلقائياً بتوجيهك للمحادثة وبدء التشخيص بناءً على مكان الألم الدقيق.</p>
          </div>
          <div class="guide-card">
            <div class="card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="22"></line></svg></div>
            <h3 dir="rtl">المحادثة الصوتية (Voice Chatbot)</h3>
            <p dir="rtl">المساعد الذكي يدعم المحادثة الصوتية بالكامل. يمكنك التحدث معه وشرح أعراضك، وسيقوم بالرد عليك بالنص والصوت. النظام يدعم اللغتين <strong>العربية والإنجليزية</strong> بطلاقة للتشخيص المبدئي وتقديم النصائح.</p>
          </div>
        </div>

        <!-- Section 2: 9 AI Models -->
        <h2 dir="rtl" style="text-align: right; color: #06b6d4; margin-top: 50px; margin-bottom: 20px;">
          <svg style="width: 28px; height: 28px; vertical-align: middle; margin-left: 10px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12h4l2-9 5 18 2-9h5"></path></svg>
          نماذج الذكاء الاصطناعي الـ 9 (Our 9 AI Models)
        </h2>
        <p dir="rtl" style="text-align: right; margin-bottom: 30px; font-size: 16px;">
          يحتوي النظام على 9 نماذج مدربة بدقة عالية لتحليل مختلف أنواع الأشعة والصور الطبية:
        </p>

        <div class="guide-features">
          
          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">1 & 2. أمراض الجلد (Skin Cancer V1 & V2)</h3>
            <p><strong>نوع الصورة:</strong> صورة فحص الجلد (Dermatoscopy).</p>
            <p><strong>الأمراض المكتشفة:</strong> الورم الميلانيني (Melanoma)، سرطان الخلايا القاعدية، سرطان الخلايا الحرشفية، التقرن السفعي، الأورام الحميدة، والمزيد.</p>
            <p style="font-size: 12px; color: var(--ink-muted);">* يتوفر نموذجان: الإصدار المحلي السريع، والإصدار المطور (API) بدقة 96.2%.</p>
          </div>

          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">3 & 4. أمراض الرئة (Chest X-Ray V1 & V2)</h3>
            <p><strong>نوع الصورة:</strong> أشعة سينية للصدر (Chest X-Ray).</p>
            <p><strong>الأمراض المكتشفة:</strong> كوفيد-19، التهاب رئوي بكتيري وفيروسي، السل (Tuberculosis)، انتفاخ الرئة، والحالة الطبيعية.</p>
            <p style="font-size: 12px; color: var(--ink-muted);">* يتوفر نموذجان: الإصدار الأساسي، وإصدار (PyTorch Hybrid) بدقة 96.9%.</p>
          </div>

          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">5. سرطان الثدي (Breast Cancer)</h3>
            <p><strong>نوع الصورة:</strong> أشعة الموجات فوق الصوتية (Ultrasound).</p>
            <p><strong>الأمراض المكتشفة:</strong> يصنف الأورام إلى خبيثة (Malignant) وحميدة (Benign) وطبيعية، مع تحديد دقيق لمكان الورم في الصورة (Segmentation).</p>
          </div>

          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">6. أمراض العيون (Eye Diseases)</h3>
            <p><strong>نوع الصورة:</strong> صورة قاع العين (Fundus Image).</p>
            <p><strong>الأمراض المكتشفة:</strong> الجلوكوما (Glaucoma)، الماء الأبيض (Cataract)، واعتلال الشبكية السكري.</p>
          </div>

          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">7. أورام الدماغ (Brain Tumor)</h3>
            <p><strong>نوع الصورة:</strong> أشعة الرنين المغناطيسي (MRI Scan).</p>
            <p><strong>الأمراض المكتشفة:</strong> ورم الغليوما، ورم السحايا، ورم الغدة النخامية، أو لا يوجد ورم.</p>
          </div>

          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">8. حجم القلب (Heart Segmentation)</h3>
            <p><strong>نوع الصورة:</strong> مخطط صدى القلب (Echocardiography).</p>
            <p><strong>الأمراض المكتشفة:</strong> يحدد حجم القلب لاكتشاف تضخم عضلة القلب (Cardiomegaly) ما إذا كان طبيعياً، كبيراً قليلاً، أو كبيراً بشكل غير طبيعي.</p>
          </div>

          <div class="feature-card" dir="rtl">
            <h3 style="color: #06b6d4;">9. أمراض الكلى (Kidney Disease)</h3>
            <p><strong>نوع الصورة:</strong> أشعة مقطعية (CT Scan).</p>
            <p><strong>الأمراض المكتشفة:</strong> حصوة الكلى (Kidney Stone)، أكياس الكلى، أورام الكلى، أو كلى طبيعية.</p>
          </div>

        </div>
        
        <div style="text-align: center; margin-top: 60px; margin-bottom: 20px;">
          <button class="premium-cta-btn" id="start-triage-guide">
            <span class="pulse-dot"></span> 
            <span class="cta-text">العودة للرئيسية | Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  `;

  root.innerHTML = content;


  if (!document.getElementById("guide-styles")) {
    const style = document.createElement("style");
    style.id = "guide-styles";
    style.innerHTML = `
      .guide-container {
        padding: 40px;
        max-width: 1000px;
        margin: 0 auto;
        color: var(--ink);
        height: calc(100vh - 120px);
        overflow-y: auto;
      }
      .guide-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 40px;
        border-bottom: 1px solid var(--border);
        padding-bottom: 20px;
      }
      .guide-header h1 {
        font-size: 32px;
        color: #06b6d4;
        margin: 0;
      }
      .guide-intro {
        font-size: 16px;
        line-height: 1.8;
        color: var(--ink);
        text-align: center;
        background: var(--surface-2);
        padding: 30px;
        border-radius: var(--radius-l);
        border: 1px solid var(--border);
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
      }
      
      .features-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      @media (max-width: 768px) {
        .features-grid { grid-template-columns: 1fr; }
      }
      .guide-card {
        background: linear-gradient(145deg, var(--surface), var(--surface-2));
        padding: 30px;
        border-radius: var(--radius-l);
        border: 1px solid var(--border);
        text-align: right;
        transition: transform 0.3s ease;
      }
      .guide-card:hover {
        transform: translateY(-5px);
        border-color: #06b6d4;
      }
      .card-icon {
        width: 50px;
        height: 50px;
        background: rgba(6, 182, 212, 0.1);
        color: #06b6d4;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
        margin-left: auto;
      }
      .card-icon svg { width: 24px; height: 24px; }
      .guide-card h3 { color: #06b6d4; margin-bottom: 10px; font-size: 20px; }
      .guide-card p { font-size: 15px; line-height: 1.6; color: var(--ink-muted); margin: 0; }

      .guide-features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }
      .feature-card {
        background: var(--surface);
        padding: 25px;
        border-radius: var(--radius-l);
        border: 1px solid var(--border);
        transition: all 0.3s ease;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
      }
      .feature-card:hover {
        transform: translateY(-5px);
        border-color: #06b6d4;
        box-shadow: 0 10px 30px rgba(6, 182, 212, 0.1);
      }
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px auto;
      }
      .feature-icon svg {
        width: 30px;
        height: 30px;
      }
      .feature-card h3 {
        font-size: 18px;
        margin-bottom: 10px;
        margin-top: 10px;
        color: var(--ink);
      }
      .feature-card p {
        font-size: 14px;
        line-height: 1.6;
        color: var(--ink-muted);
      }
      .lang-divider {
        width: 50px;
        height: 2px;
        background: var(--border);
      }
    `;
    document.head.appendChild(style);
  }

  // Event Listeners
  const backBtn = root.querySelector("#guide-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.hash = "#/home";
    });
  }

  const startBtn = root.querySelector("#start-triage-guide");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.location.hash = "#/chatbot";
    });
  }
}

