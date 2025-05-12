// Import utility function for preloading images
import { preloadImages } from './utils.js';
// // Gitpage Domain
const base = import.meta.env.BASE_URL;

// Register the GSAP plugins
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);
console.log("GSAP is registered", ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);

// Initialize GSAP's ScrollSmoother for smooth scrolling and scroll-based effects
const smoother = ScrollSmoother.create({
  smooth: 1, // How long (in seconds) it takes to "catch up"
  effects: true, // Enable data-speed and data-lag-based scroll effects
  normalizeScroll: true, // Normalizes scroll behavior across browsers
});

// Reference to the container that wraps all the 3D scene elements
const sceneWrapper = document.querySelector('.scene-wrapper');

// Global flag to prevent multiple animations from overlapping or triggering at once
let isAnimating = false;

// A Map to store SplitText instances keyed by DOM elements (used for animating text characters)
const splitMap = new Map();

/* Panel Enlarge Behavior */
// let grid = null; // Main grid container
// let frame = null; // Frame overlays
// const grid = document.querySelector('.grid'); // Main grid container
// Linear interpolation helper
// const lerp = (a, b, t) => a + (b - a) * t;
// const frame = document.querySelectorAll(['.frame', '.heading']); // Frame overlays
// const panel = document.querySelector('.panel'); // Panel container
// const panelContent = panel.querySelector('.panel__content'); // Panel content
// let isAnimating = false; // Prevents overlapping animations
// let isPanelOpen = false; // Tracks if the panel is currently open
// let currentItem = null; // Reference to the clicked item
 // Configuration object for animation settings
const config = {
  clipPathDirection: 'top-bottom', // Direction of clip-path animation ('top-bottom', 'bottom-top', 'left-right', 'right-left')
  autoAdjustHorizontalClipPath: true, // Automatically flip horizontal clip-path direction based on panel side
  steps: 6, // Number of mover elements generated between grid item and panel
  stepDuration: 0.35, // Duration (in seconds) for each animation step
  stepInterval: 0.05, // Delay between each mover's animation start
  moverPauseBeforeExit: 0.14, // Pause before mover elements exit after entering
  rotationRange: 0, // Maximum random rotation applied to each mover's Z-axis (tilt left/right)
  wobbleStrength: 0, // Maximum random positional wobble (in pixels) applied horizontally/vertically to each mover path
  panelRevealEase: 'sine.inOut', // Easing function for panel reveal animation
  gridItemEase: 'sine', // Easing function for grid item exit animation
  moverEnterEase: 'sine.in', // Easing function for mover entering animation
  moverExitEase: 'sine', // Easing function for mover exit animation
  panelRevealDurationFactor: 2, // Multiplier to adjust panel reveal animation duration
  clickedItemDurationFactor: 2, // Multiplier to adjust clicked grid item animation duration
  gridItemStaggerFactor: 0.3, // Max delay factor when staggering grid item animations
  moverBlendMode: false, // Optional CSS blend mode for mover elements (false = no blend mode)
  pathMotion: 'linear', // Type of path movement ('linear' or 'sine')
  sineAmplitude: 50, // Amplitude of sine wave for pathMotion 'sine'
  sineFrequency: Math.PI, // Frequency of sine wave for pathMotion 'sine'
};

// Create a deep copy of the initial global config.
// Used to temporarily modify config per item and then reset back after animations.
const originalConfig = { ...config };

/**
 * Loads JSON data and initializes the application
 */
const initApp = async () => {
  try {
    /* Carousel and Previews */
    // Load JSON data
    console.log(`${base}js/carousels.json`);
    const [carouselsResponse, previewsResponse] = await Promise.all([
      fetch(`${base}js/carousels.json`),
      fetch(`${base}js/previews.json`)
    ]);
    
    const carousels = await carouselsResponse.json();
    const previews = await previewsResponse.json();

    // Generate carousels
    const carouselsContainer = document.getElementById('carousels-container');
    carousels.forEach(carousel => {
      const scene = document.createElement('div');
      scene.className = 'scene';
      if (carousel.radius) {
        scene.setAttribute('data-radius', carousel.radius);
      }
      
      scene.innerHTML = `
        <h2 class="scene__title" data-speed="0.7">
          <a href="#${carousel.id}"><span>${carousel.title}</span></a>
        </h2>
        <div class="carousel">
          ${carousel.cells.map(cell => `
            <div class="carousel__cell">
              <div class="card" style="--img: url(${base}assets/${cell.img})">
                <div class="card__face card__face--front"></div>
                <div class="card__face card__face--back"></div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      carouselsContainer.appendChild(scene);
    });

    // Generate previews
    const previewsContainer = document.getElementById('previews-container');

    previews.forEach(preview => {
      const previewDiv = document.createElement('div');
      
      // Custom Preview - About Me
      if (preview.id === 'preview-1') {
        previewDiv.className = 'preview__custom';
        previewDiv.id = preview.id;

        const aboutCaption = `Former nurse turned full-stack developer, now revolutionizing aging through playful <b>AgeTech</b>.<br>
        I'm building a future where getting older feels like leveling up - by injecting gamification into our aging society.<br>
        <br>
        By day, I code. By night, I chase that perfect jazz resonance where voice and body become one.<br>
        Through music and tech, I create experiences that move both body and soul. Let's compose the soundtrack for better aging together.<br>
        Hit reply if you're into:<br>
        <br>
        → <b>AgeTech</b> innovation<br>
        → Human-centered design<br>
        → Music that makes tech sing`;
        const aboutTitle = "About Me";

        previewDiv.innerHTML = `
            <header class="preview__header">
              <h2 class="preview__title"><span>${aboutTitle}</span></h2>
              <button class="preview__close">Close ×</button>
            </header>
            <div class="grid__custom">
              <figure  class="grid__custom__item" role="img">
                <div class="grid__custom__item-image" style="background-image: url(assets/intro_3.jpg)"></div>
                <figcaption class="">
                  <p class="grid__custom__item-text">${aboutCaption}
                    <br><br>
                    <button class='custom-btn resume-btn'>Resume</button>
                    <button class='custom-btn contact-btn'>Contact Me</button>
                  </p>
                </figcaption>
              </figure>
            </div>
        `;
      } else {
        previewDiv.className = 'preview';
        previewDiv.id = preview.id;

        // General Preview Template with 8 Grids
        previewDiv.innerHTML = `
          <header class="preview__header">
            <h2 class="preview__title"><span>${preview.title}</span></h2>
            <button class="preview__close">Close ×</button>
          </header>
          <div class="grid">
            ${preview.images.map((image, index) => `
              <figure aria-labelledby="caption${index + 1}" class="grid__item panel__target" role="img">
              <a href="${base}details/index.html?project=${image.projectName}" target="_blank">
                <div class="grid__item-image" style="background-image: url(${image.img})"></div>
                <figcaption class="grid__item-caption" id="caption${index + 1}">
                  <h3><b>${image.caption}</h3></b>
                </figcaption>
                </a>
              </figure>
            `).join('')}
          </div>
        `;

      }
      previewsContainer.appendChild(previewDiv);

      // Add a grid & frame to the preview
      // grid = previewDiv.querySelector('.grid');
      // frame = document.querySelectorAll(['.frame', '.heading']); // Frame overlays

    });

    // Initialize the application after content is loaded
    init();

  } catch (error) {
    console.error('Error loading data:', error);
  }
};

/**
 * Returns an array of transform strings to evenly space carousel cells in 3D
 */
const getCarouselCellTransforms = (count, radius) => {
  const angleStep = 360 / count;
  return Array.from({ length: count }, (_, i) => {
    const angle = i * angleStep;
    return `rotateY(${angle}deg) translateZ(${radius}px)`;
  });
};

/**
 * Applies 3D transforms to each cell in a given carousel
 */
const setupCarouselCells = (carousel) => {
  const wrapper = carousel.closest('.scene');
  const radius = parseFloat(wrapper.dataset.radius) || 500;
  const cells = carousel.querySelectorAll('.carousel__cell');

  const transforms = getCarouselCellTransforms(cells.length, radius);
  cells.forEach((cell, i) => {
    cell.style.transform = transforms[i];
  });
};

/**
 * Creates a scroll-linked GSAP timeline for a given carousel scene
 */
const createScrollAnimation = (carousel) => {
  const wrapper = carousel.closest('.scene');
  const cards = carousel.querySelectorAll('.card');
  const titleSpan = wrapper.querySelector('.scene__title span');
  const split = splitMap.get(titleSpan);
  const chars = split?.chars || [];

  carousel._timeline = gsap.timeline({
    defaults: { ease: 'sine.inOut' },
    scrollTrigger: {
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });

  carousel._timeline
    .fromTo(carousel, { rotationY: 0 }, { rotationY: -180 }, 0)
    .fromTo(
      carousel,
      { rotationZ: 3, rotationX: 3 },
      { rotationZ: -3, rotationX: -3 },
      0
    )
    .fromTo(
      cards,
      { filter: 'brightness(250%)' },
      { filter: 'brightness(80%)', ease: 'power3' },
      0
    )
    .fromTo(cards, { rotationZ: 10 }, { rotationZ: -10, ease: 'none' }, 0);

  if (chars.length > 0) {
    animateChars(chars, 'in', {
      scrollTrigger: {
        trigger: wrapper,
        start: 'top center',
        toggleActions: 'play none none reverse',
      },
    });
  }

  return carousel._timeline;
};

/**
 * Initializes SplitText instances on key animated elements
 */
const initTextsSplit = () => {
  document
    .querySelectorAll(
      '.scene__title span, .preview__title span, .preview__close'
    )
    .forEach((span) => {
      const split = SplitText.create(span, {
        type: 'chars',
        charsClass: 'char',
        autoSplit: true,
      });
      splitMap.set(span, split);
    });
};

/**
 * Returns interpolated rotation values based on scroll progress
 */
const getInterpolatedRotation = (progress) => ({
  rotationY: gsap.utils.interpolate(0, -180, progress),
  rotationX: gsap.utils.interpolate(3, -3, progress),
  rotationZ: gsap.utils.interpolate(3, -3, progress),
});

/**
 * Animates a single grid item into view
 */
const animateGridItemIn = (el, dx, dy, rotationY, delay) => {
  gsap.fromTo(
    el,
    {
      transformOrigin: `% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`,
      autoAlpha: 0,
      y: dy * 0.5,
      scale: 0.5,
      rotationY: dx < 0 ? rotationY : rotationY,
    },
    {
      y: 0,
      scale: 1,
      rotationY: 0,
      autoAlpha: 1,
      duration: 0.4,
      ease: 'sine',
      delay: delay + 0.1,
    }
  );

  gsap.fromTo(
    el,
    { z: -3500 },
    {
      z: 0,
      duration: 0.3,
      ease: 'expo',
      delay,
    }
  );
};

/**
 * Animates a single grid item out of view
 */
const animateGridItemOut = (el, dx, dy, rotationY, delay, isLast, onComplete) => {
  gsap.to(el, {
    startAt: {
      transformOrigin: `50% 50% ${dx > 0 ? -dx * 0.8 : dx * 0.8}px`,
    },
    y: dy * 0.4,
    rotationY: dx < 0 ? rotationY : rotationY,
    scale: 0.4,
    autoAlpha: 0,
    duration: 0.4,
    ease: 'sine.in',
    delay,
  });
  gsap.to(el, {
    z: -3500,
    duration: 0.4,
    ease: 'expo.in',
    delay: delay + 0.9,
    onComplete: isLast ? onComplete : undefined,
  });
};

/**
 * Animates all grid items in or out with a distance-based stagger
 */
const animateGridItems = ({ items, centerX, centerY, direction = 'in', onComplete }) => {
  const itemData = Array.from(items).map((el) => {
    const rect = el.getBoundingClientRect();
    const elCenterX = rect.left + rect.width / 2;
    const elCenterY = rect.top + rect.height / 2;
    const dx = centerX - elCenterX;
    const dy = centerY - elCenterY;
    const dist = Math.hypot(dx, dy);
    const isLeft = elCenterX < centerX;
    return { el, dx, dy, dist, isLeft };
  });

  const maxDist = Math.max(...itemData.map((d) => d.dist));
  const totalStagger = 0.025 * (itemData.length - 1);

  let latest = { delay: -1, el: null };

  itemData.forEach(({ el, dx, dy, dist, isLeft }) => {
    const norm = maxDist ? dist / maxDist : 0;
    const exponential = Math.pow(direction === 'in' ? 1 - norm : norm, 1);
    const delay = exponential * totalStagger;
    const rotationY = isLeft ? 100 : -100;

    if (direction === 'in') {
      animateGridItemIn(el, dx, dy, rotationY, delay);
    } else {
      if (delay > latest.delay) {
        latest = { delay, el };
      }
      animateGridItemOut(el, dx, dy, rotationY, delay, false, onComplete);
    }
  });

  if (direction === 'out' && latest.el) {
    const { el, dx, dy, isLeft } = itemData.find((d) => d.el === latest.el);
    const rotationY = isLeft ? 100 : -100;
    animateGridItemOut(el, dx, dy, rotationY, latest.delay, true, onComplete);
  }
};

/**
 * Animates all grid items in the preview into view
 */
const animatePreviewGridIn = (preview) => {
  const items = preview.querySelectorAll('.grid__item, .grid__custom__item');
  gsap.set(items, { clearProps: 'all' });
  animateGridItems({
    items,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    direction: 'in',
  });
};

/**
 * Animates all grid items in the preview out of view
 */
const animatePreviewGridOut = (preview) => {
  const items = preview.querySelectorAll('.grid__item, .grid__custom__item');
  const onComplete = () =>
    gsap.set(preview, { pointerEvents: 'none', autoAlpha: 0 });
  animateGridItems({
    items,
    centerX: window.innerWidth / 2,
    centerY: window.innerHeight / 2,
    direction: 'out',
    onComplete,
  });
};

/**
 * Retrieves relevant DOM elements from a scene title
 */
const getSceneElementsFromTitle = (titleEl) => {
  const wrapper = titleEl.closest('.scene');
  const carousel = wrapper?.querySelector('.carousel');
  const cards = carousel?.querySelectorAll('.card');
  const span = titleEl.querySelector('span');
  const chars = splitMap.get(span)?.chars || [];
  return { wrapper, carousel, cards, span, chars };
};

/**
 * Retrieves scene-related elements from a preview element
 */
const getSceneElementsFromPreview = (previewEl) => {
  const previewId = `#${previewEl.id}`;
  const titleLink = document.querySelector(
    `.scene__title a[href="${previewId}"]`
  );
  const titleEl = titleLink?.closest('.scene__title');
  return { ...getSceneElementsFromTitle(titleEl), titleEl };
};

/**
 * Animates SplitText character elements in or out
 */
const animateChars = (chars, direction = 'in', opts = {}) => {
  const base = {
    autoAlpha: direction === 'in' ? 1 : 0,
    duration: 0.02,
    ease: 'none',
    stagger: { each: 0.04, from: direction === 'in' ? 'start' : 'end' },
    ...opts,
  };

  gsap.fromTo(chars, { autoAlpha: direction === 'in' ? 0 : 1 }, base);
};

/**
 * Animates title and close button characters in a preview
 */
const animatePreviewTexts = (preview, direction = 'in', selector = '.preview__title span, .preview__close') => {
  preview.querySelectorAll(selector).forEach((el) => {
    const chars = splitMap.get(el)?.chars || [];
    animateChars(chars, direction);
  });
};

/**
 * Handles transition from carousel view to preview grid
 */
const activatePreviewFromCarousel = (e) => {
  e.preventDefault();
  if (isAnimating) return;
  isAnimating = true;

  const titleEl = e.currentTarget;
  const { wrapper, carousel, cards, chars } = getSceneElementsFromTitle(titleEl);

  const offsetTop = wrapper.getBoundingClientRect().top + window.scrollY;
  const targetY = offsetTop - window.innerHeight / 2 + wrapper.offsetHeight / 2;

  ScrollTrigger.getAll().forEach((t) => t.disable(false));

  gsap
    .timeline({
      defaults: { duration: 1.5, ease: 'power2.inOut' },
      onComplete: () => {
        isAnimating = false;
        ScrollTrigger.getAll().forEach((t) => t.enable());
        carousel._timeline.scrollTrigger.scroll(targetY);
      },
    })
    .to(window, {
      onStart: lockUserScroll,
      onComplete: () => {
        unlockUserScroll();
        smoother.paused(true);
      },
      scrollTo: { y: targetY, autoKill: true },
    })
    .to(
      chars,
      {
        autoAlpha: 0,
        duration: 0.02,
        ease: 'none',
        stagger: { each: 0.04, from: 'end' },
      },
      0
    )
    .to(carousel, { rotationX: 90, rotationY: -360, z: -2000 }, 0)
    .to(
      carousel,
      {
        duration: 2.5,
        ease: 'power3.inOut',
        z: 1500,
        rotationZ: 270,
        onComplete: () => gsap.set(sceneWrapper, { autoAlpha: 0 }),
      },
      0.7
    )
    .to(cards, { rotationZ: 0 }, 0)
    .add(() => {
      const previewSelector = titleEl.querySelector('a')?.getAttribute('href');
      const preview = document.querySelector(previewSelector);
      gsap.set(preview, { pointerEvents: 'auto', autoAlpha: 1 });
      animatePreviewGridIn(preview);
      animatePreviewTexts(preview, 'in');
    }, '<+=1.9');
};

/**
 * Handles transition from preview grid back to carousel view
 */
const deactivatePreviewToCarousel = (e) => {
  if (isAnimating) return;
  isAnimating = true;

  const preview = e.currentTarget.closest('.preview, .preview__custom');
  if (!preview) return;

  const { carousel, cards, chars } = getSceneElementsFromPreview(preview);

  animatePreviewTexts(preview, 'out');
  animatePreviewGridOut(preview);

  gsap.set(sceneWrapper, { autoAlpha: 1 });

  const progress = 0.5;
  const { rotationX, rotationY, rotationZ } = getInterpolatedRotation(progress);

  gsap
    .timeline({
      delay: 0.7,
      defaults: { duration: 1.3, ease: 'expo' },
      onComplete: () => {
        smoother.paused(false);
        isAnimating = false;
      },
    })
    .fromTo(
      chars,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        duration: 0.02,
        ease: 'none',
        stagger: { each: 0.04, from: 'start' },
      }
    )
    .fromTo(
      carousel,
      {
        z: -550,
        rotationX,
        rotationY: -720,
        rotationZ,
        yPercent: 300,
      },
      {
        rotationY,
        yPercent: 0,
      },
      0
    )
    .fromTo(cards, { autoAlpha: 0 }, { autoAlpha: 1 }, 0.3);
};

function preventScroll(e) {
  e.preventDefault();
}

function lockUserScroll() {
  window.addEventListener('wheel', preventScroll, { passive: false });
  window.addEventListener('touchmove', preventScroll, { passive: false });
  window.addEventListener('keydown', preventArrowScroll, false);
}

function unlockUserScroll() {
  window.removeEventListener('wheel', preventScroll);
  window.removeEventListener('touchmove', preventScroll);
  window.removeEventListener('keydown', preventArrowScroll);
}

function preventArrowScroll(e) {
  const keys = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
  if (keys.includes(e.key)) e.preventDefault();
}


/* Panel Enlarge Behavior */

// Extracts per-item configuration overrides from HTML data attributes.
// Reads available data-* attributes from a clicked grid item and returns an object
// with values to temporarily override the global config for the animation.
const extractItemConfigOverrides = (item) => {
  const overrides = {};

  if (item.dataset.clipPathDirection)
    overrides.clipPathDirection = item.dataset.clipPathDirection;
  if (item.dataset.steps) overrides.steps = parseInt(item.dataset.steps);
  if (item.dataset.stepDuration)
    overrides.stepDuration = parseFloat(item.dataset.stepDuration);
  if (item.dataset.stepInterval)
    overrides.stepInterval = parseFloat(item.dataset.stepInterval);
  if (item.dataset.rotationRange)
    overrides.rotationRange = parseFloat(item.dataset.rotationRange);
  if (item.dataset.wobbleStrength)
    overrides.wobbleStrength = parseFloat(item.dataset.wobbleStrength);
  if (item.dataset.moverPauseBeforeExit)
    overrides.moverPauseBeforeExit = parseFloat(
      item.dataset.moverPauseBeforeExit
    );
  if (item.dataset.panelRevealEase)
    overrides.panelRevealEase = item.dataset.panelRevealEase;
  if (item.dataset.gridItemEase)
    overrides.gridItemEase = item.dataset.gridItemEase;
  if (item.dataset.moverEnterEase)
    overrides.moverEnterEase = item.dataset.moverEnterEase;
  if (item.dataset.moverExitEase)
    overrides.moverExitEase = item.dataset.moverExitEase;
  if (item.dataset.panelRevealDurationFactor)
    overrides.panelRevealDurationFactor = parseFloat(
      item.dataset.panelRevealDurationFactor
    );
  if (item.dataset.clickedItemDurationFactor)
    overrides.clickedItemDurationFactor = parseFloat(
      item.dataset.clickedItemDurationFactor
    );
  if (item.dataset.gridItemStaggerFactor)
    overrides.gridItemStaggerFactor = parseFloat(
      item.dataset.gridItemStaggerFactor
    );
  if (item.dataset.moverBlendMode)
    overrides.moverBlendMode = item.dataset.moverBlendMode;
  if (item.dataset.pathMotion) overrides.pathMotion = item.dataset.pathMotion;
  if (item.dataset.sineAmplitude)
    overrides.sineAmplitude = parseFloat(item.dataset.sineAmplitude);
  if (item.dataset.sineFrequency)
    overrides.sineFrequency = parseFloat(item.dataset.sineFrequency);

  return overrides;
};


// Animate hiding the frame overlay
const hideFrame = () => {
  gsap.to(frame, {
    opacity: 0,
    duration: 0.5,
    ease: 'sine.inOut',
    pointerEvents: 'none',
  });
};

// Animate showing the frame overlay
const showFrame = () => {
  gsap.to(frame, {
    opacity: 1,
    duration: 0.5,
    ease: 'sine.inOut',
    pointerEvents: 'auto',
  });
};


// Position the panel based on which side the item was clicked
const positionPanelBasedOnClick = (clickedItem) => {
  const centerX = getElementCenter(clickedItem).x;
  const windowHalf = window.innerWidth / 2;

  const isLeftSide = centerX < windowHalf;

  if (isLeftSide) {
    panel.classList.add('panel--right');
  } else {
    panel.classList.remove('panel--right');
  }

  // ✨ New logic to flip clipPathDirection if enabled
  if (config.autoAdjustHorizontalClipPath) {
    if (
      config.clipPathDirection === 'left-right' ||
      config.clipPathDirection === 'right-left'
    ) {
      config.clipPathDirection = isLeftSide ? 'left-right' : 'right-left';
    }
  }
};


// Get appropriate clip-paths depending on animation direction
const getClipPathsForDirection = (direction) => {
  switch (direction) {
    case 'bottom-top':
      return {
        from: 'inset(0% 0% 100% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(100% 0% 0% 0%)',
      };
    case 'left-right':
      return {
        from: 'inset(0% 100% 0% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(0% 0% 0% 100%)',
      };
    case 'right-left':
      return {
        from: 'inset(0% 0% 0% 100%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(0% 100% 0% 0%)',
      };
    case 'top-bottom':
    default:
      return {
        from: 'inset(100% 0% 0% 0%)',
        reveal: 'inset(0% 0% 0% 0%)',
        hide: 'inset(0% 0% 100% 0%)',
      };
  }
};




// Handle click on a grid item and trigger the full transition
const onGridItemClick = (item) => {
  if (isAnimating) return;
  isAnimating = true;
  currentItem = item;

  // ✨ Merge overrides into global config temporarily
  const overrides = extractItemConfigOverrides(item);
  Object.assign(config, overrides);

  // Position the panel, with updated config
  positionPanelBasedOnClick(item);

  const { imgURL, title, desc } = extractItemData(item);
  setPanelContent({ imgURL, title, desc });

  const allItems = document.querySelectorAll('.grid__item');
  const delays = computeStaggerDelays(item, allItems);
  animatePanelTargets(allItems, item, delays);
  animateTransition(
    item.querySelector('.grid__item-image'),
    panel.querySelector('.panel__img'),
    imgURL
  );
};

// Extract image URL and caption text from a grid item
const extractItemData = (item) => {
  const imgDiv = item.querySelector('.grid__item-image');
  const caption = item.querySelector('figcaption');
  return {
    imgURL: imgDiv.style.backgroundImage,
    title: caption.querySelector('h3').textContent,
    // desc: caption.querySelector('p').textContent, // No inner <p> exists previewDiv
  };
};

// Set the panel's background and text based on clicked item
const setPanelContent = ({ imgURL, title, desc }) => {
  panel.querySelector('.panel__img').style.backgroundImage = imgURL;
  panel.querySelector('h3').textContent = title;
  // panel.querySelector('p').textContent = desc; // No inner <p> exists previewDiv
};

// Calculate the center position of an element
const getElementCenter = (el) => {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
};

// Compute stagger delays for grid item exit animations
const computeStaggerDelays = (clickedItem, items) => {
  const baseCenter = getElementCenter(clickedItem);
  const distances = Array.from(items).map((el) => {
    const center = getElementCenter(el);
    return Math.hypot(center.x - baseCenter.x, center.y - baseCenter.y);
  });
  const max = Math.max(...distances);
  return distances.map((d) => (d / max) * config.gridItemStaggerFactor);
};

// Animate all grid items fading/scaling out, except clicked one
const animatePanelTargets = (items, clickedItem, delays) => {
  const clipPaths = getClipPathsForDirection(config.clipPathDirection);

  gsap.to(items, {
    opacity: 0,
    scale: (i, el) => (el === clickedItem ? 1 : 0.8),
    duration: (i, el) =>
      el === clickedItem
        ? config.stepDuration * config.clickedItemDurationFactor
        : 0.3,
    ease: config.gridItemEase,
    clipPath: (i, el) => (el === clickedItem ? clipPaths.from : 'none'),
    delay: (i) => delays[i],
  });
};

// Animate the full transition (movers + panel reveal)
const animateTransition = (startEl, endEl, imgURL) => {
  // hideFrame();

  // Generate path between start and end
  const path = generateMotionPath(
    startEl.getBoundingClientRect(),
    endEl.getBoundingClientRect(),
    config.steps
  );
  const fragment = document.createDocumentFragment();
  const clipPaths = getClipPathsForDirection(config.clipPathDirection);

  // Create and animate movers
  path.forEach((step, index) => {
    const mover = document.createElement('div');
    mover.className = 'mover';
    gsap.set(mover, createMoverStyle(step, index, imgURL));
    fragment.appendChild(mover);

    const delay = index * config.stepInterval;
    gsap
      .timeline({ delay })
      .fromTo(
        mover,
        { opacity: 0.4, clipPath: clipPaths.hide },
        {
          opacity: 1,
          clipPath: clipPaths.reveal,
          duration: config.stepDuration,
          ease: config.moverEnterEase,
        }
      )
      .to(
        mover,
        {
          clipPath: clipPaths.from,
          duration: config.stepDuration,
          ease: config.moverExitEase,
        },
        `+=${config.moverPauseBeforeExit}`
      );
  });

  // Insert all movers at once
  grid.parentNode.insertBefore(fragment, grid.nextSibling);

  // Schedule mover cleanup and panel reveal
  scheduleCleanup(document.querySelectorAll('.mover'));
  revealPanel(endEl);
};

// Create style for each mover element
const createMoverStyle = (step, index, imgURL) => {
  const style = {
    backgroundImage: imgURL,
    position: 'fixed',
    left: step.left,
    top: step.top,
    width: step.width,
    height: step.height,
    clipPath: getClipPathsForDirection(config.clipPathDirection).from,
    zIndex: 1000 + index,
    backgroundPosition: '50% 50%',
    rotationZ: gsap.utils.random(-config.rotationRange, config.rotationRange),
  };
  if (config.moverBlendMode) style.mixBlendMode = config.moverBlendMode;
  return style;
};

// Remove movers after their animation ends
const scheduleCleanup = (movers) => {
  const cleanupDelay =
    config.steps * config.stepInterval +
    config.stepDuration * 2 +
    config.moverPauseBeforeExit;
  gsap.delayedCall(cleanupDelay, () => movers.forEach((m) => m.remove()));
};

// Reveal the final panel with animated clip-path
const revealPanel = (endImg) => {
  const clipPaths = getClipPathsForDirection(config.clipPathDirection);

  gsap.set(panelContent, { opacity: 0 });
  gsap.set(panel, { opacity: 1, pointerEvents: 'auto' });

  gsap
    .timeline({
      defaults: {
        duration: config.stepDuration * config.panelRevealDurationFactor,
        ease: config.panelRevealEase,
      },
    })
    .fromTo(
      endImg,
      { clipPath: clipPaths.hide },
      {
        clipPath: clipPaths.reveal,
        pointerEvents: 'auto',
        delay: config.steps * config.stepInterval,
      }
    )
    .fromTo(
      panelContent,
      { y: 25 },
      {
        duration: 1,
        ease: 'expo',
        opacity: 1,
        y: 0,
        delay: config.steps * config.stepInterval,
        onComplete: () => {
          isAnimating = false;
          isPanelOpen = true;
        },
      },
      '<-=.2'
    );
};

// Generate motion path between start and end elements
const generateMotionPath = (startRect, endRect, steps) => {
  const path = [];
  const fullSteps = steps + 2;
  const startCenter = {
    x: startRect.left + startRect.width / 2,
    y: startRect.top + startRect.height / 2,
  };
  const endCenter = {
    x: endRect.left + endRect.width / 2,
    y: endRect.top + endRect.height / 2,
  };

  for (let i = 0; i < fullSteps; i++) {
    const t = i / (fullSteps - 1);
    const width = lerp(startRect.width, endRect.width, t);
    const height = lerp(startRect.height, endRect.height, t);
    const centerX = lerp(startCenter.x, endCenter.x, t);
    const centerY = lerp(startCenter.y, endCenter.y, t);

    // Apply top offset (for sine motion)
    const sineOffset =
      config.pathMotion === 'sine'
        ? Math.sin(t * config.sineFrequency) * config.sineAmplitude
        : 0;

    // ✨ Add random wobble
    const wobbleX = (Math.random() - 0.5) * config.wobbleStrength;
    const wobbleY = (Math.random() - 0.5) * config.wobbleStrength;

    path.push({
      left: centerX - width / 2 + wobbleX,
      top: centerY - height / 2 + sineOffset + wobbleY,
      width,
      height,
    });
  }

  return path.slice(1, -1);
};

// Reset everything and return to the initial grid view
const resetView = () => {
  if (isAnimating) return;
  isAnimating = true;

  const allItems = document.querySelectorAll('.grid__item');
  const delays = computeStaggerDelays(currentItem, allItems);

  gsap
    .timeline({
      defaults: { duration: config.stepDuration, ease: 'expo' },
      onComplete: () => {
        panel.classList.remove('panel--right');
        isAnimating = false;
        isPanelOpen = false;
      },
    })
    .to(panel, { opacity: 0 })
    // .add(showFrame, 0)
    .set(panel, { opacity: 0, pointerEvents: 'none' })
    .set(panel.querySelector('.panel__img'), {
      clipPath: 'inset(0% 0% 100% 0%)',
    })
    .set(allItems, { clipPath: 'none', opacity: 0, scale: 0.8 }, 0)
    .to(
      allItems,
      {
        opacity: 1,
        scale: 1,
        delay: (i) => delays[i],
      },
      '>'
    );

  Object.assign(config, originalConfig);
};


/**
 * Adds click event listeners to scene titles and preview close buttons
 */
const initEventListeners = () => {
  /* Carousel and Previews */
  document.querySelectorAll('.scene__title').forEach((title) => {
    title.addEventListener('click', activatePreviewFromCarousel);
  });

  document.querySelectorAll('.preview__close').forEach((btn) => {
    btn.addEventListener('click', deactivatePreviewToCarousel);
  });

  
  // /* Panel Enlarge Behavior */
  // document.querySelectorAll('.panel__target').forEach((item) => {
  //   item.addEventListener('click', () => onGridItemClick(item));
  // });
  // // Attach click handler to the panel close link
  // panelContent
  //   .querySelector('.panel__close')
  //   ?.addEventListener('click', (e) => {
  //     e.preventDefault();
  //     resetView();
  //   });

};

/**
 * Initializes all carousels on the page
 */
const initCarousels = () => {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    setupCarouselCells(carousel);
    carousel._timeline = createScrollAnimation(carousel);
  });
};

/**
 * Initializes text splitting, carousels, and event listeners
 */
const init = () => {
  initTextsSplit();
  initCarousels();
  initEventListeners();
  window.addEventListener('resize', ScrollTrigger.refresh);
};

// Start app once images are preloaded
preloadImages('.grid__item-image').then(() => {
  document.body.classList.remove('loading');
  initApp(); // Initialize the app which will load JSON and create content
});