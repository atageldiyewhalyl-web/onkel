const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const COOKIE_KEY = "onkel_cookie_consent";
const GA_ID = "G-XXXXXXXXXX"; // replace with real Measurement ID

function loadGA() {
  if (document.getElementById("ga-script")) return;
  const s = document.createElement("script");
  s.id = "ga-script";
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  s.async = true;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", GA_ID, { anonymize_ip: true });
}

function initCookieBanner() {
  const stored = localStorage.getItem(COOKIE_KEY);
  if (stored === "accepted") { loadGA(); return; }
  if (stored === "declined") return;

  const banner = document.createElement("div");
  banner.id = "cookie-banner";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-label", "Cookie-Einstellungen");
  banner.innerHTML = `
    <div class="cookie-inner">
      <div class="cookie-text">
        <strong>Cookies & Datenschutz</strong>
        <p>Wir nutzen Google Analytics, um die Nutzung unserer Website zu verstehen und unser Angebot zu verbessern. Ihre Daten werden anonymisiert erhoben. <a href="/datenschutz/">Mehr erfahren</a></p>
      </div>
      <div class="cookie-actions">
        <button class="cookie-btn cookie-decline" id="cookie-decline">Ablehnen</button>
        <button class="cookie-btn cookie-accept" id="cookie-accept">Akzeptieren</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);

  requestAnimationFrame(() => requestAnimationFrame(() => banner.classList.add("is-visible")));

  const dismiss = (choice) => {
    localStorage.setItem(COOKIE_KEY, choice);
    banner.classList.remove("is-visible");
    banner.addEventListener("transitionend", () => banner.remove(), { once: true });
    if (choice === "accepted") loadGA();
  };

  document.getElementById("cookie-accept").addEventListener("click", () => dismiss("accepted"));
  document.getElementById("cookie-decline").addEventListener("click", () => dismiss("declined"));
}

function initServiceAnimations() {
  if (!window.lottie) return;

  const items = [...document.querySelectorAll("[data-lottie]")];
  const animations = items.map((container) => {
    const animation = window.lottie.loadAnimation({
      container,
      renderer: "svg",
      loop: true,
      autoplay: false,
      path: container.dataset.lottie,
      rendererSettings: {
        preserveAspectRatio: "xMidYMid meet",
      },
    });

    animation.setSpeed(0.8);
    return { container, animation };
  });

  if (reduceMotion) {
    animations.forEach(({ animation }) => animation.goToAndStop(0, true));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const item = animations.find(({ container }) => container === entry.target);
        if (!item) return;

        if (entry.isIntersecting) {
          item.animation.play();
        } else {
          item.animation.pause();
        }
      });
    },
    { threshold: 0.25 },
  );

  animations.forEach(({ container }) => observer.observe(container));
}

function initScrollReveal() {
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const targets = document.querySelectorAll(
    ".intro-content, .intro-image, .services-header, .service-card, " +
      ".cta-panel, .why-header, .why-card, .why-footer, " +
      ".process-header, .process-step, .process-cta, " +
      ".area-inner, .faq-intro, .faq-item, " +
      ".final-content, .final-actions, .footer-inner",
  );

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
  );

  targets.forEach((el, index) => {
    el.classList.add("reveal");
    if (el.classList.contains("service-card") || el.classList.contains("why-card")) {
      el.style.transitionDelay = `${(index % 4) * 70}ms`;
    }
    observer.observe(el);
  });
}

function initMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("mobile-menu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    document.body.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
  };

  toggle.addEventListener("click", () => {
    setOpen(!document.body.classList.contains("nav-open"));
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980) setOpen(false);
  });
}

function initNavDropdown() {
  document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
    const toggle = dropdown.querySelector(".nav-dropdown-toggle");
    if (!toggle) return;

    const open = (state) => {
      dropdown.classList.toggle("is-open", state);
      toggle.setAttribute("aria-expanded", state ? "true" : "false");
    };

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      open(!dropdown.classList.contains("is-open"));
    });

    document.addEventListener("click", () => open(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); });
  });
}

function initStickyCTA() {
  const bar = document.getElementById("sticky-cta");
  const hero = document.querySelector(".hero");
  const finalCta = document.querySelector(".final-cta");
  if (!bar || !hero) return;

  let heroGone = false;
  let finalVisible = false;

  const update = () => {
    const bannerUp = !!document.getElementById("cookie-banner");
    const show = heroGone && !finalVisible && !bannerUp;
    bar.classList.toggle("is-visible", show);
    bar.setAttribute("aria-hidden", show ? "false" : "true");
  };

  new IntersectionObserver(
    ([entry]) => { heroGone = !entry.isIntersecting; update(); },
    { threshold: 0 }
  ).observe(hero);

  if (finalCta) {
    new IntersectionObserver(
      ([entry]) => { finalVisible = entry.isIntersecting; update(); },
      { threshold: 0.1 }
    ).observe(finalCta);
  }

  // Re-check sticky CTA when banner is dismissed
  document.addEventListener("cookieConsentSet", update);
}

window.addEventListener("DOMContentLoaded", () => {
  initCookieBanner();
  initServiceAnimations();
  initScrollReveal();
  initMobileNav();
  initNavDropdown();
  initStickyCTA();
});
