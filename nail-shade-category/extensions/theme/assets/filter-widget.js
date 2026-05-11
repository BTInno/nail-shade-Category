/* filter-widget.js — Nail Shape Filter (App Embed)
   Top-of-collection shape selector. Click → URL navigation with Shopify native
   filter param (?filter.v.t.shopify.nail-shape=gid://...). Full server-side
   filtering, stays in sync with the left-sidebar checkboxes via the URL.
*/
(function () {
  // Aligned 1:1 with Shopify's native left-sidebar "Nail Shape" filter.
  // taxonomyGid is the canonical Shopify TaxonomyValue ID — extracted from the
  // store's actual filter checkboxes, see plan doc for derivation.
  // Order: common shapes first (alphabetical), OTHER pinned to the end as a
  // catch-all for less common / mixed taxonomy values.
  const OPTIONS = [
    { value: 'almond',   label: 'ALMOND',   icon: 'nail-almond.svg',                   taxonomyGid: 'gid://shopify/TaxonomyValue/20161' },
    { value: 'coffin',   label: 'COFFIN',   icon: 'medium-coffin_FancyPageSwatch.png', taxonomyGid: 'gid://shopify/TaxonomyValue/10749' },
    { value: 'oval',     label: 'OVAL',     icon: 'short-oval_FancyPageSwatch.png',    taxonomyGid: 'gid://shopify/TaxonomyValue/20164' },
    { value: 'round',    label: 'ROUND',    icon: 'short-round_FancyPageSwatch.png',   taxonomyGid: 'gid://shopify/TaxonomyValue/20165' },
    { value: 'square',   label: 'SQUARE',   icon: 'nail-square.svg',                   taxonomyGid: 'gid://shopify/TaxonomyValue/20166' },
    { value: 'stiletto', label: 'STILETTO', icon: 'nail-stiletto.svg',                 taxonomyGid: 'gid://shopify/TaxonomyValue/10753' },
    { value: 'other',    label: 'OTHER',    icon: 'nail-other.svg',                    taxonomyGid: 'gid://shopify/TaxonomyValue/20163' }
  ];

  const FILTER_PARAM = 'filter.v.t.shopify.nail-shape';

  // Symmetry 8.3.1 + common Online Store 2.0 collection-title selectors.
  // Insert filter UI ABOVE these elements so it sits above the collection title.
  const COLLECTION_TITLE_SELECTORS = [
    '.collection-hero',
    '.collection-hero__title-wrapper',
    '.collection-hero__title',
    '.collection__title',
    '.collection-header',
    '.collection-header__title',
    '.section-header--collection',
    '.template-collection .page-header',
    '#shopify-section-main-collection-banner',
    '#shopify-section-main-collection-header'
  ];

  const assetBase = window.__NAIL_SHAPE_ASSET_BASE__ || '';

  function getActiveOption() {
    try {
      const gid = new URL(window.location.href).searchParams.get(FILTER_PARAM);
      return gid ? OPTIONS.find(o => o.taxonomyGid === gid) : null;
    } catch (e) { return null; }
  }

  function showLoadingOverlay() {
    if (document.querySelector('.nail-shape-loading-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'nail-shape-loading-overlay';
    overlay.setAttribute('aria-live', 'polite');
    overlay.setAttribute('aria-busy', 'true');
    const card = document.createElement('div');
    card.className = 'nail-shape-loading-card';
    const spinner = document.createElement('div');
    spinner.className = 'nail-shape-loading-spinner';
    const text = document.createElement('div');
    text.className = 'nail-shape-loading-text';
    text.textContent = 'Updating products…';
    card.appendChild(spinner);
    card.appendChild(text);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function hideLoadingOverlay() {
    const overlay = document.querySelector('.nail-shape-loading-overlay');
    if (overlay) overlay.remove();
  }

  function navigateWithFilter(opt) {
    // Hard-navigation fallback for when AJAX filter is unavailable.
    const url = new URL(window.location.href);
    if (opt && opt.taxonomyGid) {
      url.searchParams.set(FILTER_PARAM, opt.taxonomyGid);
    } else {
      url.searchParams.delete(FILTER_PARAM);
    }
    url.searchParams.delete('page');
    showLoadingOverlay();
    window.location.href = url.toString();
  }

  function findSidebarCheckboxes() {
    return document.querySelectorAll('input[name="' + FILTER_PARAM + '"]');
  }

  function shouldRender() {
    // Only show top widget if the collection actually exposes nail-shape
    // as a filter facet. If not, the buttons would be meaningless (clicks
    // would land on an empty result page or fail outright).
    return findSidebarCheckboxes().length > 0;
  }

  function lockScrollPosition(durationMs) {
    // Pin the viewport at its current scroll position across the next
    // AJAX swap — Symmetry's data-ajax-scroll-to attribute otherwise jumps
    // the page to the top of the filter area, which feels disorienting.
    const savedY = window.scrollY;
    let elapsed = 0;
    const tick = 50;
    const id = setInterval(() => {
      if (Math.abs(window.scrollY - savedY) > 4) {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
      }
      elapsed += tick;
      if (elapsed >= durationMs) clearInterval(id);
    }, tick);
  }

  function applyFilter(opt) {
    // Preferred path: drive the theme's existing sidebar checkboxes so the
    // theme's own AJAX filter (Symmetry's <filter-container data-ajax-filtering>)
    // picks up the change. This avoids a full page reload and keeps the URL,
    // grid, pagination, and sidebar checkbox state in sync automatically.
    const checkboxes = findSidebarCheckboxes();
    if (!checkboxes.length) {
      navigateWithFilter(opt);
      return;
    }

    let target = null;
    if (opt) {
      target = document.querySelector('input[name="' + FILTER_PARAM + '"][value="' + opt.taxonomyGid + '"]');
      // If this collection doesn't expose the GID as a filter option,
      // we can't drive sidebar AJAX — fall back to navigation.
      if (!target) {
        navigateWithFilter(opt);
        return;
      }
    }

    // Toggle off any currently-active nail-shape checkboxes (single-select UX
    // on our top widget — even though Shopify allows multi-select sidebar-side).
    let changed = false;
    checkboxes.forEach(cb => {
      if (cb === target) return;
      if (cb.checked) {
        cb.checked = false;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
        changed = true;
      }
    });

    if (target) {
      if (!target.checked) {
        target.checked = true;
        target.dispatchEvent(new Event('change', { bubbles: true }));
        changed = true;
      }
    }

    // Optimistic UI update — keeps the top widget responsive even before
    // the AJAX response lands. The change listener (below) will also re-sync.
    updateTopUi(opt);

    // Pin scroll position across the AJAX swap so the page doesn't jump up.
    lockScrollPosition(1500);

    // Brief overlay during AJAX. Auto-hide after a generous window in case the
    // theme's AJAX silently fails — UX should never lock up indefinitely.
    showLoadingOverlay();
    setTimeout(hideLoadingOverlay, 1500);

    if (!changed) {
      // Nothing actually changed (already in the desired state). Drop overlay now.
      hideLoadingOverlay();
    }
  }

  function updateTopUi(activeOpt) {
    document.querySelectorAll('.nail-shape-btn').forEach(btn => {
      const matches = activeOpt && btn.dataset.value === activeOpt.value;
      btn.classList.toggle('active', !!matches);
      btn.setAttribute('aria-pressed', matches ? 'true' : 'false');
    });
    const existing = document.querySelector('.nail-shape-active-wrapper');
    if (existing) existing.remove();
    renderActiveLabel(activeOpt);
  }

  function watchSidebar() {
    // Sync top widget when the user toggles filters via the sidebar directly.
    document.addEventListener('change', (e) => {
      if (!e.target || e.target.name !== FILTER_PARAM) return;
      const checked = document.querySelector('input[name="' + FILTER_PARAM + '"]:checked');
      const gid = checked ? checked.value : null;
      const newActive = gid ? OPTIONS.find(o => o.taxonomyGid === gid) : null;
      updateTopUi(newActive);
    });
  }

  function teardown() {
    const buttons = document.querySelector('[data-nail-shape-filter]');
    if (buttons) buttons.remove();
    const wrapper = document.querySelector('.nail-shape-active-wrapper');
    if (wrapper) wrapper.remove();
  }

  function reinit() {
    // If the AJAX-swapped collection has no nail-shape filter facet, hide
    // our widget instead of trying to re-render it on top of irrelevant data.
    if (!shouldRender()) {
      teardown();
      return;
    }
    const activeOpt = getActiveOption();
    if (!document.querySelector('[data-nail-shape-filter]')) {
      renderShapeButtons(activeOpt);
    } else {
      document.querySelectorAll('.nail-shape-btn').forEach(btn => {
        const matches = activeOpt && btn.dataset.value === activeOpt.value;
        btn.classList.toggle('active', !!matches);
        btn.setAttribute('aria-pressed', matches ? 'true' : 'false');
      });
    }
    const existing = document.querySelector('.nail-shape-active-wrapper');
    if (existing) existing.remove();
    renderActiveLabel(activeOpt);
    hideLoadingOverlay();
  }

  function watchUrlChanges() {
    // Hook history changes so reinit fires reliably when Symmetry AJAX
    // updates the URL. Multiple delayed triggers handle the case where the
    // DOM swap happens AFTER pushState (we re-check at 80ms, 400ms, 1000ms).
    const trigger = () => {
      setTimeout(reinit, 80);
      setTimeout(reinit, 400);
      setTimeout(reinit, 1000);
    };
    ['pushState', 'replaceState'].forEach(method => {
      const original = history[method];
      history[method] = function () {
        const result = original.apply(this, arguments);
        trigger();
        return result;
      };
    });
    window.addEventListener('popstate', trigger);
  }

  function startSelfHealing() {
    // Self-healing poll: detect state drift (button or label missing/extra
    // compared to URL truth) and call reinit only when drift exists.
    // Check itself is a few cheap querySelectors at 250ms cadence.
    setInterval(() => {
      const buttons = document.querySelector('[data-nail-shape-filter]');
      const wrapper = document.querySelector('.nail-shape-active-wrapper');
      if (!shouldRender()) {
        // Collection has no nail-shape filter — make sure our widget is gone.
        if (buttons || wrapper) teardown();
        return;
      }
      const activeOpt = getActiveOption();
      const labelDrift = !!activeOpt !== !!wrapper;
      const buttonsMissing = !buttons;
      if (labelDrift || buttonsMissing) {
        reinit();
      }
    }, 250);
  }

  function createButton(option, active) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nail-shape-btn' + (active ? ' active' : '');
    btn.dataset.value = option.value;
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');

    const img = document.createElement('img');
    img.src = assetBase + option.icon;
    img.alt = option.label;
    img.className = 'nail-shape-icon';

    const label = document.createElement('span');
    label.className = 'nail-shape-label';
    option.label.split(/\s+/).forEach(word => {
      const w = document.createElement('span');
      w.className = 'nail-shape-label__word';
      w.textContent = word;
      label.appendChild(w);
    });

    btn.appendChild(img);
    btn.appendChild(label);
    return btn;
  }

  function onSelect(value, isActiveNow) {
    const opt = OPTIONS.find(o => o.value === value);
    // Re-click on the already-active button clears the filter (toggle behavior).
    applyFilter(isActiveNow ? null : opt);
  }

  function findInsertionTarget() {
    for (const sel of COLLECTION_TITLE_SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    const h1 = document.querySelector('#shopify-section-main-collection h1, .template-collection h1, main h1');
    if (h1) {
      return h1.closest('section, .shopify-section, header') || h1;
    }
    return null;
  }

  function renderShapeButtons(activeOpt) {
    if (document.querySelector('[data-nail-shape-filter]')) return;
    const target = findInsertionTarget();
    if (!target) return;

    const wrap = document.createElement('div');
    wrap.setAttribute('data-nail-shape-filter', '');

    const btnRow = document.createElement('div');
    btnRow.className = 'nail-shape-btns';

    OPTIONS.forEach(opt => {
      const isActive = activeOpt && activeOpt.value === opt.value;
      const b = createButton(opt, isActive);
      // Read the CURRENT active state at click time, not the render-time captured value —
      // AJAX path mutates active state in place without re-rendering buttons.
      b.addEventListener('click', () => {
        onSelect(opt.value, b.classList.contains('active'));
      });
      btnRow.appendChild(b);
    });

    wrap.appendChild(btnRow);
    target.parentNode.insertBefore(wrap, target);
  }

  function renderActiveLabel(activeOpt) {
    if (!activeOpt) return;
    if (document.querySelector('.nail-shape-active-wrapper')) return;
    // Symmetry's "Filter" open trigger lives in .utility-bar__left
    // as <a class="toggle-btn utility-bar__item" data-toggle-filters>.
    // Fall back to broader selectors for other themes / Symmetry layouts.
    const filterBtn = document.querySelector(
      '.utility-bar__left a[data-toggle-filters], a.toggle-btn[data-toggle-filters], [data-toggle-filters]:not(.filters__close):not(.filter-shade)'
    );
    if (!filterBtn) return;

    // Wrap label + clear in a single sibling of the Filter button. Borrow
    // Symmetry's own utility-bar__item class so the wrapper inherits whatever
    // vertical-centering the theme applies to peer items in .utility-bar__left.
    const wrap = document.createElement('span');
    wrap.className = 'nail-shape-active-wrapper utility-bar__item';

    const labelText = document.createElement('span');
    labelText.className = 'nail-shape-active-label';
    const shapeName = activeOpt.label.charAt(0) + activeOpt.label.slice(1).toLowerCase();
    // Prefix is wrapped so it can be hidden on mobile via CSS, leaving just
    // the shape name + Clear for compactness on narrow screens.
    const prefix = document.createElement('span');
    prefix.className = 'nail-shape-active-prefix';
    prefix.textContent = 'Selected: ';
    labelText.appendChild(prefix);
    labelText.appendChild(document.createTextNode(shapeName));

    const clear = document.createElement('a');
    clear.href = '#';
    clear.className = 'nail-shape-clear';
    clear.textContent = 'Clear';
    clear.addEventListener('click', (e) => {
      e.preventDefault();
      applyFilter(null);
    });

    wrap.appendChild(labelText);
    wrap.appendChild(clear);

    if (filterBtn.nextSibling) {
      filterBtn.parentNode.insertBefore(wrap, filterBtn.nextSibling);
    } else {
      filterBtn.parentNode.appendChild(wrap);
    }
  }

  function scrollActiveIntoView() {
    const activeBtn = document.querySelector('.nail-shape-btn.active');
    if (!activeBtn) return;
    // requestAnimationFrame lets layout settle before measuring;
    // block:'nearest' prevents unwanted vertical page jump when buttons already in view;
    // inline:'center' centers the active button within the horizontally-scrollable .nail-shape-btns row.
    requestAnimationFrame(() => {
      try {
        activeBtn.scrollIntoView({ block: 'nearest', inline: 'center' });
      } catch (e) { /* older browsers — noop */ }
    });
  }

  function init() {
    // Skip the entire widget on collections where the sidebar doesn't expose
    // nail-shape as a filter facet — top buttons would be useless there.
    if (!shouldRender()) {
      console.info('[nail-shape-filter] init v0.7.2 — skipped: no nail-shape filter on this collection');
      // Still watch sidebar/URL/poll so we re-appear if a parent navigation
      // takes the user to a collection that DOES expose nail-shape.
      watchSidebar();
      watchUrlChanges();
      startSelfHealing();
      return;
    }
    const activeOpt = getActiveOption();
    renderShapeButtons(activeOpt);
    renderActiveLabel(activeOpt);
    scrollActiveIntoView();
    watchSidebar();
    watchUrlChanges();
    startSelfHealing();
    console.info('[nail-shape-filter] init v0.7.2', {
      active: activeOpt ? activeOpt.value : null,
      activeGid: activeOpt ? activeOpt.taxonomyGid : null,
      ajaxAvailable: true,
      url: window.location.href
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
