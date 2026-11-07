/* Unimed — storefront logic. Everything persists in localStorage. */
(function () {
  "use strict";

  /* ---------------- Storage ---------------- */
  const KEYS = {
    products: "unimed.products.v1",
    categories: "unimed.categories.v1",
    cart: "unimed.cart.v1",
    favs: "unimed.favs.v1",
    quotes: "unimed.quotes.v1",
    prefs: "unimed.prefs.v1",
    theme: "unimed.theme",
  };
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : clone(fallback);
    } catch (e) { return clone(fallback); }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { toast("Couldn't save — browser storage is full or blocked.", "warn"); return false; }
  }

  const state = {
    products: load(KEYS.products, window.DEFAULT_PRODUCTS),
    categories: load(KEYS.categories, window.DEFAULT_CATEGORIES),
    cart: load(KEYS.cart, {}),          // { productId: qty }
    favs: load(KEYS.favs, []),          // [productId]
    quotes: load(KEYS.quotes, []),
    prefs: Object.assign({ view: "grid", sort: "featured", inStock: false }, load(KEYS.prefs, {})),
    filter: { q: "", cat: "all", maxPrice: Infinity },
  };
  const persist = {
    products: () => save(KEYS.products, state.products),
    categories: () => save(KEYS.categories, state.categories),
    cart: () => save(KEYS.cart, state.cart),
    favs: () => save(KEYS.favs, state.favs),
    quotes: () => save(KEYS.quotes, state.quotes),
    prefs: () => save(KEYS.prefs, state.prefs),
  };

  /* Bulk tiers: applied to the cart subtotal. */
  const TIERS = [
    { min: 250, off: 0.05 },
    { min: 750, off: 0.1 },
    { min: 2000, off: 0.15 },
  ];
  const SHIPPING_FREE_AT = 150;
  const SHIPPING = 12;

  /* ---------------- Helpers ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const money = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
  const fmt = (n) => money.format(n || 0);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = (p = "p") => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const byId = (id) => state.products.find((p) => p.id === id);
  const catOf = (id) => state.categories.find((c) => c.id === id) || { id, name: "Uncategorised", color: "#64748b" };
  const colorOf = (p) => catOf(p.category).color;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function art(p) {
    return p.image
      ? `<img src="${esc(p.image)}" alt="" loading="lazy" />`
      : window.productArt(p.icon, colorOf(p));
  }
  function stockLabel(n) {
    if (n <= 0) return `<span class="stock out">Out of stock</span>`;
    if (n < 25) return `<span class="stock low">Only ${n} left</span>`;
    return `<span class="stock ok">In stock</span>`;
  }
  const STAR = `<svg viewBox="0 0 24 24"><path d="m12 2 3 6.6 7 .7-5.3 4.7 1.6 7L12 17.3 5.7 21l1.6-7L2 9.3l7-.7z"/></svg>`;
  const HEART = `<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.3C1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 2.8 1.4-1.7 3-2.8 5-2.8 3.6 0 6 3.5 4.5 7.2C19.5 16.4 12 21 12 21z"/></svg>`;
  const PLUS = `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`;
  const CHECK = `<svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>`;
  const ICON = {
    edit: `<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></svg>`,
    copy: `<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>`,
    trash: `<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>`,
    x: `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  };

  /* ---------------- Toasts ---------------- */
  function toast(msg, kind, action) {
    const host = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `${CHECK}<span>${esc(msg)}</span>`;
    if (action) {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = action.label;
      b.onclick = () => { action.run(); dismiss(); };
      el.appendChild(b);
    }
    host.appendChild(el);
    while (host.children.length > 3) host.firstElementChild.remove();
    let t = setTimeout(dismiss, action ? 5000 : 2600);
    function dismiss() { clearTimeout(t); el.classList.add("out"); setTimeout(() => el.remove(), 300); }
  }

  /* ---------------- Catalogue ---------------- */
  function maxCatalogPrice() {
    return Math.max(10, Math.ceil(Math.max(0, ...state.products.map((p) => +p.price || 0)) / 10) * 10);
  }

  function filtered() {
    const { q, cat, maxPrice } = state.filter;
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    let list = state.products.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (state.prefs.inStock && p.stock <= 0) return false;
      if (p.price > maxPrice) return false;
      if (!terms.length) return true;
      const hay = `${p.name} ${p.sku} ${p.description} ${catOf(p.category).name} ${Object.values(p.specs || {}).join(" ")}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    const sorters = {
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => (b.rating || 0) - (a.rating || 0),
      name: (a, b) => a.name.localeCompare(b.name),
      stock: (a, b) => b.stock - a.stock,
      featured: (a, b) => (b.stock > 0) - (a.stock > 0) || (!!b.badge) - (!!a.badge),
    };
    return list.sort(sorters[state.prefs.sort] || sorters.featured);
  }

  function renderChips() {
    const counts = state.products.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
    const all = [{ id: "all", name: "All products", color: "" }, ...state.categories];
    if (state.filter.cat !== "all" && !state.categories.some((c) => c.id === state.filter.cat)) state.filter.cat = "all";
    $("#chips").innerHTML = all.map((c) => `
      <button class="chip" type="button" role="tab" data-cat="${esc(c.id)}" aria-selected="${state.filter.cat === c.id}">
        ${c.color ? `<span class="swatch" style="background:${esc(c.color)}"></span>` : ""}
        ${esc(c.name)} <span class="n">${c.id === "all" ? state.products.length : counts[c.id] || 0}</span>
      </button>`).join("");
  }

  function cardHTML(p, i) {
    const inCart = state.cart[p.id] || 0;
    const fav = state.favs.includes(p.id);
    const cat = catOf(p.category);
    const badgeClass = /sale/i.test(p.badge) ? "sale" : /new/i.test(p.badge) ? "new" : "";
    return `
      <article class="card" style="--c:${esc(cat.color)};animation-delay:${Math.min(i, 12) * 40}ms" data-id="${esc(p.id)}">
        <button class="card-media" type="button" data-open="${esc(p.id)}" aria-label="View ${esc(p.name)}">${art(p)}</button>
        ${p.badge ? `<span class="badge ${badgeClass}">${esc(p.badge)}</span>` : ""}
        <button class="fav" type="button" data-fav="${esc(p.id)}" aria-pressed="${fav}" aria-label="${fav ? "Remove from" : "Save to"} saved items">${HEART}</button>
        <div class="card-body">
          <div class="card-text">
            <div class="card-meta">
              <span class="cat-tag"><i></i>${esc(cat.name)}</span>
              ${p.rating ? `<span class="rating">${STAR}${(+p.rating).toFixed(1)}</span>` : ""}
            </div>
            <h3><button type="button" data-open="${esc(p.id)}">${esc(p.name)}</button></h3>
            <p class="desc">${esc(p.description)}</p>
            ${stockLabel(p.stock)}
          </div>
          <div class="card-foot">
            <div class="price">${fmt(p.price)}${p.oldPrice > p.price ? `<s>${fmt(p.oldPrice)}</s>` : ""}<small>${esc(p.unit || "each")}${inCart ? ` · ${inCart} in cart` : ""}</small></div>
            <button class="add-btn" type="button" data-add="${esc(p.id)}" ${p.stock <= 0 ? "disabled" : ""} aria-label="Add ${esc(p.name)} to cart">${PLUS}</button>
          </div>
        </div>
      </article>`;
  }

  function renderGrid() {
    const list = filtered();
    const grid = $("#grid");
    grid.className = `grid ${state.prefs.view === "list" ? "list" : ""}`;
    grid.innerHTML = list.map(cardHTML).join("");
    $("#empty").hidden = list.length > 0;
    const total = state.products.length;
    $("#resultInfo").textContent = list.length === total
      ? `${total} products`
      : `Showing ${list.length} of ${total} products`;
  }

  function renderStats(animate) {
    const vals = {
      products: state.products.length,
      categories: state.categories.length,
      units: state.products.reduce((s, p) => s + (+p.stock || 0), 0),
    };
    $$("[data-count]").forEach((el) => {
      const target = vals[el.dataset.count];
      if (!animate || reduceMotion) { el.textContent = target.toLocaleString(); return; }
      const start = performance.now(), dur = 1200;
      (function tick(now) {
        const k = Math.min(1, (now - start) / dur);
        el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3))).toLocaleString();
        if (k < 1) requestAnimationFrame(tick);
      })(start);
    });
  }

  function renderPriceRange() {
    const r = $("#maxPrice");
    const max = maxCatalogPrice();
    const wasAtMax = state.filter.maxPrice === Infinity || +r.value >= +r.max;
    r.max = max;
    if (wasAtMax) { r.value = max; state.filter.maxPrice = Infinity; }
    $("#maxPriceOut").textContent = wasAtMax ? "Any" : fmt(+r.value);
  }

  function renderAll() {
    renderChips();
    renderPriceRange();
    renderGrid();
    renderStats(false);
    renderCartBadge();
    renderFavBadge();
  }

  /* ---------------- Product modal ---------------- */
  function openProduct(id) {
    const p = byId(id);
    if (!p) return;
    const cat = catOf(p.category);
    const specs = Object.entries(p.specs || {});
    const view = $("#productView");
    view.style.setProperty("--c", cat.color);
    view.innerHTML = `
      <div class="pv-media" style="--c:${esc(cat.color)}">${art(p)}</div>
      <div class="pv-info">
        <button class="icon-btn close" type="button" data-close aria-label="Close">${ICON.x}</button>
        <div class="card-meta"><span class="cat-tag" style="--c:${esc(cat.color)}"><i></i>${esc(cat.name)}</span><span>SKU ${esc(p.sku || "—")}</span></div>
        <h2 id="pmTitle">${esc(p.name)}</h2>
        <div class="card-meta" style="justify-content:start;gap:14px">
          ${p.rating ? `<span class="rating">${STAR}${(+p.rating).toFixed(1)} rating</span>` : ""}${stockLabel(p.stock)}
        </div>
        <div class="price">${fmt(p.price)}${p.oldPrice > p.price ? `<s>${fmt(p.oldPrice)}</s>` : ""}<small>per ${esc(p.unit || "each")}</small></div>
        <p class="desc">${esc(p.description)}</p>
        ${specs.length ? `<dl class="specs">${specs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
        <p class="tier-hint" id="pvHint"></p>
        <div class="buy-row">
          <div class="qty" data-qty>
            <button type="button" data-step="-1" aria-label="Decrease">−</button>
            <input type="number" value="1" min="1" max="${Math.max(1, p.stock)}" aria-label="Quantity" />
            <button type="button" data-step="1" aria-label="Increase">+</button>
          </div>
          <button class="btn btn-primary" type="button" id="pvAdd" ${p.stock <= 0 ? "disabled" : ""}>${p.stock <= 0 ? "Out of stock" : "Add to cart"}</button>
          <button class="fav" style="position:static;width:50px;height:50px" type="button" data-fav="${esc(p.id)}" aria-pressed="${state.favs.includes(p.id)}" aria-label="Save">${HEART}</button>
        </div>
      </div>`;
    const input = $("input", view);
    const hint = () => {
      const q = clampQty(+input.value, p);
      const line = q * p.price;
      const next = TIERS.find((t) => cartSubtotal() + line < t.min);
      $("#pvHint").textContent = `Line total ${fmt(line)}` + (next ? ` · ${fmt(next.min - cartSubtotal() - line)} more unlocks ${next.off * 100}% off` : " · top bulk discount unlocked");
    };
    $("[data-qty]", view).addEventListener("click", (e) => {
      const b = e.target.closest("[data-step]");
      if (!b) return;
      input.value = clampQty(+input.value + +b.dataset.step, p);
      hint();
    });
    input.addEventListener("input", hint);
    input.addEventListener("change", () => { input.value = clampQty(+input.value, p); hint(); });
    $("#pvAdd", view).addEventListener("click", (e) => {
      addToCart(p.id, clampQty(+input.value, p), e.currentTarget);
      closeDialog($("#productModal"));
    });
    hint();
    openDialog($("#productModal"));
  }
  const clampQty = (n, p) => Math.max(1, Math.min(Math.max(1, p.stock), Math.floor(n) || 1));

  /* ---------------- Cart ---------------- */
  function cartLines() {
    return Object.entries(state.cart)
      .map(([id, qty]) => ({ p: byId(id), qty }))
      .filter((l) => l.p && l.qty > 0);
  }
  const cartSubtotal = () => cartLines().reduce((s, l) => s + l.p.price * l.qty, 0);
  function cartTotals() {
    const sub = cartSubtotal();
    const tier = [...TIERS].reverse().find((t) => sub >= t.min);
    const discount = tier ? sub * tier.off : 0;
    const shipping = sub === 0 || sub >= SHIPPING_FREE_AT ? 0 : SHIPPING;
    return { sub, tier, discount, shipping, total: sub - discount + shipping };
  }

  function addToCart(id, qty = 1, fromEl) {
    const p = byId(id);
    if (!p || p.stock <= 0) return;
    const now = state.cart[id] || 0;
    const next = Math.min(p.stock, now + qty);
    if (next === now) { toast(`Only ${p.stock} available`); return; }
    state.cart[id] = next;
    persist.cart();
    if (fromEl) flyToCart(fromEl);
    renderCartBadge(true);
    renderCart();
    refreshCard(id);
    toast(`Added ${next - now} × ${p.name}`, "ok", { label: "View cart", run: () => openDrawer("#cartDrawer") });
  }
  function setQty(id, qty) {
    const p = byId(id);
    if (!p) return;
    if (qty <= 0) delete state.cart[id];
    else state.cart[id] = Math.min(p.stock, qty);
    persist.cart();
    renderCart(); renderCartBadge(); refreshCard(id);
  }
  function removeFromCart(id) {
    const prev = state.cart[id];
    const p = byId(id);
    setQty(id, 0);
    toast(`Removed ${p ? p.name : "item"}`, "ok", { label: "Undo", run: () => setQty(id, prev) });
  }

  function renderCartBadge(bump) {
    const n = cartLines().reduce((s, l) => s + l.qty, 0);
    const el = $("#cartCount");
    el.hidden = n === 0;
    el.textContent = n > 99 ? "99+" : n;
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }

  function lineHTML(p, qty, { removable = true, qtyCtl = true } = {}) {
    return `
      <div class="line-item" data-line="${esc(p.id)}">
        <div class="thumb" style="--c:${esc(colorOf(p))}">${art(p)}</div>
        <div>
          <h4>${esc(p.name)}</h4>
          <span class="muted">${fmt(p.price)} · ${esc(p.unit || "each")}</span>
          <div class="row">
            ${qtyCtl ? `<div class="qty sm">
              <button type="button" data-cart-step="-1" aria-label="Decrease">−</button>
              <input type="number" value="${qty}" min="0" max="${p.stock}" aria-label="Quantity of ${esc(p.name)}" data-cart-input />
              <button type="button" data-cart-step="1" aria-label="Increase">+</button>
            </div>` : ""}
            ${removable ? `<button class="link-btn" type="button" data-remove>Remove</button>` : ""}
          </div>
        </div>
        <div class="amount">${qtyCtl ? fmt(p.price * qty) : ""}</div>
      </div>`;
  }

  function renderCart() {
    const lines = cartLines();
    const body = $("#cartItems"), foot = $("#cartFoot");
    if (!lines.length) {
      body.innerHTML = `<div class="drawer-empty"><div class="empty-art">${window.productArt("tube", "#94a3b8")}</div><h3>Your cart is empty</h3><p class="muted">Add a few products to get started.</p><button class="btn btn-soft" type="button" data-close data-goto="#catalog">Browse catalogue</button></div>`;
      foot.innerHTML = "";
      return;
    }
    body.innerHTML = lines.map((l) => lineHTML(l.p, l.qty)).join("");
    const t = cartTotals();
    const next = TIERS.find((x) => t.sub < x.min);
    const pct = next ? Math.min(100, (t.sub / next.min) * 100) : 100;
    foot.innerHTML = `
      <div class="progress">${next ? `Add <b>${fmt(next.min - t.sub)}</b> for <b>${next.off * 100}% off</b>` : `<b>Maximum bulk discount applied</b>`}
        <div class="bar"><i style="width:${pct}%"></i></div></div>
      <div class="totals">
        <div><span>Subtotal</span><span>${fmt(t.sub)}</span></div>
        ${t.discount ? `<div class="discount"><span>Bulk discount (${t.tier.off * 100}%)</span><span>−${fmt(t.discount)}</span></div>` : ""}
        <div><span>Shipping</span><span>${t.shipping ? fmt(t.shipping) : "Free"}</span></div>
        <div class="grand"><span>Total</span><span>${fmt(t.total)}</span></div>
      </div>
      <button class="btn btn-primary" type="button" id="checkoutBtn">Request quote for this order</button>
      <button class="btn btn-ghost" type="button" id="clearCart" style="margin-top:8px;min-height:40px">Clear cart</button>`;
  }

  function flyToCart(fromEl) {
    if (reduceMotion) return;
    const a = fromEl.getBoundingClientRect(), b = $("#cartBtn").getBoundingClientRect();
    const dot = document.createElement("div");
    dot.className = "fly";
    document.body.appendChild(dot);
    const x0 = a.left + a.width / 2 - 9, y0 = a.top + a.height / 2 - 9;
    const x1 = b.left + b.width / 2 - 9, y1 = b.top + b.height / 2 - 9;
    dot.animate(
      [
        { transform: `translate(${x0}px, ${y0}px) scale(1)`, opacity: 1 },
        { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1.2)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${x1}px, ${y1}px) scale(0.4)`, opacity: 0.2 },
      ],
      { duration: 700, easing: "cubic-bezier(.5,0,.5,1)" }
    ).onfinish = () => dot.remove();
    dot.style.left = 0; dot.style.top = 0;
  }

  function refreshCard(id) {
    const card = $(`.card[data-id="${CSS.escape(id)}"]`);
    const p = byId(id);
    if (!card || !p) return;
    const i = $$(".card").indexOf(card);
    const tmp = document.createElement("div");
    tmp.innerHTML = cardHTML(p, 0);
    const fresh = tmp.firstElementChild;
    fresh.style.animation = "none";
    card.replaceWith(fresh);
    if (state.cart[id]) {
      const btn = $(".add-btn", fresh);
      btn.classList.add("added"); btn.innerHTML = CHECK;
      setTimeout(() => { btn.classList.remove("added"); btn.innerHTML = PLUS; }, 1100);
    }
    return i;
  }

  /* ---------------- Favourites ---------------- */
  function toggleFav(id) {
    const i = state.favs.indexOf(id);
    if (i >= 0) state.favs.splice(i, 1); else state.favs.push(id);
    persist.favs();
    $$(`[data-fav="${CSS.escape(id)}"]`).forEach((b) => b.setAttribute("aria-pressed", i < 0));
    renderFavBadge(true);
    renderFavs();
    if (i < 0) toast("Saved for later");
  }
  function renderFavBadge(bump) {
    state.favs = state.favs.filter(byId);
    const el = $("#favCount");
    el.hidden = !state.favs.length;
    el.textContent = state.favs.length;
    if (bump) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
  }
  function renderFavs() {
    const list = state.favs.map(byId).filter(Boolean);
    $("#favItems").innerHTML = list.length
      ? list.map((p) => `
        <div class="line-item" data-line="${esc(p.id)}">
          <div class="thumb" style="--c:${esc(colorOf(p))}">${art(p)}</div>
          <div><h4>${esc(p.name)}</h4><span class="muted">${fmt(p.price)} · ${esc(p.unit || "each")}</span>
            <div class="row"><button class="btn btn-soft small" type="button" data-add="${esc(p.id)}" ${p.stock <= 0 ? "disabled" : ""}>Add to cart</button>
            <button class="link-btn" type="button" data-fav="${esc(p.id)}">Remove</button></div></div>
          <div></div>
        </div>`).join("")
      : `<div class="drawer-empty"><div class="empty-art">${window.productArt("vial", "#94a3b8")}</div><h3>Nothing saved yet</h3><p class="muted">Tap the heart on any product to keep it here.</p></div>`;
  }

  /* ---------------- Drawers & dialogs ---------------- */
  let openDrawerEl = null;
  function openDrawer(sel) {
    closeDrawer();
    const d = $(sel);
    if (sel === "#cartDrawer") renderCart();
    if (sel === "#favDrawer") renderFavs();
    d.classList.add("open");
    d.setAttribute("aria-hidden", "false");
    $("#scrim").hidden = false;
    document.body.classList.add("locked");
    openDrawerEl = d;
    setTimeout(() => $("[data-close]", d).focus(), 50);
  }
  function closeDrawer() {
    if (!openDrawerEl) return;
    openDrawerEl.classList.remove("open");
    openDrawerEl.setAttribute("aria-hidden", "true");
    $("#scrim").hidden = true;
    document.body.classList.remove("locked");
    openDrawerEl = null;
  }
  function openDialog(d) {
    if (!d.open) d.showModal();
    document.body.classList.add("locked");
  }
  function closeDialog(d) {
    if (d.open) d.close();
    if (!$$("dialog[open]").length && !openDrawerEl) document.body.classList.remove("locked");
  }
  $$("dialog").forEach((d) => {
    d.addEventListener("close", () => { if (!$$("dialog[open]").length && !openDrawerEl) document.body.classList.remove("locked"); });
    // click on backdrop closes
    d.addEventListener("click", (e) => { if (e.target === d) closeDialog(d); });
  });

  /* ---------------- Quote ---------------- */
  let quoteFromCart = false;
  function openQuote(fromCart) {
    quoteFromCart = fromCart;
    const t = cartTotals();
    $("#quoteSummary").textContent = fromCart && t.sub
      ? `${cartLines().length} products · estimated total ${fmt(t.total)}. We'll confirm pricing and lead times within one business day.`
      : "Tell us what you need and we'll reply within one business day.";
    closeDrawer();
    openDialog($("#quoteModal"));
  }
  $("#quoteForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    let ok = true;
    ["name", "email"].forEach((n) => {
      const el = f.elements[n];
      const bad = !el.value.trim() || (n === "email" && !el.checkValidity());
      el.classList.toggle("invalid", bad);
      if (bad) ok = false;
    });
    if (!ok) { toast("Please add your name and a valid email"); return; }
    const data = Object.fromEntries(new FormData(f));
    const t = cartTotals();
    state.quotes.unshift({
      id: uid("q"),
      createdAt: new Date().toISOString(),
      ...data,
      items: quoteFromCart ? cartLines().map((l) => ({ id: l.p.id, name: l.p.name, qty: l.qty, price: l.p.price })) : [],
      total: quoteFromCart ? t.total : 0,
      status: "new",
    });
    persist.quotes();
    if (quoteFromCart) { state.cart = {}; persist.cart(); renderCart(); renderCartBadge(); renderGrid(); }
    f.reset();
    closeDialog($("#quoteModal"));
    renderQuotes();
    toast("Quote request saved — find it under Manage › Quote requests");
  });

  /* ---------------- Manage: products ---------------- */
  function renderProductTable() {
    const q = $("#manageSearch").value.toLowerCase().trim();
    const list = state.products.filter((p) => !q || `${p.name} ${p.sku} ${catOf(p.category).name}`.toLowerCase().includes(q));
    $("#productTable").innerHTML = `
      <thead><tr><th>Product</th><th class="hide-sm">Category</th><th class="num">Price</th><th class="num">Stock</th><th></th></tr></thead>
      <tbody>${list.map((p) => `
        <tr data-row="${esc(p.id)}">
          <td><div class="prod"><div class="thumb" style="--c:${esc(colorOf(p))}">${art(p)}</div><div><b>${esc(p.name)}</b><br><span class="muted small">${esc(p.sku || "—")}</span></div></div></td>
          <td class="hide-sm"><span class="cat-tag" style="--c:${esc(colorOf(p))}"><i></i>${esc(catOf(p.category).name)}</span></td>
          <td class="num">${fmt(p.price)}</td>
          <td class="num"><input class="stock-inline" type="number" min="0" step="1" value="${p.stock}" data-stock aria-label="Stock for ${esc(p.name)}" /></td>
          <td><div class="acts">
            <button class="icon-btn" type="button" data-edit title="Edit" aria-label="Edit ${esc(p.name)}">${ICON.edit}</button>
            <button class="icon-btn" type="button" data-dup title="Duplicate" aria-label="Duplicate ${esc(p.name)}">${ICON.copy}</button>
            <button class="icon-btn del" type="button" data-del title="Delete" aria-label="Delete ${esc(p.name)}">${ICON.trash}</button>
          </div></td>
        </tr>`).join("") || `<tr><td colspan="5" class="muted" style="text-align:center;padding:30px">No products${q ? " match" : " yet — add your first one"}.</td></tr>`}
      </tbody>`;
  }

  $("#productTable").addEventListener("click", (e) => {
    const row = e.target.closest("[data-row]");
    if (!row) return;
    const id = row.dataset.row;
    if (e.target.closest("[data-edit]")) openEditor(id);
    else if (e.target.closest("[data-dup]")) {
      const p = byId(id);
      const copy = { ...clone(p), id: uid(), name: `${p.name} (copy)`, sku: p.sku ? `${p.sku}-C` : "" };
      state.products.splice(state.products.indexOf(p) + 1, 0, copy);
      commitProducts();
      toast("Product duplicated");
    } else if (e.target.closest("[data-del]")) {
      const idx = state.products.findIndex((p) => p.id === id);
      const [removed] = state.products.splice(idx, 1);
      const inCart = state.cart[id];
      delete state.cart[id]; persist.cart();
      commitProducts();
      toast(`Deleted ${removed.name}`, "ok", {
        label: "Undo",
        run: () => {
          state.products.splice(idx, 0, removed);
          if (inCart) { state.cart[id] = inCart; persist.cart(); }
          commitProducts();
        },
      });
    }
  });
  $("#productTable").addEventListener("change", (e) => {
    if (!e.target.matches("[data-stock]")) return;
    const p = byId(e.target.closest("[data-row]").dataset.row);
    p.stock = Math.max(0, Math.floor(+e.target.value) || 0);
    e.target.value = p.stock;
    if (state.cart[p.id] > p.stock) { if (p.stock) state.cart[p.id] = p.stock; else delete state.cart[p.id]; persist.cart(); }
    persist.products();
    renderAll();
    toast(`Stock updated: ${p.name}`);
  });
  $("#manageSearch").addEventListener("input", renderProductTable);

  function commitProducts() {
    persist.products();
    renderAll();
    renderProductTable();
    renderCategories();
  }

  /* ---------------- Manage: editor ---------------- */
  let editing = null; // working copy
  function openEditor(id) {
    const base = id ? clone(byId(id)) : {
      id: uid(), name: "", sku: "", category: state.categories[0]?.id || "", icon: "tube",
      price: 0, unit: "each", stock: 0, rating: 0, badge: "", description: "", specs: {},
    };
    editing = { ...base, _isNew: !id };
    const f = $("#editForm");
    $("#editTitle").textContent = id ? "Edit product" : "New product";
    f.elements.category.innerHTML = state.categories.map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
    ["name", "sku", "category", "price", "oldPrice", "unit", "stock", "rating", "badge", "description"].forEach((k) => {
      f.elements[k].value = editing[k] ?? "";
      f.elements[k].classList.remove("invalid");
    });
    f.elements.imageFile.value = "";
    $("#specRows").innerHTML = "";
    Object.entries(editing.specs || {}).forEach(([k, v]) => addSpecRow(k, v));
    renderIconPicker();
    renderPreview();
    openDialog($("#editModal"));
    setTimeout(() => f.elements.name.focus(), 50);
  }
  function renderIconPicker() {
    const color = catOf($("#editForm").elements.category.value).color;
    $("#iconPicker").innerHTML = window.ICON_NAMES.map((n) => `
      <button type="button" role="radio" aria-checked="${editing.icon === n}" data-icon="${n}" title="${n}" aria-label="${n}">${window.productArt(n, color)}</button>`).join("");
  }
  function renderPreview() {
    const f = $("#editForm");
    const color = catOf(f.elements.category.value).color;
    const box = $("#previewArt");
    box.style.setProperty("--c", color);
    box.innerHTML = editing.image ? `<img src="${esc(editing.image)}" alt="Product photo" />` : window.productArt(editing.icon, color);
    $("#clearImage").hidden = !editing.image;
  }
  function addSpecRow(k = "", v = "") {
    const row = document.createElement("div");
    row.className = "spec-row";
    row.innerHTML = `<input placeholder="Label" value="${esc(k)}" maxlength="30" aria-label="Spec label" /><input placeholder="Value" value="${esc(v)}" maxlength="60" aria-label="Spec value" /><button class="icon-btn" type="button" aria-label="Remove spec">${ICON.x}</button>`;
    $("button", row).onclick = () => row.remove();
    $("#specRows").appendChild(row);
    return row;
  }
  $("#addSpec").addEventListener("click", () => $("input", addSpecRow()).focus());
  $("#iconPicker").addEventListener("click", (e) => {
    const b = e.target.closest("[data-icon]");
    if (!b) return;
    editing.icon = b.dataset.icon;
    $$("[data-icon]").forEach((x) => x.setAttribute("aria-checked", x === b));
    renderPreview();
  });
  $("#editForm").elements.category.addEventListener("change", () => { renderIconPicker(); renderPreview(); });
  $("#editForm").elements.imageFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    resizeImage(file, 640).then((url) => { editing.image = url; renderPreview(); })
      .catch(() => toast("That image couldn't be read"));
  });
  $("#clearImage").addEventListener("click", () => { delete editing.image; renderPreview(); });

  // Downscale uploads so they fit comfortably in localStorage.
  function resizeImage(file, max) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  $("#editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.currentTarget, el = f.elements;
    const checks = [
      [el.name, el.name.value.trim().length > 0],
      [el.price, el.price.value !== "" && +el.price.value >= 0],
      [el.stock, el.stock.value !== "" && +el.stock.value >= 0],
    ];
    checks.forEach(([input, ok]) => input.classList.toggle("invalid", !ok));
    const firstBad = checks.find(([, ok]) => !ok);
    if (firstBad) { firstBad[0].focus(); toast("Name, price and stock are required"); return; }

    const specs = {};
    $$(".spec-row", f).forEach((r) => {
      const [k, v] = $$("input", r).map((i) => i.value.trim());
      if (k) specs[k] = v;
    });
    const p = {
      id: editing.id,
      name: el.name.value.trim(),
      sku: el.sku.value.trim(),
      category: el.category.value,
      icon: editing.icon,
      price: Math.round(+el.price.value * 100) / 100,
      oldPrice: el.oldPrice.value ? Math.round(+el.oldPrice.value * 100) / 100 : undefined,
      unit: el.unit.value.trim() || "each",
      stock: Math.floor(+el.stock.value),
      rating: Math.min(5, Math.max(0, +el.rating.value || 0)),
      badge: el.badge.value.trim(),
      description: el.description.value.trim(),
      specs,
    };
    if (editing.image) p.image = editing.image;
    if (editing._isNew) state.products.unshift(p);
    else state.products[state.products.findIndex((x) => x.id === p.id)] = p;
    if (state.cart[p.id] > p.stock) { if (p.stock) state.cart[p.id] = p.stock; else delete state.cart[p.id]; persist.cart(); }
    if (!persist.products()) return;
    closeDialog($("#editModal"));
    commitProducts();
    toast(editing._isNew ? `Added ${p.name}` : `Saved ${p.name}`);
  });

  /* ---------------- Manage: categories ---------------- */
  function renderCategories() {
    const counts = state.products.reduce((m, p) => ((m[p.category] = (m[p.category] || 0) + 1), m), {});
    $("#catList").innerHTML = state.categories.map((c) => `
      <li data-cat-row="${esc(c.id)}">
        <input type="color" value="${esc(c.color)}" aria-label="Colour for ${esc(c.name)}" data-cat-color />
        <input type="text" value="${esc(c.name)}" maxlength="40" aria-label="Category name" data-cat-name />
        <span class="n">${counts[c.id] || 0} products</span>
        <button class="icon-btn del" type="button" data-cat-del aria-label="Delete ${esc(c.name)}" ${counts[c.id] ? 'title="Move or delete its products first"' : ""}>${ICON.trash}</button>
      </li>`).join("");
  }
  $("#catForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const name = f.elements.name.value.trim();
    if (!name) return;
    state.categories.push({ id: uid("c"), name, color: f.elements.color.value });
    persist.categories();
    f.reset();
    renderCategories(); renderChips(); renderStats(false);
    toast(`Category “${name}” added`);
  });
  $("#catList").addEventListener("change", (e) => {
    const row = e.target.closest("[data-cat-row]");
    if (!row) return;
    const c = state.categories.find((x) => x.id === row.dataset.catRow);
    if (e.target.matches("[data-cat-color]")) c.color = e.target.value;
    if (e.target.matches("[data-cat-name]")) c.name = e.target.value.trim() || c.name;
    persist.categories();
    renderAll(); renderProductTable();
  });
  $("#catList").addEventListener("click", (e) => {
    if (!e.target.closest("[data-cat-del]")) return;
    const id = e.target.closest("[data-cat-row]").dataset.catRow;
    const used = state.products.filter((p) => p.category === id).length;
    if (used) { toast(`Move its ${used} products to another category first`); return; }
    state.categories = state.categories.filter((c) => c.id !== id);
    persist.categories();
    renderCategories(); renderChips(); renderStats(false);
    toast("Category deleted");
  });

  /* ---------------- Manage: quotes ---------------- */
  function renderQuotes() {
    const fresh = state.quotes.filter((q) => q.status === "new").length;
    $("#quoteCount").textContent = fresh;
    $("#quoteList").innerHTML = state.quotes.length
      ? state.quotes.map((q) => `
        <article class="quote" data-quote="${esc(q.id)}">
          <header><div><b>${esc(q.name)}</b>${q.org ? ` · ${esc(q.org)}` : ""}<br><span class="muted small">${esc(q.email)}${q.phone ? ` · ${esc(q.phone)}` : ""}</span></div>
            <span class="muted small">${new Date(q.createdAt).toLocaleString()}</span></header>
          ${q.items.length ? `<ul>${q.items.map((i) => `<li>${i.qty} × ${esc(i.name)} @ ${fmt(i.price)}</li>`).join("")}</ul>` : ""}
          ${q.notes ? `<p class="notes">“${esc(q.notes)}”</p>` : ""}
          <footer><b>${q.total ? fmt(q.total) : "General enquiry"}</b>
            <span><button class="btn btn-${q.status === "new" ? "soft" : "ghost"} small" type="button" data-q-toggle>${q.status === "new" ? "Mark handled" : "Handled ✓"}</button>
            <button class="icon-btn del" type="button" data-q-del aria-label="Delete request">${ICON.trash}</button></span></footer>
        </article>`).join("")
      : `<div class="drawer-empty"><div class="empty-art">${window.productArt("box", "#94a3b8")}</div><h3>No quote requests yet</h3><p class="muted">Requests sent from the cart or the hero button appear here.</p></div>`;
  }
  $("#quoteList").addEventListener("click", (e) => {
    const card = e.target.closest("[data-quote]");
    if (!card) return;
    const q = state.quotes.find((x) => x.id === card.dataset.quote);
    if (e.target.closest("[data-q-toggle]")) q.status = q.status === "new" ? "handled" : "new";
    else if (e.target.closest("[data-q-del]")) state.quotes = state.quotes.filter((x) => x !== q);
    else return;
    persist.quotes();
    renderQuotes();
  });

  /* ---------------- Manage: backup ---------------- */
  $("#exportBtn").addEventListener("click", () => {
    const data = { app: "unimed", version: 1, exportedAt: new Date().toISOString(), products: state.products, categories: state.categories, quotes: state.quotes };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `unimed-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Backup downloaded");
  });
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.products)) throw new Error("no products");
      const valid = data.products.filter((p) => p && p.id && p.name && isFinite(p.price));
      state.products = valid.map((p) => ({ ...p, price: +p.price, stock: Math.max(0, Math.floor(+p.stock || 0)), specs: p.specs || {} }));
      if (Array.isArray(data.categories) && data.categories.length) state.categories = data.categories;
      if (Array.isArray(data.quotes)) state.quotes = data.quotes;
      persist.products(); persist.categories(); persist.quotes();
      renderAll(); renderProductTable(); renderCategories(); renderQuotes();
      toast(`Imported ${valid.length} products`);
    } catch (err) {
      toast("That file isn't a valid Unimed backup");
    }
  });
  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset the catalogue to the original products? Your edits, cart and saved items will be removed. Quote requests are kept.")) return;
    state.products = clone(window.DEFAULT_PRODUCTS);
    state.categories = clone(window.DEFAULT_CATEGORIES);
    state.cart = {}; state.favs = [];
    ["products", "categories", "cart", "favs"].forEach((k) => persist[k]());
    renderAll(); renderProductTable(); renderCategories();
    toast("Catalogue reset");
  });

  /* Tabs */
  $(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    $$(".tabs [data-tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
    $$(".tab-panel").forEach((p) => (p.hidden = p.dataset.panel !== b.dataset.tab));
  });

  /* ---------------- Global events ---------------- */
  document.addEventListener("click", (e) => {
    const t = e.target;
    const open = t.closest("[data-open]");
    if (open) { openProduct(open.dataset.open); return; }
    const add = t.closest("[data-add]");
    if (add && !add.disabled) { addToCart(add.dataset.add, 1, add); return; }
    const fav = t.closest("[data-fav]");
    if (fav) { toggleFav(fav.dataset.fav); return; }
    const chip = t.closest("[data-cat]");
    if (chip) {
      state.filter.cat = chip.dataset.cat;
      renderChips(); renderGrid();
      return;
    }
    const close = t.closest("[data-close]");
    if (close) {
      const dlg = close.closest("dialog");
      if (dlg) closeDialog(dlg); else closeDrawer();
      if (close.dataset.goto) $(close.dataset.goto).scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (t.closest("#checkoutBtn")) { openQuote(true); return; }
    if (t.closest("#clearCart")) {
      const prev = { ...state.cart };
      state.cart = {}; persist.cart(); renderCart(); renderCartBadge(); renderGrid();
      toast("Cart cleared", "ok", { label: "Undo", run: () => { state.cart = prev; persist.cart(); renderCart(); renderCartBadge(); renderGrid(); } });
    }
  });

  // Cart quantity controls
  $("#cartItems").addEventListener("click", (e) => {
    const line = e.target.closest("[data-line]");
    if (!line) return;
    const id = line.dataset.line;
    const step = e.target.closest("[data-cart-step]");
    if (step) setQty(id, (state.cart[id] || 0) + +step.dataset.cartStep);
    if (e.target.closest("[data-remove]")) removeFromCart(id);
  });
  $("#cartItems").addEventListener("change", (e) => {
    if (!e.target.matches("[data-cart-input]")) return;
    setQty(e.target.closest("[data-line]").dataset.line, Math.floor(+e.target.value) || 0);
  });

  $("#cartBtn").addEventListener("click", () => openDrawer("#cartDrawer"));
  $("#favBtn").addEventListener("click", () => openDrawer("#favDrawer"));
  $("#scrim").addEventListener("click", closeDrawer);
  $("#heroQuote").addEventListener("click", () => openQuote(false));
  $("#manageBtn").addEventListener("click", () => {
    $("#manageSearch").value = "";
    renderProductTable(); renderCategories(); renderQuotes();
    openDialog($("#manageModal"));
  });
  $("#addProduct").addEventListener("click", () => openEditor(null));

  let searchTimer;
  $("#search").addEventListener("input", (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.filter.q = e.target.value;
      renderGrid();
      if (e.target.value && window.scrollY < $("#catalog").offsetTop - 200) {
        $("#catalog").scrollIntoView({ behavior: "smooth" });
      }
    }, 160);
  });
  $("#sort").addEventListener("change", (e) => { state.prefs.sort = e.target.value; persist.prefs(); renderGrid(); });
  $("#inStockOnly").addEventListener("change", (e) => { state.prefs.inStock = e.target.checked; persist.prefs(); renderGrid(); });
  $("#maxPrice").addEventListener("input", (e) => {
    const v = +e.target.value, atMax = v >= +e.target.max;
    state.filter.maxPrice = atMax ? Infinity : v;
    $("#maxPriceOut").textContent = atMax ? "Any" : fmt(v);
    renderGrid();
  });
  $$(".seg [data-view]").forEach((b) => b.addEventListener("click", () => {
    state.prefs.view = b.dataset.view; persist.prefs();
    $$(".seg [data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    renderGrid();
  }));
  $("#clearFilters").addEventListener("click", () => {
    state.filter = { q: "", cat: "all", maxPrice: Infinity };
    state.prefs.inStock = false; persist.prefs();
    $("#search").value = ""; $("#inStockOnly").checked = false;
    const r = $("#maxPrice"); r.value = r.max;
    renderAll();
  });

  // Theme
  $("#themeBtn").addEventListener("click", () => {
    const root = document.documentElement;
    const current = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem(KEYS.theme, next); } catch (e) {}
  });

  // Keyboard: "/" focuses search, Esc closes drawers
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && !/input|textarea|select/i.test(document.activeElement.tagName)) {
      e.preventDefault(); $("#search").focus();
    }
    if (e.key === "Escape" && openDrawerEl && !$$("dialog[open]").length) closeDrawer();
  });

  // Keep other tabs in sync
  window.addEventListener("storage", (e) => {
    const map = { [KEYS.products]: "products", [KEYS.categories]: "categories", [KEYS.cart]: "cart", [KEYS.favs]: "favs", [KEYS.quotes]: "quotes" };
    const k = map[e.key];
    if (!k) return;
    state[k] = load(e.key, k === "cart" ? {} : []);
    renderAll(); renderCart(); renderQuotes();
  });

  // Sticky header shadow + reveal on scroll
  const topbar = $("#topbar");
  addEventListener("scroll", () => topbar.classList.toggle("scrolled", scrollY > 8), { passive: true });
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        if (en.target.classList.contains("hero-copy")) renderStats(true);
        io.unobserve(en.target);
      }), { threshold: 0.15 })
    : null;
  $$(".reveal").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));

  // Static illustrations in the markup
  $$("[data-art]").forEach((el) => (el.innerHTML = window.productArt(el.dataset.art, el.dataset.color)));

  // Bulk tiers band
  $("#tiers").innerHTML = TIERS.map((t) => `<li><b>${t.off * 100}% off</b><span>orders over ${fmt(t.min)}</span></li>`).join("");

  /* ---------------- Init ---------------- */
  $("#year").textContent = new Date().getFullYear();
  $("#sort").value = state.prefs.sort;
  $("#inStockOnly").checked = state.prefs.inStock;
  $$(".seg [data-view]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.view === state.prefs.view));
  $("#grid").innerHTML = Array.from({ length: 8 }, () => `<div class="skeleton"></div>`).join("");
  requestAnimationFrame(() => { renderAll(); renderQuotes(); });
})();
