// Configuration object for animation settings
const config = {
    clipPathDirection: 'top-bottom',
    autoAdjustHorizontalClipPath: true,
    steps: 6,
    stepDuration: 0.35,
    stepInterval: 0.05,
    moverPauseBeforeExit: 0.14,
    rotationRange: 0,
    wobbleStrength: 0,
    panelRevealEase: 'sine.inOut',
    gridItemEase: 'sine',
    moverEnterEase: 'sine.in',
    moverExitEase: 'sine',
    panelRevealDurationFactor: 2,
    clickedItemDurationFactor: 2,
    gridItemStaggerFactor: 0.3,
    moverBlendMode: false,
    pathMotion: 'linear',
    sineAmplitude: 50,
    sineFrequency: Math.PI,
  };
  
  // Create a deep copy of the initial global config
  const originalConfig = { ...config };
  
  // Linear interpolation helper
  const lerp = (a, b, t) => a + (b - a) * t;
  
  // Main initialization function
  const initApp = () => {
    // First load content from JSON
    fetch('grid.json')
      .then(response => response.json())
      .then(data => {
        const container = document.getElementById('content-container');
        data.sections.forEach(section => {
          const sectionHTML = createSectionHTML(section);
          container.insertAdjacentHTML('beforeend', sectionHTML);
        });
        
        // Wait for images to load
        const imgLoad = imagesLoaded(document.querySelectorAll('.grid__item-image'));
        imgLoad.on('done', () => {
          document.body.classList.remove('loading');
          initAnimations();
        });
      });
  };
  
  // HTML generation function
  function createSectionHTML(section) {
    let html = `
      <div class="heading">
        <h2 class="heading__title">${section.title}</h2>
        <span class="heading__meta">${section.meta}</span>
      </div>
      <div class="grid">
    `;
    
    section.images.forEach((img, index) => {
      const dataAttrs = img.data ? Object.entries(img.data).map(([key, val]) => 
        `data-${key}="${val}"`).join(' ') : '';
      
      html += `
        <figure class="grid__item" role="img" aria-labelledby="caption${index}" ${dataAttrs}>
          <div class="grid__item-image" style="background-image: url(${img.src})"></div>
          <figcaption class="grid__item-caption" id="caption${index}">
            <h3>${img.caption}</h3>
            <p>${img.model}</p>
          </figcaption>
        </figure>
      `;
    });
    
    html += `</div>`;
    return html;
  }
  
  // Animation initialization
  const initAnimations = () => {
    // Cached DOM elements
    const grid = document.querySelector('.grid');
    const frame = document.querySelectorAll(['.frame', '.heading']);
    const panel = document.querySelector('.panel');
    const panelContent = panel.querySelector('.panel__content');
  
    let isAnimating = false;
    let isPanelOpen = false;
    let currentItem = null;
  
    // Attach event listeners
    document.querySelectorAll('.grid__item').forEach((item) => {
      item.addEventListener('click', () => onGridItemClick(item));
    });
  
    panelContent.querySelector('.panel__close')?.addEventListener('click', (e) => {
      e.preventDefault();
      resetView();
    });
  
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isPanelOpen && !isAnimating) {
        resetView();
      }
    });
  
    // Rest of your animation functions (onGridItemClick, extractItemConfigOverrides, etc.)
    
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
    animateGridItems(allItems, item, delays);
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
      desc: caption.querySelector('p').textContent,
    };
  };
  
  // Set the panel's background and text based on clicked item
  const setPanelContent = ({ imgURL, title, desc }) => {
    panel.querySelector('.panel__img').style.backgroundImage = imgURL;
    panel.querySelector('h3').textContent = title;
    panel.querySelector('p').textContent = desc;
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
  const animateGridItems = (items, clickedItem, delays) => {
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
    hideFrame();
  
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
      .add(showFrame, 0)
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
  };
  
  // Start the application
  document.addEventListener('DOMContentLoaded', initApp);