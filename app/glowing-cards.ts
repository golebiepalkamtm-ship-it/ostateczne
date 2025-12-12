// Globalny efekt glowing edges dla wszystkich kart - DOKŁADNIE z CodePen
// https://codepen.io/simeydotme/pen/RNWoPRj

export function initGlowingCards() {
  if (typeof window === 'undefined') return;

  const clamp = (value: number, min = 0, max = 100) =>
    Math.min(Math.max(value, min), max);

  const round = (value: number, precision = 3) =>
    parseFloat(value.toFixed(precision));

  const centerOfElement = (el: HTMLElement) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  };

  const pointerPositionRelativeToElement = (el: HTMLElement, e: PointerEvent) => {
    const pos = [e.clientX, e.clientY];
    const { left, top, width, height } = el.getBoundingClientRect();
    const x = pos[0] - left;
    const y = pos[1] - top;
    const px = clamp((100 / width) * x);
    const py = clamp((100 / height) * y);
    return { pixels: [x, y], percent: [px, py] };
  };

  const angleFromPointerEvent = (dx: number, dy: number) => {
    let angleRadians = 0;
    let angleDegrees = 0;
    if (dx !== 0 || dy !== 0) {
      angleRadians = Math.atan2(dy, dx);
      angleDegrees = angleRadians * (180 / Math.PI) + 90;
      if (angleDegrees < 0) {
        angleDegrees += 360;
      }
    }
    return angleDegrees;
  };

  const distanceFromCenter = (el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = centerOfElement(el);
    return [x - cx, y - cy];
  };

  const closenessToEdge = (el: HTMLElement, x: number, y: number) => {
    const [cx, cy] = centerOfElement(el);
    const [dx, dy] = distanceFromCenter(el, x, y);
    let k_x = Infinity;
    let k_y = Infinity;
    if (dx !== 0) {
      k_x = cx / Math.abs(dx);
    }
    if (dy !== 0) {
      k_y = cy / Math.abs(dy);
    }
    return clamp(1 / Math.min(k_x, k_y), 0, 1);
  };

  const cardUpdate = (card: HTMLElement, e: PointerEvent) => {
    const position = pointerPositionRelativeToElement(card, e);
    const [px, py] = position.pixels;
    const [perx, pery] = position.percent;
    const [dx, dy] = distanceFromCenter(card, px, py);
    const edge = closenessToEdge(card, px, py);
    const angle = angleFromPointerEvent(dx, dy);

    card.style.setProperty('--pointer-x', `${round(perx)}%`);
    card.style.setProperty('--pointer-y', `${round(pery)}%`);
    card.style.setProperty('--pointer-°', `${round(angle)}deg`);
    card.style.setProperty('--pointer-d', `${round(edge * 100)}`);
  };

  // Znajdź wszystkie karty i elementy interaktywne
  const cards = document.querySelectorAll<HTMLElement>(
    '.card-glow-edge, .card-glass, .glass-container, .card, [class*="card"], [class*="glass"], .btn-primary, .btn-secondary, .glass-nav-button, input:not([type="checkbox"]):not([type="radio"]), textarea, select',
  );

  cards.forEach(card => {
    // Skip any card that is inside a no-hover container (admin override)
    if (card.closest && card.closest('.no-hover')) return;

    // Dodaj element .glow jeśli nie istnieje (z wyjątkiem input/textarea/select - dla nich opcjonalne)
    const isFormElement = card.tagName === 'INPUT' || card.tagName === 'TEXTAREA' || card.tagName === 'SELECT';

    if (!card.querySelector('.glow') && !isFormElement) {
      const glow = document.createElement('span');
      glow.className = 'glow';
      glow.setAttribute('aria-hidden', 'true');
      card.appendChild(glow);
    }

    card.addEventListener('pointermove', (e) => {
      cardUpdate(card, e as PointerEvent);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--pointer-d', '0');
    });
  });

  // Observer dla dynamicznie dodanych kart
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node instanceof HTMLElement) {
          const newCards = node.querySelectorAll<HTMLElement>(
            '.card-glow-edge, .card-glass, .glass-container, .card, [class*="card"], [class*="glass"], .btn-primary, .btn-secondary, .glass-nav-button, input:not([type="checkbox"]):not([type="radio"]), textarea, select',
          );
          newCards.forEach(card => {
            // Skip cards that are inside a no-hover container
            if (card.closest && card.closest('.no-hover')) return;

            const isFormElement = card.tagName === 'INPUT' || card.tagName === 'TEXTAREA' || card.tagName === 'SELECT';

            if (!card.querySelector('.glow') && !isFormElement) {
              const glow = document.createElement('span');
              glow.className = 'glow';
              glow.setAttribute('aria-hidden', 'true');
              card.appendChild(glow);
            }

            card.addEventListener('pointermove', (e) => {
              cardUpdate(card, e as PointerEvent);
            });

            card.addEventListener('pointerleave', () => {
              card.style.setProperty('--pointer-d', '0');
            });
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}
