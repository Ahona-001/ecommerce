/* ==========
  Single Product Ecommerce JS
  - Cart (add/update/remove)
  - Variant/Size pick
  - Delivery: inside=60, outside=120
  - Checkout form -> Generate invoice -> Download PDF
========== */

const PRODUCT = {
  id: "single-001",
  // Example product (easy to swap): The Ordinary hair density serum
  // For your "5 themes" builder: you can replace this object from user-selected config.
  name: "The Ordinary — Multi‑Peptide Serum for Hair Density",
  price: 1890,        // BDT
  compareAt: 2190,    // BDT
  // IMPORTANT: match your local asset name
  image: "assets/11.png",
};

const SHIPPING = {
  inside: 60,
  outside: 120,
};

const state = {
  cart: [], // [{id,name,price,image,variant,qty}]
  deliveryZone: "inside",
  lastInvoice: null,
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));


function onIf(sel, ev, fn){ const el = document.querySelector(sel); if(el) el.addEventListener(ev, fn); }
function formatBDT(n) {
  const num = Number(n || 0);
  return `৳ ${num.toLocaleString("en-US")}`;
}

function getSelectedRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function clampQty(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/* Drawer */
function openDrawer() {
  $("#cartDrawer")?.classList.add("is-open");
  $("#drawerBackdrop")?.classList.add("is-open");
}
function closeDrawer() {
  $("#cartDrawer")?.classList.remove("is-open");
  $("#drawerBackdrop")?.classList.remove("is-open");
}

/* Cart helpers */
function cartKeyFor(item) {
  return `${item.id}__${item.variant}`;
}
function findCartIndex(item) {
  const key = cartKeyFor(item);
  return state.cart.findIndex((x) => cartKeyFor(x) === key);
}

function addToCart({ variant, qty }) {
  const item = {
    id: PRODUCT.id,
    name: PRODUCT.name,
    price: PRODUCT.price,
    image: PRODUCT.image,
    variant,
    qty: clampQty(qty),
  };

  const idx = findCartIndex(item);
  if (idx >= 0) state.cart[idx].qty += item.qty;
  else state.cart.push(item);

  renderAll();
  openDrawer();
}

function updateCartQty(index, qty) {
  const q = clampQty(qty);
  if (!state.cart[index]) return;
  state.cart[index].qty = q;
  renderAll();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  renderAll();
}

function clearCart() {
  state.cart = [];
  state.lastInvoice = null;
  $("#downloadInvoiceBtn").disabled = true;
  $("#viewInvoiceBtn").disabled = true;
  $("#downloadInvoiceFromModal").disabled = true;
  { const _el_9034 = document.querySelector("#receiptBadge"); if (_el_9034) _el_9034.textContent = "Ready"; }
  renderAll();
}

function cartCount() {
  return state.cart.reduce((sum, i) => sum + i.qty, 0);
}
function cartSubtotal() {
  return state.cart.reduce((sum, i) => sum + i.price * i.qty, 0);
}
function cartDelivery() {
  return SHIPPING[state.deliveryZone] ?? SHIPPING.inside;
}
function cartTotal() {
  return cartSubtotal() + cartDelivery();
}

/* Render cart drawer */
function renderCartDrawer() {
  const root = $("#cartItems");
  root.innerHTML = "";

  if (state.cart.length === 0) {
    root.innerHTML = `
      <div class="cart-empty">
        <div style="font-weight:900;">Your cart is empty</div>
        <div style="margin-top:6px;color:rgba(15,23,42,.62);font-weight:700;">
          Add a product to continue checkout.
        </div>
      </div>
    `;
  } else {
    state.cart.forEach((item, idx) => {
      const lineTotal = item.price * item.qty;

      const el = document.createElement("div");
      el.className = "cart-item";
      el.style.marginBottom = "10px";

      el.innerHTML = `
        <div class="thumb">
          <img src="${item.image}" alt="Cart product" />
        </div>

        <div class="cart-item__meta">
          <div class="cart-item__name">${escapeHtml(item.name)}</div>
          <div class="cart-item__small">Variant: ${escapeHtml(item.variant)}</div>

          <div class="cart-row">
            <div class="stepper stepper--sm">
              <button class="stepper__btn" type="button" data-act="minus" data-idx="${idx}">−</button>
              <input class="stepper__input" type="number" value="${item.qty}" min="1" data-act="input" data-idx="${idx}" />
              <button class="stepper__btn" type="button" data-act="plus" data-idx="${idx}">+</button>
            </div>

            <div class="price">
              <div class="price__now">${formatBDT(lineTotal)}</div>
              <div class="price__was">${formatBDT(PRODUCT.compareAt * item.qty)}</div>
            </div>
          </div>

          <div class="cart-actions">
            <button class="remove-btn" type="button" data-act="remove" data-idx="${idx}">Remove</button>
            <div style="font-weight:900;color:rgba(15,23,42,.78);">Unit: ${formatBDT(item.price)}</div>
          </div>
        </div>
      `;

      root.appendChild(el);
    });
  }

  { const _el_76949 = document.querySelector("#cartCount"); if (_el_76949) _el_76949.textContent = String(cartCount()); }

  { const _el_25654 = document.querySelector("#cartSubtotal"); if (_el_25654) _el_25654.textContent = formatBDT(cartSubtotal()); }
  { const _el_58939 = document.querySelector("#cartDelivery"); if (_el_58939) _el_58939.textContent = formatBDT(cartDelivery()); }
  { const _el_74468 = document.querySelector("#cartTotal"); if (_el_74468) _el_74468.textContent = formatBDT(cartTotal()); }

  // Wire events inside drawer
  root.querySelectorAll("[data-act]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const act = e.currentTarget.getAttribute("data-act");
      const idx = Number(e.currentTarget.getAttribute("data-idx"));

      if (!Number.isFinite(idx)) return;

      if (act === "minus") updateCartQty(idx, (state.cart[idx]?.qty ?? 1) - 1);
      if (act === "plus") updateCartQty(idx, (state.cart[idx]?.qty ?? 1) + 1);
      if (act === "remove") removeCartItem(idx);
    });
  });

  root.querySelectorAll('input[data-act="input"]').forEach((inp) => {
    inp.addEventListener("change", (e) => {
      const idx = Number(e.currentTarget.getAttribute("data-idx"));
      updateCartQty(idx, e.currentTarget.value);
    });
  });
}

/* Render receipt summary */
function renderReceipt() {
  const rItems = $("#receiptItems");
  rItems.innerHTML = "";

  if (state.cart.length === 0) {
    rItems.innerHTML = `
      <div class="itemline">
        <div class="itemline__left">
          <div class="itemline__name">No items yet</div>
          <div class="itemline__meta">Add to cart to see summary</div>
        </div>
        <div class="itemline__right">${formatBDT(0)}</div>
      </div>
    `;
  } else {
    state.cart.forEach((item) => {
      const el = document.createElement("div");
      el.className = "itemline";
      el.innerHTML = `
        <div class="itemline__left">
          <div class="itemline__name">${escapeHtml(item.name)} × ${item.qty}</div>
          <div class="itemline__meta">Variant: ${escapeHtml(item.variant)}</div>
        </div>
        <div class="itemline__right">${formatBDT(item.price * item.qty)}</div>
      `;
      rItems.appendChild(el);
    });
  }

  { const _el_14559 = document.querySelector("#rSubtotal"); if (_el_14559) _el_14559.textContent = formatBDT(cartSubtotal()); }
  { const _el_90125 = document.querySelector("#rDelivery"); if (_el_90125) _el_90125.textContent = formatBDT(cartDelivery()); }
  { const _el_82266 = document.querySelector("#rTotal"); if (_el_82266) _el_82266.textContent = formatBDT(cartTotal()); }
}

/* Render all */
function renderAll() {
  renderCartDrawer();
  renderReceipt();

  // Update WhatsApp link with current selection
  updateWhatsAppLink();
}

/* Sync product texts/prices in the UI */
function syncProductUI(){
  const pNow = $("#priceNow");
  const pWas = $("#priceWas");
  const side = $("#sidePrice");
  if (pNow) pNow.textContent = formatBDT(PRODUCT.price);
  if (pWas) pWas.textContent = formatBDT(PRODUCT.compareAt);
  if (side) side.textContent = formatBDT(PRODUCT.price);
}

/* WhatsApp link */
function updateWhatsAppLink() {
  const wa = $("#contactWhatsApp");
  if(!wa) return;
const variant = getSelectedRadio("variant");
  const qty = clampQty($("#qtyInput")?.value);

  const subtotal = PRODUCT.price * qty;
  const msg =
    `Hello! I want to order:\n` +
    `${PRODUCT.name}\n` +
    `Variant: ${variant}\n` +
    `Quantity: ${qty}\n` +
    `Price: ${formatBDT(PRODUCT.price)} each\n` +
    `Subtotal: ${formatBDT(subtotal)}\n` +
    `Delivery: Inside Dhaka ৳60 / Outside Dhaka ৳120\n` +
    `Please confirm availability.`;

  // Put your real BD WhatsApp number below (without +)
  const whatsappNumber = "8801XXXXXXXXX";
  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
  wa.href = url;
}

/* Invoice generation */
function generateInvoiceData(customer) {
  const invoiceNo = `INV-${Date.now().toString().slice(-8)}`;
  const date = new Date();

  return {
    invoiceNo,
    date: date.toLocaleString("en-GB"),
    seller: {
      name: "MyMart",
      phone: "+8801XXXXXXXXX",
      email: "support@mymart.com",
      note: "Delivery across Bangladesh",
    },
    customer,
    items: state.cart.map((i) => ({
      name: i.name,
      variant: i.variant,
      qty: i.qty,
      unit: i.price,
      total: i.price * i.qty,
    })),
    subtotal: cartSubtotal(),
    deliveryZone: state.deliveryZone,
    deliveryFee: cartDelivery(),
    total: cartTotal(),
  };
}

// jsPDF default fonts often don't support the Bangladeshi Taka symbol (৳).
// For the PDF we use an explicit BDT prefix to avoid garbled glyphs (e.g., ০/ó).
function formatMoneyPDF(n) {
  const num = Number(n || 0);
  return `BDT ${num.toLocaleString("en-US")}`;
}



function formatBDTPlain(n){
  // Ensures a space after the currency symbol for better readability in PDFs/preview
  return formatBDT(n).replace('৳', '৳ ');
}

function buildInvoiceHTML(inv){
  const zone = inv.deliveryZone === "inside" ? "Inside Dhaka" : "Outside Dhaka";
  const addr = escapeHtml(inv.customer.address).replace(/\n/g,'<br>');

  const rows = inv.items.map(it => `
    <div class="invoice__row">
      <div>${escapeHtml(it.name)} (${escapeHtml(it.variant)})</div>
      <div>${it.qty}</div>
      <div>${formatBDTPlain(it.unit)}</div>
      <div style="text-align:right">${formatBDTPlain(it.total)}</div>
    </div>
  `).join('');

  return `
    <div class="invoice">

      <div class="invoice__grid">
        <div class="invoice__box">
          <div class="invoice__k">Billed to</div>
          <div class="invoice__v">
            ${escapeHtml(inv.customer.name)}<br>
            ${escapeHtml(inv.customer.phone)}<br>
            ${addr}
          </div>
        </div>

        <div class="invoice__box">
          <div class="invoice__k">Order details</div>
          <div class="invoice__v">
            Delivery: ${zone}<br>
            Payment: ${escapeHtml(inv.customer.paymentMethod)}<br>
            Delivery fee: ${formatBDTPlain(inv.deliveryFee)}
          </div>
        </div>
      </div>

      <div class="invoice__table">
        <div class="invoice__rowH">
          <div>Item</div><div>Qty</div><div>Unit</div><div style="text-align:right">Total</div>
        </div>
        ${rows}
      </div>

      <div class="invoice__totals">
        <div class="invoice__totline"><span>Subtotal</span><span>${formatBDTPlain(inv.subtotal)}</span></div>
        <div class="invoice__totline"><span>Delivery</span><span>${formatBDTPlain(inv.deliveryFee)}</span></div>
        <div class="invoice__totline invoice__totline--grand">
          <span>Grand total</span><span>${formatBDTPlain(inv.total)}</span>
        </div>
      </div>

    </div>
  `;
}


function downloadInvoicePDF(inv) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("Invoice library didn't load. Please check jsPDF CDN.");
    return;
  }

  // ---------- helpers ----------
  const pdfSafeText = (str) =>
    String(str || "")
      .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u00A0/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .trim();

  const formatMoneyPDF = (n) =>
    `BDT ${Number(n || 0).toLocaleString("en-BD")}`;

  // ---------- init ----------
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const primary = [79, 70, 229];
  const text = [15, 23, 42];

  // ---------- page bg ----------
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, 210, 297, "F");

  // ---------- header card ----------
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.6);
  doc.roundedRect(14, 14, 182, 30, 6, 6, "FD");

  // accent line
  doc.setDrawColor(...primary);
  doc.setLineWidth(1.2);
  doc.line(18, 41.5, 192, 41.5);

  // ---------- logo ----------
  const logo = new Image();
  logo.src = "assets/logo1.png";

  logo.onload = () => {
    doc.addImage(logo, "PNG", 18, 18, 24, 24);

    // brand
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...text);
    doc.text(pdfSafeText(inv.seller.name), 46, 28);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      pdfSafeText(inv.seller.note || "Delivery across Bangladesh"),
      46,
      34
    );

    // invoice meta
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...text);
    doc.text("INVOICE", 192, 25.5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(inv.invoiceNo, 192, 31.5, { align: "right" });
    doc.text(inv.date, 192, 36.5, { align: "right" });

    // ---------- info boxes ----------
    let y = 54;
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(12, y - 6, 96, 42, 4, 4, "F");
    doc.roundedRect(116, y - 6, 82, 42, 4, 4, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...text);
    doc.text("Bill To", 14, y);

    doc.setFont("helvetica", "normal");
    doc.text(pdfSafeText(inv.customer.name), 14, y + 6);
    doc.text(pdfSafeText(inv.customer.phone), 14, y + 11);

    const addrLines = doc.splitTextToSize(
      pdfSafeText(inv.customer.address),
      90
    );
    doc.text(addrLines, 14, y + 16);

    doc.setFont("helvetica", "bold");
    doc.text("Seller", 120, y);

    doc.setFont("helvetica", "normal");
    doc.text(pdfSafeText(inv.seller.phone), 120, y + 6);
    doc.text(pdfSafeText(inv.seller.email), 120, y + 11);

    const zone =
      inv.deliveryZone === "inside" ? "Inside Dhaka" : "Outside Dhaka";
    doc.text(`Delivery: ${zone}`, 120, y + 16);
    doc.text(`Payment: ${pdfSafeText(inv.customer.paymentMethod)}`, 120, y + 21);

    // ---------- table header ----------
    let yTable = 96;
    doc.setFillColor(236, 242, 255);
    doc.roundedRect(14, yTable - 6, 182, 10, 2, 2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...text);
    doc.text("Item", 18, yTable);
    doc.text("Qty", 128, yTable, { align: "right" });
    doc.text("Unit", 158, yTable, { align: "right" });
    doc.text("Total", 196, yTable, { align: "right" });

    doc.setFont("helvetica", "normal");
    yTable += 10;

    // ---------- items ----------
    inv.items.forEach((item) => {
      const name = pdfSafeText(`${item.name} (${item.variant})`);
      const nameLines = doc.splitTextToSize(name, 88);

      doc.text(nameLines, 18, yTable);
      doc.text(String(item.qty), 128, yTable, { align: "right" });
      doc.text(formatMoneyPDF(item.unit), 158, yTable, { align: "right" });
      doc.text(formatMoneyPDF(item.total), 196, yTable, { align: "right" });

      yTable += nameLines.length * 6 + 4;

      if (yTable > 260) {
        doc.addPage();
        yTable = 20;
      }
    });

    // ---------- totals ----------
    yTable += 6;
    doc.setDrawColor(...primary);
    doc.line(120, yTable, 196, yTable);

    yTable += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Subtotal", 120, yTable);
    doc.text(formatMoneyPDF(inv.subtotal), 196, yTable, { align: "right" });

    yTable += 6;
    doc.text("Delivery", 120, yTable);
    doc.text(formatMoneyPDF(inv.deliveryFee), 196, yTable, { align: "right" });

    yTable += 8;
    doc.setFontSize(12);
    doc.text("Grand Total", 120, yTable);
    doc.text(formatMoneyPDF(inv.total), 196, yTable, { align: "right" });

    // ---------- save ----------
    doc.save(`${inv.invoiceNo}.pdf`);
  };
}



/* Small safety */
function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Init UI wiring */
function init() {
  // Drawer buttons
  onIf("#openCartBtn", "click", openDrawer);
  onIf("#closeCartBtn", "click", closeDrawer);
  onIf("#drawerBackdrop", "click", closeDrawer);

  // Stepper in hero
  onIf("#qtyMinus", "click", () => {
    { const _el_66297 = document.querySelector("#qtyInput"); if (_el_66297) _el_66297.value = clampQty(Number($("#qtyInput")?.value) - 1); }
    updateWhatsAppLink();
  });
  onIf("#qtyPlus", "click", () => {
    { const _el_9356 = document.querySelector("#qtyInput"); if (_el_9356) _el_9356.value = clampQty(Number($("#qtyInput")?.value) + 1); }
    updateWhatsAppLink();
  });
  onIf("#qtyInput", "change", () => {
    { const _el_53348 = document.querySelector("#qtyInput"); if (_el_53348) _el_53348.value = clampQty($("#qtyInput")?.value); }
    updateWhatsAppLink();
  });

  // Update WhatsApp when selections change
  $$('input[name="variant"]').forEach((el) => el.addEventListener("change", updateWhatsAppLink));

  // Add to cart
  onIf("#addToCartBtn", "click", () => {
    addToCart({
      variant: getSelectedRadio("variant"),
      qty: $("#qtyInput")?.value,
    });
  });

  // Quick adds
  onIf("#quickAdd1", "click", () => {
    addToCart({ variant: getSelectedRadio("variant"), qty: 1 });
  });
  onIf("#quickAdd2", "click", () => {
    addToCart({ variant: getSelectedRadio("variant"), qty: $("#qtyInput")?.value });
  });

  // Gallery click to update main image
  $$(".thumb2").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-img");
      if (src) $("#mainImage").src = src;
    });
  });

  // Usage thumbnails (swap one focused image)
  $$("[data-usage-img]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-usage-img");
      const img = $("#usageMain");
      if (src && img) {
        img.src = src;
        // active state
        $$("[data-usage-img]").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
      }
    });
  });

  // Delivery zone changes (affects totals)
  onIf("#deliveryZone", "change", (e) => {
    state.deliveryZone = e.target.value;
    renderAll();
  });

  // Clear cart
  onIf("#clearCartBtn", "click", clearCart);

  // Open cart from summary
  onIf("#openCartFromSummary", "click", openDrawer);

  // Order form -> generate invoice
  onIf("#orderForm", "submit", (e) => {
    e.preventDefault();

    if (state.cart.length === 0) {
      alert("Cart is empty. Please add a product first.");
      openDrawer();
      return;
    }

    const name = $("#fullName")?.value.trim();
    const phone = $("#phone")?.value.trim();
    const address = $("#address")?.value.trim();
    const paymentMethod = $("#paymentMethod")?.value;

    if (name.length < 2) {
      alert("Please enter your full name.");
      return;
    }
    if (address.length < 8) {
      alert("Please enter a complete delivery address.");
      return;
    }

    // basic BD phone check (soft)
    const phoneOk = /^01\d{9}$/.test(phone) || /^\+8801\d{9}$/.test(phone) || /^8801\d{9}$/.test(phone);
    if (!phoneOk) {
      alert("Please enter a valid Bangladesh phone number (e.g., 01XXXXXXXXX).");
      return;
    }

    const customer = { name, phone, address, paymentMethod };
    const inv = generateInvoiceData(customer);

    state.lastInvoice = inv;
    $("#downloadInvoiceBtn").disabled = false;
    $("#viewInvoiceBtn").disabled = false;
    $("#downloadInvoiceFromModal").disabled = false;
    { const _el_38430 = document.querySelector("#receiptBadge"); if (_el_38430) _el_38430.textContent = "Invoice ready"; }

    // Scroll a bit for feedback
    document.querySelector("#downloadInvoiceBtn").scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Download invoice
  onIf("#downloadInvoiceBtn", "click", () => {
    if (!state.lastInvoice) return;
    downloadInvoicePDF(state.lastInvoice);
  });



  // Invoice modal (View invoice)
  const invoiceModal = $("#invoiceModal");
  const invoiceBackdrop = $("#invoiceModalBackdrop");
  const closeInvoiceBtn = $("#closeInvoiceModal");

 function openInvoiceModal(){
  if (!state.lastInvoice) return;

  { 
    const _el_83221 = document.querySelector("#invoicePreview"); 
    if (_el_83221) 
      _el_83221.innerHTML = buildInvoiceHTML(state.lastInvoice); 
  }

  { 
    const _el_54508 = document.querySelector("#invoiceModalSub"); 
    if (_el_54508) 
      _el_54508.textContent = `Invoice ${state.lastInvoice.invoiceNo} • Total ${formatBDTPlain(state.lastInvoice.total)}`; 
  }

  invoiceModal.classList.add("is-open");
  invoiceModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.body.style.overflow = "hidden";
}

  function closeInvoiceModal(){
    invoiceModal.classList.remove("is-open");
    invoiceModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.body.style.overflow = "";
  }

  onIf("#viewInvoiceBtn", "click", openInvoiceModal);
  invoiceBackdrop.addEventListener("click", closeInvoiceModal);
  closeInvoiceBtn.addEventListener("click", closeInvoiceModal);

  onIf("#downloadInvoiceFromModal", "click", () => {
    if (!state.lastInvoice) return;
    downloadInvoicePDF(state.lastInvoice);
  });

  onIf("#printInvoiceBtn", "click", () => {
    if (!state.lastInvoice) return;
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
      <title>Invoice ${state.lastInvoice.invoiceNo}</title>
      <style>body{font-family:Inter,system-ui,Arial,sans-serif;background:#f1f5f9;padding:20px;} .wrap{max-width:900px;margin:0 auto;}
${document.querySelector('style')?document.querySelector('style').innerHTML:''}</style>
      </head><body><div class="wrap">${buildInvoiceHTML(state.lastInvoice)}</div></body></html>`;
    const w = window.open("", "_blank");
    if (!w) { alert("Popup blocked. Please allow popups to print."); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  });

  // Initial
  state.deliveryZone = $("#deliveryZone")?.value;
  syncProductUI();
  updateWhatsAppLink();
  renderAll();

  // Scroll reveal animations
  initReveal();
}

function initReveal(){
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach((el) => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', init);


/* === Mobile bottom navigation helpers (and desktop scrollspy) === */
(function () {
  const links = Array.from(document.querySelectorAll('.nav a[href^="#"], .bottom-nav a[href^="#"]'));
  if (!links.length) return;

  const sectionIds = ['highlights','benefits','usage','details','order','contact'];
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function setActive(id) {
    links.forEach(a => a.classList.remove('is-active'));
    const active = links.find(a => (a.getAttribute('data-nav') || (a.getAttribute('href') || '').slice(1)) === id);
    if (active) active.classList.add('is-active');
  }

  function headerOffset() {
    // Desktop header + breathing space; on mobile bottom nav exists so keep small offset
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    return isMobile ? 20 : 110;
  }

  function getCurrentSection() {
    const y = window.scrollY + headerOffset();
    let current = 'highlights';
    for (const sec of sections) {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (y >= top && y < bottom) {
        current = sec.id;
        break;
      }
      // If we haven't reached first section yet, keep highlights
      if (y < sections[0].offsetTop + 10) current = sections[0].id;
    }
    return current;
  }

  // Click -> smooth scroll + active
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const id = (a.getAttribute('data-nav') || href.slice(1)).trim();
      const target = document.getElementById(id);
      if (!target) return;

      e.preventDefault();
      setActive(id);

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const off = headerOffset();
      if (off) setTimeout(() => window.scrollBy(0, -off), 260);
      history.replaceState(null, '', '#' + id);
    });
  });

  // Initial state: use hash if valid, else highlights
  const initialHash = (location.hash || '').replace('#','');
  if (initialHash && sectionIds.includes(initialHash)) {
    setActive(initialHash);
  } else {
    setActive('highlights');
  }

  // Scrollspy (throttled)
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setActive(getCurrentSection());
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // Run once after layout
  setTimeout(onScroll, 60);
})();

/* =====================================================
   FINAL OVERRIDE — DO NOT EDIT ABOVE
   Ensures image-only logo for PDF + restores autofill
   ===================================================== */

document.addEventListener("DOMContentLoaded", function () {
  // Restore autofill safely
  const f = (id) => document.getElementById(id);
  if (f("fullName") && !f("fullName").value) f("fullName").value = "Demo User";
  if (f("phone") && !f("phone").value) f("phone").value = "01700000000";
  if (f("address") && !f("address").value) f("address").value = "House 12, Road 5, Dhanmondi, Dhaka";
  if (f("deliveryZone") && !f("deliveryZone").value) f("deliveryZone").value = "inside";
  if (f("paymentMethod") && !f("paymentMethod").value) f("paymentMethod").value = "COD";
});

// FINAL PDF with IMAGE LOGO ONLY (base64)
const FINAL_PDF_LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYQAAAG6CAYAAAAIzTEOAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAAEnQAABJ0Ad5mH3gAAP+lSURBVHhe7P3nk2Vbdh+IrX1vuqqsqmf7mX7tu9GNbgAECIA9oDjgcDgEhpwPFDWSQv8bP+jLSCFFzBdCDE2EGCPNiFYkCBINtHnd/bw39Uz5zOu2Piyz11rbnH2uycx67/4yTt6zl99u7ePuuWG5XEZ4rBA8YasIuzX/2CBeyVFxuZ1zmWNjbH9sP9aRAezxWGLiCXt8uRBjedvj8ca+H/dYB2F/hmCx/SOri8MXPwFcbudc5tjYtG83j33DAPZ4LLBfEBw2nzi7waYJ4YuBy+2cyxwbl9///QFcZjvtsRn2C4LDZQ/my5/4VxmX2zmXOTYuf1xsHsBltt8efdjfQ7hE+Ov2lz/p99hjd/BjfT/erx72C8IFYj8Z9tjDYj8nrhb2C8KOsR/se+zRj/18uVzsF4QdYD+o99hjc+zn0MVjvyBsEfsBvMce28d+Xl0c9gvCFrAfsHvssXvs59jusV8Q1sT+stAee1w89vNtt9gvCCOwXwT22OPysZ9/u8N+QahAJ//9IrDHHlcL+/m4G+wXhH3y32OPxxL7ebp9fKkWBJ/098l/jz16cHUnyX7+bhdfigVhn/j32GNdXP2Js5/b28MXdkHYnwHssceXB/t5vh18IReE/eDYY49t4PGaSPt5vzm+UAvC/oxgjz22hcdzIu3n/2b4QiwI+4Vgjz22icd7Mu1zwfp4rBeE/UKwxx7bxhdjQu1zw3p4LBeEfWfvsccu8MWbVPtcMQ6P1YKw79w99tgVvtgTa587+vBYLAj7ztxjj10hfuEXA419LmnjSi8I+87bY49d4ss7ufa5pYwruSDsO2uPPXaJL9dZQQv7XGNxpRaEfefssccusV8IauDc82XPQVdiQfiyd8Iee+wW+4VgLPwC8WXJUZe6IHxZGnmPPS4H+4Vg2/ALxBctf4XlcnnhVdqsEYMnbBVht+a/VIibdXQBl9s5FzU2QsHRuKYcJbzHFlHouscKF7ogjBvUNey2xR/3Dr0obD/Z9+ByO+eyxkYIYcTc6RbcY8e4rPGyCS5kQegfzD3YbSs/jp24K1xO0m/hcjvnMseG7orSGQTiqvXXHnDJ42Ysdrog7Caf7LZ1H6fO2yauXvIv4XI75zLHRqt7LjOuPfrxOPTTTm4qfxFvtnwREWOUbY/HF7of9315dfE4dM1WzxAupsK7XWYfh1V8EzzeCeNyO+cyx0a524rEDPVLTHtcBq5yd2xlQSgP1l1ht615lTtrXVzmIhC22l/btDUeFzU2YiHRl7uwSOzCfpG4XFzV5t9oQSgP0l1jty15VTtqLC5jEdhu8i9h1/bbuKyxESEW5lpG2Ar2C8XF4So29VoLQj44LxK7bcWr2Em9uMhFYPfJv4TL8JlwmWNDd22ElWbtHPtFYne4ak07akG4wHzTwG5b8Kp10BAuYhG4nORfwuXGcZljI3Vz3t+lS0y7xH6B2C6uUnN2LQgXkHNGYLetd5U6p4ZdLwJXZwHwuNy4LnNstBYEj/0C8fjhqjRhdUHYcc7ZALttuavSMR5f3kVA43JjvMyxgd2/3hjYLxCPB65CsxUXhB3nng2x21a7Cp3C+MIsAltzszVDa+HCxkah27c5Fi5ygdgvDuNw2c1lFoQtjrkdYrctdtkdss2JX8KFLAI7c7Ezw924lPERdz8uLmKR2C8OfbjMZgrL5XLXY23L2G1rXUZn7LoDdr4I7Nh8woU5quJyxgfkpw27HTI7XyD2i0Mbl9U8YbHILxldbey2pS6iIx7rBWCHpodxqc4FFzFGNIoLgscAe1PscoHYLw51XHTT7BcEh110wC4XgJ0mf9h5c4/E1QlmF+OkhDFPF2VYQ6UXu1og9otDGRfVLPsFwWEbDb+rBeDLlfxLuDoBbmOcDMEOoy2NqS2Z0dgvDheHXTfJfkFwWLfBd7EI7HQB2KHp3eFqBb3uWOlBPpwywnawA7O7WCD2i4PFrppjvyA49Db0theAnSX/HZm9HFy9yvSOlzEoD60icTfYoqttLw77hcFi282xXxAchhp4mwvBThaBHZi8OrialRsaM2NQH15Vxm6xRbfbWhz2i0KOWpPUx1MZ+wXBodSw21oEtr4AbNnc1cfVrXBp3IxFe5g1mReHLYWxjcVhvzBsH/sFwYHH2JVbBLZk5vHG1W+EdXPU8HAbFLh4bCmkTRaH/aKQMDyGhsfnfkFQiDEONlgPtrIIbMHEFw+PR6OMHUM9E3lr2XdX2FJ46y4OX+aFoW/81KGbbr8guLOBdcfVfhG4CDw+DdQzjsZN5FHCl4sthLrOwvBlWxTGjZ8+fKkXhNJloTFjar8I9KHUzuvh6jeWT0ql8bRec6yldPnYMOz9wpBjvfHThy/lgtBKUD1jaeOFYEP1q45W+26Gx7fhQihP5P7kVVB+nLBh+GMXhv52fTxQGju7wJdqQehJVLVxtF8E6uhp1+3gC9yIBdikdlFtfAHYoCpftoXhwqYW4UuxIIxJWH78bLQQbKB6lTGmPbeLL2iDdiE+9sktw5rD6MuwKFzWFPtCLwjrJC4eO/uFwGKdtkzYVoNsy84usEn79KBu/3FMeAb1qjXxRVwYNppmW8AXckHYJHlN1h00a6pdZazfjrtqjF3ZvSis254wWvdxSH4ZxlUR4Au0KKw91baML9yCsG4S4zOC0eNlrPwVx7rtdzENcRE+LhOttm/x+nBVk2GGNar6OC4Ma0+1nQCD+cIsCOsmMn9pqHuc9MpdYazbZgkX3QgX7e8qgPto076yuAoJcRAjq/y4LAobT7utIQ/kC7EgrJPY/ELAGBwjQ/wrinXaqIzLbIDL9H3Z0P23rb5EXFZi7MbI6l7VhWFrU3AjtIN4rBeEdZJcbSFgFMdGiXaFsU67tHFVGuCqxHEZGOrTIf4wLioxroWR1btKi8LWp+No9Afw2C4I6yS9ocUASguCL18xrNMOfbiKFb+KMV0U1unndXQQu0yQG2FklcYuDLDFukf5d1kY7/yxXBDGJsGehYAhY6Ff5cIwtt7jcQUrbXDV49slttX34+xsKzluFeOqsNaiwFin/uJtfbcbYDOnj92CMDYnjlkMAADCxFMuH7tZCMa1y9XA4xjztrDtMTDO3jqJcecYV4WNFgYYaIPMckbYNbbj8LFZEFJSrHeKxtiFgMUbfX6h2O4icEUqtTG+KPVYB9scDx7jbLcS46VgRPibLgoMboOitSJxV9iusyu/IOSJsT0Y110IpDhSfZvI6zoGlxj4heHLUMcaNhkbYzDOz5VaHMaFvtHioDVNG6xvciR24+hKLwjlBFkegJsuBIyLHt/lOrZwwQFuCePrWcLVqvvFJsNttN866Pd7se0xgP6wRy0MTUli7rYdmhFsjCu5ILSTh23sUQtBh+hO+5LQrp/HBQS0A4yrYy8ev7bYXnLYRXuORX8M26v3hugPGaCxOJSpChWB7bRDxfgOcKUWhL4kgg287YWAsZX+K6CvbowdBbFDjKvfJnj82mYIw0njotp2LPrjGq7jBaA/XAASry0QggE2Y3z9Ow1vGVdiQRiTTAKMeAxobB9seUEYU6+1gr1EjKvbtvF4tdVmeFxee90/Hi69Po1QGyy7OLQEG6jXfU2DW8alLghjkko6I6g1qEKHSA3V/urEmDptFOgFY1y9do3Hp902w3Cb1xPMZWI4bsalx0+h9keMwoNnDg2kOq9vY1e4lAVhTHLJLw35MqFCHot1x2d/ndZ0cMHor89lYcQBwlZxUe2yuZ9LT7YA3fW4rFglup4wKzLjFgeUvaz6DuHCF4TeRJMvBAxHr4mtiTH91FuXrQe5A/TXZV3sog12YXNb2KQ9N9Ft43ITUV+9LiLGZiQlZonmUF8YyvSLqOdYXNiC0Jtw6gsBg/hDYmuip49667KzIDdAf+yb4qLqflF+doFSX5Rou8PlJaW+em47vj6vhDhWAYELQ7/ituu4CS5kQehNQsOLAWAC6BFbE7W+6a3DToMbif6Yt4HLqvdl+d0FdH9dZN8hLicx9dVz09j6vCh4BV+uIgnWzxhybFq/bWGnC0JvQupbCHjud8quCd8vvXXYdVwt9Me4TVxefcu4avGMRW8f9spthstJUH11Gxtbn1XCkHCRXyQKeheGsfXaBXa2IPQmqa7FwIh0yG8A7pO++HcbSwl9ce0CF1/X8XgcYixhG326DRtlXE6iGq5PT1zDVhTGCEf514XHZVHYyYLQk7TGLwSMInGLGI599zFY9LTn9nGxddweHre4d92327V/8QmrL/5SXH2aYwQZSmGkbs/CUKrLRWGrC0Jv4lp/MYAWYyNw7O2+aDK3jt723A4utm67xeNQl4vsW43t+b3YxNUXN8fUJz1GENrCDZbHRS8KY9LI1haEnuS12ULAGBQYBR93uR+KxJ3Ax7MbXFx9LgL1NttNPTefrLV4Lxrbi2PzNhmDdtyxJ562CYcRwp2iu14UqlNiAFtZEOoTMmE7iwH0Cg2iFrPtg+34GkItlu3gYuqwDeymHS6n/vXJvIs6bgPbiate710gj9lTsni8QBOjhBM61ba9KGxj+my8IAxN4u0tBIxRwhkG4w2wsY9eDMWyHi4m9rHYTV3H4Cq0i22DMZP9YrGdvrq4+g2n1hDCiGp1C7bRYWY48nY7bntabbQgDE3y7S8GsI4CQEesiFC5ZLRd9MXSiwsIeA1st45fPrSSwMVi837cdV1ShJVYFXk4loqNddFhbmhRKMW8q+m11oLQM9l3sxjAaKWeWLXNQttvBX1x9GBHAW6I7dVvjxpKieFisXkfb7sO5YgUtSxQiKMiuA10mO5ZFC5iio1eEHom/uBiMMBuo195ONbcVjZONsRwDD3YclBbwHbqtcemyBPbRWDzvt9G3M0oovxrYgth9GE4lMFF4SLywKgFoScJ7HYxgC4Dw3HWbWxrgAzH0IMtBbMFbKc+62NwXF0RDE/q3WMbybYfm9V33VibXjNmRiAk+rpxjEYtFMLw+NkkziHbnQtCbzIYnLQD7D7UjQzHWddlbDouhmMYwoYBbAmb16Mfg+PmC4ThCb99XEyy26xeY2KseqoyGFogFx4Tw0bIXRsMj5HeOIfs5BhcEHoSw+CEHmCPQ9nYcJxlPY91x8Sw/yGs6XhL2Dz+NgbHyB6C4YSwPi4m6W0WfyvGquUqwyMOCrf8bwVt9x3934pvSLeN6oLQmyAGJ/oAezysweE4xwUwdiwM+x/CSIdbwuZxtzE4LvboxnCCWA87T3wbxu3jq1qrMjy8oC9beP9bRdt1R5/72Ibk+1BcEHqTxeCkH2CvBzQ6HON6znvGwLDvIXQ42SI2j7eOwTGwx04wnDDGYafJD2CjhBVCqGtXGR4twRZvx23Tdr31fh6CWRDGJI5mImiwNkcYiHMz562+b/sdQsPwFrFZjG00+3yPS8e2ksdOE+AaMbJGFleXqS4hQl02871N1N0CFPrVT/FthiYLQm8iGUwKA+xNgDG2HLR4fSg1bm/blFEwuEVsFlsZg328x2MDn0zGYqeJsCO2mkTfGK1pt9DW2Vl7tN1ChJgtBBrbCivM54uGG4vBThhgrwub9EpOSrT1oBt2/WS7vXg81o+pjME+vQLYNKldFL4MbbmbhJjHlFMUFLMeT9NCB+r6dZ9bQMGtnvJD/bdpaF0LwuBAH2BvgjwBamfbdxxCyWcvth8PFNtgfQz25QVjaIB/UXFV+mHd9t9dUhyIqMK08VSE1kLd1s7agFzWpv1ACwFssDAMLgiDA3eAvS7qSTDszGmMcY2GHK3QhXr9x2Gw/y4APQN4D4uL7rdN+mibiTFFUYmnQmZsMRSFutNt1p0RY9MlQFd/IX9sfNUFoWtAdoiMxXAinHjCxtA++9uvW3AUhuvfRle/7QjDg3SPTXBRfbtJP45NQBplr4paFlDQ83j9OOqoB7ANf8WpX6Ip5H3ly+NiKy4IgwNvgL0u2smQnW7PecnfcNsNCoxGKY5eDPbVDpAPwj0uAxfR9+v29ZgkBMU05jA4R8r8sXH0Yfu+mtVr8QAgwsqTiuiJL1sQBgfZAHsdtBOid+jL49HyV2+zKmMttGIYwmAfbRHrJoQ9Lge7HBvrjoWhRDRo1QiUpEs0i6EYxqPsc4yfUSmgKJuIvX0zFJ9ZEAYH0wB7HbQTY8lhidaPtr/SgpARNsKQ/xoG+2YL6B1Ul4fdt0Efrno7Jexq3KwzVmrJaNBSUYCJRWYVtRjWQ9n3kI81UwAiyr8ievulFmOYzxexa9B0iIxFPTm2nLV4ddR9Wdh2Ws+XR69vj65+2QC9g+fisNv6Xg6uVhvvYkyNHUc6GQ1qNgXikEAVtYQ4HnX/3seaaUCBDHTY6ekTHx8AQFjM81dXGOQ6G6OdIIccDvEt2r5yYBuN81HDWN+MXUxa6Bwku8Vm9Vq3PbeJ0iTaLi6ujtseZ2PHV2i9kgKGmsIzfXkY2+3Lsv+wlR+2KRgokDx6+0O3Q3tB2GZ7EdqTusdhjwyi7auE7fyE5ni/25+cjN5BsV2sV5d12u0qYzsJ52LaZJvjr3fMsVSxnZomWswWr4yi/7VgffNwXt9+R126RIaFOMb6grBuHRqoT/gxzoZl635aoAYZNl/FOn63OREZPQNgexgff6mdIjLEXkFkDcQNJuN4cMghYKHX9bgYt9IwVWxzPLbGYYlj2qEkUCYW0CtnMa4faii/YqLfdkF5CB0qrb5ghBAqC0Jv7J0oJYCEsc7a8m1fJVh73f2mMNbnNicdo6fDN8e4uLldpHlCgLiKAICXCpCPp9QxRljRJ0T2M84f0NxYLCOcz1bw8GwFD88izGYrWLon87paa4x7WgVCAIAQYRICTCcTCJMIB9MABxOAw4MAhwcBjg7pcxrh6DDAdFJ21JdEumqyFrY1TktjM6cklP22NGoYr9PX5nXgWC/7bdsu63SjU73UFxr5gtCKeQ20k+U6zso6bT815LaafeYw1md5oK+Poc5dH+Pi1O0QY0r2mOgBViv8XK4AlqsIqxXAKuInywyhQwQA0NeDR0t47/YCXnlrBr96cw5vfbCAz+4tQR6oC86eqm6EWKx+hEKzGL0y//hoAqcnAW5en8ATp1N44uYEnr45gaduTuDZW1P4ypMHcOt0AieHE7h2HODkaAInhxGODifg14l2QmH0ttQ4bGvsxqFRy11k6trU6MB4/b62TsjHcEYAKNoty62NDnOtHrALgo91Q9QT5iaOct26nxpyG4ysvwoY629bkwkGOnN99MXn6x0BACId4QPAagmwWK5gscTkv1ikRQGg241g3ZpGADifreDDT5bw6tszePmNGbz67hw+uYOLQrJLexSX0F2cVbqvzyAfLel6TSYAT9yYwgtPTeGrzx7C1549gK8/dwjPPzmFm9encHoygdMTgGtH+ZlEnlxKWLcVy9jGWF7VYiqQu6rYjYKDBvrat7QYMMoMtFvmbQXOdMlTLY+kBaGv7t3wySNhU0dJv+6jhbb/oTEwxuc2Jg+j1oHrox1bqZ5ICnhpZ4VJf75YwXIJMF/gEX+Gtptu5NEMY76IcPvzJbz6zgx+8foMfv32DD7+fAmzubrOW03iJEBl8e/lCzRdLvKNH4JbLG6eTuHrXzmA7754BN9+4QC++ZVDePaJKdy8NoEb1/BMIjMxNHjXasUy1h3bOoJsTGfhJcJw3XqROWmi5bcwRQrwQruoU44o/+rI2h94QdhyXKVkgtiGI7RR91FDn+9aH43xt+5kKaHUaeujHletfjECLQARj/qXAebziEfaZZUcdbdF9JodRMD7CZ/eWcJr787h56+fw6/ePIcPP13CeWNRGFwEuuWJ4vkMT2/4OT2ZwDefP4Tf/NoR/ObXj+AbXzmEp29O4Nb1CVw/msDEveJrONlk0ayNMeO95DUCnWI6qsdwncYgt19DyW/32AcAaLxaomR7E2RhxRLRQueY4k9orotaUkFsp+JNF1X0+y71T7teCWMmRgtXZRFYrSKsVgFm8wjzOSbXUai7HsRITxbO73IZ4bN7K3jjvRn8/LUZvPzmDD74ZAHnc7yRjfLOo0/WiiZ0X7/GvQnG4BmIognd2wkAzz85hd/+5jH8zreO4bsvHsLzTx7Ak6dTODkK2b0HgKHEs1FrC4bGf9ULMdK4r0oCDNZlLNq+NNhvZdpUMFynbdSnaF0TiwIJ3PZbWxBqySUfzesDfYyxN0YWofumXieLoYnQi4tYCFp1Wq0irGKA5RJgNo8wm+FZwdoohzCIeoSdKPhdLiN8fh8XhZ+9PoOXXz+H92lR8P6k7OzUzgwYNX6yb29Y1/xkegN+vvLEFP7Gt0/g9793At974QCee+IAnjydwNGBN4yoJyDfEuuhNh+K1h2x90Vt0KzHWBQjyxDjGJ8lmyVaQr/thKLFIrFBJ0SI21kQ6klmfAVrSD56bfbKWXCf1OtkURv8Y5CnpHVRjqVVl0hnAsslwHwZ4HwWYbkccTnIoxzCaKzlfsD3chnhzoMlvPHeHH766gx+8cY5fPAJXT5ij9z/rORs+mQMYGW69eieASPnE92RM7rT+9pXDuBvfe8a/OH3juFbzx/CMzemcONkUjzzBWgloczzaOi5UbVmGKkwZk7U6zAWdZ96Pgz7q9tp83psIzIrGaGCAbmNF4R6sumr2BBy+0N2h/hD8P7KeNwXAn02cD6LMJtXbgqvg3I4VdSjHInMb255uQT4/P4SXn9vDj999Rx+/voMPvpsAef6noizM5ishZ/8RUMnVPWIXpGHqg5SS3o3rk3gh18/hr/zm9fgt75+DC88OYUnrk/hYOpkCfVElLfhWAT63kkGQ8wlxsyPevxjkfssTaO6v4JwhrZM3XZBMyN0oKGz0YJQTzj1Co1B2X7Ldos3jNjxi2mbLgRjBnkb5TjKbZbAZwOLZYCz8wiLTc4GPMohdWGjEEb5xfp/dm8Jr747h79+9RxefmMGH32+cI+kFhKy99O4ZyB0oRGFyk29EX64nLWfemrp288fwh//8BT+8LvH8M2vHDYvJwHUElLmoRsRCvNGzA3bHTNnyrGPRfLXmhvWV0OwiraOtp9JZoSRqOivvSDUE8/mHVK3DRX7JVo/tL/WeMoG9QiMGdR1lP232wuxWkVYLAHmC7wstMh/F2lzlMOrYmsRVP3WPSyWAJ/eXcKv357BX71yDr98awaf3FVfXoPykbdGzkdd41XJCD3Tq+tA0Q/RpVyup9d76ZlD+Ns/uAZ/+/sn8N0XjuCpgYUBwCc9RtlfDV46SIU9p40xc6gc9zj0zCv0MyzXRkPf16MhOhrGFhbWWhDqDXURnaB9bN+fb3/gAbwmxgziOsr+fewlpIUA4Owcj463inJoozFckwI28h1hvgS4/dkCXn5rBj955RxeeWcGn91bmhvpEQp+VLnIhzwZZ4tFaZ5nOmm3qlfVIX+eDwAvPHUIf/T9E/gvf/MafP/FI3jydAKH04KgQj3BtnuuyC1/GbwbY+ZUPe420tQa8rWt92VZP97rJjkI4S0SHHn0glBPQpsG3LKtwX4281fzpft2k04YM2jLKPuuxe2xoi+OzeYAZ+f45bGdoRxqFX016EDmd7zl2SLCB58u4WevncNPfn0Gr78/h7sPV/g4KoP8CEn8EsXzGZ7u4s2S9RCfLGX0AT9QOQN58akp/PEPT+G//MEJ/MaLx3DrWv5t6BLqCTBrgZwSLfWi5lg95hz5FMsIBEsf46OGrE6qON5+LW4H7WPMglBPRmMDtajbLcF9A2ckhnxxm68zULPOXAu536GYNSK9M2g+B3h0vqNLQ4w81G5sFNVafusez+YR3vloAT955Qx+8so5vP3hAh6dr4qJ11jxfNDJmiSpXNOLrgyuXONntfFnINBnBwDgm185hL//W9fgf/OD6/DtrxzCjZP+OVZOUoVYhJBRAWC9+cYYM+/K8Sa0p5pmlgWH7NdgrDXaCbp81HWrIJXuBaGelIaCa6Nut4Swkb8eX5PBxi5jzKDMUfbZE6/GagUwWwCcnwPM5quBwb0FlMMexMZhVf2uZzlGgPuPVvD6+3P4y1+fw1+9dg4ffrqAmVtMSwsEGK+7+Z5BXX5kfAN+fvT1I/jf/sFN+INvn8Bzt6ZwfOgN1lFKUtmc6BiQF7EwlGJlDIcYs3b3aNkvQaxlZjOCoOyjLt+F2Lkg1BNTKah+1O16aD/jffb6CTD+B3J6B2EZZWe98TJWEV8kdz7DG8Yrc71jyyiHPBprRbiR77bHxQq/uPbrt2fwn399Di+/iTeZF8u+JO+Tq7/Rm/OJ7sgZfdAP76BGjW/8NOpzehzgx9+9Bv/o907hd75+DE+eTovffK6BE5WrfU+mNVh3YRgzH31S7QsxZrUrwdsuQaw0zdWZyUddZhR6FoR6chqucA11myV4P75cR68fPfg6+hFg5MDLkTvpjdWD7xM8Otvx5SGNPPwmthZV5nc7ltnKYgnw8ecL+Onr5/Cff3UOr7w7g3sPV+q7s8lfhEI8VBYpx68la6jqILWmV9bBsmmZoTgIUS1iX3/2EP7kt6/Df/XD6/CtZ4/g2lFFqYAILiHK2B7fXxe1MPRNPy00rFBbFERz2IRCSXhbN7QTmgtCPUmtH0TdpkfNR41u0eOnNNh62nfMYLPIjffEWUKM+HqJs3OAOb+TZ9fIw+/GRuGN8rueJ9Y6n0d4+6MF/OWvz+AvXzmHtz+ew/mMelznON4RGlGobKLwer4+rpwlbG8zmFLOr9E7/Ggb0wnA73/rBP7JH96AP/j2CTx5ve9sQWxUfzUui7SJ0jztRc9cjV2vpKjZqdETtO0o/9YBK+YGhuPvQ3VBqCeq9R3XbXq0fLR4/T5qg6zVrj2Dq4zcaG+cJaxWAOezC7hp7JFXo4mtRVb1u5mHknaMAPcereDVd2fwH395Dj99/Rxu31nAYgl9N24dTZc13xxAB8MlZgR8DTFdsoq53VJCh0YcVp6kAv7TdfLj/KtPH8A//Bun8Pd/dArffPYQjhvfXRBNt5MnrFLrt1Gbsz3wdWL4aZjHCR2xDvEh74zRYB91X+XYx6G4INST1foO6zY9hnzU+T0+hgZVrU1rA6qN3FhPjDVEwLOBs3M8O9jaqyZayKuwFtaq9Ua++zyWpJYrgNt3lvCz18/hP/7yDF55dwZ3H9mb9Ca5BrCW3JG2jCn6FJ7YwNc/i83MNiJCmvQyHn0bOR/JVyRm+owiHzI9ExsAHEwBfvy96/Df/8FN+JvfOK4+iRTln9kR5Ekrl2lhaP62UJrDpeloYywIFFGXYx953XtQsluiIdbzkZAtCPWEtb6juk2PHh+5TK/9nsHk27M0iIaR++mNsYbVCheBR2f4wy8Xirw6TWwtuszvdiwPWgl06ejDOfzFr87gL185g3c+xqeOjG5wMfqxk/IsQhUilK6noPVYsSu+vdrYewYkrO8ZACQ7gUUKdr73/BH8H/7WTfjj71+Hp65P4EB9oS3KP7NTRJ642vIePXO5Bu7F1pTE+BoCReTy3kde7xpyWznKMv0+cpgFoZ601ndQt6kxxr6V7bE/ZvBwW16VhQDoiPXsbAVn57h/Ycir042Nar2W33Eei9LK7yoC3H2wgl+9jWcJP3vzHD67twI1WzKdUjk6miwEarHIEraMwZymkeuhhuj5WLw8+Njwv8jF3AYAwNM3p/Df/Og6/He/exO+++yhPJ6ahnqxdTPkiatPT2PM3NaIMPwOryy8LiSjLft53RkNpSJy+brtYciCUE9c6xuv29QYa58HX4/t8QMmBJq0o2H99MbXQgSAxTzCo3N8kminj5OWMK7pBBtHWfW7meVBbed3vgD48NM5/OTVc/iPvz6DNz6Yw6NzXJGNLa0XUllknN105kCMAJSiCJWj0yyhd/hRJWUXPyOwDgsirXTmgNxUnk4C/NF3r8H/8Q9vwe9+4xium+8s5LG3kCewcfoAMHqe8/Ssz/VEz+MbwvBiA5ndDoUqct3xMSPCYrGM9eS1nlGA3oS4jv3QZXvsAAEaHOPbMVfoiW8Il3aJKK/OWlgr4o1893ksSgViFPw/PFvBq+/N4c9/eQZ/9do5fHxnAcuVTSQhAMTiwCEZOiPwSAmb5ajoZVW5tiiArlsAzHghUJxUQX9piXV87FREWf0/5/3W107g//S3bsHf/s4J3Lo2qbVwFzZNkL1z3k/PfFHwZR9bG2g/t5EDZcbYriP3t47dST15jTfGqNvUWM9+j+3egaGRD4oeWD8xxq74hhBjgNnsEhYDKI6rQcTCth14q62tji6pypA5PpzAc09N4ZvPH8ALT0/h5JiSK6AOTrrgv4dG/AAw8V92pKeGQoQAuGFZy9QR/IvhlF9jhpwGmg08J4wuPe2U4qCNWisEOkBiJaXM1n727jn8n//V5/AvfnYfPnu4glW2YvXDzp0RjUKI9NdCaXrafFEQyGKrI4m14rejsdd2G7mvlt3Uy3YL82LGyY33ohVEwnr20XZddxsLQd+iaoX66twD/ILMo7MVPNrFm0mH0FX3MjZqgVF+1/NU1Or0ezaL8MYHc/jzXz2Cv3zlDD76bAmLlbLJduiTx1DGB/ox+RDUUz/pw8qriD2/Rnf1yXJzk49W2JbhVfzIfAwAz92awj/+3Zvwj37nBrxwawrTidEYjV2cLQxP0+EFpXXUXbcvreroFi3bfajYH2G38OxYv7JHX2Icb7/nyLs0AIYw1Pk5Qhb/UFx9QLvLVYSHZ3jP4MIXgzUQ1bYbaA/jPK2nVcbRAcCzT0zh688ewvNPHcDJMf4kpd/AjQ47WiIlT7p8JJ8gR+V4RE5H67mB5MdtZToe3aejfG6FdCZgzwySLaDQPLR5JKQ6fHRvAf/jX9yF//uffw5vfDKH+ZLquyYu4mzBAmWH8khtvlfICoMCVdv9yGMfa9EtCLnB7WK8/Z5GGurEEsYNFshi71mkhpEG+mKJl4geneFvGl8Yslnejw1UEYPK2oPfRkL3VcNEqU+nkwA3rwV48ZkD+OozB3DrdAJT9bhlAMyNE7UwmMQrSTtCmNi1QP7R9f0IdHTOSdlXWSd/hpLnWJDPdUmLg9ED1qPLWmyHtskEUrwujgBcX/z6HADAnUcr+Oc/eQD/w//vM/j1R3OYyaLgnfYhn2Pj7fA8L3SrgmUO5RM/Rvpst20yvO3xQD88lmCkTbUg9AVcw7DT8faHbQ53nsf4IwfIYu+Jqw07SZbLCGdnEc7Od/xiuhLWcMeDTW/bgbfa2uooclOmbmIS+Jq77aXDwwk8c2sKLz17AM89OYWTI0yiYaKESAETqMqsgfwHAJARSOMwluvDCZhVTTDatA+WZIIoF/TECe/gpSwpKmh16wdj9vcozuYr+J9ffgT/w7+/Ay9/MIdzuSJtLI1CviiMs7OK4+f8UF7hxaqdCjyzbZORL4T9wNGU+xm0R8OQFoTcwBgMOlvD/pBNHIjj7I4dFH7wbdJRCTbm+WJFl4kuYTEYP7cA1lOxqPplRmnrR0u6NAZKXiJnSNqmE4DTawGef2oKLzw9hRvX1VmCDzXgoZYkbIcQAh55TwDCJNCGR+S8+UUgQMEe8UXMxYBH/mlDIt3o1vFNaNP6+toBq5k4lGOqC59RLFcA/+uvHsL/5T/cgZ9/cK4WBQ5yPPJ5J7VuQquV+j5P2glDOSbGUlyMGr1uz6NuOwflc4XcT1zRPazSRpiUFMdgOOjx9odstjqphKt4VhBjhMUSv2x2dj50pHG1sLtQ/SgtjNgKuqQpkXFPmB5xxNINvuODAM/cOoAXnzmAZ5+YwvFR4Sgc/NDRl2vSIToma6TjtfzcjjfbS8eNWyF9BogQYt5CmT0uWIPZN6hx1/qRFBoj/MtfP4D/63+4C7/44BzOF/oblZnHLpQPyOp2MlEAlwcKAgWU8o1ZaDJHvuzRX//cdo6qBHd13uVVFG4q96Mn2LEYslnqnBbWWwiSj/IgHIOyveUS30l04YsBhzOuGQ3WVh30q4PzWx1R/mmiIpB6ZqlgvtXX02mAW9cn8PyTB/DcE1O4fhxgQtfQJderNYJv1vKN3UmIeAaQBNwigTC21JG3pgWyw5vhB4AQAp1p8MKDZyLmzEU28q/t6Q0AcEFxbSYy6VFaTZ8AwL999RH83/78LvzqoznMFivXvlzjccj7KLeTiSjg4eG4r/zrvFOynWIqMKvI4y4hry8i1rwJI7dfs8XYaEEYRh5QC0PBXsxikDAUzzDK9pYr/DGbC18MoDaC2uDxpbftwFttbWUIxw8NfybAfE0soHRmoHF4EODpm1N4/qkpPHljCoeH7iRbJ8WSm4j1wSP4/B6CyOusrS77yKUft4XsGVNEMQaCuGD/SjjFwQWkpOrV+sU+tQQQ4d++9gj+x7+4A6/eXsBi5Q+watG1kR+opeCH5xQKjM0PgR4LryHGcYsMoq/+PhcVwyh2SW7f29JYe0FoGUXkgbQwZG/MYjD+EpGaCcXBNhZ1e6sVwNkZvrr6Qt5WqmHD6sYaKhZVv8zQ23h4TSl70+uZNziYBnjidALPPXkAz9ycwMkhH4Gno+kAXHaJnDbel/sHLKPLYsNHUK9fzR/6RLGJvq9AfxNVBr7oo3SCfuKINq6H1EX280CXMcK/fOUR/LOf3IW3P1vAihaFNMfW7xw/T2NlYaxhTJ6IEVunDFpk1sobNZsWMWK0mYciUSO3X4tzrQWhZiwhD6CFlj0etL0Y08EIa7sVyzDswPYLS4x4ieh8dgnvJVoDPM52F6n2MN6Tl5bW553180wVIeC3l5++eQDPPnEApycTmJpfjaFEKsk4xaAT/JiwRNbUSz/O6gyq7xkAuCN2Le9oks8lr2shsHNR67IE17uA82WE/+WVR/A//fw+fPQgfcnGzrfkawx4niVTLTt+1GDOGMobOsw8H1nd9XKIt5kjatujp8ywfVhnQRiubJ9jRste3vBtDHWqhR00PnmPw7CtGAHOZxHOZhGWF7kYcGjjmhJgM1XEoHISqDV9jQ4l8zrgpt8E3081aLnDgwBP3ZjAV56cwpM3JnB0wIsAPjUkWV+PRyapzGuSufDLT/3wfQirY6/ZJ3rK0jrJ82ZqzHzelyec1M1w1mCbENSZhrUTAsCEznQEdPZw/2wF/69fPIT/z68ewp0zuyjkC8M4RHriJ7ejbbX7upY/SkMkLY4F5ohxZeHjRageAIj0tNBasLZTjOwhjlsQhiuZV6aGvPMsxiwGPSu8Ra1hxsJ2YK1OMdLvHl/G6yjycAaRhocbjBvDW03WJbE41OgAqvnL86gLtSNaDy03nQCcngR49tYUnro5haNDFUDk0ZhaLXA9AmB93RfETDLXOkwSA5rPZdWOtW86p/XBkvVi4JBU1eUgABV/ejrKhKZdS8USPrm/hD/76wfw/33lETygN8cy2sm8Dj/l8jkYUmAD8H2XmTKIzTxVywfDSDZFO00VLK5lF5Qh3Px9j64Foa9i9YbxGLLVamSP8QuBauyuetXQb2exwEtFi4Xn7Bj9c8pgDRWLql9m6G0cAuTJ0zI9sQ+t/vMIAHBwEOCJ6xN45uYUTk8CTKfJ/yQEOUqWMwZ1FG9aQJXlCR/tSCdzo4gJV2/Jgbr+7/RC0PcB2LE+MwBK+MkA01P8QcWHvuVJJ5VRgntqie2989kc/tlf3Yd//9YZnLlXqeVziXxVUOs2ayeqyvZhTF4ZyldjxlZCenC4Fkqf3ei2PFZtZ3BB6HOaO6lhyN5Q42qM6TQf41AcddiBNWRnucQzg9m8LXeVsJtI/cDkrQ6VQ7DF6Vn4ttZ6qJ0p+Bg4jsNpgFunU3jm1hSeOJ3C4YHJmKSb3hdEX+w1YHEzpJQZ69heMpJwlYy8m8i1kDZfomc8rgP5xXnGl6eQl5+hKBUdH8HQA8AvP5rBP/vrB/DT92f03iMLm9CLUXYhxvUfdV0157Zv47bdoTyhIS3aMdjrdvNxkJDHynaaC0LdmUZuvIYhe0ONqrHuYmAH2hjYQdljZxUBzmYX/AprmZWe0Y+1Vat+uf6aWdu3ZiLNC0h51kD6IDTGfwOlPiw1oYw3Ik4nANeP8V7CresTODqg7xnoONkI3RPQR9H6CD0lUH4MFQACXs/Vl2XMvjqbSIsEHa3zN5HVkb/IZ2cCKlS2I34xliD/bJ3kHoJsaIDprCL1lCLa/Yu3H8H/8+f34J3P580j/QSxCACpqepIArkda8uDxf0lJKaWkO4rlFEaax6R/4lo3R7D2jXKDeR2Y2zcQ+gJvmS0hiF7rYb0yDuoBtvxQzHUYW302IkR4Pw8wvnsgh8vHQ4tAw8hvW0H3lp73/QWJxEieEsMvFRCzP4hJAgBR57eSiiNz8MpwK3reGP55BgvmwCka/kaom1vH5hKpUs/5E+SfCrjqQZt5p5BurYPvHD4+qgC7kr2Jz3AhYD8on8tpr/pnHqEF5IaXRYHkQuy4Pz7N8/gX772CO6e1SdJKZkPT8FcIJ+3pnUEmRiAyjkFpkNprDDyGBKi/POo22PgvYCicgO53eKC0Ao6ITdWw5C9VgNqlFfrGqzNoRjK4NmCGGNjNqcnigqnwzuDDbcba6hYVP1qYlUo5zixshaBmU0hC/aX+a2hIjydBrhxbQJP3ZjCjZOpvNsoACY+/Y1f1pcEy5s6gucj+okPkHWMojWECxsfodpNFhoVG8c3oXsX5mifBFlPNlLwdWIYfbFBJPrU9YQAcPdsBf/ilw/h37zxCB41LqvqAzH88M40+uwgrI3WFB/z7eZWTvN5JLLfhm8fZ8Kg4gCs3WxB8MGWUQsuR8teGsDD6F8IwMSXD4BejLfBQ3S5BDif4c3kqwweSsM160HJiqblnsyU5gIRdGwlywCjhqE3vxVMJwGuH0/gidMJ3LwW4JAeP5U6eIelssJQfaP880QLk6zVhkf9UjBbdiai7Umo9PoKpisTWb24zO9AYrp8cBwR3vxsBv/TL+7BX79/BouBRyr5S20JLthO5DaG7KD8mDzUym2cU4p9WoW2l4+Unhw1BLMg9BmsV9KjZa/VWB5jOkHH1/Jfhx0cPTa0xoq+bzBvHO1sFey8vzkFG6giMuW8znnzFQ4DegLwhnp0APW0aE9/GjT8TALA8QHAzZMJnF6bwMGBPi1Q7ZtI5ohbQIJJnpKzS7h4ZK2Sty7TfQq68VBO1BQLAN6r4NgUF8KEv7nsbIQUu/1mM2vm9eXxwLEiE6+ZBX0PBAB+8t4M/udfP4AP7i58yEXUE3p///oDvd5vOY/JR608F9f6TkFo1nH0+AZQbacWhD5D9cp5tOy1Gsmjv/H1oGj7r8Pq99jQNeHF4HwWYXQ/r4s1/MTCtjn0hExWdcLBHiIed1dhKBTj8YYa0KZN4i2Um+gQnU7xLOHGyQSO6cay3KzV9UtZUuiyMPhNhBKSOfU9A4DU1sqlwJtl93pBknsaZDOiPWPLG1b2MH5dJ+XLtTWSmcYLA8USI/z5W+fw7986gwezlXHH8NOxd44OAe1wqejZE0Zdvi7lOx12fx14XuX2NPrtaaDNCXQbaAeh0bJXapwaehvcx9byX0ey0aPPYx6oc2OkS0VzgMVFfflMBzECa6hYVP1qIgv1nRHwUIcyO6HBrIY1FspQcSykquHTRicTuHV9CteP8TUW5k+OplVy1mb4Or7my6b0HVPysIpFwuOkLATcRJ2v4buzilIggc4I9P0QEz8AfmuZe5kcB6j8tgOL5Ebg9oMF/ItfPYC/fA8vHWmxUjcwsI/06GGtPuD81Q6MZ0XP0ZujeAbESl2K40yg68do17Ftr4YAkz7FtnONlr1dLwbrHTHYAdSjr2vB4jECnM8v4ctna2C4hj0oWdG09Aw+QOGI2UFPv5JlgLLugNnxcIb8EbDnTycA148C3DyZwPXjCRzwjWVOvBW9wP9ko/Yyr4xAuuGDOwNhXwU/xnwiZ3wArCfuM8U+tYQyku9RShm3i4X1TEtFUgzUrqAmEKDyzz88h//l1Yfw/j01kaoDgkHX47OkPg65jT5056qB7xXkvpuzYRC5vWFkN5Vz9DdsK4CLWAzGw+r32NC1kMUAcDHAR0yHbWwEPdfWxNqqmd9aXZ2HTodVsRLD3RvYCIU2jXoRY1phjExCgKPDANdPAlw7DnBwQNfzlZ4kS9709wN89aL8S7+1II+CYiLFI3Z79hDUt4L5qFx8BaBHVEG9mygtLOLfx6nCwgJGw4ukiZ0KHId57FbTlSk8SyFbAesGAeAv3jmH//j2OTycpad6TCwNjF0USlMebTBj2AbweGmA/QzlweS7bQ/RtgVZe1hoT7wNLAjDDhktx0ONoDHUsAnJZst3HeP09eCP6vtDQL+JfD67oPcUDYeawXf6GiYKkNYwVrGdKFnrRqugOy6VTAJQ8lgXxlCZV7Ivl24MEWA6Bbh2NIFrxxOYTnKTADbRImxt8XJLHo/RCWC+h4BnE6rllH5wttJRuroEBYC66vsM/gxE2+Hr5rFwhpKDLmvJwmCF5ATIELGNP36wgP/3q/fh5x+dw2Kpk6m3Alk7AviFu6wFUF4MGGMXFqD2KcH7aefD/KCjjZathDRqVP4qbI0Foc8RZI1n0a68Ra1BcySbLd91jNPXNfDiq4ivs76QS0X1sd3EGioWVb+WKKWq/Boo58n1UDPE9BKvA9MQ4OQQ4OQQFwdQyV+O0BUkyQZ7HT8E9ZsI5qI9NYIYsLHahUbReVOJXZs0ZxpKScw7HfUAVeLT2ZDYdWW7r+pGC2eQ32NQcU8C/OzDGfyHd87g8zOcWHreJdH23F0nqSNQbx19n8N8vmDkeZGzMpVqikV4WwmRHtU1ib+ByoJQd+DRCjyvdB2+IetQw6Hhu45+fRn41LEl8cUSX02x6ytF66BzDHSiZAVp0k66wTpQsqjByWcjcEwbGNImSuYmE4DjowmcHE3gcIoJThQVonkXk7oxbIR0r+Gg650bEpsPNEA6CzCXjJAXgJRcvFqdCSZx+9ipgP6llsSkMxCaROiT5NSlK5ZerAD+3Ztn8JfvncOcJpeeg5nvCvKkjlqluYywjJp+C9xfdR8I3TYlDOUnizwuGUojbBUWhNxwDS0nX4TFgFETjZG+gLbLS0U8BvubU7CBahpJ+lpwoZ/Q9rAHbkM1RquQI8oNIPcAuFzrRJIp8X3bRZJjSeZNQoCjA4BrRwFOjvDNpyZ+Snpyjd/XT46iKTGSYz6alu8F+O8hsIwUUlDS95Lnk0NTL/bFZwyT9KZWDb1eyFNK1Ju2v1Q7KttcJ1M/pRfoUhaoarzx+Rz+3dtn8IG+wSxjCf3YKMuI3d83yMcAFMdGTT+hL6cN3wfLfbeA1mLl4LXHVmFB2BxXbzHgIZYPjhJ09DXRGAFmi2iuce4Ea9iOhW08VAYwQIv2PoFNviWkhIEoxZR6aU2wgQDZtX5fRmLandBlE70VQXZ0u04CwNEBniEcHeCP22MMnPzyew/pWr3qJZMgLfAegJ5ZJgsjnR3qTQfiygHceg+pUhi2ys4EXTQLkXpCioIhKXZAl4VYVtsBkPZQVYIAAD95/wx+8v45nC/8byekfaXShF7M+7UQed5o68cIA7lNR9K2NQZDS8xQ7nMLQtuYxpDhHrQbTCPFNd7vOF3dAi3xSD96s9jlm0z1rBmBNVQsxG8sWkOKSjAFmRJSarAQC/2mLMbqafkRTyvV5AK9Dvv4EF9foZ+mCfQ9A10/frqGb+6WnxqihC2GrD+dOMWu8mn0ZA1Q9ybU6Yo947B+OLYJ69KZg9SN/XJAZEs/6ZTit/VjWZYRUb6vAgAf3V/Cv3v7Ibx1R58l4EiK61xCMtd2ezQsehYFLVLOcTmttSj05C1gq32iVeju1/QmWgG2KqZRbqgSkr2W3zLG6bK0Hmg1zObxYl9rPQLbi8r2pZrX9sh2pEeW7p3ERbDySANaLYBKZB0o1xKT23SCi8KhOkOQlYA2SX4qbEyGlByZ7uqWJVZnT4kaIJ2jTp/pWr7rP+WvZDDFp7N4Su5eCSmc9N3ZED/RVEDyg9vPPprDX39wnv2YDkPP1ULYAmmBYlIv2y6hrI8oWenNda3cOZS/ovyDLCaPli1aENoGNFrGWhXS6G0gHVfLbxnjdGVYDIvCchlhttjRY6Y8G/qasohxqjJN8KOozEfR5YlfArdjVB60ZmYhIzQwRlYhyL/hMaHjNohQ7KQQAA6mAAf6mn+hznytnM8MhKvqJHou4dOJRXrax20T/f0GuYkM+H0GScrJAdJUQldbUPHoSgSKwTzuSrFOJupMw/mhmmvHEKWO5M/54cuSd86W8O/feQSvfzar9UrfoqBkYvZo6jiUFoUo/3KknFcRILRyaG3Mlv3W7UDD1qh7CDUjMFARjau2GKgx2LUYRACYLXZ4I7kjBo9Y2Pqh+i2A0kZL2b2CTg+cUKRtNU/tC2HIJHdUplyHVvFqQ2cGKW5+Op+sVPQmIcDBFLd0QzZ5l/lROEqWI3YXaACbWNO1JyWm+WZXGVKlwP+Ezdfu8xHkk7T1QwubmOH6FGJTtkJQ5qQtk55dSMQSvHx7Bj/7aFY9SwAKgeewiaMxvDA/xILGMHRuidD+FjIAdL8+u5VLfT6L8q+Euh0o2AIcYm0lRkmZ0aqAxlVcDBgDooLVCheDnZ4djMQaKhYVv0hyh3troKqpGUWBlnIdRZUisQYU7h3XANhEE7p0ZI7g+aidvmcg7cnxyLX8XIfdMz05y82YSMW/PfrXZyYmRmXD+2G+OFDCHCufmSSD5CedExhVMKL6XgbyOTYg+2ECcPd8Bf/x3YfwxudzslCHnsuhlS8JpaP9XozV7c2BPWOv19IYdJ0htBJrT+AwoiF0BVp+y0DdmD0RkENHPSBqMF9cnXsHUW3bhEzcANkRbS/GSRegs0cHWLyoUiRqaG01/oxMGVpjql/mBpxJEdHMAG25v6XyCC2DkywK8BkHH337p5pM/jaGhU77xrbAjol0QYjONsRXITZXAS7GEHAjihYNEOHl23N4+eMZzDp+dIrndGQbVRVkjE3sGlH+tZAEenNhLbdG/bRUn6kqfJ7sWhBqqAXs0dsAuiN8oG2kodOjJwOw4+axIODrrefzLZ8dVCZJD8arcmXVp1H2/BLaHlmzLTXAbPEK0OKm/7uCQIFYq3VhgJTaPQAmPH10m5h0DX8S5UxBNr70oo3SFkJ+Y9qXTZJmGpAP/gyqTJtXMqbFLk4QprE/m9jZoa03W5WzFPYmT1TlwciFOc0j8xAC3D1fwX/64Mw9cVRHVJ2q3FSxzqIQu/TyMdSfE3OIz24TpZgSdPyDC0ItwV6txQDRo8fSHaIINWjnC4BFx9HJKKxhLha2PnDt6VNPVH16r+qcY5zHIkq22WeJV0BNXCefHFrLynHJt6lPpDXrnCiZb4/ImYZ0vJ1aP2LXCsav4ulYdCI2zBQM2mLjxg/HkehsL70+A+WsSVdhqpMOQ9+bCKhk5IyvJICq2hsvIADwy9tz+PUnM/n2chdIVMdfw3ByTxDJ4uuztwOfZ+s+h9COiX+Tubkg1Bz6IGu4SouBHgwDogmqmqsVwHyxgmXffaE+9IzQAtZQsXB+jb3A//zWh6ZkzVSJVkHNhEEmlBGK8DUe1qAxrgXliBZgQu/p4U2vGsYPJWv+E3ll0+ioRCo8tWkdDCbR0jedVWxyOJDk2U/6PkE6qjdV0bEAKslZSSLhvQYXtwmVZOTeicgmqUAvvvvrj87howcrW7cRSGrlRLBuch+r15sfuW/0YrAeOKZY2BDVBWEowQ6ht7Kme0b57NfTXTMgmkBKkS4rLZYX8K3kTmwzBGkbmoQIP1i26ZHA/obnDcA4UcJIBz3QJmnjo25pIcqEeAStZdMTRWILONHWLhml5B2y7JsWEK8YIOgTkzqML/JXsyeCSsdJQQBsCXXG4RHAVkMvJiyuVQsm4Bcfn8Orn53DKvpLnv0YUhtK7sJ17ZzrtTuiJ0+iRB4DZP5q6JvLMVbOEFpO5EiigZ5KIpKtls8c/Xo62gHRBFLS8otFhNVyuO6D4NG+gak+VQ7efSpl2TU7pQD7PDaxgbmR4kZjaHxkcPJyBtARBB48oD5/H0BDjsz1+4Jcf2SbiNjLLLI1nmoSOh95a/j+UDbs9wzs5SQ+6zFVEz2+X5CMpXctKT/arfanYuD7LkzTMbx9bwmvfLqA+7N8TLfANeLSkFqe3Ime7VjU9Gpo5cuMkxG8Pw/Pa8fjh0nT+OO6GOBEdcwSeOCRDmO1AlguJ7Acc92yhjVMxMK2FgIATwRzHTuz7r2s7RHBHaHadwgs2imepIPV4CP4bnCSFnP9+iv6XW2A1GTJFNlR5rL6eYKLQ+dVBA/sdPaRvoFsTZiCcVqDOjMBSGOFx0vJFscK5taJZqXkzhA5GxS3F1PxE4VjjPDzj8/hzc8XaZ56uw3ouT2k4pN770xAPR1cG6W86Smh+lI+H6dQPYFQt5MtCDX0LAb9SLbKFamhT0+PjYaYhaqe11ls62byiEGrsYaK0qLPkhFDWzO4FrTJEaZHiKJ0nimbyMRYN2MMg88gIi0GvCDwkS6/sZTPGHyTh+wbxuoo365NmV52KYk2Xjy0YlBfeSj5Qdn85nLQOiqaAHjvQc4YlJ8wSd9wCkIkI2wlFcVfdo+hEAv6CfD653N443O8uexydhF+9uo3nlZUBH5RQKIiVVDUa0AvCpl5HlcddhCZhS6YBaGWZHuDKK1yOZKtmr8y+vR0pA0xC+7jwplEBL6Z3Gtse4hq2whUP55raUdjK54Q2n7RVw4W6xAdLc0wYa1nwiKAOYNYrSKsVtSKTDZHioiU2DpbPUB6dFViVsmbSZWnlrQ/MVeqflDGQoQI+OtoMRAPAAD4Uo47Y3D2MB7cRJ0WzgiFoATqbAfAHJOzjRAi3Dlbwq8+ncPth/iUh5m7JbMFjF0UVCSGV8Zgr1aRaWaEMlJe7FEo10EWhFaS7cEXYTEoYbkEWK5ClT8IGsSV9m9inKofDPRpzt29zProiqlLqFsMoNRPHcq6DSPgj9QwfV348b6KAMtVhGVcpQTqk54ORCdrw48cZSqzHm1inpIzb/qJJsntHELmhwusq1wQD8vqcFCqk+5nsAPxo84MhJbUKa7UdoYfIC2wUgFI72DiWMjQrz+dwTt3S7+VQDJMS7vZ0O9dFCKo3BNhQDph7FnCKgvQFiG1QhH4+GgvrJ3IC0I7ydadM/zkKCPZafnL0aeno2yIWZBSS365iLDc5HLRGqqxsA2DW0B90uwJ/B93toJiTGy/00+nGIFq4TNMBSYM/qUy5bC/Xcsw8yLi2cF8ib/0heNUHUHripb2VdKWLEo3blNCVv6MTX+kjvtij1XonzJv/APwy/CwVeRSlOizbWsXCk9OsYyIuThCCMkel7WM3LRO31+Q2EQuwrv3FvDWnfyby3pR6Onj3kUBwOegmrSPp0cnafXk03JeHtZjqNGiemLgHkLZqUVP8LoRWkk9R5+ejrIhZkFKQ/KzRVz/uweh2f9VrKFiofyKraAZpa0PRWlNzJg5ijaayKVb406kxztqo9Jkq4gLwXzJYyU/QpdN07Q5fJ0RbnTErgVMIs8IFIyLy5nI/Mo9BSAmaWXyPl56egjUvYpAZwYTpccxyL0BXlAmZCOkT6Dkne6LpP20KCKNz4AeLVbwyudz+PBB/s3l0plCY8iYPKBVwKuN/kIYYmhR8BYjjPkmMhgLpfii2xJsLJOSMsiwaKM1KROSnZqvMvr0TH/XxRJo8EGH/GIRGz+3tzsMhNUJfqyOj6r8kPBbHX5OGWnN7GiqDhECd1RBg5KFKlrpitquECHCfBnhfIGvRV+pgdWohYATot8wYbItZzMyLeuRBG+vQBM/rODkA3B8IiQ++Tq/0LUfVRYfctbDtCQc6OY010Wf0Vr/qb4BAF7/bAbv3y+/S0Zu+0lANaBgaVGotKzKSYPGBbVFoeijSLRIOToXZl+N0aGQYmmeIWwOVemh7FtBS093RUMsQSn0yC9WeF14FGgQjxgnGfpUC3GJ30iDRS8GLbQ9VrVZrbO+HSKEhqRn+VlM/L6JsAH4HT8UwmwR4Zx+NCnG0jP59KGfJqIypNwHkFWR30xKR9Tmewb2Ow1yRK2OrMUy/f5ArVECnS3wGQrGkC7RhEC/d2B+wxk3Xpy16aDsSL0CyD2tQOXAPsyGNH1QyucJAbhuiA8eLOG9e4vqqyzG5m0/nAzKLpxkVQgAbD6rjlEi9hxwZzEq6AOTJjiQWFkQtnd2gGgl9TLQf0vPdEFdLEEp9MjHGPHLaGMvF3XY9lD9UR8kGXwfoRYetbmZOIiyx6p6yXbZBEBFPAdLNSSJpSXly11OjYv97dmG8QmYoBn4WpMIZ/MVPQaJXtM1eYpAhVqrJdPlk3ZEz1cmmU5QTmTRoZjTJZj0J9o6sKCcQ+4niAyV1aUeS2d5Hp8swwY5AmozpErPJT90X4RBvh7OV/Dm3QV88tCeJehmou5IwQ+A88OQSu2IvwfcGhlc/7bzbJ1X5yhwuwBILNmCsL3FYNhOGah32YvBagWwGvt0EY7s0VhDJUcIaQiLQQ5Ib8NgSa660fImuOzpoz02oAw1Y3EYYA9CHwi3jK1ihPNlhPMFwHKlbl6Trjz5wwrM0+8Vku8rKBof5etA5Awgb2CJ1fkRHn9jmTcVI+pZH/LUEn2PQsxyvVyzoDl9BsH1RCVTDetO7ecLi1SDbVGZz8LeuHMOH6gFoTRl62cKJWl1uYlVymLNPFWDPXJXAY03BUBtrqHNFOOLNV/BLgjecAljF4NiQFWgXktHR9gQS9Dt3SHPvi/ivUXcLxu7CaDODMxwKGxtlEZABGJ4pi8rNFgKJaMKii27vNNQYwzXNscI84LlCuB8toLz+QpW0T/hoxKjSrYBMzBKqDqavgqAR8YAdGlFP02kkisnVbY3UA+xlwoAPPvpUlhp3Hg/qGWTunWYiDrJo44+MxDvAPrehDahTPs43r+/hI8eLOqXSIhcXxTKqJnzaOUrD5Ycc3ZRzrmWxu1XlNS+SgIK2RnC5kiVG9NQQ43i0WVameyRT/EGfF1F5bqkAQ/YceEDjFaVoSSfEfQ9gtDobe2p7rFMLaBuAqDN6oaeBGJPGS6NrUj01It1ZPqSCKno2jKTJ0R68eGjOW4LfsqIL8fomDFCKfvEBllip8WAfxuZjort9wzSGYN8o9h98xnp7Js2bQPSWQMezatFDZ0YP6JDOxxyipf8mcdE0yKQyqjFvtKZhfUji0kKh+Rx++xsBe/fX8Kjhe+1HHZRKEtrauTmUrQS0vP/dUnvzSbquh7I2EmlEspUgh16VciCsJ2zg2SjNoHK6NNjqYZIAgnHwrePPWLhB7cXy877BwO2S+C+0dswuPbpEydY6Z6Bt+q95R517xsJY7eNPlGWqkgSiy+xBEUzYphNBClepJdrmaDth4I9Px88n7GKEc4WK3hwvoKzOb1GoVLFENQL7cz3BrRsurRCRWcPEy0nRV/TglsASra8JeMguv4dSAAp4abvDJAsORFTYjLZVUuisoMFiYNtKc10JpQuDwG4BQpJggAA791bwEcPFnn+KAwCN9UNCuIiXxA38DlEo2RX0GR6lIUjtXkRIx6VnUDLkMLwYpDQ6xyRfLf0ZBzURRJIuEfW+kTF5RL6HjfVA3QE1lCxEL84DJJBZpS2OjzXmNNomKqQHQakiJ1VZ8vQJrMx55os4zssVwBnswj3z1dwNl/BUj19hKBvE+t3E1GCZiQaJ1h+5EdlXBEUNRNqcHxtU+SprE1zbMDfMDYJOxmT2F3Z+HLvRhL7KQSRBe9L5NXvM4T83gUHgWcyycd79+dw+4xfY9HuM9AyOrgG2uIlf0myxGVEcxWibJ1Ry8HWgrOhmD3tMskMFFALxGLYTg7VaI1gWaohkjAijNJiAACwXOG14F1hG5b77xnwVoa0rZfubEeeo200pJjlEk5NfF0oN5bO2QkKTM8vYLmK8HAe4cEswozvO3F9KMHVTOhkmEDX0GPWIzl0pVRyrNIBjE1k85kSx5HuVfClKu8vaN+8XyYp6HsgVJY4WvcM3BmTgvb38aMVfPZoKS3VyicMESEjRY0CsRCKoMevgERreSgHXSY2lByS00vMAWzpHkKqxKgGIbR0Ws2TQQk3TAJkPq2X1QrvIRTBo3BUYBZ9qjK07Wfg/VDocR2c33KwBW8lE6+YKJDGQRkYa0vHHaHR4e7ewDYRI34h7eH5Ch6er/CNuGphC5ASWQB+9QKdMeiNDRpFxR/6noHLmNoubxIDx+QEAl+mE7tiLS1qtPHoC4BvapV7FMoWLyiGlkymI3+KxYaTFlEuEzVFpuIJAeDOGV4ymi2Z6Y++2+i5IKCHWEs85Ra5dZ/DMVo5EJHzc4pChTnkZ3BB8CtSjtQ0Q84sqNM6dQbFVA8NybYWAwCAZev+wYDtEmJh6wfHlzKHHM1J6N56aUswqhpVRmaiKpbAxgqSipxJFMRLYDEJSydEvZlMtF1EAJgtI9w7wwXBPISgK4aBANiUlvqGj8b5SFnpqrSfoCooawH70Jmby3ImkvjejzYtnwHsU03KjSB1gCFw+k5h6TMlkqmV3c1oAdspiYQAHz9awmdn/Pgpcsv5JdGaqaCgmpvLCADkN7XaWLR18vMEh4jtX0O5TRDNBWHArUHLSY5WZyXIEGuLmfYbktWrd6nhV6uoT2AtyiqDWEPFaim/wbCYobc+xOpQdmCTLpw2GhIlO+PDB3Dia5nQSmMUSX6xAnhwtoJ7j1bwYLaCBT1yqp/w4SRvrtnLpo591ZF/epIomLgkn7s4ZDfl+2J9/BkGXqtPukkOZfn3DtJigsK6DprG36hORpMa+5+4X1DT4lymXfmdCE2HgGdM/DVoHQsuCPpIDpWG8kxzUSiA5TtECU6yEk79QLWkUKJZrLMoNBeEYdQd1tGnw1KVuIsYkrWLQRmrjqeSesFJdzvm1NEjlctbHaFW8xrD0WpiFhUJpdxnZxjDvbklcMAu8OUywv3zCHcereCcnjAyCQ4AQF1ukSSqoS/TOPs62Wm9SjiObx9Z5TMQME/s2O9MiB+3JREm2KB0DEaVdrCf0hg19wyUkrSTt6npZojbyD55tITPz+kMQeSQX0uAjAF2BpSvHjoCZD5bkgnr6Bi4erQWhRKqC8Lw2UFyNNTYCX06LNUQSSDhIdmexQDoqZHiqX9brYj1VNk3fWY3jfUnQ3tqe4wF7SLqJhqoKClyJpERLLjfSnEHFHBURG18CX3AL0DelLp1YwQ4X0S4+2gJ989WMNdvTiChEPAo1/uyT/ikDFi8PAQqIYqO+57BhI6mXa6mfC1ILZJuKIM7Own+G8i6LmxX7HBsqOfjZHU5c9DGyA6fHbFRMqf4yY88DRWAHk9VCgHg8/MV3J+VrvWiFez78rgAPZR0BRvoGUq1cdhCv06vXBklP8UFYXgxSCgZLSM1W0uHpRoiCSQ8JNvy5xFXYO8w9asKeNjprR/Kt54kPEOK1rw3K6MnlkGN4Wg1sYSGhKlDmdcCJpIk6mvHfI8mvcxCcKAqIZViX64iPJit4M6jFdw/X8FipRKU6ODhMSZ6a0n2JEmpmumEauyVY2FYHiVdSdYqaQOgL77Jzb7VTWAg394Xl9N3EzQHuXKJybF0fOmMiGMoQOu5YY9nVTa+e7MV3Dlf0ZcDPVByKBcMsDPUFgVtpvdgdD0oT5XYx5wlFBeEYfQ7QCT5VoeMskrCDXMAmb9hD6uVen2xH3GdWEPFouQ3aEZpa8NP3yqcqWHLDZByZqMv5Az9ta2gpuwM18Q05ssI9x6t4LOHS3gwW8FyBZL4JSFqu0wKkHYcPQR35O9MZDG6vMsMQzf+7dkAqFShwwUVh7HH5Qnb0p9Jlt3yN6olDP19B0jxsKLxofWYRvvESp+K/+nZCu7io0Zroy9/57OpJS55qOdxpjXy1hBqi4LPx9mCMHx2kAx7Y0PolR8UoxCG5EY1Kslu4x7ChuoCGuf0j1N6bcsh+h41hqOVRCwqhohc4V4sOIhSIIreEvNY0euu7zxawd2HKzjnVyZoI7Kphghgn8NXiQ9YX8PZ8onZi1nQZSH5opwaK/57Bk5ZH4378EQ8gM3Ocj2dCezDxpd0XaI3uknWxxei1eWxz2ccd2ZLuFe8bARiqCcP9S0KiA5zDh1GO+NE9MqVkfxEuyAMLwYJ/cH2dQI30YCYCA7KGQx0gCwGbmKviX5VV4nMb+qohJL1Eg0Rcy9dqFvcEJ2G14k5g/Jlxp9rZx2SH6el8nKF30z+7MES7p4tYbFMiQ8CjadIN091zuTkpRMlHyXLlnwZ6Hi1OG90HyF9Cxm/5YvfX0B9Y1op81E+t0tUTRTct5p5tQhyb4BHGDpIcskPPhXENtO7mNiOxEdxJ+deRi2iqt7yfQcAuHO+gofz1uhBQd+vJayzKLRERx2gAgBA/kqdGnpyd+0sQWeJ7AyhjZrBGvrkWWqwj0hwUM40/kAMWi7S50hwc+qtD3Vfgf9lIiXrllZUgwZD0WsiCSxRkCJyhTsKa+tXwtOJRot4P3gJo12eLyPcebiCTx8s4cF5BPxJX+yDEFFGbhaDPRqXZCnOE1/6UQWWkp7avInkXpDViyou+jEfsWJTK6uQZA8NUEktKKUZQH4CqaKeC1YBY+A/R1cLibELIIvv3fkS7s9rZwjsF7XWXxTKeoOLQvZOoapkBW356G+0FJAvCqjDccmCMLzCJEM9Ddkrb/p3S1hrMQCAGEf+/gFhwMswgjVStueEBhCrw1ZhnMm6sLJTlGB+kblF1OyT722EsFxFeDSL8OmDJXz+cAnnC2xlSdzmCSC6vs5/fDReSnZ0zV2+LUxH+M2AuV6lhUYvHCLHdnHTvvRKo+uBjxylI/P0pFEKjNXTdyeo3mxDybEa1lfHZuvDgadfaBNVsc2WhB8AHs3xZYPDExmtRfV23Bp60wn0LAoD+TAhyQzJt7ktWM0Y3SWjHgwF59GS50ZriCSQ8JDsuosBAMCyY3BoRLVtDrQi0WTh93nK1CBNtBaGRSpcIg/r7xA150SvsdfBYglw5+ESbt9fwp1H9LrrogM3vgLTUj9yIpWC0sCNlw6uiN5IUtH0wqPVrE0LcS//7Sb2FDuADcUi/56BDpl1tYCOoWDOKCZZWnTojIPpDxcRzmiRHkwWpJXlqJZaFmAO1/NFdOcpQq98/1lCWW4CAKPODvpQaWiFURZJuGEOYESjlRYDJOtrdsOQceoZTbB9+gy8r465mgbrzDqngC0KN7lNZh1daq3GD9isNfaYfmasIsCj+Qo+ebCET+8v4eFsBavVSsIIwImPbuS6/O2P0KVMiU5iDaAurUS5Vm98GLsqyZIRL6eDFDEu05aO/tXYJMFAdjWYpu2nxUMvZkpHferY8n2qP5sDikuZk7MRIgYA/OW6pcpog/2MukPjIbHbctDjMoNto2Ek+ZKr4UUh6mxjMBmzGAw1GqLsSENLDJok4SG5TRcDAPwOwpAfoE7wWz/0iE47NCwHr7HWeKZNNTGvZhZCSSShwiXFChfRZLZRriVhIOgAfC3fcxIkcY3AYoXvLbp9fwmfPVzCfBFTIJhJaT+1TVDlKpivEmO69IKGcOHQddIOmMJH52rxUC4MMVdXcnoBSPNF/lRdWc6YVm1ryuzXOa3Fgb9ZoUYCt42Xl/YCmK/wFSKpBXjON0cUgMkhZTRSRwaWFdGCaetPGy0IZ/Lrom2j+5LR2GB65AdFdH82sI3FAKiphnxBVXsEshHNdGbobRheypcNmkyPijCRK9wxoY/HgF3ThFtEjBHO5xE+vb+E2/cWcO+M3l1k7hmkZC5JUyWwQPGZ/QZfrrFrKD85TBDSCFyUWwJOJAS6Jq/L+mklbY5lJF4+y8n1+d4DxsA7JEP+fBzpvkJyIrbJAL/LSJ+DoB0sr6L+3WJSbE5sMT4Ib7aFbFEooCdPauhc19IsnyVYWuksYWBByBXaQPlWJdliQ2QUtrYYxDjqDGF7UE9g4JLktjZ0bUSLZ4mHotVEEipcIle4a6HL1kDAAShx7AiLFcC9sxV8fH8JnzxYwWxhjkEFnMc8AiVBk1wrfG+4IG7oySaNgKA3LYibthfkX7JT8gXAT0qp7xsEohfGaVBfTEt1soHoOLwu28T41BNaem74dzEBLgr5vUASaE5ulGnlLp6PA6mkiJaozWEt/x4NqxHcrYA+uwMLAqLdSIxGcASWGGOuS3YIAz2I9QuwWOILy4ZQttIC2VSD19CzzmLBcZ7GSbdQsUTkChfRZK6Jgk09JoP8S+gbswkt+UjvLbp9fwkf3l3A3UdL86oKSaQqhgCc5PkRVNWfTsc/TYS7UTaUizCZ4P0E/b0AvZknlDSP7LJF8cN6HK+SkvjVpoE0XR/1W8+qqiLPZyeaQMEl+3YB4+8XJJ3UlslFfpwb6SzBwkuVgI+et8YCYyClCDpMOQwYHBirZdTlfes1FoThwEoYH2wB5HrIVPfZQQNsI8YIDx4t4Wzmjy701MwnVR9K8alBHcBZHfbEullcZVeGXhJJqHCJXOFuhGotXdwa5jeXITeir2P3wMuz7UD3Du4+WsFHd/HpokfzfIwY6MBi1kOZSClSvlaf4hKDAHxUzmcBbFuO4MvRBVDJWjtVSRwvdaUszM/3mxVB+U1kjovs8GfBT2ATTOS5QH2KVLtYID3Vne1miwa9oLLcAtwfLZCnQbl+RPpahI7RY6w/O5IclKmBkQogrY+oLAhJoC/Q4UZkiw0RBAkOyXUvBg05G2+AO/dX8PndZXaWkGuORKgZ0cSqUBVZzUrqjlYSSahwiVzhIkaEz6JN8QbT1LfLWD+8qVUEOJtH+PjeEj68O4c7D/WL7HTGSlrMYmNeTMfPcplMYfME+UsCsuk/0GcNzgwGgyNJtL1Posv3JLgGLnYpsw1nT+osNzOsH6yH8p8siD0NthmCtWfvIUA+U4aSC8m18hlUUktNg2V9HTQirxxNKcRQbBr9ktUFATHGaQtcvS2Z28FigCvpp3eW8MHtBTw6w3fbR2rM7YRtrQUAc9NtjKfgJCMTPRytJJJQ4aqJXUWTmaDtVGvbcNZgbQS2621Heond54+W8MHdOXx8bwln8xUfBwOATnzuej3ztFHNLzkdoNfYSgTpTlAnXdqRDclkjeW9PeeklJyZrT+1vNgtdjrYeUGQGBQxGIaTJV8x0GtoigmHlIo8DZRLNsryjRRTRZ9oXUoiKjkvhzkIXuQLC0I9kDJ8w1mMstbbVwDDlkuNVQV+Q/mzOyt4+/0FfPI5PlLIY67HQhEBzAzgkJK9kuUSzUIs5gZT2dOaqAhXyAY9MoSotiJG2Bol20DLzIpecf3hnQV88Pkc7jxawiKC+p6BTRaTAPYXwQicqLwv7qZs4XDAswCWU0fS8q4iu/lfQmPT+pFUIki2RjniiDKys6edAvmV2NJZCplDPTKDKukmN/qikaDk5Z1ExeCVjxSpEUGCeidZNS+RRpE3Hr2ppu0OmeV4e9B23mu1sCAg+gJrB6ExaK6zj7riGughf6mI8fm9Fbz5/hze/WgO9x+t8M2nIxqzjGQ/DV597dejRENktclmQxk8v8qocMh0hYtoMhO6xCpCHEPGrjfTIKo2FSIAzJYAnz5Ywvt3FvDx/RWczemoU5Ia2DMD4LGXkq5JpOyXEiplQVHmVCd/KvkrB2Kf/afkmjb0YcynWnPyZXsSVIrBIKkZTrbwKZ4G6nFd0K8sYFIX1A765jM/RSRlWx/Z1fHxnB0cH7VoNVCmK+d0onYMp1E88q/AxDYQ5gAbAgS/IAwHUEKtwdhahZ1AgkNyXQ01IFOMlUQfnq3gvY+W8Oa7C/j4kyWcV1+jOwA1aHPoUa23YRQit+g3RagIV8gGPTK9qNjKyOObzGCM2nIV4e7ZEj74fAHv31nA3bMVLFfRHA2zsQmdHbADZKfr7cIK6hvKuir0T5I4vwMoC1iMZ5mRwwlU1nqB4tOqGB/FpMWpkGLDvQD+raU2HNFTZyqez5a0K+OTCdwW7FmVRU9VWNzTTnRzpTjnGYMJNQCYt46WMZB2DPJFoWXbGmxJetl1UDxDGKo8Ap3XZDm0Cns0drMYqFEGAKsVwOf3lvDm+3N4470ZfHoHX228GZI+tVhlWwPlagp4opRR4RC5wkU0mQlt/22BCnktNNwUsQKAh/MIH91bwrt3FvDpA/pWMmUstEd9poxLsuW0xzxi6KSW6Wo6AIBc3kmPncpZpToTKCjm9SWCxJcJAPojPxgyXf5RceC+sqfMiDlTJ+1QsaU+6AeR2jOdvSCd21pMSzumQJQLgrWbz31IMkWeBsqVbSQU009bpYohXxpWNmsIgyGrakFoG9oZOvqkazEYQN7Aua0YAc7OI3x4ewmvv7OAdz9awINHq2ZsBgHcXbOWovafx+JBQ7+OJrMTZGMbpmCg9i0U/ReJwxirFgFgvsBvJL/32Rw+vLOgV1zzF7OS7CQEdc+AjqI56/MH/0CN0sNdddlHJ2uAtNiIvLpMpY7A7UZ89eW39G4itpnsZn6D8ivX8t3RPgBeVqCzCrGl6yvECPoFEizD9QBQMfOX3WQRSvZSoMl4ouuCrgfPdzaGyHMAJJkiTwPlyjYSelMVy7XExuS9mH/xYi1kZwhDFUa0G4fDr7ATevuiB43Gy+MkGSca6Y2ndx4s4a0P5vDa23P48PYSzmYjFoUi7JEV0zR/CFFLGTt5PSokhQK33CQ5BgVseCZuho+/TUZkRtpo2vJg4YCXiu48WsL7ny/g3c8X+M6i5UoSlb45CpDiCvLPYUKvsQbrR19SQdijfp1AgfOhJE9uVb2Vkdoh7SFQh89AJJMafsk+lXV8vKv3aeFIumnh4n0GnklQLELTISm68WFDNq0gDC1RQ4/M9oE5JdVtCPVe9mhbbNmhoUrNvlnW2wm6VsmGTF4nNaI8iLZYRvjkzhJef28Or707g08+H7h05Eemg71iPB5NrQKzQFIocBtNIugMf1CkIlAhJ79VgRzdos7ucgXwYBbhg7tLePszfsw0AtBFID4TmHCyI30ip1C5zDd1meav5VMMqWyP+uW5/5QZBaZZfBvpcsBZHvgX1dxvNXCAuJvOeDhutiH1URkjuy9eLGPsugqJTRSWYyoLK5ulsv1M/QN8BsMO004hHygUeZqGdmo2mNpIR6PRl//ooxLXGNAtojFoNwpbq7ATSLAl19cYHTICknGi4ifiFiPAo7MI7320gFffmsNb7y/g7oMlrLpOy6QFVEld/10DRkvHXqhygaRQ4JabxKLJRAQnltXUC7TJiCojB9vpUikIRgCYLSPcvr+Atz+bw3t38AV28gUnLc9txslI05mXuxBZ/PAtRJdQDD9tpn66oJKwbM5/YHOq7GVAySDdxmPsqXprH7yf1SxAOvMB3k/vRZIYsoBy+z6WNvQ9lqRRzF2R+CWeAcoVbYwGft8JuuszBm2LtejlktF2KtiJ3rbfEMU6uXYyMmqkrWKEuw+W8OYHc/j12zN496MFPKQvrJXk69AC44ZzBlbbwEQJTVNNpoVOYReJESEWhSPfN3iwhHc+ncO7n87h84f0viJQSTYUnv7RWZhZpn/0i9lYh5Kje0tq4oM6gud9debAZyx8RuHLKmC0q474yT5vwXzPgHpP+U2VJzvkg80ANwERkj11WUnc6QRNiu4upq8z0/Vnik/75UtthUswGaGSG1iwyBuHyBOh4HssonyvYthYuV79yO4htIEB1ZxyuBX2KGx6dpDH2COjkloEWC4BPr2zhNffmcGv35zB+7cXdD9B6/l93qS1lGvLH4U8/Ax1EZpBBVJdJ1cpoWDZoiJQIY9Ctw0WLAhHukR459ES3vlsDm9+soDb95cwk5/G1Akx7zp5EohFtC9JqqSohPDPheVjVEnR8DkZlvqP4kv28TP5TL4FbIteKe1YhYUh1UsnZavn65fkJxJ3urfGLqiY7Cg/ZMIghZX8ZUKCKkOBZCSjl0DRF/KHRpudmCzXE12Gpo/xFifQUbExGDSl23sQPRUaIdMrSlsEgPNZhA8+WcCv35rBK2/N4KNPFzBbDPSDNrJNNExWyOuh4aeFTCUjICpk22xVoZEYsLNcRrh/toL3Pl/AW5/M4YN7S3gwi/i2TB8HlSU/Mo/l5BtVSkVkKGFpXbVJYtP2me3KHiV7ftPfb2BZUwegswv5rWWl7+JIftPZSDC/ZZDs6/3kCm+0I0v5S+4yP8AyfFbFwnqDiEx6Y2l29m93Nsx7aKfLhqrLuug6QCZ0xVRZS0acIbQbYDjMhIoJQc2HQUPG6ruRRshlSMCZjRHgwaMI73y0hJffnMFr78zx+wkLfKxOSZp9eRKks2HqtVGxV4TaLgrcAmkdaDNU24SKjwp5FFRv1dEhtFzh9w0+vLuENz+Zwzuf4autl4V7RZwMdaLSPniX2Vo2CyUjEJkSnbflIbbdJjGWdCP3ENZNnwmgvObbexbelvZDFNnMkXrGRmp6vBXMvTVTJ+eHNdmu9pHMMyXvPwCloFDONSRY5I1Dbx5nuQGxNTDO4qTcIB5to9INQ6baZgBMBzWEGzLF+jixfDEgWlQJXEYZku8+wC+svfzGDF57dwaf3VvCYlGqs3JmskcZpia5MYOeV9laDPgv+RtQYQSKnTem2R2LChnRZCZ0iXUI4VtMV/Dx3QW8+ckM3vp0Dp/xfYOAyQU3vm+QjJpExUNG2PibBRpsQ+4ZkDjaUdf9mUNC/ENH4s8lyAkdlcttDSWDN20Br6mrp4OSc/LNv9egvoHsL9OokCCwDWUOLwH5ew86Xv3YKArZi1N5ohc/LgYm4z9auBQf95PlYj5Qnusgo0V9Btop+xhCTwwJoZYbK2Z6Y/JSI84Q+p0UQYFvYsKi0hIGuUyrDobj3na6XOG7jl57dw6/eP0cXn9vBnfvL2G18prqOwdZc+cwEaqBnGhJKB0BJeQURoFDtthkyV4PaloR6swKOWGgqVQz1NElhGPwfIG/fvbGJ3N485M5fht5qW5I6iNXADmqzZqMEz0Jcpti+7I8Z/cS1Cjj7yEoX5hQdZ8V6qmSZSLxkTozaHGTutC9j8j72q5K4GIx8YVm4iicGYgIUlN7MI9i0t/rIDnxQ+NC4iEjaRF1oPpog2bOm+AJ1ZxQsJ8BZSJ9AbHAah2/GrDcgNga6LfYsSC0jTG32qYjUFwBPRqOSkf+LVNVZsDNj53FAr+f8Mrbc/jF6zN48/053H24guVKKW0T2lzBdIG0Hjj0DoNNkQqzQkZ0+G6wErqEMFecL1bw8b0FvHF7Bm98MoeP7i/hfAFihG96+gSWboYiDF/pcH0w4XHSw2RmNv5jGVZleY5I2TR+FU2LGXljl5IoX4/P+Na2LnM84svLVu9NoLAuh0m635KWLRuTUk37jhaC+tIfCciN8aA1OhaF1hFJI+dsBu3fosbpypGE1sFvDR0LAmId4wKKvc9Eo6KNxijG58SKC0YBUW0aKwA4n0f4+HNaFN7AReHeA3zxmTnSGkDJvoGMfkcnVMiEAldN/HXR1K0wK2REk9kZb5cQiaifwnzz9hxevz2HD+8u4JHcRC7c83GJT5fzJIkC/IfyfCkl9TaK1c8IpE4DdRMRH9+AOtJzjpbX3IyuCdJkXD+qC/DL88C9myjB1xUXSWWe6aosi4Gzo0Mq7OQoskpxUoos5RcBGivmIEIjdRk0TNRVqwyNupB2ObAgDFcUBirRiyEfCXnFct0hmZwPQGQ9yc0ow4EXaVH44JMFvPzmDH722rlaFApKDlF3QBb3diF1rofT5jlw7FnUFRsV8vbQ6SBQU58tInx8fwFv3J7Dax/P4cM7S3g4o3fuBFBH6zgImMYZh90F4OSP4G8UI+yrp3k0oI59nXOikz3aaDkRKFb23QXtw3wLmjZgHXye0DiWM5X0RQTyh/TSU0PoT19aA3pnUToTSosgBUdyTAJVPzYv4DiUahLCkUcmjK4K3w3QxMjzBHjvFfTLtCTLi0JLY3OU61zHwILQRldVSKgVV9dpUMuAAdlQpsY0SinhpUSI366MMcLZbAUffLKAX755Dj997Rxef38Od+7je29yCwm6hjqpGMgod3RChUycxOXExpwMRWKOkpjUsMSsk7tga1HBoECys4oAjxYRPr63gNc/nsOrH8/g/bsLuD9bqW+fYw/zu4pS1zA92UxZWDIkylCSRTU/pvlTjTAKEDlplDFfEqzURN1p1lvKxOnshKyyV7RXOi9AoLo4ZCrZJDviLtkOARdE3U645e3Gps2CkszKPvCirPV02wJk7cRgeS2pYXKBCHm7FXTkkTG5pobWcVwwPlzFt4DGgoAehio4wAbolGmi1ACEYny5mELOzGzQAJSilHEHB2aAs1mE928v4ZdvnsPPXj2D19+dwef3VzAvPn2UkEdAcH63hczkjvwwmqbZd1NoAAO62vwyAjyaR/jo7gJe+3iGi8GdJdw/x8tEcpSccmoKUeV7OXuY2Ov98kQRX+5Q+blYBvSZfisBmSkOtfGfiq24eYhPb4eP/NGm1zexEo/tANdPyeqFLUySQWlPLBl/2q/fFxkmsxHvV2TJLilxrHbqsbUKiqzS5CXB1sQuGXOkcirL9Zpu1kbuh8HuKgtCXZExLNEnVFzt1kZuY+hSUbYYFCARyvVevMywojOF9z9dwstvzuGvX5vBq+/M4ZM7C5gt7GsukiZueSQKjTFcIZc5aT6tjap+JcYCKaHJrJpMGBRI7AgAixXAg/MVvH9nDq9+NINXP5rD+3cW8OCcv21euIbvDYFKTM43JiPFCqBHS+IFUJdRbFLTSVHLe7rwWhvrAaS68TuD1NgFPpJXMegqsgmWAbGLBbto5f4lhACFp7UKPkVB6SZvQkU5ddahlHFhRX9+SUAky+U5rz2D6kdQPC9TQdH+EMq2y9RxebNc3zIqCwJiyNAAG6BTplmpRsWLyV6JDcXPCFrNu1EDnIeijihCgPPzCB98uoCX35zDX716Dr96awYffbaAM7pZ6aPwLgDEWBFcj6LeWIw0EuthZRhpeutI/YSvo7h3toT3Pl/AKx+ly0QPZumFdXiNPCU3zlByVC30ZD8AJzPVKj6h6mf/tS7bE2DrTsSmbUR5LQb5C6F8DyE5VrGoeIQOIPVKZeOSHav7HTYB63rrtmG+doofGIzmGX9iPMVdundhgyCaWtis3VCZ+0nC8IVsIqujaJuBNsr+EY2U1oWqWpWh0RYqLAhtBeiS6BNqNZpFbqyom4sp5MyiDZUE8TyAvpGsjnQAkrlA1Nk8wsefL+CXb87gJ6/O4OU35/DebXwhnv7iax6FMhLKAnwkVofjkp22zgYoGC6QulGpdsKAgGavIr619PNHK3j70wX86sNzePXjGXx4bwmP5nTWphUi9avuX+cvACcgTafLIjouPgsAO1QAUh/qDQLf0HX0pIV+5H9uFyg2zJO0gKhr+VaQYnTX8JlllXgHP3lhShX291oQohVsnQvRAGReSlBtakJMcXCdE5U7uY3yoqBRaGwWrOSOzWCDYBfF0Hz8A+iRjeUFAdFjYAgtE12nPC0DBrmN4tmDgj3qTsMMQB+d0I45ilSiIoeNOV9E+OTuAl55ZwZ/9coZ/PT1c3jrQ3wCabF0b0rV+ry/FjoUVZw9aIoXiAUSQhuqCFXICQMCzI4Rf9XsbL6C2/eX8PrtGfzqw3N47fYcPrq7hEcz/J63HP2zsiRT1cfKdhoLyZlZCNQRrLYhSdovGqw/yb/XwLYm+tfOlG9f1jGJARMo2ePH/l1Mchag7Su5zCd92IeS+NvOXM7lmabnUOa3RdM2WZ+e7kJ71ib7KOcwCbyCGr9GLwFly/4RPemvBaumSmvaY7gFYdgaSzTq2mNmBHJjxWSvxFodAdlioOjZD3RjiZ+YkKMVGpD+uD3SN5rv3F/C6+/P4aevncNPXj2DV96ZwSd3ljDjI1StoOEDIlTIZU7eHKMg/VsIr2S0QOpGU5fauQUd62IFcP9sBR/cXcCrH83gVx/M4I3bC/j0Pn4DOUmmmgX7T2jiWsUQwCYobSMLtaAHPulpcWM36eukiE8/AV0jx3Jmir/XoO5X6E0XUT4lUto1cVh1ZqDtdPSv2lPbYVvKIVvgRdexXdm3b/IXtDFnA0iTyzjXNRdMuXyWoPj5LEj8Rp7xHvthNdnF+vZKqFsrniEMJdQetExs9+ygbWaAafjBFrEQAkQ/W2mMZU8A0uBZRoB7D1fwzodz+Pnr5/Cff30Gv3hzBu99soAHZ/glNrkUtQNItBJXP9L07lBt9dGg8mYI5H4VAWaLCJ89XMJbny7g5fdn8KsPzuGdz+Zw5xG+m4iPhPmIUt7fw/1K7WTazV3/N/UJAMDXxaUcjQ6giGTFZJucKTBFzgoMlzNCunSEiTedhcgZhTlD4TOhLHCKPUi41l9K7Jz8SUWdGagsRX4tUtnoqbrJmRgHoAMRn2kR5BjEqGwsb8/M2MxoOKUwtChUgfwY7SUvjZ402EKo5dKKvZ68rk/0NL0IlmjaHTYzjFIlCcWzA4VePnIsHzmcEjlh88bi/lpqggxy0ng4i/D+J0t4+a0Z/OUr6fsKn95bwfkc7JXc3BxAnVzmqAm3DZhuLhjW9c3QGCOhbA7RZCZ2BIBFjHB/toIP7y7h9dtz+OUHM3jloxm8d2dBj5XqFtZ9mYLjH4wP2rjOM0wnHZ2DdKzpCJY2cZz8oa66xq8SJdthpCLuGdtKTjMlNp0vA/YTX0axyinqoOwIl9rGA8Vs27Jf3FH3FtQ4EB9cLlSe9dhzksjb0MygKP8ISb+cCJPPIX4TRd1NYX2zi86INkJ2hlBunHFomSiuaJ0oxqbMFPkKdjGwSEcBaSbhJHKTRSnLeNbgSU6YLyN8encJr703g7967Rz+8yvneLZwewH3H61gsWzmzvVQimsT9NrSbVTRqZARTSayI904Pp9H+OzBCt7+dA4vf3AOv3h/Bq/fnsHt+0s4m1Obqn6UPlGdlmh2kzBMPfwZAdMpsenBEEAtDxKGUlBnIMaO3fjI3z91A07O2NVlR67ZQzvpuxFeWVcvLS50lsG/w0yZxISj9ZI5e8ag+EH5w12kyqc2SPZFl5SDBMzeEOXcUOEL2fNTGeHLFllbFrBBOgQgtWJOrdgryioUurEMlii2K2PYDKEhOBBwwnr8RE17MepnQ6NscobgTZlZyDTXH6ocIcC9Ryt4+6MF/PT1c/hPvz6Dv3rtHF59bw637yzg7DzCapW3bcELocBRk26rKBh1Ve1GU6fJRKwi3ri/82gJ793BewW/ePdcXSLC14eonlVb6jfJK5D8cp2CLijZsjz/gbl2j32fLlUZ47SZorbPBoxjZEoy1gFmJQXvt8R2fHSZLr1oVb/v4cPmOgX+pw2oaSW21IJUqH7qS/3oK/0TsUJg4tJPMIfyopBQ1a/RCVW9JmwAa5lYA+YMYb3ALVom+u3nvWF1ia/EinyFIb6MKDVD9BEJa5sJpDYe/PqGHp91RPo3m6/g9p0lvEpnC//pV2fw16+fwxsfzuHTe0s4N69SGIFCdXqwhqdLQYz4vYL75yv48B5eHvrFe+fw8/fP4fXbc/joHr2TKKr+oL6SPjTZiXaVHNOFxnQtaxIP/YYAHekbf2SMy+kYN5Vtp/kjW0YEoEuUyOJ7Icq22iZAGyd050WgmkQ/silsGxqAOcMiPumyA1VDc2TMeokrJomOvrGcbljrwDlW9iI03ud/ylcClnRMFjU6o66JIG41tyG/fB8CIaqZo4xQoCCKR/41YUEuwG9yb4IlqnWGou0KGoJNBw4NMx7cWCUVv0jFqG/4pvfFJ2XckQniQubpgPpqVpLCKka4/2gF7348h1+8dQ7/+dd4xvDzN2fwzu0lfH5/BeczOmOwpgmuFlR04XVhULQgUCANgpugiAYzRrzk9mC2go/v4a+avfz+Ofzs3XP41YczePezBXz+aIU/akP9JZv+4hg1vySRms9C0xbFOBmajeXTPQKE4nNilQ2DSgmW9XlfJVcJnsal2uzTRbhpP84dWeT2SV6Qn2JNlWAal9leWgZKEDrHwfEHUP3DZyP0Mj2ab8EYIEkqa7s6JuZF//OZypCf74gKX9um/aJ6A7W22SbG+ii3AULOEFpC20C//bx6tc5lDPEtKp3PCJVN8WQQurKZ7DyVadKwAMvOlgCf3VvBmx/O4Wdv4NnCf/r1Gbz81gzevb2Azx/gwrBc6UdVxZJBsm/p20bRvKnzdrBSC8Ht+0t465M5/PKDc/jpu+fw8vvn8Nanc/jkwRLOFil58ZlAAL6sQh1S6C/e5TKpYlGVmSDvHQrq6SR6vl/oqv6oz4lW62m+8iOKapuoTWS0gIqfKYplilqNdfgsQspJNYnpsZvkrB2lb8poMEg7kRmqcIBC/UmBlxlsO9bjT5LReiXfKXIttiaGNDflq4UmE00ElslEMiiJYWGD7KayB9sr5U4BCTVlhjBGeUQlW2cHLfCQirR5faZnDI3AFniw6h7Fs5Cz+Qo+vrOEV9+fwV+9dgZ//qsz+Itfn8Ev3jqHtz5ewKf3VnA2j7BY4tmFQcv3JuDKO1KGItGiQwSAun+1wkdI758t8actb+MZwV+/cw4/f28Gr388g4/uLeHBLMJqxUfh6ROPPm2P2YRjqxYc3ycZGQEB8Kgb8AgWbVAGZX8mKTEPNy5qKDbxuW8pHcqVR/bH9yTUvQkHY1MROC7D03oqmaICBiCvy3C6mR3lx9hzksLn/+KHDXHf6b50flTZf/r92oFi8UCwxtcGh1C0m1D2ux2EkfaTrK1gODtbxpYhFm+IiFBNpubcoCKTd6qdXTnfIppHDyudTkel//TPPoc/+9cPAOhaLQC5o305jeay4Uc6MsmvgwbAt0HGqB9Z5cmGciEATCYAJ4cBnjidwleePIDnn5rCC09P4bknD+DJGxO4cW0CJ4cTmE4An+zQcQAuMXJ0PAIYl9LzJjyfUSBpDLBxSaTvEsyXER7NItw7W8FnD5bw8b0l3L6/hE8fLOHuGX7TGL9f5pKhHg6qQQJ9ctkUg6O5QFNdIwCd4WHbMh9Eybe5jy0H2gRgfoQAQS4xBvqai8gam1rPwoxmdf8KeW5uOX25vMllrLC1yVZU22h+VDF4Ou9pGc2zn+m/pmey0dYzlQH+9KUb8N997RRuTtTZomhTbUvjWUVn+ETWOaOoDqpvHbhW6pyriEBtn8P6LonYejmJgkJJtrkgiHiZnTDwW9SDC0KDnyf8/gWBeYma9nydVxHgn/4/Poc/+5f3TcKA1oKgP9XCAOqUNhAfO8vqSn/wZSXiTycAx0cBbl6fwNM3p/DcEwfw3JNT+MqTU3jqxhRuXpvA6ckEDg8DTEOACf984QCiaYEKCgIFEqLKqLMidfcK8KznfL6Ch+cR7p6t4NMHS/iEFoHPHi7h/tkKzhZ8PyUtuLrdpV2RInQTgFk0bFvZfa2UFgMBP0UkZbdjhyYWDIGKAYBqhDQjo3uJxmjIhCyIlU1BpvNYL5iIWk/xDV1ROTrPb+7zGwAiUjK+ooo8MSLkC5T9TPYibX/6tRvwj756HW5N8QKI7deVyI9dFLoWBCgzpXax5hchrOQqI7BMJkK0UqIvFUtymy8IMug8IwHt1xth1IKgGjPjOcTOswPQC8K/um/dqEkeAj1ZIg2f+LwvOgGlZBHh6T/hJKMvM5Aif9DnZAJwdDCB02sBnjjFxeGZm1N49gncbl2fwulxgGvHEzg8COnMQdnQGOiFKlPIFb6HF4sRL3etIr7a43wR4dFsBffPV3Dn4RI+e7iCzx6s4LOHS7j7CF9Cd77glwLSUVXgBE21oEs4AK6yqu+C/FP7WpR5Xh8gtZZbQBLf0syu85MrQBobhuLo9JGPVoK368qZnj/7cAMiFnSkXDwqtUf9ml+moUOup5dp0218esHAT9YG+NOvncI/+uop3KwsCCyX8zTH8XhB6lkUygyMce0FAYTIMiWRaOIuSDiSlw2PHtGduQJEtCqRhGoyg2cHwMo5v5jwVWMW+QR7dlDmJQRaED6DP/vX94lC/zgB8FG/DkMvBjwQ/GIA6qjS2GM76gZZSQ7w0caDaYCTowCnJxO4dTqFp29M4KmbuEg8dTqBm9encP14AteOAhwfBjiYol3z4yRkrwonkMlnhAJo4kQ6olrS5aCzOW4Pz1dw99EKPn+0hDsPl3Dn0Qruna3gwfkKzhcR5kt/Sq/PDNInnjGwU9zJ6kk7LMefaJ9peaWRovvPx0KiLknqfjTwbe/5DE8fKjvEEr+YyDXN1k9PRZbx+rocaXxHd4kp10HDySb6jdGeMTAvZn4q5ZjqzQn3T9yCAKafk6VY6n/hIDQ/Rv7HPNlVaC0I9H/tRSH3nYlk9SpIKJKXqy4IIlbkKlzk5aJAnyWeQ21ByBcDAOAF4Z9/Bn/2r+iSEZLxg5N8AGw4SeJ89Ar0uB6vEClU+QxkiM8UiMYdEllG/OE+l3EHzwAOpwAnRwGunUzg1rUJPHE6gSeuT/HzFGnXjydwdBjg5BA/D6eoO/F1MvEop6bV8mEV6V+kJBKpKxfLCLNlhPkiwmwB8Gi+ggezCPceLeHe2Qru0QJw/2wFD+dpEVipeWSTLiZ+at3Upsikz8RzZJocji6XmrQf2U03M8WOdsrIj+QZthl9grB6Ui8GFUx7GzdpHPo+ERAf5N4EEkXexadnCu/yPNE+IvEMXRKylY8F3WDoNunraSkJXsVg7Alf20p1/dOXTuEfugUBII13hGoZ22EmcsOLHKfmJzaCeDkDgL2uvSCAEFmmJBJN3CUJS9aymy0IqmNqwE6tV37c2UHaL/IJdjGwe/mCgLxsQVAmQwj0oi0kIh/jZlkVmikHzSO+5AN3dqD5WidIJ6fOw/0oZw4nRxO4dgRw4xqeLdw4wfsMN65N4MbJBK4fB1oYcDuYAkynAQ4mfKlJnU2oqjCiuuyDl34iLFcAixXeC1iscBE4m0d4OFvhdo6Pjj44X8H9c/x1ufNFhNkiwnzlF4HkywxQvThmsqktdMCZTbOIAN3Yo4Wdkkl6/p4FtT9t3NpSH4WCjY1HnvHBKNEI+mChCSUTVVmGfGAOCyKD2TWdqIU0jciJZRepfD/xtZ7/BPYfkkakhUdkhE80xf/Tr57CP/zq9cqCwMocketfQYpG8+PK82RXwR8EJGCsqF/2iwjBNYjA+i6J5HUqSSXy4IIg7Izj4AePw/bPDnA/4zmMPTsAvSD86/tICcotNRhPbizS2YH+ap/h+8WCB0EKKbibyWKGFxKmqSPa4GwAXzoJmNgPD/CS0dEBLgDXjwNeSjqewLXDAMd0SYm3o2mQ+w8HE3wvTXrXDJ7+RfpC3XKFC8FiCTBfYWLn7XyxgnO6LPRojo/TzhYR5kvAbYXfqZA6qrnK9ZSBKWUYvGdg3qHj2lDanngow5R0b0IvEF5HQ/eH0FQ506voy6hX9UjASzAAuX42ekvqBZrWw96kSqrpx0euuK/lk01D1wW6SmAu3ShEPpIPxNWXl+g3kGNM9WbbUXyWFxIue/qfvHQK//DFU7g5zRsD2zxp8V7eF8lLviCA48sugXg5Azm9CwK4ygpYX5csorFfkiCYs5UtLAgtmb6zA8hkiglfRPoWhERVnZkFm3jLVYR/+s8/g3/+bx4kciG5g+oIpKXLRryJukvqSQc7Qbw728Y+pCNETlwBC0lGLTZiNdC9B1okDg/wvgJuAIdTOmM4wDOG6QRgOsWzBDxbQBeRukluCtON4cUKL/UslhEWtFDwYrGgxWPFc1y3A8UZi+1EHvXCR/WNvPChhuiBsmPaRH0mOukBiB9pT1og0I9qX/qnR7KvC1A7Zf48PVGwpHQxniQF1O8GvlxBTY9Hv/hzMBR1ZhCp7GXMPlXL8pUn4dvknmTdJ+3IWQEdmHg53k+8CH/60g34b1/kS0ZakseAtRKF7pF080VB82RXYfgsoewzwYRqgEQ7fixsnUoSCmpRWH9B4GAqMoNnB8DKOb+Y8EWsvSCsc3YAekH4tw8si5OxalxOGEjCxQeTNl9yCfKFm7RY2AGUJXW2bZ5C0gsRn01wYrSLlIlL25Q4VV2IP50EmE7xkx9dnQD9bi+bJeFI3RX5jAECrGKEuErXkNkPhpfOfrR/YglEJwRThySuFgLlgG0bXUOzn7ijFm/el4lrr+0bXYb24/g4AR1d+Nou+9X8dHSeO6Vx48ic9DEiB+LJmA+KyLpqevqpqo/WsUxyXGYG2cFyxJZhGyxLtqIiRtmlxYFuLjMS338OLAoxQgwAf/rV+oIAkMYLYvOzhEwNAHllBgDFCkWfCcLKq0DAuVFjR2O/JoVgueybyqLe1gfolKlijLIZnFqv3JhlqofqYD0Y9eksAAT6A27SwKoRO4Ro6nhf6AFwuEVIRgMvBgy9a84acHJxLCoCAvqXTTpOiVTagrWWK4DZHODRLOL1/rMI984j3HsU4e6jFdw9W8G9swj3Hq3gwdkKHs1W8kjofEE/9EPf1OX6YnuQV70YMEx9+ZOJqRK0BCWjWk+LAqC8kpF9FuQzDtCLDa+M/CGMpKqA3UH15Hqpjc+oRI9908Id+JvO4kD3H71VjHzYvlVGlT/tS8gUF5flJyZZUuuqvhE93uSgJPGVuvEjfBaS8afi5wjYP/uW8W4XIPaTA6ni1/DIti6K0zbqEolTPqBEVFlVhmqvjWDbw6NGbyFbELrQ7albUNCT8Guo6eadWeEFGlTElqNVKftVX88i1k/vrYlKRH9mEN1U1hMOCfQdBu8PkCY+1JfUav6YH3Vc4OIIqf78Rk/RdXaZxi0ZlI9EUDrKp27j9OZQrqMPrPR2UROKqbPEL8ykh0R1RqLsKndkJ32aehGMjnrZv5fX8cpGSZuXLCMXKDmLjNXNCTmC/g0ErysxuDhJUejqE5Qdts86UnXhqzNmd8gkMlR3JZb8FPxLn2o/zKMdOQirAOc8R5OiyvNEGfr+Vx2+thYcd8tng6XQ9pOd/lXAcRSr1hdIHa1KAvQHCWBFaglfo0wdAA0o2dcsUw7y8B4nYRl6IhdpK0MfiWpfNM4FbDdNVmszTS/yl104dnCTXryZuFXRCvtmQVqNyKY1v1BtPHq1ftXDkYAJO5VMEtA0TlLKOLePyCYH8qH7QqkKuO1THzDD6SghjkO7M740AtBZB/Uhv8CI5P0i4AOq/nEAusG4Dir2ZDiJ8Q6qUuRZA5CYspW49pJaqgNdQuVN5FEHbCgCbdvzXfVEwMSjGQ0MS5SQtKopr8roDq0pg+aLo0tg2mMAZkHoVYJ2PS8FtcWitTh5HiYo1YLqKN+Uzf/kDfX5woLrCWdP5phqdOTZ02ehk2XQk5kLNMP0hC9uCtkcD+hbx+d1+IwiY7B6PtNNOVflRMB1TpeIxB7pmHiUjCCJ4vTQfNVMIhoqZwUsaIwrsC3a5016PfDkUGW3cdtjnFw5LJuE7mDMaDtsIvNhF1TxIP6cG1035YNl5XcWlBDHYqoifql/ZUyzIjpKsWNcoM90xS6PeR4b6qwu2LfBsk45E1j054syr+8sYQgq8I0xbES1flE6xlg+Q2iiZKmIIcGcX+ukHGVemerhpLgormlHtVqKKvHk9hYPTubLteESkm8jJfa0DJ9uA9nlXdas+PFmVHVkJxl2R+SQ7Do70UWfJjPL0SRnkSRs6YpmoePQ7UhHP5l8oqUYFJFhiupovMSWauDEMPVLVUwFSeEgcQZ6eiS97hp9sd10NmAbhc84mezjAqL5mDSsfjpqFHshtavYYR3WI6VaDLl1D1WPAKn+gPu+/QWqObxlXwYojGtBOkMZzieWVpIYRtLK1pIOi4HjrIiKzQoflEytT1I75PX1W7Yg5JUah3yFdRjia6j4W3ZrHd+vA2qEob40LpsLPGnV7AE1e/U1dN3CmqbhJ77WYXvkK/m0/rwP0L7ZpjqCAhe6JCZ17T7V0ckqu1wXM8z0hCZdE5uxl+qDcunIlT+TIeVX+Wb74idAMW7RCYB9GtIFdQlP21TyAvbDRXekrPdlAwBMvGphZ0Ei6KK1n8Kc0K+y6fs4wG683wyqXd3vEiSJin9ichzsR/uUunk+BSR9SQbLNtwnRcjx+HnIYTKfaawPIcBkkh6Ti/yG4QJqeSNH4g2fJRTsZLlGQ6Xxgup4bGZEqjTGTLN+AB3Wcn5/55TRp+GkVBG7hZ8iwX2LaLaASnUQD+0VFouKXPnQJ/1ymwxuEUOCTDJCwUUqkZ9UT+2z5N/aRoLed465SPtGl2ksxuFwHOrMAMi0qNNOShaKxvIkamLQdEsu21Sw/lNyE1LaxYLUTT3GmouY8GQrtZWX0QQlljY++o90qYaPypUsV8OPmbx6Btqt3ceSC4tg/WtoW+aTghBberxQnFpeA+Vq8zMjFGn5weImyO0XkQ7zM4wPJzfSW6fiGldF7udC0L9YJF6rAYq8gCNN0mOA9N0Buo7JJ6M42PI4Ao5GR3T3e5WMPL+vEqAG+qG4jA2aMGyLNo7b0NmPTzbISbtOR8iBJqiWUTxPkziqKBwRyXViRVTxpnsXCj6kAKk+nECUDITyPYMkp45mybhuLzx7kaZXSUddPoOItSNBkRd+8su7GIRUPjF0mUYl2+EjfWNbQmdFuwzoo3X8SzCumCb14RDV/R3xxZ90oML1Mnz2STz3mYFt8D9uGgyIqpf86TMQbUIntjFnCRUxE7E5S5BANa9gpZRzaiioAzToynwSqQnX6IgJKJExMZdQTLQaQ3yNdtyCQZ8CZ7BgXz82l3ZoUkT65xurZVYVcEJqJjN4QOOkt3DXXEWf48DsWzJbhpakffNBg1nagBnoX4q6XrpS2pbaFwndpqX6si99mUWxuKlMfJASjiRjp6f3TWxEwA+OBzczDlQwZs/4orYr+GEE8aUuAal2kKGgbODmU7jla6LYkDfdWoOpDZWmplMZaUjQ/xPSkT+K50fl2hyQSw6HGeyTdRMfC3p8+QgQGEcg+0BJjV/imCtlhCKtO6/kqoQqowCS1T7HqFcx3si4MwQXcxlDQeR8v0rXUeZ5aqszW7zDgwAHB2rE0gjGa/lEDkg3R62878s65Wk+lc0EZFk9Y8iXLCY1P1QWGedX68pz/GRbFGlfzT8LfdnLyYm602WatJWuMxVwwjtjSgRUczDNaGg+87RecPdRkmiRIPp0RG3ssQy1I9YbidxHUh0VZ5IjWVcn0XPl2iaGIcWl9TWSf+eTnhriRYMXHO9HjxdzwERWgiw6al8tXywviT1gf3A8HB/o+FzZ1o9iFX6qHNuaTvLE1pr3/qjeVNGgzMHYyjxEi2dhJFVBwm+YKh+jUmOaNqgb8e1WR90GwECDA3StJAmmIep6ay8kFdETemW0RUzpVVh0fViJ2omSgINZC7IdtCkcJ8fJyPgvoVY18ePotC9PNcnROF3uYBk9Cb0ylbN68YeLiUlI1tfWuW58CQDpmi0hpHkvxkr++TKfDkF8ix59ajr7JbvatBJRSjkvsA3vDwCPpuXxS5JRdWLd5FeCUQzcJD5FA+o9bSezT5snBIlHLQ667VnP2FeKAK4v7XxJcSCBY9Dq2j6Cx3xUhpIug8/stK0DAJhYIfwQkgncQUXQm3tMvzUSb8OeljVarVBHIXQZkwWhGesO0Wr0HgxXcRgcwskhwPGhmkGEwP+o1/XwM6JcIEJ6/hrUANfgtKwsKv3Io0w7cT5KNHyvkuIDGEIElncxKXfqn2V7uwBSN2TlNlFPK6p7BgG/jWsyF4F3A9FL04x9ooiKI6gzA2VX6zI9sA8nwXTx4dpV9JyPiTKIfDQyoUTFCR1VuO7KiGkLTHjJP9cVYBJi+hZygJTQ5WDCgeQKJ0zZJTyupw5N1x10laWNlF1dBUNDKuuJXfeJfD5QcP3KFig4qS2RpmECEx8stHNN/1nCWLClPosco2835GniuqBGrkAutTXRHdCQtU34fby80x2vYeb0ZAInhwEAIsRI3xU28mRb3zh17RvNTVXFkFFOHS4DVserB4OdoImuSiXzDkgP1HlpU61CmzamYtBGtQ/JGLiv6ZJEQFeB/AR25euqWLyjNwYJaJKORdsjUtonW94kFwK4MwOmm/rouAt8pmVtTEo68RY6jUlyXVz9oQlWkICoP/kMJLUzx8X19hByQMe4kOiztfSkgvj3dpVp7Ue78xGTJWXV8jAm28elffxU7QkA0xDggN7Wa8BxCd0LaKzH02eseR4i1OhDqLs1YPM18RRX6bBgzCWjBqqVZwzxNVSMLbst3hhoM6fXJnDtJI12GeCqo4HnsG9LLSJ6ZX6ipeuvaFgZ1xOZdWXfxsPIniZST4YgHXcyn+TPQ5omi0O1jZfRCOpdPOQLp7kSDPKvCNP04l+FbD6pPv57BiUPRECb3CaJxr50PZFOiSro90ahUFD2RN7YIzl1FK/52qecRegN2Zk9ZrK9DM6OLmd6FESgo0WOiWn6E5J4GltSv9yf/kxbeSxxFLJsVOzIWCaR4ynA0SSMSjkWOpB2nvGXjepoMhWsXKbFhIyxCWzjb2VBWBetxu6Bb5eWvRaPcXqCPyTjjzrkyJZ2IzejD6AIHt1kjyeAsNmX8+eg3GOZCD4OfYaSjrH8pSu3KX2ZxM4uzbkMSR696smN/rne7As/OW5fH24uX68Uk1pS2G8hNinr5GH0yvXUaNHRVmph8REgvTJCHJKsalsiKr4pWgRQizu3GD9dk56yEXGJQ8eabPt9r4dI44J9gGpLYugPMSztasUa/nUUDD0+aWwRx9sHiCgSAE6mEzjMTg8SevIAo26ljtqYsbVuQ8eYaWSEbQHjmwD0HcD3yLQxVJMWf0u8ligA3LiGvzCWUNBXWyRaSsI+8Sp5RdNNKe3KMxecjvMXiKYteasi4+ur4ycHKaVZP4ZGsGcg0dVEgQOVm4v4KVWSLKWO/oyAjhPSvQGabdJkOrwA+CpuNidMIyX8RLF7KjSkSVmCUQbQ34TrZ7IlqONbVUf68SaTqGUH29TSyA/ryNG3PtPAP/3EUIpCgfqObfO+0FhMyvrxW6yP1ErRxRaHq4xoX6nClia6ygDXLZW1cScLSe5kAnBS+KU0jVRXK5cSsXOWYUPeyGSaWRwKbwMMnyF0O64Ijqm8MtFayVu8MfBmbl6fwOk13SSc0BSJjlBNVuKPbFYlwTRocdLL5NeTpQBmRS6QIOo5fwAqMAWZL27BUn6zEDRPM1SBj9aplFiSUByKcVi/su98piL3ScpAgcilRIg3YekIWsWHMfqzNRLxRtidxE+elL10U5aPpJORpMc30IUlPsWu8NPNY07xqUwiGcHZ4rLil+DNsKjWR1oau6r5jR2tZ+h2uKUTHYGtHyK1gUipguXh3unBBE7oDMHPb2NoECqKzFBCiccxlngjgxCwljFZMcUyFXYTwwvCAMqVHsa6egxf2Za9Fk/j1jX8Mfp0BKscaYeOJxPOy2gEEgxSUEeUfNO3bMdET4kJwB+xKz1JXszkY2xFUz44DD6jkBAdhBRYScWrN2bwUZ5xljWD0OWzuI87WRIHksmeKGLf1k5SVXuuDbks6lpfH/WaPkzlCSU30SVwrtf2KVQA9ZsFpGnllB2WZ88qPOGjDo/ltFSy//RkkrJn9smituHanuW9HWOPI9N69I9Fk63UtikG9q1MKFvWX4AnjqZwejBVAmXoerTQKYbQdawq6lqXUOcZDhfq4lXYMyGLSU+u7JFpI3ds0eJvidcSJZwcTuCJ0wkcH6nRV1ttPUGX1T5PovSTHXpkpzMFO+Jx1wyqUPDJdAAJNJu0/EkTVN7SSrKZoNsXEQooAIVLvNIPkaBd9oMb+1dS6T/Ref4rEvkxikh3ctm+uvySaCjk24h5nsZ0ALqEH1IfYdzso3YGkj6lbkpfFbM42VXQZbanZFHB+Smxqd46ED4m13EYPWVMP+9f2lDG7sunbzeHEi2B7l8ACooppaT9PnE4hdODAYuNhGZ5bTsboR4CQBZHQjGiInE9tM8Quh11C3ah1hgwwBsDb4Zr8NSNKdy4lkavnsh8RM6q/D2DCMqgHp2E5Mpe4+Z0ZdMWQd8DcDbRnpooioPTlqCv4St/SEt1xPhTXFk4xnfyUPSuFgm0l44wk/9SVkvgOKxI+sJTqU+QYRRcAhSq2VO5inxIISVgtkOy2mQ648oTq7XtwhTh9KptLhsf2oCJiTdM7KwTit8oJl0A9ViptkN1E710fSfRCgExz8eoP9X9Ix+7Nokh8OU2ZVI50G7QtrUzmQA8cTiBU3UPwc9zbSTVqwZtp2EoA8UbSnoaLRsjkZppI7QXhE1RaYxiI42ojBct2iO0eCU8fWsKT9xQp5zkLNI1aotsdEmaDEKiBCpsTqi8KVVRzJMtssxMoY0kZRZZTXsErxKebxcyp2Mp7/OMxfg5CgxNK9Cnr68oJD3v1yCjkx2yiwnRiqWEkvwizZ0Z8L6uG+9J/Jpl6+J96rr4sI0rxdT3FAKAWsRysF2zyVtNnSzLiw73Vd5eSQP/T1SbihzbChSjQ2CZjKhtlPR8HwlDfxiUaAAA16YBrk8DTAt+1sewLZNjhsWdUEmhRFNwU9eAVP307sVGC8LYZFvGQOWraOk5niu2wn7m5hSevJ7epw40jmXCUxl0mf+ZfuZ3ICXldKSJgtqmqNmisSvX+J3/pKSIASgBFhKM09dxRM03SNe0gRcsqY8Vl4Sh/AT241FIAkLja98Sj7+e7fxoH8qXp+lYuD66mRKN/TGdfPPSx9e2lZ72xX68DyrKPoP9Gb7UVQuqTZE8X/yRHa0T3PcMrDm1tOuY2S6QvSQidO0bWM6UrU0wYxQ3WbQSydpRcSiXcPNgAtcP+lIa5y5VjSpUa4xGj/1Uk34E+VeAotdEahhsvVby7ENHSFURy9jOApRDe3nm1hRu3ZjmIbV6NoAs29nkdUeVcs/AQ00aqLnTByJy+YQF0wBPutq3s+kclNwBcFwhi1mSogmKd9TRM+2wFMcbFC8RKH5FFrqETJYUncFVKrajIeYkhtiQgPUHX6aLnpFVJWie61sW4NQvCw8AjZEUCF7iSfdgdPsYP46v3TFKNOAjc7PReFE6xbbCShjDRqf6SXvGphqr6hEka08pqC5gPHE0hZsH5i1GAFDIYV7AEfrvI6zLI2R+WnHkaHrIzRkk21aoviA0jFlUBAcqU8NGjeAwZKuEJ0+n8NRpgOkUBzt/x0BsSUP7MtJ4WCcKQV/DZx3Wo/2oeQXoewYYjrogpPTQDp2hMNn7rNAqrhM4IXlBLpM9+8SSy/IFvwisjR+qeG05vWE2qelLJUWDCDrqtkj9hz8+lJKeHLFyvhO/uMOLvn5qiB3ocHxEyaw68+B3EzEvQLq8wwRthYSFrM5YtB30774gxzxqNyQp26qEcryPBTYjdkybqFDJNsqp+2ZyyZLaW/nhxQXLet+Cayt6yuczR1O41XmGMB6hmU9aPJsRGIXKATToZQxKDwpY7Kr1quhffVtIenlHOJuumIkrxAgwDQDPP3kAT96wTSMTOBGcbS5wook4AbRIYWDwFMw5arBrgtwoZv/oB3xVI9FLTaxmmqmG8hfkH/OoQHblSNm1A5uw+irBaUEjh/cDDJ/oyRDXnT5MPSgubQKdJgIVeQNg8/6sTvvWm6qSl3cdKPWi5kFxFa/cTiEa95eo5b7RlqTgtB+wLQItDiJFlWL/srkFUtqDjEkbyZVT1+6sZ7ZkMWghLa8UfVfbPdWYzifC9QUlsmePpvDEYX9KG3fZKP0fRKdYHdiiLeg81pZU5gYFBxaEdvJsMAUdEVThhkCXv/EoRfj8kwfw9A17H0HvFyMJeFGWj+pEJqQRJ5NOw9NUfk02eIZ6GSLIjFb29KTzPj3NxZCSg6IbGh3Dlo68PUGF7cu2PWiHkpsNiKvvMgmzWVWztDqZs6oq8Ym+OnKnMtaR06yORcwgj98iGtRvCIhvtoN14HjQh9p0Ihe/+A1kvNHLSm5zSDbT5Sjxqfz5uiRzEinKkE22zXraHguxHFsR60FTkqKJQ/lQZowvlJWWwDJ9Ie3WdAKHZETrQymXeQFH2E6+yZzkqPrp0FUoSbNpw3Nt6VFeEAqCZXQL1qFMbKcTEJvYev7JKTx9E580CvKPIPvc2uWjcJn4AMUlBAe5uyJd9MNAG2kypHIuW4CTIfd9CGl0maN45vFuK/48UxhkZqnMaZAvxrFYTZ73gyPKXqj4lx2qJwD5Uz3kdLOmV3zvWcuhWHlMsE2W981W3FyCLslDWm5kz/hRSr5tiVzdtAzvGBOqYOXzNvAohIJwwT91NIGb2W+Z9KNU54TEzNOK5mVMhRavhvZlKoB623ZDdyQd1GwflUpsernIa+SN5SRc0YtrtuY9+8QUnr01hem08D4gSRJqIKjOxj1cJCKoX1bjDfBTf8cgSJm0Zd/XT92jCCA3/4DK6Ro7ZxY3M10crC1WtD0PFR+bVxSyS0T+UHXk+qRwki8rp3gUa2ora1/XBVS7MBzbxJ3ZCEHi4+TK7chH2L45GVqHywAgi3cQIXtN335zWVlm/777FE02VcYTE75JTCNF2xIluq5Pyil21yckI7EZxyTDPgH1eaHJZMxZir5xzgc4TGJFHUNyq6Fpz50cwNNHB9kc3w18JAV0iPQJlWpeR79kKX+uuSCUDG0XrWq1eNvB9aMJvPTMITxxnb6PEIL7pnGQBMfQR7AYoeW3ELnbefYAAICaiFRGeLtUNq5YhojGTJqAWNa7pqCg7Vj/Qf4puSLUzOYyQKaD7cD09FRW8CERWF7aUBhJ2sTIZzokgmRimnq4dlXOTTUUL/nXXN1Wrv4mYGPAsIJKrIZpgmAW96JXAteOqV2BaPr7B0wTC749NZn1JHPbMxAbBdNVG2cytmxHHCOdX0xDgOeOpvCke2WFt1lKWzqX+ebyec7XY/cwLa3228jbfAhJuroglBpvHDpCUiK+8TVavBLGy3sKwEvPHMBzT6jHT7mV1cbfM0gTgTdX1tA0x49EC5pHG0+8pKcY5E8GtPfpac4vm8o3O8G9YdEzRFc0dhwd9+QDE6aqDzH8ZbEg8jkNC3n7Iwlvgossbcke+pakqo9qGeKD1Pl+gfjhs4nkWDVj+lQ2DY/2pVChGWie0pnIWQORpW3VGY8bv+xH+2M2v01V+Mq99stlltH1TXGQrPIjvpihbSq+yBHz9GACTx9O4biazSog+5qg62VRYjCtxGNoXiHRQCUBFcENhRhSC1B3WUPehK26GVQEh6IEqOs24DXypO8kXNGLe3seLz1zAF95curaM7oWxnI0l0KIXgqv4jQj656kgc/m1HBwm0OpOeqjPbfD7uWMgvgVEzKxVTlLGmITW433azaTUkxCBT9M12YUGf1FtRh4l+yH3oya+VN2cj1Ns18xZ3lsC9tHXI3ABaazjvJpYsjsOnlvV/ohQohYP3vtnmkJmR3yReLpHEQrCdh2PiZ9XTSiH1q5utOhJ9wA4NnjKTypni7yc30syvVKaF36NrwBO4hhoXKuG9ZjBH9g0EC+IOwIeaXWwVB1toev3DqAF586tC+6I3BNEpmnGKeTSnbSUDS89u9nRJq2EYsA+no64BlK1qreb2EUYIz4v4oAwrfP/6ejRP6ORhGOV3wHkm8XaQP+ZIF0VO9VACp15g91b8XwlYxtRWRwsuV9jcA0T9e2ZQHgT3cfQtkWFc1QMSRXMroSnWXcBkYP1OVHFDCXI2lfUUyBRVOM2i4zgM7Akm+vyxBvStaEQ+XAR+xcJ3GV2jZAgJdODuDZk8NkQEH7HQMdj0aZXKbuHuv5pSYtbqMXhL7E3hGoEulecTswXt5TEJMQ4VvPHcALTx0QRZ9OpoFvygIyqmmuSfDyhKXUoY9crV+MKTOeditucLIFSTJIt3bQtvdrYwgip6AXA0k29tKPXJZhMdlDTSyndk320kdQfpK+PqNJEH++vwNutm91nErO7ZOqqQ3+/gJRjN0EMc8GVAz6W8lJgfn8Izgsa03UwLKTCUYpG18S43Gk/fIBeMEwklL/iRidgfHCwLYKJgilmz85LCudGQAAHE8AXjw+gCcHfhSHUZrvtfwT+MyywMvRSqVarxAAVAIDGPAJyDeDZRx8vizWohrbJcFX11cik3BFL+7tebD9b3zlCF54ko485J4BUDK3ozjwP0tGPS1Em09wxqS2QbNZEh8JmaefvI6H49X9aFq6kGDMeh+uXEoiTEt10H55Uw2gBCgUY9PbQyJ+DyTJpn1jQ+YPL4jaFzLZlYTDUr6PAPvD1tkuBH5h4E+QcDEOTde+Avu3zWLBcSqZTJ9Fqcz7IPdMbL0lXqJpH+lT1V3sKgITXTxslEwkP76OSkB2uRwAQgjwzPEBfRmNlRB+zldh1TJwfB55DgIxVuYlmDpuDZsaRV27IHTbqwhWGqJ/lW1hXb11EeDFJ6fw1acncMgnCURPodgjIWgMoH6ktkpH8LgfgNs4XTZIwmrf85qgClAfoR779Wc+zKM959+0g8TvkY8RrBnXi/y6s5+svgRMDKqs6BpyBcfVL/3SmVam3TxU4eGWnHAcWYhEMHGyAQBVb0X2sZukrf7o0g//saKU1E1gNuvjFH+UYHWcxXAdHb25kAOk8eN5BbT4OU8fpkT42vUD+Mrx8A/ibAI/ltpwwhXdwHYDl9qoLTI5OeuNgkwdxTOExxW1RqthSPzoIMB3XzhUl41sW/M01vcMxKTql9TxClJOQZhwgqbQFXieyTKIXDZkstQN9dPU1B6IyurajLmfwRmE342Eer46ULh8k6LH//5mZqqLolOCA/n9hKRn2gcKbUrQoRs/3E2F+vnFy9clxarAZaEnuyaxKj3sQkyiSMhCyRJ+guozXuE4rtRN6nXYKIPt6dpPDSVdNU7vPGblk2I3wgIiFGS1qPEjfKm0NUuX3nBfx56kTqYT+MbxITwjj5tmgQFUqRat3BGjeyWKZhYxLMEI/K9fpRO50R4XoxaEVqMldLhVIq2zhz5/bXgTQ9F5n995/hheeuaAFNN7+HlLN0vtiKlGHoBmA0voywUqUWUGyI+W9UK6cuJHsbRf5kl9/Ixk2PqinLuZbatjIWWa9AHy9mK28NQmWSjJ6V1nXtWPP1Ty9TD+iJTyU+ZrqOQXFaTpAu+oN4wy3VckfSgghf8HUN/xAjBPCyW9KF+IqyU1r8O96+kIfIIOae7eVsmuIljJxOf4tUPba6pN+CEBiPDs0RSeOvJnBzbaEnxOyFG2ge1X5iGy2jfKCab+dbE1Mc5otiAMN9bFwlfFJ+xMwiushWTkq08fwDeePYATftpIzyxu6wD2MUoN1R+Ry54nMrRj6DpzkBr7ZJr3qeKQ1mIb5v6FqlMB7EfK8k/RdKxCdHpS5rMpf93dguOTBEuyEqb2GZSDil9udwohJVNVFnlRVnz+rgHJ4GZ1TKie5rpQ+0F6OiMQP0lE+Ux1MluSBGVNbkB7O6xXshVIUOqnTZP1pI9G5NKVyJAct6zyJzFYs4agdURPyQbAG+TfuHYIz9HlotKBZZYqasiCqEPHPgwddUKewxD81t2KWhuD8qpBG8LZgrCHxTQAfP/FI/jaM3zZyB/nMHDUpmTm2GD7AfnalrPJsnQEXzJXhYsjO3LNrpsr3zVHwVaKJ7aJOtNNfvS9AeYgvaDnywUaJ4kE1U6+TgxR0JeriMX72mgpDnU3XxJgQcc3OUP7wX2VYL1LRQiky/UubmzT6KXFr6bP9hlCkwrWZLHNs0eYRa3QB4Rq+2QjhD7Ve7+AXmb39euH8OTUnyEwKg62AI69ltgh4/XHott5hNoaYE/Wyc4XhHUb5irhO88fwje/cgATOlKUa/mgq2QnBE+VxLHX0Hlw643P/0Uq0OjjSzQ8EMWKbVKRGWjmIP+UMW+bfSuegV8MAOSQTEwqG9XYTDAoz0fsiV+GbhNBIdNkJPGZGBy5F2UwPdniWmatkGRkMcaN9wM/IAB0E1dfCSR9HmK8nwRKP2ij5PlLSMog+tNxyC7FSHLyD/0wUegqFvzUdUEhsUV8IH6SUfs+Ds+X/sBYtJ0XjqbwrHwZTVvXqNE3h27fPvhWaEOkw1rORiJ1QloQun1WBBur5eao+NwAY8J99uYBfO+FQ3hafms5TRYBz0hdtLPSK6gi357GfYvo+ATfJK7sr+26x2wIfKScaMGI+FgIlTMhvuShKMqGDZByRUrExiffO2Bhu+urDuTbpCY3ifI5xe1KSdkJsR8mRc+nSyS+i6t++KxMzs6UYdot1U3ikM1LZALJnl4o+JNssBVjzccv3an/+09/X8vyQyTniqaRrpKow6XAFIWYzuoOAsC3T4/g+SO+t9eCjX1bCLZabRi5XiWESFPdd42dnyE8TmidAv7mS8fwreeOip1S0sIE4jpSlwPgkJdZy7NRzVzWgfxbwcYnyZgzEJUBjG6ANJKD/EtwxWLZxWZogMlSMhDxsWrab7br7FIi9Xx17wTNqevkhp7HBXJt3AbAbUPmpBu0PW2T9zn9Gb7Ip6NyXpyYJosQ+Sjta5slGjJsVTQC6Zmq6n2XcA2PfaGgqTPTknxeH2s4fXp+YF8sonnCtPcnAAC+cu0Avnp8ANemlL60vyIGBQAG5n+NZ/qjG76RmFaGkS6pbhFfmAWh1mEam7TjN589gu88N4VrR/1WbER5fBEgfxRzCDQgcL6oWJDgirqsZp4BpzXXQF7WjXzPziHpEgKAehusO/JDoRycYYinE0eCpqD91IapXin0JIPmlX6o1D8kphGRM64E20TsR/kTwfSR1UmHVFkAdNOYTfMKeryfeDaZF+PRqiTkTWsk2ZyetRg5RHosWGN6MjgNAb55cggvHOM9vZJGD4bTRb9lX9d+1Fq8DCM9TrUJnTu7F4SehNsFVYld319YL+RyHNNJhN/+xgl887n0zWUWDVnnpGSkH0tN4RDfTAag42H9/HX+eKcus2UDdR/C+0O+06FJbr/57NogQOaN748YSDtwfWJ2ZiP+2af35aD7kHeD/FOfzG+YQ1Y6Yjf2itBnKPbSCCdSqbOKR+ySgF2YHVQitr+PoERqCwD5kM0ttoEmONtlGu9w/MLjcgA5gEAa16h8xqaLBkRAGyk2Kqr9ZF/kjfk0CG4eTOBbJ4fw9GG6mRzkXwsDAgNsi1zY99k4pJr2wEiOUx1E94LQh+1F1rcAOX/bc2/Aye+7zx3B954/huND//yEchxodNAwTpcOFAJyo0oysnDwzCdqEHkED7qUdBKPKJ4AoO2LHy+hVXO/AH7EWwOZOWUL1D0C024R/2lfnDwYaaKRZig5Q8HEwnb04SO4DRTX2+Nysb72/gb7DEokiGrhnoGTFz0fg4FlcpvgUMGHFXizglY1tWUi42caoyKuhyHpKlYyzVVz8UskxkiBxgSsDIAfI0LEMfTN6wfwwkn+ZFEAKB6k2DSSOd46zFlnhhYPyg1ZQSbZpzYAfVM5a7yrh75FYne4cTKB3/mGfgTV9ox5q6YG04WnCXYyaJTGcqT9oO05c9oX2uAJj0QThkhoeQV1RK/tVn0DSHB8hJyyEKWdwlmD+XT0YnLRZedXCDomX/ZtqEQ8RSdSpJC+kmI685iAZdrx/r2eogfA5OLPLqRNs4106ZfYzGudwMVPjOKntQigxw43RNYYKGXELFtkCqqqrOrLQQQQg9cPJvD902N48bj0ZtM0ttoYFBiFUk7SdayhpJfAFbco6RjJshrAiNy+5TOE7aJSt43R2zgWGM0PXjiG7z1/DEeHatSXkD1LqPbNkSNvZdQ4NbqHnpyiZeLCAttrVcmCNVqR8FFrfuzm8wq45uR9q+etpLZLT1XZdg/yT5UVpOwY+aRWtkuBVn1gidUC2Za4tJ60QSImPVqY9BlBSJtzKrr8Wdq0DNZPXQbL+KDaO/WDFa8qlmFkit/5F38hAHzz5ABeOJoWRlNCj9teqU2A46ceZx9cZzRgJPvVMmxnQahk2F3fI9gmSqtvCU+eTuB3v3UMX3s6HaWgZklfXahh+wHSldjA/1K5dM2d2ZHLnk8oR6DOXCQL42eEQH2nL10RbFgKXCPMXiWfiZouYsgFHG2MfJRsyE3oUlwFJBslAUdT2R711GUrfXRLGTrVIf0vwq6+bK6qITwnxN2ESV8vnhyg6kcq63sJybi9z6H3rU+8J2J6Qst7ccB6GnuZDMfMi6jtIekClgH8RLKxAgECXD+Ywg9vnsCLJ+ZNk0WIbQdLLgv15oFe1GIZB9+ydRjJfjUBLgjdSt2CW8Swz2134hB++NUj+I0XDuHowF+1xSRmwYkN68EJyPMzlDpTlWWgiaq3qaHOSHgB4C1lGwT5NRZCUDZZHst4j8SJAij7XPIxVUAG8MP7cXEKcj/B5GZ3M1SpB7Jt4vPCAFRvN8GVEdwlG4F5BUPMc1XBombw5RXVjorN3cb1NJtpK7ng46zTfkB5D01JbN5RbVXoVu0nKZsOsTAKPDYVOwB889oBvHh8YMdAA4UqZYjmSYoSLN/nmSFtRgj0+pMeNHOZaShBScX2QdqC2i9tvWE+9sibsYRcqpTInjqdwu9/+xjvJVBDpvcKuYFPs5atBKJlVo2OnxJIE5Gh6/q0k+5phDRotHwJnqdsFn1qmpT1yMt1eLJKSKxrfGOFTSrP+KlR8Bq2b3ul40JC35hocd8YN0h6qh+9uErMmiZh8b4Oi+kA6ZIQl1kA+AmiZCfzraFkkl+rxHs63iRCZxkSVxJO9phIdI43gNFVIsZODpQQ2/rMBgBOpxP40ekxfJUeNe1Fs50ESqhLfn24btgApkWbkCb1jAq6FgS/Mm4fveH2Y6chxwg//Oox/OaLx3ByiLEH+UeOpUoqEEk++pu5ZZT4pSrZBStWpbKJXILiZ/5d2bMtOI4US+kotAYtGoqxMAGXCyyiv+EjSORj3kqyWR7L6qvqoy8j+UlO+/7MSeDqlu3xm0lLtkmyZ/M6uFOJCYDqFlSf2RvAGhxbFaUhSMCFWwoqHj+OEZMA8K1rB/Bi528e+FwV+KpoE6VWG8JY+YSwjruiAhsiXklEQUv7jdG1IGwNyrPvuI0x0BibITd+62QCP/7uCXz7K4c46Iiep0LeT8kEdHoJ9K1iBu3GCPJYKt5XSFaT7XIbol11bO1eDOav1Jbs5f3DX7LiEvpgu1wXBO0E9A0QxF52j0TB1o4+9ZiRMsvgbzTQskDtKtGYOicoCtkyYSt/upw85vAXpEoyoOnODycI7CViqA9eGFiF1YWuNobIqDLviKzRS2chpra8OLG+LmXGVbm0FcT4U9vXy9atgyn86OYJvFB8sqgPul3a6BbcGGFUXD2oNHInWHuLC8L6wXjkyaiE9fyVTPf5y/H9F47gt752AtePJy4edZOSyiV+GhCc/JRMwKmRivYRRFt9XDgSifxp+55vAyCmLhsFxfNpFveD0fZ8uleh4YrVss/EYprsunsivp18NUGOfJVh3wyC6M4ManaZz0xfGYJvUl9pKhp1F5t2wWWhFxYFrAN9spDhM1I90R63b3KQ/Kv+zfw1EGI6o6UDg/wyforjYBLgu6eH8GL2mwdQvJTbiqDWJTm6BRvotxFMn/Xr1cG9tJ6tLS4Iu8W6SXuXuHY4gT/67gn86KUjmE7VqAu8X5q1+JlNBMfP+rRoh0cTbvj+ojwrSMu1bHJZf2YyaDvSp1H2R/7ehkmsvJfOgJKsKujY2LiWVWVdx2ocBlWGqxs/vYMs05Z6t2IuS0RUFh0uE8FUX8myvOleZtAmu6p7+Jq+2BIB9sI6yrgKwsSv9z0kSC6UwIu140vgxCH2s0dT+OHpETyrvpW8CVy1qxibasblpnIErtm3hEJbD+CxWRB2j3ENx/jec0fwh988hmfoTajJikqALQz12RDf+FBPE+0KZvAnX8MebUVwr3Bz3deHy74NXJknUylhc9n4KvBtmX3jxrrZxHX9UzuLy/SYLrHb+0q8zyRJZuyvYIshOo1Pcy3f0AfGjwRRIHehYV+Rj6YBfnD9CF4q3kju9+ZR6oMyugW3ito42QwDAwbSoiYLwvAi1zbYxnjd8Rp1rGureFpaaKjf/eY1+N1vnOArLchZOoom8K4/YleIRLMesNSYRhDli0n2SaD05JMRF1rZHtW6oJOeWiJNHr3ajxrReT0SRb5noLiIPFEln9QWGT9fWFKr0X8WEId0+cIHwL6kzPcocnifGsYsFZRJgBCwtwqmdXOCvgTmZLGp9RlMejwVfahPr0zIk48oiC5TRYLpha6SL2S6oQHahrJrQLQJBPjGySH84PQYbvAbTbcIXedsOpu4QnbM7M8GStXQ8PIaLZ6aRheKzVu7UqlWZbeJkp8CaQMM98rzN6fwR989gW89ewAT6cVKwqlggF2B1oqm3LRXnKWuXDRQ9+fpwU08yRCVMsqHZNM8EYP3ILKjbykmHcN28ubegrPnJ2Aqc33qT90UQbImTEGqJ/LcPRaVSOV3FBJLbXQjmPYnYWL8mU+Jh+0pmyZxJ14EnEtBG9WaqvtthAqm6BR8m9O/GwcBfu/mCXyteHawHnxOGNWXvk4XCD8ud43NF4SdorMlOsV2iR+9eAS//80TuHVtYt5pFAH3Y3atXO1z2R+1exk1pfBpndohWIKbB5m8tZfosnGZdrg+KUvYMwptz6BSzs5iTByF+tXKvK83Laf3h9o58D/afByCrHUFkoCUnpg1FDXjXdySCFiM9v1ipuHPBHQJVSr1Yd8qA3HRItXZLxQmdkUWiAL6Fxnl93AS4Aenx/DSyfpPFZUOEkvI69ZCSbhEa2CkuMa4WNcHHlI00Nu4Y2BtDgSwRZSqsn79bNzHBwF+/O0T+J2vHcHxwcA66yeRn0ier8HlKP8snLxX3wz64knEzY9U79DVz5dlt1CVCrEJ7z4jZCYzAoHqJ5sDJWZVbJ5x+Hojku1AxUyMCkhPj2SyHPpV/ojgXaUy18VLDCAqZx4cfA2iYtsza9kY4aWTA/itG8fwtJ9DhXlavKQ7sl5ZPzXRLbgTjIt1PQxkrl50RNkh0o+tGtsavvH0Ifzd71+Hbz17kJ7acINeHzmX0g0PcuFFKqlJJWcg+reWORvw5W+SZ9t8BiBl+jTTSo6c9X+SCCig75Hg9ye0JfyXKBrGGoL9yRkUcehTHpgc6G7tT9fPn5Ghr9I9Er6joW1xI3dC9U+m5ssmYqpjRk+gphc7XNYLAd9FETHe8UlEFVrJRRYXIdj9Mp/7T9ENVFAF3Dqcwu/dvAbf6Hhf0bbRaguLevwXgUivAV8nhOFXdWxtQdiD8dsvncCPv30CT12fVCc4NDka+skTTle6U5MVSWm+z93g8WyLpJ8dfUWbLn08wmk76EZK0QWs4SM7wIzyzyCZrvj3vn25E3K8QPoBIDvDMP1Gkxnl1CftJ6JoDIRGdfOXzwAST33kMhVi4ym3CBGi/i6CwmEA+MHpMXzj5HD4ssWO0L8ogO2cSwD3/7bD2NKCkHfwlxVH0wB/9J3r8De/eQInh6p5feeVyoQoZXvc54/IhVXaV2XRUEfkBhKLEqDZoXUzPZrkAh+Ll/dlgq7RWiPJ2fVnYRKLj08TaJf9m3sqzPfxl8rdWYXbmLxksbmyJH7HI5jwpPtc/VyxXFCo0RkZn53QmaTm63iSGAC/nuL6Efz26RE85S8VXTC6uw+g1AAXjsAx+/auQgvnSpfb+l9IRHjh1gH8ve9fhx999RgOpjyTFXS5xPM0QeGa/abw5lyZB1uWHHWhZaPFK5UvAuIzP6PKmteXa7QaqrKRtqpAG4NqbL/Vdx0YIV/xqODo1PzPHB3A72/5qaJNwGdefQjjGmlD1B8moCjWCoeV3C+mlVALYDRqY2QtbNXYTvDDF47h733/Grz0dHoUVY4+tSBdy0iTiUupY+33DNKdR34HUunSYPEIFzlIr+hAkkAfwq2MNL4mT8j23T0NEWDbfC1HmUZ59OftmToVkUskCsdKF6QKZ0Fem8PTvr0M6+Hm7gyzsGs6fClGKFkDqFELzd/EOvIyBjw0JdpLcOKnUlmBoweAa9MAv3N6BN8YeqqokIfKF8XyyNdFwWUDutMvDxIF74wMabLF9rvyKHXw1ha8An73a8fwt791DW6d5F+cElTd6xSky6iAnIpVbdMPCt4vqnp/Gj6eNkTS18+UC2c8UiR/VGZ7Xrxtv4W++mT+BpCJZwSmqf4s9U+trFCPvs6pIjSaJPg4VMzZIpqMxIxvJY8mAX5wegS/eeMYTugA4Kqh3f+1xqqgJL4jmNbkQiM0xuAZwh7r4/RoCn/8/VP48bevw/Uj7A0zJnwHyeRRb/HUMgG8hXyMOXnmm7nuB4gaOTyJ9UwQmoYfYN4m0dr1pTMeQnamU7Bv6gCqUlKmnZYtQN/gzkAY2kcWP9vx9giZfKndFbIbrJUzqgjqbCUkveg2BJ99pLbwcRkfil6KUVCjg9ZLBkRc7KbxPA0BvnF8CL938xo8PdXvKmo5uRyEUZeQYKARLxZDXeqxXxB2jOdvTOG/+cF1+Jv0aovigZAu836UfxZuZHpTm8F/z6DgYCh+V/Ysizgo4ZFJe0J3GVNoMDTCUBlU1zjeqMShuleSutK3vY8lPSw0Xy8QiVsYPwBIHxNnBWXryW8WQcTVbhIAvnpyAP/FE9fgpaPSpaItBLcDjOpbgCtXj55o9gvC2ihPhxK+88wh/IMfnMIPXziGAzoY4skiUycwVd0zKH7PwN4D4Cj4nkGKSjiJJkeKaD8CfadB/PvvGbAi0+ynB9vWfI6VY8Myy4Tk29VH79do+j4Jl410sawL6QxBYivA+lf3cIiJdSIu/Y6Fsef7yn0yzNkS7+o6sg/iaz+4oaTwOTYygHTrQ8fi4wGwbSbxuXEBOl7dmR70zqWnjw7gb928Bt88OfISChUbHdjlZeDH+WyhB/sF4YLw2y8ewZ/85nX49rNHkN7XVXttGmRTVKa+H41uvGX2DEFdk/dzO/qUYNNDMVmMhj8DiT5AhL/E0UBBW6FiHyD5d+y6X+agApfkk5Jr0ufFQcn5L+350KhvtYzWj3QwgBs2Ei4Kxqto+RgBUtvaWIVlgD5ZjmKj7xFktlnZ8TUCANyYTuBv3jiBb187yvzlGJa4LPhpWENanMKVrg9jxIJQ6uI9xuBvfu0Y/sEPrsNLTx3CZAIAchTOk80pgBtDAWw/EE9PysjjjvWYqfzItVx/9Ont+QmfxZIjSxDGXn7Wwd9Kxn2lx/Gpz2qsRV+A/krjVvvgTx9XwVYRnhzwH+paC1k/8b6SMzJEMP1BiwCyAsSI9wtk44WJ203b0oh57BFcLC621FComNlkaLvSTxFOpgF++8Yx/OD6IZxMfMOVUPUwGr0JfAyKl38HsZbS9qC7sLCNWBAqWKOlt35Kt71xs1McTAL8+JvX4O/9xnV47uZBuelKNINBAYsB8SD/PLFSbvFU3+LRrD0C98kZSySfCIlvypwEPUWDKJTI5PIIHxU37Zdtp888elM27VDxSzJc1rzofOb+LdJxOF0bovpqXSWsdAimX6yOLXP/6Pp6D1iOmqUWNACAk8kEfvP6IfyNGyfwxAF+38CP/3JeCL5xLxi2rqUYx19GAgAIEMLkkuuWY/MFYY9RuH44gT/+znX4u989gadOJxCCumfAwy/gKCt/z4Amnz/qcxPc00DZ8VMbSzTx/Ph0fnQSLfn3viXh6fj4DAVLua4UvDN9yYsi72kHBdTylWRO3mYlpDZr6AT+Z6MoxYRwHH25iXYi2HbW20qdObCOnC2A5WmUqBFcf6VIaC8xvV0zVqlvjicBvn96BH9w6zo8zTfRWKTUdkV0C26GUoN0or8uHuHC6jfkab8gbAmlI4cabp1M4O//4Ab8V9+9Dk9cmxY7qHKsh3CTrmhAgEy05KevRsNfAZIiaMcerVoZDY5jEEH+SdkkcuJrS5ln3y5SbvhnltclpBZM7Vo70xBZd7RsZRSZHxhwfP5kX9qd0eeYqvHgtmIaMZAeYVUcH55izxVK4DiBFoPvXjuCP7hxAs+6xYDRP3W6BS8Nw2cLrbYbnMxbA3vymywI7Up8mdHqwPXx5MkE/sEPTuHvfu86PHGdFoVCH2TetYw6Oo5gr0trmTTOVMH7Epm0n9nzdPCXhIBmRKJpu6kutad7aK8UW6EseiombAcdA+04GxirpUn9HC3rA0YItoe8vQqtZE/TODbdRoZnjvzzjeVw0/+9oRzeF5b19xqwQhHJEmdmLgAcBYDvnh7Bj5+4Bs8ftV9L0Z9/ugW70O93HIYXhhZSO180vpBnCOt3xMXi6etT+G9/cAr/9W+cwpPXp3ncapb5CQ+QHwmCv2wA+oidj+xwG7IXieD5puwCzs6SfH2kXHv+3xNacL51wcTdPqL17SCSTkVaTdUBRZAQqX20PEibYcm0nfOZyvzffq5iempp5XxpaFu2xxM/l0t0LYPgCmtrvsER2tbxJMB3rx/Dj29eg+cP24sBo7/7uwUvCakF++tUQrjwuu5sQciSwx4G3D7PXJ/Cn/zGdfh737sGT1+fwGTCR2MJaXj5aYtl/m/TIG1pPiPk0gtJBxy1zNYeNHxaNfvko5Z4LRUHeYoe4fdt8iU0yrquyVb5TKT2KSU64yjVRl+XFwlsTqFHxWJkvmin1K4RKPm7m8Q2wUdcJKi8ilTmm/mF3vBlAG5D5FhfCU06E1RfnNBloh/fGj4z8OhPGziOrgKGcp2cLbTFGmDltQ10Y2cLwlVCcSJcIfCZwp98/xSevzGBKX1xyyclv1DoRI5lXdDwN24jCov8Gi1k7OmZrNNHCW1+4qA9lmY6J8tUqh8t63orSvr0ZzzGEO6XbSeipN9C21vVlKD1J/dpLBz5I1/5ECvKPy0CXofvE+h94BvN5kwjXzgAMBC9uDgWxZlu6vOZ0LXpBH7zxgn8F5XLRHnyzL1nIhm0zqDwaOQxbgeB68bbWthIeRBfigWhD4WBucOG93jiZAr/4DdO4R/+8BS+/vQRHE7JN/W/uZ6vw6J9jJ7fgaRlChczA05eD/+ESFZ9TeMkxP7ZqT8UMvHli5yOxcbdg5D1m7cNql5iX8pJWuJzZxUYny0nI9IY+KFiL9fXLgo2cksXHjnl7xmkfSXLZzQupNxOjlI8sh9AHd4SPTJdGQzIPZ1O4Eenx/CHN47TDeSK3yH4IduGrngba4azVUi0fhiNwtqKTewXhLEYN1JH4fRoCv/1d27AP/7RKXzv2UM4Oki+ZAAZgipyXNmIN2lBwIsdT3ItYaX9MSIfNWqwBPK0RPkI2/tQZRVLLkMUXkTUohRRwJR9vQxC6kuJMYAYiWBvjot9uSeQaslHy8RO8auC7GaXgdLRtabZz2SZj9qZx4Jy5B/5EdTEA31GIJ8qfmMqRcf/a787zv4CADx5dAC/d+ME/vDmSfZo6bpQa1EndpMkdwUTLRdGh7+WUhVXYEEoD7Ze7Or07rJwOA3wR1+/Bv/kt2/Aj144gmuHlLTUJI00GTVkGtP4kH39hIjMsOBTikCSgLYJ6ZUZ7FfORDj5BEiXPwKoMwVSUN2UYhNuOuKU31Mm74UzCka5BmXo+uq2c94UzdYN4yglbe4fT1ebbiOJP/Uoy2gPXj9p5Ynfb1rY0sg6L5jZhpLmLIl2xI5abCHgi+q+cnQIP755DX7/5gncSu9l2RrGT3Eee48HUrTU2EwYVY1RwlV09d4XLenuHmkKrovfef4E/nc/ugl/8LVrcON4UuiDVMYJqqa1yiARMHtIypN9BW9aEXBPCYRSmWus7ZK/kI60jVd9FKvK9j6Ju0ciUBNHg/04JZ9Q+VPI6uzK8o2UuXQCYpdfEMh9oO0SnTdimMVJ2+NP5ZJ3zVG/giw2nu629B2D+hE/iL8OfgA4CAFeOjmCP37iOvzO6Qmc4PtYtg96Kd54hMIgubrgaLOINSNjenQJVbHFHqwPoi878mTeh+89cwT/5LduwB9/5xSeOT2Aqbz/xd8s5cRbTqARCmOkdG3cjyVzRJt44iM7erdGUDdbfpRdSi8lP9q24kfAsxPtq1i/Es2XHS2Pk+wXj/ARpg19bbMjdHvErYFld2+Aeao9ilvlTMEn/oxPm+bhPi7iJTneO5lO4FvXjuDv3LoG3zo5LDbttrHmNEoD6jFCM+I09DuF+rHFBWGPbth52sSLNw7gH//gFP7xD2/Ad545guMDTvpqKstMqT3fn++bo1tDK5SxlD2Fk1dDnYkIRcHHJY4SJZJf48k7Mk+/4GZ09GUNU/aGkgUAHQ7btGdTOplHJS98+czbRvvRchpoH41y/6xU3fSWwcUWIV3W099A9p9aJ9HpSS7nKEKEEALcPJjCb52ewN954jq8dFz6PQOPYsRrgY8Fyg98DPkZnyDrGPLlMFKc0RUxC+ltUKC8jVwQ1qzV2nrbR+koY90j+F3Bx3PzeAJ//zun8L//rRvwOy+cwOkRnQ3IUTSfMSSa8JSpYi/QxMckZtOs/PfNo/yyLywRs/E9AxNDwS5HAsBHqUmj6Id/WU7FL/LeH1ENjbO8sZ3HWVtMgEwU2LbdSEDbTxu3e2p/VMGGjkCLk3oUdMWLBZ21SL/LY6jaYsGnujmdYuK+y89UIkQ4CAGePzqAH9+6Dn/rxjE8XblfkDzuDptN2Y2ULwXYMyPACn4bQLlHrwwuYmhtAhufT+RlWJ0xNfzRV47hv//RDfgvv3UKz51O4FD3nn/6xF2u8J/lweGJ+hKUyW5q30N7ZUpdPuekkYuJjfbpX6pH+gPgsyQfP0E50foI9iUiBlHiSOXSJ+97+4lvb9RGYmodJCEFj+pTwtYyGrwAyBfTlPyKFqqWDb3QoPfy6naNLhH93Seuw+9cP4Jru7pfMAJd062Kxni5whiR2zOYK7qlDQDCo4cL7P1QHAeCNCkKoVR49qjKPcbneQrMQ2ri6QSBwH2x5ULz9WG2pyMNbftB5hMHEodjr9PBtEWM9jZqVqcC/eE8wk8+PIN/89YjePXTOTyar9RTOmmiBKqP1IncCj+QVAAAwKSa+Hh5AHVQwdiCSAMsnbzzgKMPqaP2w/Q8Dt5nnyA+9EJrY6AysM3Uf/Kp5JLdgOmZblayLy6zXtkGW1BxiA0dC+tYI7gsWD8irOV1+lb2NK2FCCjjRxGXY8yf4Eq8VJ4GgCcPpvDd68fwm9cO4Sn1SKk9AEqWouZFy8sPmpBXowOA7XAAHBeuATBmGrMOmuTbI/FSpYt9kMWoMkPms1AnMTXQFhlNo1w/bG9VqMB0SQEhhC0tCMA94jtJGyQeB1XiES5vQSh1End9zXg5dkSNl9qitiBAZgsAIBjaG3fm8L++/hB+9vE5fH62hPkSJ3mg5AhA+2zSJCo99gJAwMGGiRLlAhoyOvmnkhE9UnB+uG3JbFWeCToWMItVriv2/AJleKoMJBu4b+mCiQSn4hT5pGfK8q8cE7gDDbOvdor7VPbQsgB2kptRw3yeOzTmouIhnz6ZEPA3DJ4/OoDfOz2Gb5wcZc98+QSp90LQqw3u5HMr6bR4psEAqK88jeZSJmvVdQ0y0SwHtOvL3Nynt8OkVn0B+UU6lG0qMDlLGQoi4xnKrlkQoGEwS2YeWbL2CY14uo0qNscuCMJzofm6MNvTGbUBtf0FAZCnrk0nSV9fDeRp+oP5Cv764xn8m7cewmufzuDRIl2s4OQWWJNM66NjIUvZHvmzHvLUgiGJV9miZkp2bQxez/DQpfjhMk5+HZ+yJTJJHwpnIrVPjEQtOkDxSUHT6SSM6lDiM3RciZ7X1SOvi92P/K/IY0ZKVCSh+FiW/ZAOMJgbAeAgADx1OIXvXDuCH1w7gqcODpREgk+Q6T/xJGBFM+jgVeilBQFoTPlpo01oVsm0pbmWdPWNGQ3pDMMbbAsoBaBA9a7whUwuXBMAKJkyD5ndCwJAKSErVHhZ0tdt5HkKUY6cEy/373jOjK+LZnse0tZZECDj1epVWhCYbiWx1LMgMN65O4d/9+4Z/PWHZ/DhgwXMlqkuXKXSZ1AEw68mXK1X12e+LeukzvF1xKmMBCknno4XRSv26J8pJ9NkIxnS8izL8iSZZLV/TXcyjLSvUpv2Q/sy8nQARDdwfIRfHKwe70faJgBwejCBF44O4HdPj+GrR4dqPlhLPjn6vRB2tyCUFwMwY0m7ZhO+LQqmXX3bdY4ZDekM4QmpwDPYcEHwFXSkLBwFmTMXtyAA8pVIxlOwSRL3cv9pf/cLAmQxbnaWQPQ1LhuV6QDLVYRffjaHf/XWQ3jl0xncOVvCYkXN7pNNIQlyGcDzvV4AkDMJNZiUjCnLZ370nV/Lz23iLslJ2dsWksiJD9ZX/pGu6q3sin3aZ1tGhv7XdJJMigN5mklTL4S0z5aVPWIMoyATIfI5lpTTPiLQ66qfOTqAH1w/hm8fH8B1umlsE2SCT456zybCxMvnlq5/TgcoNURtQSjbiirH+hlTMO30V2o/bwtTV0GhvkIq8ATEy+iMcm4CreIr6BAK95QYMt+2uyBAxs+So2JnPIW1FgRLIrotS9sV6okLAuRGAAbOEvLYEwZ4W7hs5HF3toKf3p7Bn7/7CN68M4d750tYqfCDTqSUqGk2qARHMankSuEmGyxLBD1etQ8u4yfbSxNb2yqWWZ8HrR5GLKsmvonZ+HZ68pliQhIyEz+PT/ZZtmSbi+zf84o2pTdEPoOzrxFDBIh0WUgF6s8V2P7hJMBTh1P4xvEhfP/kGJ42j65hW5bSyOCCIKQ0jiySTotnGhsAoLEg5HaSenTfbdE8QbYgsIavA5alrgaFerm2MDwB8TI6o1w/0Cq+gg6mWxw2WBAgCWtUeKUEWOUp2CSZeHl8yNvGgoCIuRGAgQUBXIxlOpR40u7ls4Ry4rc3l3Og7kcP5/CTj87hJx+cwbv3F/BgtoIl5wmd6EIAoOPIEDgme+0e95N1HoTpE+W4lbQPRqKF5r0ILKt7GlhMg1YZDZSMSUT51PdEmMJ2RJ38oZLEYWTT4iJq7M/70meYJd+0o9xnNB0blnVUtIfO0K+SRa6S5MD1OCKFwwBw62AKL50cwQ+vHcNzh/z0UNL3CTCng48MgPnR8vJk1sfLGmTNBQHIqp42mXh1QfCy6ppByYinD7YFJH6RB9X6gVax3WTAMjURtB3VggAAsMmTRhVeLQEWeQpjFwRgHReal9dsz0PELBakFugd8Xs6lHhbvGyUkBaNDx4s4C8/PoeffnQO79+fw4M5LQwoVk6o8plfFtHyMhh9YuUzgMweyqEe9bHYdcmXPr0PHy/bYDGhkWyaR/llp8TzNvKFQPhOh0kyqUQJx0wpXrOr+NHFxIwsCerXT0tLOpBKpH8h4BnBrekEXjg+hB9eO4YXjg4L2twv7NPya0kTY3dOCXky6+BV6FlbAGC7Z/LWhK5FtCdQyuVQnSPArhaEIh3KNhUqIRuYbnHQddveggDUyo5XTPq6rRo2U5JMvDw+zdv1ggA5rxJ/sd6EjDf6shEAdJ4laJkPHy7gJx+fw89un8P79xdwf7aCxcofgacyhQY+iTKdy/JJjFRO1QgmyZMcALY36fBED9q38+MXGf7wsSA9QKArIEkeE7avC9RsUMH70KPE1je1FY9HbUPLC1QMmmaKmUAuAzR6Dcj/UQCzEDx3eFBNfjYBeV6qDyLxI/OElHh5MtM+cjpAqdL1swMo2rImdE0kTCbSZ61NrO1VqqtBpb7GUUkPkF+kQ7N+oOtoQzZgmZKIrnO2IADUEmU7eQOwouVlyU99QI1PuEoLAgAMnCXksScM8KTdy2cJ5cTf4jHyRSMEgNuPlvCzT8/hpx+dwbv3FnB3toLZEuWCTrYUTChck+cyx4s0m6y1Dpdx7AU6g/D27FE5j9P8E3e8H/PJclLm+0MoJD61jqsP72hapuP2pX56YTV0ZZsQUFwZZEZO8rTstSJkCgBfTX1tMoFbBxN48fgAfnDtGJ49SL9iVkv4YGL048d4V/tUhZAvCHkiS3otXtZQGywIvpZaNALeP27VzfOwropEdIbI///bO7smyZLbPCO7Z3aXoiQqTF8wFIqwrf//c3QnhxS2aF/IopfkLsmdj+7ji0xkAngBJM6p6u6ZDT9kTXclXnwkTp7MrqqeWdMLZZsMG4wz8fxIutlJCqAcweUDgYg3IL8w70DowzKgXtFgE+gNsn+HtS3FjGVKsD5z+hCLRMucefRlYAbz+vNxWrYXetuIjEauqR8+PtM///4D/dN/fKT/+YdP9P2HJ/rzp2d6pkY0N1D8aXoMz/H1m0Jt/OWl9VZN/x0X3pj1y/rW+h+jyuGj7TMXf+WaZAz5ddbC4/2b9ZfcWr/GZqPnrzO7yMlfVG0jRq9bjMscwxFispDDL3cO2bsoxtWtzCIaucbaOVp/J+n9wwP98vGB/u7dA/3Dd+/pH7/7hv7u3aNaqnIT8Fi5td1ujPa71uyP3taHyjbTgN5r2Sw5DtoOD9tZWvlxyNoJPGy/+vWxPXTm5cTDWocNxpluR79Oa1AuAOUI5Dy+ugOBnJ962Xb2QCDPNt++cebRl4EZzOtfRLYxfvFtIwpt5NrtmjrG31r97Y+f6Z/+4wP99+8/0v/5yxP98PGJPjyNN8p4kxOXrs3NeYw11rHW/zBXpm/DZ7qPP6aG45k8/bl+NWF/a8n96vkL+8w3xbpfaj4kDhUbfzqI700sNU/Io29cqeOBbl+qdw+Nvnt4oL9+bPSfv3lH//jdN/T3376nb0VguUz6XKJ1w/WgPTsQ9CYo15ydQcEWjJ85EOSQnQnIx4Ewdeaespu/mu8cGTVC4igWE82Z8efHbC4l0dBEkhc+EAjssDHKflmbQG+QbIsPBGIfU56Vq8tobdsDgdBWnbcAbLP3/qsEnDNtbAz2S61XU/sPH5/oX/74kf7595/o3/74mb7/8EQ/fnqmj89Ez6O3jdXiUKARt81XFGvDZA1+bV1nbeOJ6zv+gAOK8wndrM28CiFq/ddq5auE8XXOTxiWTR4A47MI8XxURY0/Y5iO+nsVk4fEnDXmvWXx7WNr9O1Do79590C/evdAf//te/qv372nXz2u/6ASX165BOzmZlnp7Lqx1S17ny/+hI0+lNhUkdKwfJwO9euK43LIzlTJh1H2Rep1zt0HyqaWY/5B5PqQLMAaBv78SLrYCQpYE0n+/4EgvgdbciAQ8XKIEqCP3XBxnJbt9NtGFPRD0v2lxq6taL7ff3yif/3jR/qX33+i//1jPxz+/HTQXz4/09Pz8OBDQW7OI0HjsUbjraRuk/nZd8hWHPN5wtSquCOPtJ95pSAGZQy2S+2Scl29Z+qtI+Ek401kzPGNNnsnBX9z0ENr45VAo796aPS37x/pN9++p//2rfxH51afp6f5B0xrBwLa9Ka07HOFt7d5u4jcWDqEnA1Ih9H2Rc1rDuwOBB4fqm0/qNvdceY1DoRRuzoQiIgabpKSaIMjonBjjDY/Jou5Nki2eRvg8vMOhD6un88+2nHx1o0XKD8QCGzu3AeQ50XeNiK3Z+pmsXU4/Pjpmf7tT5/pX//4kX77wyf6/sMz/eXzQX95eqYPn5/nf8C9UQ/eRI7+dczL/BTPWvshM4ua+gm9fz9rb2tDHl1YMeeGvfxovnqh+ZlCl4utRh1ii17TitNvUuMzxV4+bZ/fKoN+3ojo3eMDfdOIvmuN/urdA/3q3SP95tt39F++e09/+2j/Y/arx2rUPRDi9SKvlx6XcZf9kLZD22wtVRs05oYDwc4EpENgD4SJmbdYWWqcUbUcpP7Gs1cnUXYgxPMjWZqdpCDqAzlzvu+BQDSctc3dFGXPPPtgHQhsw81N+kybKc+6zDbYcW6eMw+itRz0YF7/YmMTubWyP8N5M15PJOhv11c0XwkvnufjoN/99ET/44dP9Ns/faJ///MT/eHDE/3l6aAPz8/08Yno0/Mxf5aauRqpn97bHFupG+vFoNTy8/m0rbrWq5BlnPGkvj9Vufmn82lz/LwxGUtr15YhfQ7xnAcb9Tk8jn9Y7v1Do188PtAvHhr99bsH+k/vH+kfvn1Pv37/SN+k/x0Cnr9MsJbnwR+c9mdSMlmu2h4dBvzsrgcCjBNRciBgnI4qyRmfqL6MAQHb+ij/hpENHsxL9cOrNZszTTv6deawnaQAShXY9eAeCES4UTJXDoQ+bPxkz+zGKPAOBB7XmHFTgpVLs7TN5kXzmG2NEmD9i4Lt4ttGFNootKt1G9QvmTeGU/cfPj7R//rTJ/r3n57odz99pu8/PNOPn57pw9NBn54P+nwc9Pkg+vx80BP/h1z4B6M19fm8D40/NwcChT/5r5pZO0zTvr6uVxPKJsf6F+O34Dj9/71H8qBprf8Dco8Pjd61Ro+N6JuHRu/HZwG/eNd/RfTX7x/pN9+8o1+9e6RHWnPIGfmMFpZEa11rxwfdHY3RhjlXTftKPz+gLojmR6rWsW6j+ofbtJl+LJuMP53EmCTqVwfCOUA5gi/gQKBulxfM2gRs66Ntfmc3N+l3HPi2kZVLs7TN5gXzIOJlkSXw59CJbGP8Bd82IqNRN42tw0Euyor+z5+f6XcfPtP//fhEv//4TD98eqYfPz7Rnz8f9NPn/l/4omZCjLeUVJ2y1nk49AE5B/eeGWPT5B4K9nON8YrLascfsxSTj5+3RtT41cmI9zD+YzPfPD7Qd4+NfvnY6G8eH+lX7x/o1+/e0S8fH1SuzlgHNhEQ6+ySaK2Zj0ynu5gPrqNowzyk7dA2rKdmg8aGrw6o20CvQ9jZgPzEgTD/9ILYXpT6MexgY/z5Ma1BuUAr/oYR0YUDgSjfLL+WA4GEh7TN65lseC9zIJDqy/EKrxLsOsvmTKQXNNQdENfTl+Bz629BHfO/Ed3fs+yfSnBkkZc/JxDzwQXfYz0/Ez0f4/1bIegxTM3iqbXNNWj7Nb7KvrTh/9AaPdBBj0T0cPQDQbpnN3mHc+50FGpt6+XN710V2WU1ruJq2yHth7bbeqo2aLR3vcY4ubF0CDtXkCdvpdm5y2uOnTB67scQenWO5JB3cduBoC6Ng533Cx0IBHZ3A5m5HJtgbY5t2nGjWX7TZkJZl9kKMa6uZzBP922jZA7Z/MAmeqKVzvwUUV8k+FkDzndaxPdjxCzMpUetxOZc5H6MVbnxrCjCcT0D9EA9k8QWG8On+++1sc62qWvWoK1wrCAzamOjf2v4dtEcV8S1Tr/AdvVAsLMB6UzLBu1h567mPEfXn0p/rHFlUym8D5SlID4QgpIVbkqBXRPZJ1Svhm16zFVbTtDvcyRBogtKnk1MI5oR+BAlao3v28lsHtFNVKfmZ1Wt9b8VrdD3UPy4AZszDhdbbAyf7l/T+viHgRkbD/7+CtG9i/ninly3eXnOczaG1bf5qrUIN14+XMHrgwdC3v8vBntRJJntHvg/rUiyJtZsOIfMb4F+EoxhN45FaAiI9fuaYl/GU0DcWqgSbRw68sHkaWIL1OvS/e+vjdEz0+jYaP8SubEdlzmfVvSzmQcY7o+3bvBAGDhaQ7A4AsdbF9Z5D8SWtovZa96pXgCRMsruXczqBpHZz16nqj7L2Yl9mcNR7ePG8EbvPa5hq1tcj3kee8iv3HF9Z1GR7hfWZf8D2GtQm2QbDys/ff050AyonrwY4YFwO4UGCknWsMymMTkLJTDlFIO+SOGqiyfalm2ckQ3nXZnQTtPtMra3gZzZRKL6LTgfy5H6M1YlN/Izj7PYvJrYUs+F1ybG13rX8iraF+cX2TFnzYY3IeZcZDaffXg9YGsFuUHqG9H81eMUKEozY/aA49GGX/P/uVtDoYrJpQPBNur+ZFPIFtcis50nq6dOVhPYREqd/R7z7zGkxm4kpOyO0dCKh4jWRRziEbNX5MgslYdPbK3NlVSMuh613jVcpMaCfaGUdbdLZK8O7Pz72Pq+UpoXIwP1eRarviuNH+KAkOYLyf0DIZ+jIBAGlehmBr4J5z3QyZa2i4kLwJIlyKLXbLv8vr37+zYG83sbSmWTl1T1vFnmNdKIk8dixdnHbcRRavNiVoyaT9db7W3XDu3RvcrfRXZbV9UGN2YK1vuynMxn5A9t/Z2UxS5mbnfb1YZBPrboPP6BMCjFuxW1JvxFRhubJluAObkcc2Y/vURkNcEcRUqdPesN0zW+bWHtt20snSt6WwdyiMdbE9ewnwez5lKbP4XX9B7XTGLjW6b9fOgTRL9q2tnVaEsDuRVs7imQG6w+oonHq9DsAdEfrfHfjNGP9EDIqDVg18bz2Ii1OjTWxca07HOYCEqfRc9sA/GXZrS64LvVdLud3z02GK2v+/Ajpx7zvsR5a3UTxKj50Ateq51m2ZVyPsnmUrPBDZnWFNsgzAasKQf1cS25rdPcVw4LzGfYp0AJJwwSXz4QtgST0ZOEclO2DYo4keZsiuynmIhsHlF/fJ+dvZPZOIbV7DcaR2CI5lKhlTZYruNc7IX0rzyQWp3MinHFz+r312gHanbXbGe/F9l9ZftgsVWB3ApwQJDZroIxm3qgXQLzcahoiCBxciDkNQnKwhgRor7glg0XSGa7hVo9RPaKnPDzEJJM7c+1e/g2xtcc5p9NJtBk1XT0xrfXW+ob53HhcZ16XaTynfMj5adGnfJv6TM5OSSHtDvh0XeJMlt958o5GwZrWlibM12F0huxjVWlicdrEh8Ig4vzEezaubMj5z3Qyc5rFzO7sNlPMxE6ns4e2XhcqzNfpmt8GxNr7ObTLmzyWl/zkXBOr77Xpl6Dnmvdj/Gvib0eBP2tsNMtu6+8ZV4Z2WcH8T/j8NJgXr8rncw2gHgama+Zx61ka2V7IGRgkwyB3fXD2ly0b+Z0fcHm8iynoVwrAvMc7v5cKrHrGi/HPTYhmNN8nKO90cFQz6vnVfeT+NfiHtfB0+G10Uz7Mf9I0HPXCF+wXUOGsZVBCiswA7s+3M4u5s4+Dgb89zsn6lKd5AEaJrkS8Q5ULoodxYW3x7rYmJYsh/sX1TZU5qkQElSvkbjOyk9YPY6n229GjsDAmyPOfe9r8WPVkL7VRw19Hep+Ev8a7Pt/DZtHoqI6KTLf8+SvDu7FmZp3WVUsIz6Tp4oN2cTjHpReIdgikF3b0K6bhfb7YOKeSJPP+WqgE35Jj3g8i5YtxszW6ZE9Xb4p0aYqDW6Yh3icg2NVH/dH1309h9/7vO+OMWSnXXb+Dq+RN85kdpEbbHswnsbODORWgAOC4jyAzDaAeBrMV6OJx1VKB8KrodZLPK1zC7ST2c6wj1NYEIJoLiFDwn7aQz/za+0a3yaJdfnmRFDHjuZu0sfpOG+DrtOfSxW/53m/HWMIanfXbdrRdGeyBLHtbKttbyXWFme9yi7izj5IZHIKzXmsvyTX/4VW+7j5QLBNBHb2STLLwOaPbjBOtjxptrYd4cvdzU2X4d6w44vfex0/0/g2SayLfgPp2kbVYX+c8/lYL4+uC+s+w4plY9gek9I4xhPYXBIVeT7R80Uyu4gItk54/7jxNLd1IibLq2wvVYAgKeVuPNAu0ZhoqiEqdATtWbN34KYRkS3Sa/Q4tZyTpN7dXFy7kKEHjiAVDU1dtOG91IaF+Q7xeEt0DVjnGTCWsjpTvd7bnX7Z+Tvsfw07jz1Z7NiWpQEbhNED9bnWbGEPovFB6PdK3PwK4e6Iftcv0uJKQ61LLZPP+innXJRzc8WFhx6o8chsizzWfuNyBEXaF/GqgfPpPni9qLGPte/pGVCP/dRMO5qg1o4jnAgb+Hbba7w62MWRVGPWuVPEJExyycrc5UDYNrq8kHd2pOaxVK3Bf4A3JZ/aiUBkg53zdXs8QrAti+j6883o2ixHqs83MNpUVwM3Tq7pSmzpu3tovPnXWfFwPp28l44xBfVeTkap5xNdM7Kz58SHAdbOZGnABmFgQFCbi7Jl4crcJUhKZQ09xCZBSURnhBO36cUwuDl449fYlZDleKlXCa59fGGb9tLP/Jq7xrd5xPqX+FzBQ8dkjpOPc3BOzFtl5c3i2P5R8Ub2qeiXhr9z19llhH8w54yoT2fJ4lhbPOPYIm023iQaL3CD6ynmK4RKwoom5KJzZXH6oxajMk+z8jIbBBqEP/UU5rMo2scXfyHqGJnGt3ksveez39T4cRuc36thh/StPK6j55rF2vctR8f29TvNtKMpqL02N59rf+9AprEqKMEK3oRdEd1+vn+LG1wVd3nLiE5NBpuzW6QZkW9WT2Y7Qy3OLfNB0D7iizSYEUeQs4sy73W+uTFHsbY9zdnEs8fLo+e2y5v3yzEaWNu/+vo0v/skv8ZRnoWwg//ON8p5Hh1H541smDuw7adxPwq5IgnOx+duB8IiKukkai35F03ij24wTrZn0mxtGj97+NPPZj67+WYXl23oFSxoRdfEdsuR+kSbHD8WK87Xj54LzlXjvc1Gqp+O0WB7ucvZWXH5OxvnDGm+wBbeH8XcVhWkOYWNWUNfb5dovMANrg75DB9oKxkM0U3FlZ1LFV2gcOFOUovjzOeGm48g7/Cf16jbsqhx3d0rtnvEPtGGR0OP8+DH14auG+em2fWlEwgE2L+FrCHTkbSjKZiHniviBJpkto4f09w2OyANDAh287lKlnNxS84bXAH1CuHWwPVJYZPqvki02K/EtC6yUmvT4JyIsp+CcqI5xQzN+ML+2lM/i/vTdXJD2ZP7RJsfCR+cc+L0xaDrxHlodgfB8g1EAuyXz8PDQ9c6j0M+J/5+LPbWqD08gI+0+w9hl/6C+L6I5yGpqSi9FtYWx9TX1xnOSWooBynICpItL/CWEd2pNB2msvj9UYtR1ZxS7MLycRJt5rSbM+YdmvEF7QRxfA0pXayx5D7RRijRmyKNmPz4ktA1Yd2a7CAg6FciHFT1Ute/W1r+rhrLI5sz0FopfhQzGCbybPs0gnzd5tziu+ceIVdd+6bMA2EvXaKbikyKu9/CrF2kyGaHZSXWpvFrrv8a6nk7zmFo5rXy/vtLegRjMLU+ao7p5/nwxphtjjR80X/Ffjt0DX6di91c0T8RD6p6rKv/+zWSqXHCoD/5QoWwe/6tvdGrA+3lz81DX2tnOKEkOlHLywOvEG6tbU2u1owtan3FF5jxRy3mItecUnYXNbwJwG+3cLHYUDO+tJsPBfTe030abHiLyuHA/joO15Q43oSMbx+dbF4k5haB/rX5YA8QjE2gPWSsadLzQ3QMX5Mxfs008YtiBsNEng3aAgPAXuFR8ILiJAV/ymVwCW+gtYYHwpb7ZB7fYDC8SepEvtEiU5hU1kWarY3peeKa+6Hg2KOAA6wfY4Sa8aXddCjQ0GKEnOXjb1KLyuFAIs6KxTnu+fDB3JrdHNB/n5NBPx+/tqXn7+Z/CGWalmYXgyoasJuaHbsfU0vtzAOXMBaB7ZgxMx+FLeKMryHzS0xlKmtGog6E1Rg56pNpskleQq0zfTE9/FHL7gZAZNzcZVeBY9/MC2s8oRlf2jgUtKd+hjEsmHfPytqSDZXZbawMx9rFk0ifsw+PXa3oz70IHBzQF/Fr1Hr+jnVtmpYGYxDk3GrAPq69fZWs5nUnDlvfLbF3fcnY5d3Z93BJt0danH+FQGcqSITJYrjlgka+pQtqUlVcLPrmRdLPE4LaGZzDCc34wnbtqZ/5m4vkAJ8ay49z5Hn2Gy4j42WPe7GrCfOd75mOEfv68/L1U8vrQegqcbYa1+4cBswY9uPqcHZGgUsKXhNvvELBNxo/g530CSprh2EtHAjsWplLpgmbdBW15vyLKvFGsab9RbXDMq61MbsL8TUcCuTGsRyu3x72676tuGnLwyHbjF+KXW6cg57nGTAG4vcL9TwytdM8+h9eax1nqwns4WEwaA+wDRGZcH4HDBdeHai+gKWj7PuQBdHou5u3k5gUu0xn8a9EhXIliVAtes3ZCyth3+618zX2nbwmSS820Zd8KOgRf9OxYP46nHPF4Jy7vLsN2sMeKmceHn6t2McqOlYcw+8N6nlk6qfE9JvmD+tgp0q+nd1FfG5g/OVTLwqk80QGvEZX0b17MZISd2nP1CW17oGQ1AFkec8UVUKtv/ziRvaspsgWDBNtbB2sjdn95LTAGFjrCc34wnb0xJEGm57lcP3OwTH09drnxs07etwLrAlrP8uKF8fBvOTq5cjUT4nur8RbEVbTEZrEHq9x50Nk+zwgkuH1iOi2A3yYoD9ZSIsbd+Hn7SSmC5wp+vAPBOZ+hSVFqZsgY2f3qXmZBVBwkpKoT/oG96n/5hFqcFGd0IwvbEfPwx3FeBb0uQbn19eGH28B5scaz+LH9PHnjXoeUXGnTPcT0X9XIdLkdHt2GIS0Ru1h+SXKRUHkz+MK+/7l7Ox1okh+XTXaTz89HYfzo9NcnmjS8HpLdD1+UuR0Ro2urfWHkKFdcxxygYuFBgV3W2vCZsKBi5F4dlK5sD4ikr/4ZixeUNREc7G4vZrXr9t8T38U81p8v9vBuPtaOrfcLJ1angysIY+JenJ91NWFg0A/KcW8QbM7DPz8Opx3TcFtSHQ87efZDhhngh7N4cA+OZwiJc4rI8E04dQn7qUVrPiRYmG14SsEDpXUfpKkuPIErtn9UcvuQl/vhW26pf55ArkarBc1BLqjP4aUbWPU4I+27U/rvt/tcFx9zSqPHBk3elwHa9jH9GtGHx5ROaYMe4XomK15W7rJG8TxPCV+fiecGQD7AHuas1dE7Dxvtb894YFQZswxulgEF+wcrq/oq2sXRItl50dUu35SkoXc5XubQ4G6bl7DZfO9D9eCMS2+333g2Pd43B/eoFePavm0D4N+cmTqlUzrMSalmnBFBHHywyD/6Vgys2X6vIVEMN/l4NcR2J08vv+m3ipOPkZeYg+9znK8OTxEBlILzRgukxRZnsg1+xoNLjqRbzPhwMWws0NAwZsfCuPX9tg+hhxwVPrFxBF/TnAv9M1Zn7vfR/TlEZVryjBfJa6ngb/j7mhsHCS3y5CgbM1PCfWCJ7BXROw8a3avv0xiemFW7be/QqBCLzaN2OH6ipyuXSA3uD1LFcW1w7W4Ml7s8aaHgvgiNxk/wuFa1OYUwr7o/7XC88YNqj5H9Cc3hhyZeiXDnBiXQJdppiXVeDZadtdXh8TKh936Fv7OQWT36wjsGDbwfz2ckohUXZFiz8PuYq2FZwwOFU1abHlCaI8uPhPZo3krMBwgJVnIykX7Ig6F8S1rxJDBtzR3c/Ngfz/OlwzPEdfWublgDAZj8IjymTLMW41d0eDao6m5x2Hg4dqxLSVit9jSKdrdYmnbA5KuSarE/TSrFp3wPq8QCOK6ZA3Z4foWclpqLkvl5g0ujozt2ZnoYkjiG8wLjnFwIzhCnUZo5jrXrxYwCoUWjL+D4/ixzse7L1yD31usOcKPw2AsOTJ9lAxz+7EJtL7OxGveiuwaz9IZdjc+LmOcgaGtXwnH/msie1QLo+wYduv/Vqy6nKJPMA6E/MKthWgMDhVNWnR5YmiPFgET2f15GzuG2841s1cuYPh3FMgL7utwbqjzNUMnvm3lg0Ej/c7BWXQ2jnctZoyMGz0WWNcOP47Ej8cjynfK0GefY+HrTA1Cs77rmvgw6PjxEZy1s8QHeB00nh1VTGzp7OyDqNhBqQ+FVAXJlqyW9tNPn0eOLvJ+95fEQgjMi7bX3Pb3EuSzYRcyrF/H0L9vjzbdq/Xk6t9NoEDD7P6OAhGNv6cQ2CG4r9v1hVwNI7ROrzESE1viXDF6IcexX45ba47w486VIWMoKfrl+bTe15qYjob/3kx+GOS/URROaeC6DqE2obc9ENw+Tpa/3+fAPuGiPBtNu+/bmSacyoQ1nsTOd8fSo1a8ZZQXvppqDA4VjVfMJCl4N/mofobt3RP9NbvF4M/VRvU0THZxmNd8pYA6GtqhF26ylxiNUgvn8vNV4NhxDo3VX3nUqM0tjitHVYwpRb9avoWvNbUEmjbXZMQLHgZN/gd20FvnXXa/HvTX7OwDN/bCz32efTV7xa6W+32GcIJdUadJ+4DGc4tm0Vr9rSNHFrLLS/MGDKKCv6/DPFUdM/SHvkFZL4YNsYVEDBnrPJwjerwstfr39bBFxZouvm8t58LXm7iJpqXHAdYnkWE9ZZJW1+3ovHl5OTyUr+PkxXaFip1dzDeRuqkHfl0V/ISnDgQOkdYwL541ePhFEeWd0k0YdiGrNgkjezgqZ8hLKWWeXdJrdgILXvtQQC0Nvej5vN63HwwMx/LzfznU69zPWypmPOWG/vvcvg9idIlGHgWoGhrXPwhbxI3pjU3WnFzfE/YU1/ct2Nfrz1NjDoT8gt6Tl86h42OzIrtfl2PHkC5S5oYW9Nh54Nc8FGhoUU/DZ/iJb6VeDBvYEisYjhfX8brUaqnNzypU3OmGMer5Nb6P0SUa73XBGhka1x/B6tLUBjE4nHTebnddiVKLZ/Ln5AgdfN/ONCWhYDnchTia+FB5Ds3vog/+5jx8c4cnkmgqH6jiB8xRfWNchML6dR78ULStCwC+hLmdsj03K/M0TKknRPk/iEc2ia/BOfo6Cfowwte5BvvIEl/t3VxxPefwYp+jVodVQV4lsGpHD5zxMVpXx9fPszHj1x5c/440YYVpanezl7Qmf5Olf+Vnfk0rBtiP+ccENERd444zo2+JZppwShPWeJIV27MiFb1zIBDxDRndbDOsb+7wRDLNzBE3rX4gULfZ67vZGPWGdfJA0EMTz9XKPA3zMocChTqcq6+ToA8zfEUIq91Hlyx1dnO9DVEPNFblzkOJrEfgozjrI/Shrmt2hwGJXFiFDr+zT4awdBgwx0HqrsgCD7Q/fJPHcG1M/sE6sTtOSdH8jy2JVG2RYlHVnvoMgVkNNwZJpWeTpMhkIm7DjezUgqouBGnHkO6crczTMNWLt27UQAdJfB3O1ddJ0IcZvodcA/otDjbts5BR1zxellotVsU9UH2zoiBu3GvmrI/Qh7quOXMYEOFhb6drcdMPYT4HhxYF9IFrob/JSfPsY6Tug4qmkqtKoxa9QqB5ae1PdwzXGpgX5b+XQM5yEhwHX3Fr8V8FyGsNBegY8lVCvwjLjr7k27Esd95W5mkkPb710rzcKwXG10tKviZM5BNlizeIaHyHn/8KXiSo1xP5g0SeP4C+p3xCbdecPQwAYcJK8/QYFyNoTbfPO6F5G896DvGP+ccENERL49qY/NXBNNnyDKzzZCu+Z9V4ffIoHQhE+xs3MHd4UommfiCQ+6IG6xtxRDj30BCwvf/HmrQd45PfHwwbzltdokDDVPqzPRTIS+Rr/flSqJeUfYNQkX8ju7DfFq9Ktz5P6A9O3DgK9D/tE+p3/4Q1zVhZTml6lgaB636vw0ByHBBDaaZpaSAG0bK7NuZEb3BaE9ZEkmsHQqzla54cCER812Y3KXG/M3hyia6y6d3yKoEijeAYf1N5tEaN+xgNhiRK5i3lkYYp9YdofzBAokBXnHfEad9gmEQse5MlLnfHm42thygQ+oMKNxaAcfZ+6ONvaKPH267610Li7rWC0PXSYUB61YONIMa1w4C4QDsoiHvDt8M04bQUrPNklQ2e0dpYf+pAIIpv8JnON3d4cplG5cCGTg4K7e6GL689FODFqf4nNwn8f46HAoVzp60fpb6SII4Z5sUdxWS5b70P3s2OCWHAxY3lgvFqvujnb2hdVzkMdnndvdbghhhiHR8jYP6uOVwbs+KA5ph/TEBDJAu0BkGtP8cBKRUcIpJcPxAYM1+54+UHAhHfZtub0DcveJKJrrThTX/UYI1DI6TuoaHodtGiZYH4BDFuPRQo0VG1R0TiUKBYC4kC3cCfP239mNjfA2O2hr9FxlRi727WMm4qd1BxPj/GrMVAv3gj4/Ue2WlpwhgdaXYqIIrKGOJbDgNy7aTigH2aEg2RLNAaBPseeXuzt2xZ55iCDd5n18+OfouwfCAQxTfdLNE3d3iSmUbliBorPyxCDdaIm0h2KLS27KJN8zuMTxDj9Q4Fcjw19361wPh9oDv4x7SGnx8RlVPmnC6n5pBtEDEYuxYH/UqbWNrAoUnj6DROFURRKUNc2bw8zVzdWXDPPk2JZnL9rSKmso8fIk0ku3Yg5Fr524qFA4GI77joJp7hfPOCJ7vR9TxRc/MDgaDOoRFSnMcyzgsyNP2pzoP+FGucEl13RxrpmP3h2dkeChQlS/QDvxdU8rXEsTr+DeeN3Zu8LolfYwU/Ry2e45v68drONLR0aSydyqmEKCqHbxFl9CN4mrmqs+ADpZmmRDOZRVqDYN+n4t7cfyAVz+UtUd3gCWqJ9XYNFA8EIr7xopt2luqbF95vgxnyjW6MJRqscWjkmgg0at0MzbAsg+tPsQZLDHtgpZGOyXul2R4MYbJAL/D7QSXfDBk3u+Hekut1RT2rxnT8t368pou6TTx3nzW4IfjWKGxcnmau5Cz44Gs6DCiRcY74XltUDw+7DtqHD09HJQHf2JF2pvfNC570RhdvdPLiRhqvzqFR7qix1/U4/A+Z2YYEGiyRKOiDlXoaia7Demu2hwJlCROfgd8TZu+fceaGeEmymz9nX3ctthPnhJ/dBJChS2Jak1MRkaMjWmJvo7d4mrmCs+AD0BzzjwloJru3ioho80FycV/eHgY064wVc6txeubhrYMTBwIR39CRfs7dNy948omudCAQB7GaDta5/zzBu7ZvcSiQkUcaSdwz5KUPBgp7w9RiSLIbL8+FZLHuy76uWi1BnBO+3gagGbpNTGsOKgMd0RJXNi2sY/frpaRigWaaEs1kFmoNgn2/psmf4oR1kWzliBSLqtZbD+3Dh6eDqHpD9QCRdpbhmxc8+Y3O3+DsRfY0C7vhyy+M1HgXl+3Lsr6LemGT3ONQoETH+D3zKR0KtEu68U17ZMljedfmy2M/13PzCOKVYoh1veltZXMjJ61XndVM+BZQAi+C1ZBerWBjxHytZpp0PtARyUKtQbDvV3FfPnEYUKLqVLXRegh+bSMib8K6YMZgqfRb5YknVu460dKkUjRyHcuyvot6YeNMHYYnSnph5ZGOafPfyzkcb00b/9tq2/ivVLnJN76qph0cSz6+Bvb1cg9qfaA4XngdJMt3XeOMod3EtWanupgh3uUgV7MyoY1JqpkmrfFjzUKtQVDrFxGkvJEzwc5oF/MVAlH1J7nVhEjPisC8GMJMhz/xBhcBdAusc2iEdL4KmGNxnGXZ98LGea1XCuT2Lqb8aoEJCyj6D+K+IfoGPJfnvuxrLm0WLkHsUrzluz8EmPw9cHJSBxWCbsJLHgQYKdIcro3RcZRumhKNova5AaUxRAicooJ1kUzniFSdqjZbG+3Dh8/zl+brN2eun73wzQtuxkanN7ZgMpvND2v1P0/Q1xhjveWhQI5LpmWuHQxU0ucFFPwdoj5mN2DH2v04L8W+voikzlLM5Z/d7JqxjjfxrTmq1OomvNQLmxXW0nVz9YKdIBZojvnHBDSTWaw1CPZ9myZ/mhPWZbKVJ1N1qtpsjagDgSi+GTV7/SzNNy+4KRvdypO8y7XZ+HStQwNSWwgI7nIokNSiiSjpiZVHOsmZQ4GIzh8MlBVS9P/KyDaFnKhPg3LcFSe7yZGxfjd5rDmq2uomvLzf9DBQ36BmMou1BsHJvvlTnewOhOoGT1BTrN+tk7G7xgF8zuoTKtehyokGTo2R7i42Cc1yrS44nWxqg3KjUFbeCm8rtxOfLdBYOGvx1HziQti/ECOB5yAfr8313IUehP2zrDi1zwgkw2+Tx5qjqq1uMhwqGxXW0nWsRjtBLNBMs59TM4u1BgDyGKZ5k5Z1G9kFbos4XiEQ1X7KtXSfSD9745sX3JyNrudpqlaX5KdhrHVo+MusReowDgnNsmod5mICnZ8m7Yt1ybTM2VcLRGReMVDNt1JMJc5gdzN+WVTmLhbclhXv3AHAjLW6yeeZo5l4WqLl8KUdBqAjksVag2Hfv7OHASXSlSdSLCp9psK6OeiQ77+IBZdM+grbcMVrcqZJETi3EcuErDSZNctaWYAU6/w0aV+sSyv8kNlOvlqgsZhOv2rgYtKCOI59fI0U6pc9SfvCrHjnXw2Q9t/ks+ZoJmnp45+wPnP/LLqO1WgniAWaad7oJJmNqNy/s/hduSVPFLGOeUP+bMC8UaeiDXEQ6hwziF8B1jt0vnzgG1/kUHBSteQm9FwirWTV5kWI8Q+GjT9PoFIYkYlbzPHqFGqT8740d9vvCsYfNmjEmoPZgG4y0mEeP1KkYzXaCWKBZpo3uolfm2b1MGOaNyFZt5EN9qpdXcxu/fA7AOEntNVEO9YFNoaL6E0sYaPD+aGuoiGhW9ZrC1LduH6qtI/WpRX2IJUTIuRcetVAojD5KMM55OM1KeS9NC9ScbG3FXRd+tr6eGVGM7O6yXDAXH6kSMdqtCOgmal0TtBNZtHWAMQxOtPsT3fCuky2yxWTRa0jPkNQw0SUvQduyfWzX75Zw00LtTbXpoEbnf2soDWU4rzyWMuqdRhHEmj9VERpj9At00psP85y6beTMkQ912+WF+amuvSFOXcAMNd6ZKXZErHaCS9TEPjRIh2r0c4kc5wm00urm8yircHQdXGcTuVAkCESmciVqTpV7W5NyXs2PRCI7AYRsdfP0n2zZoh9rZcrmfBmg7P1ziYbqdWBYLA7FMiNxWjtvQ8F2ugltx4MZBba1RgSuDGrk3kJbC1lsObdDRuzYkFvNlg5VtWxOgUvTxD50SIdq9HOJPOcJp0TdJNZtDUYui6O0ynuySdfHWSqRVW/W1+FA4HI33gzuj7TzvJjSYeb5+q8uvIJn3mV0Hs8dEaOc8vjaat+hrEYjPnlHAwURMu59BtKDrub88vEzp22N2iOjne2J1aO1S2sdiKcML8fMdLNOxPsjLw3o+KrPeH7KLIzXRfH6RT345OHAW2UnZc4DCj7DGGXCKk1kerXY6urNmV35bDmoTPyUGdgnbbqZxiLOWKtn45o0yvPLdNLGvzePda3A98P5xj28XMB54Q9OMuKh9ekhpVnHbfayXDy8/sRIx2r0c748TRas40V2pnV4wx1OyRswjhsAr4wySsEIvmTHP6k6NH1mXb2MZYshlhrscP3fKWgL+B4YuQ4Pz8eCe1SaC3GkiTaOGXaW88t03tgzV7UOvanFKTH392kbwfWf33jl+i4V+YfuWDFnUhPtJywDj9apJt3IdiZzbyVeaOdzOKtwdB1cZzO2QMhk61cmWpR1e/WoHffbQ4EInmz40bg0fWZdk4nliy4oVPrT/JehwI2eeiMHOcXxdsfCuTGYxItmiZhuIHnuvPx0HV7UW9Dvb/p3qTe2EuDjdrdfOfYzXlP5IaVLyIf6YT1+BEj3bz7wM7oeKBT5o12wvdLZGe6Lo7TKe7HJw8D2ig7Z/S7NXnxQCDimy7etCSriEw/expLFtzYQzxxuMeh0JpX99AZOeoIRYPbDgUCvdJiqEkW0nPL9BlYuxf9NuTN4C3m12R3s51nzWe3IUVkblm3Mr+1l3oiPypqu27edWBndDzQTTPmBe1kTsAaDF0Xx+mcPQxoI135MtWiqt+tz+j+aR8/PB2RcbGC443vsdfLcgPJYoh3BwKpfLkuOhS431j3MJiwqCMUDfBQwGd+PAbjTj2aFFnYyDXzydBziKKfZ3ezfl1gc6/OL3PDLJrMd+2lVhRHjbTzbgM7o2O6uikpaInkBKzBMO7Lja64FxMJbSatbu5MVX/5MGitHwiUiBYrSb5pMV2faWXZiazDDT7yyZLKudE6OrkmsPZhdMKGWgc8GFCL8ZiNFs2TMOQgct35ReAcogw1djfsl43txW3zyVwxE5L5r33UE8XRUd+18y4DO6Njgk6ZN9rJnIQ1GMa9uNWJUHELiIQuk+l8mbJzRv9KBwJRZZPX7PVqmrGs0/ofW53KmTfHHgp2XWDtQnBGa7jtUKC9Hs2TNGzuuvWNiOeSZdNUbtovB5zvPerPQmBGJPOXAbDWODpqaern3eVqCOKCbpoxP2gnQxvamXEPbnUiFJahkKEi6ZnNnVk+uf6Ww4BovGXEg5F4sZLFN7ikpp9TjSWLUfhOWz4QSAYbf1PZ4Nc+hEaPWifgQGqXSusxngXjTx80KXahN+5b/4z9vAgqqNy4bwfO5171ZmEwa0wWZ+2hnijOgvqlnXcVaBgdF3TTjPlBO5kTsQZD18VxFsW9mEhoM2l1c2eqB8juMCDy93gZXx0IFDhounPthqapp43PbFEsGbQp3mmvHArRAvFrH1rjkmodWC8ui7B2/JjMRo9mRRp6kIWo+FfJ5rmuTVbNa4K1RuvnClkozOyTxSDSgbD2PEukl16oYXRs0E0z1gDaydCGdmbFjGN1zuzdrM2k1c2dOaPfHQjR3n7jgUB09VDY6WfvU9lQcfNT7flDofcm1uIcdD0M6ghFAjwU8JkfU4LxqwfDNrQgCXMqzs+B3YZylizcmdZmcSYjoD+HOFumn3ebq2F0bNBOM9YA2smcjDU4jHttoz2xFyttJD2zuTPLJ9fvDgMif2+3PYADgQJHzQqy36SY7rPTz+mHMjGB8W2s7eiceePaWtLGssA5DK3jEmodpHapUI8xLYkPmhTb0IIs1Jk4Vezitez7chu7/FfYhTwzo12sCS8F1yHPiD5LP+8c0DAYG7RTorWgU8wJWYND1+bxzh0GJPSZtLq5M9UD5OphQJAjOBAoCbDogc7dhHsf1QJXJhTiW1+7WDnz5rUmg8VanMPQOi6oJV84YL25VOqZH1Pix68eDFToqSQLdyZOhl28XyOVKZxpVyXehC996BRn9n26Xnr5OnJjg3ZKtBZ0ijkpa3AY91VBe2bv/rkcBpT/W0Y76s21ZD56cYknHkK80566IAUtzmFoHRfUki8csP5QKq1v7r8lI9HezPTxzYrm/Fv5EVk4jlON9XNCzn03/6yHlkq8iQjsr5k8c+yjvXwdQWx37U4JamPmpKzBoWvzeJ0piVsyYW0mreSMySLviQ6DiPAVApWCrYnuf2Jlaj7zmoDEaS5fFNAiu1cK6tpttOTOQWgdt1TvgK8WfD3GtaCf8kGzyzaNoBhysot92431OpwpcTNd4ExsG9zvXV7BzmfeHa6O0Tlc7ZQUtJOhTTXMuIcK2iuHAW3kK2+mWug6Y597vzog2hwIlARcrMD7TYmp+cw2Kok/kWuHAkE86FOiZfw5DK3jkuodpH6pfL0fW4J+Vw4Gsq3ZcCJswn2i3BNYLwkn2jU5E98miG56EBp8v+Wj7ghXy+g8oFXmjVYxtKmG6do8Xufkvn3y1UGmWlQPAyLaHgjR3p31YnsgUBJ4sRLsNyRJzW+29JDPAvgixeEm3sGQ9EoEjUU4D6F13FBPvnDgHw74jMLYloIfSkKs61W8lNlCfmvuMe1T07OXKHXeV+f7L7+58l2dROdy9VOCdbl6Iq0NNZKuj+MtTu7ZJ9BYrUwAAAAVSURBVA8C2igXVZ/dQUAU79m7fvw/XHX/En074PYAAAAASUVORK5CYII=";

function generateInvoicePDF_FINAL(mode = "download") {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  // Image logo only
  pdf.addImage(FINAL_PDF_LOGO_BASE64, "PNG", 20, 12, 36, 36);

  let y = 60;
  pdf.setFontSize(11);

  if (window.fullName) { pdf.text("Name: " + fullName.value, 20, y); y += 7; }
  if (window.phone) { pdf.text("Phone: " + phone.value, 20, y); y += 7; }
  if (window.address) { pdf.text("Address: " + address.value, 20, y); y += 10; }

  pdf.text("Items:", 20, y); y += 7;
  if (window.cart && Array.isArray(cart)) {
    cart.forEach((item, i) => {
      const title = item.title || item.name || "Item";
      const qty = item.qty || 1;
      pdf.text(`${i + 1}. ${title} x ${qty}`, 20, y);
      y += 6;
    });
  }

  if (mode === "view") {
    //window.open(pdf.output("bloburl"), "_blank");
  } else {
    pdf.save("invoice.pdf");
  }
}

// Rebind buttons to FINAL function (override any previous handlers)
(function bindFinalButtons(){
  const d = document;
  const dl = d.getElementById("downloadInvoiceBtn");
  const vw = d.getElementById("viewInvoiceBtn");
  if (dl) {
    dl.onclick = function(e){ e.preventDefault(); generateInvoicePDF_FINAL("download"); };
  }
  if (vw) {
    vw.onclick = function(e){ e.preventDefault(); generateInvoicePDF_FINAL("view"); };
  }
})();
