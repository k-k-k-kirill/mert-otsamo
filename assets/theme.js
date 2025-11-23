function isMostlyOutOfViewport(el, ratio = 0.85) {
  const rect = el.getBoundingClientRect();
  const viewHeight = document.documentElement.clientHeight;
  const viewWidth = document.documentElement.clientWidth;

  const visibleX = Math.max(
    0,
    Math.min(viewWidth, rect.right) - Math.max(0, rect.left)
  );
  const visibleY = Math.max(
    0,
    Math.min(viewHeight, rect.bottom) - Math.max(0, rect.top)
  );
  const visibleArea = visibleX * visibleY;
  const totalArea = rect.width * rect.height;

  return totalArea > 0 && visibleArea / totalArea <= 1 - ratio;
}

document.addEventListener("DOMContentLoaded", function () {
  // Only run animation code on landing page and in production
  const overlay = document.querySelector(".logo-animation-overlay");
  if (!overlay) {
    return; // Exit early if not on landing page
  }

  // Disable animation on localhost/preview domains
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('127.0.0.1');
  const isProduction = hostname.includes('otsamo.eu');
  
  if (isLocalhost || !isProduction) {
    // Hide overlay immediately on local/preview
    overlay.style.display = 'none';
    overlay.style.pointerEvents = 'none';
    const landingPageContent = document.querySelector(".landing-page-container");
    if (landingPageContent) {
      landingPageContent.style.opacity = '1';
    }
    return; // Exit early on local/preview
  }

  // Show overlay in production
  overlay.style.display = 'flex';

  const leftBracket = document.querySelector("path#path-left");
  const rightBracket = document.querySelector("path#path-right");
  const landingPageContent = document.querySelector(".landing-page-container");

  let scrollCounter = 0;
  let isPageRevealed = false;
  let lastScrollTime = Date.now();
  let scrollVelocity = 0;
  let lastScrollCounter = 0;
  let hintTimeout = null;
  let hintElement = null;

  // NEW: track last user interaction time for "stuck" detection
  let lastUserScrollTime = Date.now();

  function createHint() {
    if (hintElement) return; // Already exists

    const logoAnimationContent = document.querySelector(
      ".logo-animation-content"
    );
    if (!logoAnimationContent) return;

    hintElement = document.createElement("div");
    hintElement.className = "scroll-hint";
    hintElement.innerHTML = `
      <span class="desktop-text">Scroll to reveal</span>
      <span class="mobile-text">Swipe up to reveal</span>
    `;

    logoAnimationContent.appendChild(hintElement);
  }

  function showHint() {
    if (!hintElement) createHint();
    // Force a reflow to ensure transition works
    hintElement.offsetHeight;
    hintElement.style.opacity = "0.7";
  }

  function hideHint() {
    if (hintElement) {
      hintElement.style.opacity = "0";
    }
  }

  function startHintTimer() {
    if (hintTimeout) clearTimeout(hintTimeout);

    hintTimeout = setTimeout(() => {
      if (!isPageRevealed) {
        showHint();
      }
    }, 7000);
  }

  function updateBrackets() {
    const currentTime = Date.now();
    const timeDelta = currentTime - lastScrollTime;

    if (timeDelta > 16) {
      scrollVelocity = Math.abs(scrollCounter - lastScrollCounter) / timeDelta;
      lastScrollTime = currentTime;
      lastScrollCounter = scrollCounter;
    }

    // Hide hint when user starts scrolling
    if (scrollCounter > 0) {
      hideHint();
    }

    const scale = Math.max(0.1, 1 + Math.abs(scrollCounter) * 0.001);
    const movement = Math.abs(scrollCounter) * 0.3;
    const screenWidth = window.innerWidth;

    const isBracketsOffScreen =
      isMostlyOutOfViewport(leftBracket) &&
      isMostlyOutOfViewport(rightBracket);
    const opacity = isBracketsOffScreen ? 0 : 1;

    const extendedMovement = isBracketsOffScreen
      ? movement + screenWidth * 0.8
      : movement;

    if (isBracketsOffScreen && !isPageRevealed) {
      isPageRevealed = true;
    }

    let contentOpacity;

    if (isBracketsOffScreen) {
      contentOpacity = 1;
    } else {
      contentOpacity = Math.max(0, 1 - opacity);
    }

    if (leftBracket) {
      leftBracket.style.transformOrigin = "center";
      leftBracket.style.transform = `translate3d(${-extendedMovement}px, 0, 0) scale3d(${scale}, ${scale}, 1)`;
    }

    if (rightBracket) {
      rightBracket.style.transformOrigin = "center";
      rightBracket.style.transform = `translate3d(${extendedMovement}px, 0, 0) scale3d(${scale}, ${scale}, 1)`;
    }

    if (overlay) {
      if (isBracketsOffScreen) {
        overlay.style.display = "none";
        overlay.style.pointerEvents = "none";
      } else {
        overlay.style.display = "flex";
        const bgColor = `rgba(230, 231, 226, ${opacity})`;
        overlay.style.backgroundColor = bgColor;
        overlay.style.pointerEvents = opacity < 0.1 ? "none" : "auto";
      }
    }

    if (landingPageContent) {
      if (isBracketsOffScreen) {
        const baseDuration = 1.2;
        const velocityFactor = Math.min(
          1.5,
          Math.max(0.8, 1 / (scrollVelocity * 500 + 0.2))
        );
        const transitionDuration = baseDuration * velocityFactor;

        landingPageContent.style.transition = `opacity ${transitionDuration}s ease-out`;
        landingPageContent.style.opacity = 1;
      } else {
        landingPageContent.style.transition = "none";
        landingPageContent.style.opacity = contentOpacity;
      }
    }
  }

  // NEW: "stuck" watchdog that does NOT change normal behavior, only rescues edge cases
  const STUCK_IDLE_TIME = 500; // ms with no scroll/touch
  const STUCK_CHECK_INTERVAL = 300; // how often we check
  const STUCK_RATIO = 0.95; // how much of the brackets must be out

  setInterval(function () {
    if (isPageRevealed) return;
    if (!leftBracket || !rightBracket) return;

    const now = Date.now();
    const idleTime = now - lastUserScrollTime;

    if (idleTime < STUCK_IDLE_TIME) {
      return; // user is still interacting or just stopped
    }

    // Re-check with a slightly stricter ratio to ensure they really are almost fully out
    const leftOff = isMostlyOutOfViewport(leftBracket, STUCK_RATIO);
    const rightOff = isMostlyOutOfViewport(rightBracket, STUCK_RATIO);

    if (leftOff && rightOff) {
      // Brackets are basically gone and user is idle,
      // but normal logic hasn't flipped isPageRevealed yet → force reveal.
      isPageRevealed = true;

      if (overlay) {
        overlay.style.display = "none";
        overlay.style.pointerEvents = "none";
      }

      if (landingPageContent) {
        const baseDuration = 1.2;
        const velocityFactor = Math.min(
          1.5,
          Math.max(0.8, 1 / (scrollVelocity * 500 + 0.2))
        );
        const transitionDuration = baseDuration * velocityFactor;

        landingPageContent.style.transition = `opacity ${transitionDuration}s ease-out`;
        landingPageContent.style.opacity = 1;
      }
    }
  }, STUCK_CHECK_INTERVAL);

  // Start the hint timer when page loads
  startHintTimer();

  window.addEventListener(
    "wheel",
    function (event) {
      if (isPageRevealed) {
        return;
      }

      event.preventDefault();

      const delta = event.deltaY;
      scrollCounter += delta * 3.2;

      scrollCounter = Math.max(0, scrollCounter);

      // Hide hint and reset timer when user scrolls
      hideHint();
      startHintTimer();

      lastUserScrollTime = Date.now();

      requestAnimationFrame(updateBrackets);
    },
    { passive: false }
  );

  let touchStartY = 0;
  let isScrolling = false;

  window.addEventListener(
    "touchstart",
    function (event) {
      touchStartY = event.touches[0].clientY;
      isScrolling = true;
      lastUserScrollTime = Date.now();
    },
    { passive: true }
  );

  window.addEventListener(
    "touchmove",
    function (event) {
      if (!isScrolling || isPageRevealed) return;

      event.preventDefault();

      const touchY = event.touches[0].clientY;
      const delta = touchStartY - touchY;

      scrollCounter += delta * 5;
      scrollCounter = Math.max(0, scrollCounter);

      // Hide hint and reset timer when user scrolls
      hideHint();
      startHintTimer();

      lastUserScrollTime = Date.now();

      touchStartY = touchY;
      requestAnimationFrame(updateBrackets);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchend",
    function () {
      isScrolling = false;
      lastUserScrollTime = Date.now();
    },
    { passive: true }
  );
});

// Mobile Menu Toggle
(function() {
  'use strict';
  
  function initMobileMenu() {
    const menuToggle = document.querySelector(".site-menu-toggle");
    const mobileMenu = document.querySelector(".site-mobile-menu");
    const mobileMenuClose = document.querySelector(".site-mobile-menu-close");
    const body = document.body;

    if (!menuToggle || !mobileMenu) {
      return;
    }

    function openMenu() {
      menuToggle.setAttribute("aria-expanded", "true");
      mobileMenu.classList.add("is-open");
      document.documentElement.classList.add("menu-open");
      body.style.overflow = "hidden";
      body.style.position = "fixed";
      body.style.width = "100%";
      body.style.top = `-${window.scrollY}px`;
    }

    function closeMenu() {
      const scrollY = body.style.top;
      menuToggle.setAttribute("aria-expanded", "false");
      mobileMenu.classList.remove("is-open");
      document.documentElement.classList.remove("menu-open");
      body.style.overflow = "";
      body.style.position = "";
      body.style.width = "";
      body.style.top = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    menuToggle.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      });
    }

    // Close menu when clicking outside
    mobileMenu.addEventListener("click", function (e) {
      if (e.target === mobileMenu) {
        closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        closeMenu();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileMenu);
  } else {
    initMobileMenu();
  }
})();
