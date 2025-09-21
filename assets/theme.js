document.addEventListener("DOMContentLoaded", function () {
  const leftBracket = document.querySelector("path#path-left");
  const rightBracket = document.querySelector("path#path-right");
  const overlay = document.querySelector(".logo-animation-overlay");
  const landingPageContent = document.querySelector(".landing-page-container");

  let scrollCounter = 0;
  const maxScroll = 2000;
  let isPageRevealed = false;

  function updateBrackets() {
    const scale = Math.max(0.1, 1 + Math.abs(scrollCounter) * 0.001);
    const movement = Math.abs(scrollCounter) * 0.3;
    const bracketSize = 224 * scale;
    const bracketPosition = movement + bracketSize / 2;
    const screenWidth = window.innerWidth;
    const revealThreshold = screenWidth * 0.3;
    const opacity = Math.max(
      0,
      1 - Math.max(0, bracketPosition - revealThreshold) / (screenWidth * 0.4)
    );

    const isBracketsOffScreen = bracketPosition > screenWidth * 0.5;

    if (isBracketsOffScreen && !isPageRevealed) {
      isPageRevealed = true;
    }

    let contentScale, contentOpacity;

    if (isBracketsOffScreen) {
      contentScale = 1;
      contentOpacity = 1;
    } else {
      contentScale = Math.min(
        1,
        Math.max(0.1, 0.1 + Math.abs(scrollCounter) * 0.0003)
      );
      contentOpacity = Math.max(0, 1 - opacity);
    }

    if (leftBracket) {
      leftBracket.style.transformOrigin = "center";
      leftBracket.style.transform = `scale(${scale}) translateX(${-movement}px)`;
    }

    if (rightBracket) {
      rightBracket.style.transformOrigin = "center";
      rightBracket.style.transform = `scale(${scale}) translateX(${movement}px)`;
    }

    if (overlay) {
      if (isPageRevealed) {
        overlay.style.display = "none";
      } else {
        overlay.style.display = "flex";
        overlay.style.opacity = opacity;
      }
    }

    if (landingPageContent) {
      if (isBracketsOffScreen) {
        landingPageContent.style.transform = "scale(1)";
        landingPageContent.style.transformOrigin = "center";
        landingPageContent.style.opacity = 1;
      } else {
        landingPageContent.style.transform = `scale(${contentScale})`;
        landingPageContent.style.transformOrigin = "center";
        landingPageContent.style.opacity = contentOpacity;
      }
    }
  }

  window.addEventListener(
    "wheel",
    function (event) {
      if (isPageRevealed) {
        return;
      }

      event.preventDefault();

      const delta = event.deltaY;
      scrollCounter += delta * 0.5;

      scrollCounter = Math.max(0, Math.min(maxScroll, scrollCounter));

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

      scrollCounter += delta * 0.3;
      scrollCounter = Math.max(0, Math.min(maxScroll, scrollCounter));

      touchStartY = touchY;
      requestAnimationFrame(updateBrackets);
    },
    { passive: false }
  );

  window.addEventListener(
    "touchend",
    function () {
      isScrolling = false;
    },
    { passive: true }
  );
});
