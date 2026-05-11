/* filter-widget.js
   Simple front-end widget to render nail-shape buttons and filter products on the page.
   Behavior:
     - looks for product elements with attribute `data-nail-shape="<value>"` or `data-product-id` and relies on theme output.
     - renders buttons for options and toggles visibility of product elements.

   This is a light POC; integrate with Storefront API or server-side rendering for production.
*/

(function () {
  const OPTIONS = [
    { value: 'super_short', label: 'SUPER SHORT', icon: 'super-short_FancyPageSwatch.webp' },
    { value: 'oval', label: 'OVAL', icon: 'short-oval_FancyPageSwatch.webp' },
    { value: 'almond', label: 'ALMOND', icon: 'short-almond_FancyPageSwatch.webp' },
    { value: 'squoval', label: 'SQUOVAL', icon: 'short-squoval_FancyPageSwatch.webp' },
    { value: 'round', label: 'ROUND', icon: 'short-round_FancyPageSwatch.webp' },
    { value: 'coffin', label: 'COFFIN', icon: 'medium-coffin_FancyPageSwatch.webp' }
  ];

  let assetUrlBase = '';

  function createButton(option) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nail-shape-btn';
    btn.dataset.value = option.value;
    btn.setAttribute('aria-pressed', 'false');

    const img = document.createElement('img');
    img.src = assetUrlBase + option.icon;
    img.alt = option.label;
    img.className = 'nail-shape-icon';

    const label = document.createElement('span');
    label.className = 'nail-shape-label';
    label.textContent = option.label;

    btn.appendChild(img);
    btn.appendChild(label);
    return btn;
  }

  function init() {
    const root = document.querySelector('[data-nail-shape-filter] .nail-shape-filter__container');
    if (!root) return;

    const filterContainer = document.querySelector('[data-nail-shape-filter]');
    assetUrlBase = filterContainer.getAttribute('data-asset-url-base') || '';

    const btnWrap = document.createElement('div');
    btnWrap.className = 'nail-shape-btns';

    OPTIONS.forEach(opt => {
      const b = createButton(opt);
      b.addEventListener('click', () => onSelect(opt.value, b));
      btnWrap.appendChild(b);
    });

    root.appendChild(btnWrap);

    // Apply initial filter from URL (after buttons are rendered)
    const initial = getQueryParam('nail_shape');
    if (initial) {
      const activeBtn = btnWrap.querySelector(`[data-value="${initial}"]`);
      if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-pressed', 'true');
      }
      filterBy(initial);
    }
  }

  function onSelect(value, btn) {
    const wasActive = btn.getAttribute('aria-pressed') === 'true';
    document.querySelectorAll('.nail-shape-btn').forEach(el => {
      el.classList.remove('active');
      el.setAttribute('aria-pressed', 'false');
    });
    if (!wasActive) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      applyFilter(value, true);
    } else {
      applyFilter(null, true);
    }
  }

  function filterBy(value) {
    // Find product cards with data-nail-shape
    document.querySelectorAll('[data-product-id], [data-nail-shape]').forEach(el => {
      const shape = el.getAttribute('data-nail-shape');
      if (!shape) {
        el.style.display = '';
        return;
      }
      if (shape === value) {
        el.style.display = '';
      } else {
        el.style.display = 'none';
      }
    });
  }

  function applyFilter(value, updateUrl) {
    if (value) {
      filterBy(value);
      if (updateUrl) updateQueryStringParam('nail_shape', value);
    } else {
      clearFilter();
      if (updateUrl) removeQueryStringParam('nail_shape');
    }
  }

  function updateQueryStringParam(key, value) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(key, value);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      // fallback: simple hash
      window.location.hash = `${key}=${value}`;
    }
  }

  function removeQueryStringParam(key) {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete(key);
      window.history.replaceState({}, '', url.toString());
    } catch (e) {
      window.location.hash = '';
    }
  }

  function clearFilter() {
    document.querySelectorAll('[data-product-id], [data-nail-shape]').forEach(el => {
      el.style.display = '';
    });
  }

  function getQueryParam(key) {
    try {
      const url = new URL(window.location.href);
      return url.searchParams.get(key);
    } catch (e) {
      const m = window.location.hash.match(new RegExp(key + "=([^&]+)"));
      return m ? decodeURIComponent(m[1]) : null;
    }
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
