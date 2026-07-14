export function render(root) {
  root.innerHTML = `
    <div class="premium-dashboard">
      
      <!-- Left Ad Marquee -->
      <div class="ad-marquee-column left-marquee">
        <div class="ad-marquee-track marquee-up">
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Pfizer</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Novartis</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> Roche</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> AstraZeneca</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Sanofi</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Pfizer</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Novartis</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> Roche</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> AstraZeneca</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Sanofi</div>
        </div>
      </div>

      <!-- Center Content -->
      <div class="dashboard-center">
        

        <!-- 3D DNA Animation Container -->
        <div class="dna-container">
          <div class="dna-strand">
            ${Array.from({length: 12}).map((_, i) => `<div class="dna-pair" style="--i: ${i};"></div>`).join("")}
          </div>
        </div>
        
        <!-- Glassmorphism Bilingual Card -->
        <div class="dashboard-glass-card">
          <!-- Floating Robot Mascot Left -->
          <div class="floating-robot robot-left">
            <img src="robot.png" alt="AI Medical Robot" />
          </div>
          <!-- Floating Robot Mascot Right -->
          <div class="floating-robot robot-right">
            <img src="robot.png" alt="AI Medical Robot" />
          </div>

          <div class="bilingual-text">
            <h1 class="slide-up-text title-glow">MediNova Emergency AI</h1>
            <div class="lang-block slide-up-text delay-1" dir="rtl">
              <h3>نظام طوارئ ذكي</h3>
              <p>مرحباً بكم في نظام طوارئ ميدينوفا. اختر مكان الألم من المجسم ثلاثي الأبعاد لبدء التشخيص والفرز السريع.</p>
            </div>
            <div class="lang-divider slide-up-text delay-1"></div>
            <div class="lang-block slide-up-text delay-2">
              <h3>Intelligent Triage System</h3>
              <p>Welcome to MediNova Emergency AI. Select your pain location from the 3D model to start rapid triage and assessment.</p>
            </div>
          </div>
          <div class="dashboard-actions slide-up-text delay-3">
            <button class="premium-cta-btn" id="start-triage-btn">
              <span class="pulse-dot"></span> 
              <span class="cta-text">ابدأ فحص الطوارئ &nbsp;|&nbsp; Start Triage</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button class="guide-btn" id="guide-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              دليل الاستخدام | User Guide
            </button>
          </div>
        </div>

      </div>

      <!-- Right Ad Marquee -->
      <div class="ad-marquee-column right-marquee">
        <div class="ad-marquee-track marquee-down">
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> J & J</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Medtronic</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> GE Health</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Siemens</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Bayer</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> J & J</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Medtronic</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> GE Health</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> Siemens</div>
          <div class="ad-logo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> Bayer</div>
        </div>
      </div>
      
      <!-- Background Ambient Glow -->
      <div class="ambient-glow glow-1"></div>
      <div class="ambient-glow glow-2"></div>

    </div>
  `;

  // Redirect to 3D model body picker when clicking the main CTA
  const startBtn = root.querySelector("#start-triage-btn");
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      window.location.hash = "#/body";
    });
  }

  // Handle Guide Button
  const guideBtn = root.querySelector("#guide-btn");
  if (guideBtn) {
    guideBtn.addEventListener("click", () => {
      window.location.hash = "#/guide";
    });
  }
}
