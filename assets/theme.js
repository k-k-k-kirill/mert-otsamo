function isPartiallyInViewport(el) {
  const rect = el.getBoundingClientRect();

  return (
    rect.bottom >= 0 &&
    rect.right >= 0 &&
    rect.top <= document.documentElement.clientHeight &&
    rect.left <= document.documentElement.clientWidth
  );
}

function isCompletelyOutOfViewport(el) {
  return !isPartiallyInViewport(el);
}

document.addEventListener("DOMContentLoaded", function () {
  const leftBracket = document.querySelector("path#path-left");
  const rightBracket = document.querySelector("path#path-right");
  const overlay = document.querySelector(".logo-animation-overlay");
  const landingPageContent = document.querySelector(".landing-page-container");

  let scrollCounter = 0;
  let isPageRevealed = false;
  let lastScrollTime = Date.now();
  let scrollVelocity = 0;
  let lastScrollCounter = 0;

  function updateBrackets() {
    const currentTime = Date.now();
    const timeDelta = currentTime - lastScrollTime;

    if (timeDelta > 16) {
      scrollVelocity = Math.abs(scrollCounter - lastScrollCounter) / timeDelta;
      lastScrollTime = currentTime;
      lastScrollCounter = scrollCounter;
    }

    const scale = Math.max(0.1, 1 + Math.abs(scrollCounter) * 0.001);
    const movement = Math.abs(scrollCounter) * 0.3;
    const screenWidth = window.innerWidth;
    const isBracketsOffScreen =
      isCompletelyOutOfViewport(leftBracket) &&
      isCompletelyOutOfViewport(rightBracket);
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
      } else {
        overlay.style.display = "flex";
        const bgColor = `rgba(245, 245, 245, ${opacity})`;
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

  window.addEventListener(
    "wheel",
    function (event) {
      if (isPageRevealed) {
        return;
      }

      event.preventDefault();

      const delta = event.deltaY;
      scrollCounter += delta * 1.4;

      scrollCounter = Math.max(0, scrollCounter);

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

      scrollCounter += delta * 6;
      scrollCounter = Math.max(0, scrollCounter);

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
