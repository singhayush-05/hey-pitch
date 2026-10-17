/* =========================================================
   HEYPITCH STORE — Customer Dashboard & Live Order Tracker
   Real backend order history, live status tracking & updates
   ========================================================= */

/**
 * Open Customer Orders Dashboard.
 */
async function openDashboard() {
  const modal = $("#dashboardModal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="mscrim" id="dashScrim"></div>
    <div class="mdialog dashdialog">
      <div class="mhead">
        <div>
          <div class="mt">My Orders</div>
          <small style="color:var(--muted)">Live production queue for ${currentUser?.email || 'your account'}</small>
        </div>
        <button class="mclose" id="dashClose">&times;</button>
      </div>
      <div class="mbody" id="dashBody">
        <div style="text-align:center;padding:40px;color:var(--muted)">
          <div class="dash-loader"></div>
          <div style="margin-top:12px">Loading your orders...</div>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  $("#dashScrim")?.addEventListener("click", () => modal.style.display = "none");
  $("#dashClose")?.addEventListener("click", () => modal.style.display = "none");

  try {
    const res = await HeyPitchAPI.listOrders(1, 20);
    const orders = res?.data?.orders || [];
    renderDashboardOrders(orders);
  } catch (err) {
    $("#dashBody").innerHTML = `
      <div class="empty">
        <div style="color:var(--bad);margin-bottom:8px">Could not load orders</div>
        <small>${err.message}</small>
      </div>
    `;
  }
}

function renderDashboardOrders(orders) {
  const body = $("#dashBody");
  if (!body) return;

  if (!orders.length) {
    body.innerHTML = `
      <div class="empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin:0 auto 12px;color:var(--muted2)"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <div style="font-weight:600;font-size:16px;color:var(--ink)">No orders found</div>
        <p style="margin:6px auto 18px;max-width:32ch">You have not placed any video orders yet. Choose a style from our gallery to get started.</p>
        <button class="btn btn-p btn-s" id="btnDashBrowse">Browse styles</button>
      </div>
    `;
    $("#btnDashBrowse")?.addEventListener("click", () => {
      $("#dashboardModal").style.display = "none";
      location.hash = "#edit";
    });
    return;
  }

  body.innerHTML = `
    <div class="dashlist">
      ${orders.map(o => {
        const style = styleById(o.styleId) || { name: o.styleName || o.styleId, bg: 'bg-ink', cap: 'line', text: o.styleName };
        const statusMap = {
          pending_payment: { label: 'Pending Payment', class: 's-warn' },
          paid: { label: 'Paid & Queued', class: 's-ok' },
          intake_received: { label: 'Brief Received', class: 's-ok' },
          in_production: { label: 'In Production', class: 's-act' },
          review_ready: { label: 'Review Ready', class: 's-trend' },
          completed: { label: 'Delivered', class: 's-ok' },
          cancelled: { label: 'Cancelled', class: 's-bad' }
        };
        const stInfo = statusMap[o.status] || { label: o.status, class: 's-warn' };
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

        return `
          <div class="dashcard" data-order="${o.orderId}">
            <div class="dc-left">
              <div class="dc-thumb">${tileHTML(style)}</div>
              <div>
                <div class="dc-title"><b>${o.styleName || style.name}</b> <span class="chip-id">${o.orderId}</span></div>
                <div class="dc-sub">${o.len === 's90' ? 'Up to 90s' : 'Up to 60s'} · Qty: ${o.qty} · ${dateStr}</div>
              </div>
            </div>
            <div class="dc-right">
              <span class="chip-status ${stInfo.class}">${stInfo.label}</span>
              <div class="dc-price">${money(o.pricing?.total || 0)}</div>
              <button class="btn btn-g btn-s view-order-btn" data-id="${o.orderId}">Track</button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;

  $$(".view-order-btn").forEach(b => {
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      openOrderTracker(b.dataset.id);
    });
  });

  $$(".dashcard").forEach(c => {
    c.addEventListener("click", () => {
      openOrderTracker(c.dataset.order);
    });
  });
}

/**
 * Open Live Order Tracking & Management Modal.
 */
async function openOrderTracker(orderId) {
  const modal = $("#orderTrackerModal");
  if (!modal) return;

  modal.innerHTML = `
    <div class="mscrim" id="trackerScrim"></div>
    <div class="mdialog trackerdialog">
      <div class="mhead">
        <div>
          <div class="mt">Order Status <span class="chip-id" style="vertical-align:middle;margin-left:6px">${orderId}</span></div>
          <small style="color:var(--muted)">Authoritative live production status</small>
        </div>
        <button class="mclose" id="trackerClose">&times;</button>
      </div>
      <div class="mbody" id="trackerBody">
        <div style="text-align:center;padding:40px;color:var(--muted)">
          <div class="dash-loader"></div>
          <div style="margin-top:12px">Connecting to HeyPitch production queue...</div>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
  $("#trackerScrim")?.addEventListener("click", () => modal.style.display = "none");
  $("#trackerClose")?.addEventListener("click", () => modal.style.display = "none");

  try {
    const res = await HeyPitchAPI.getOrder(orderId);
    const order = res?.data?.order;
    if (!order) throw new Error("Order not found");
    renderTrackerDetails(order);
  } catch (err) {
    $("#trackerBody").innerHTML = `
      <div class="empty">
        <div style="color:var(--bad);font-weight:600;margin-bottom:8px">Order Lookup Failed</div>
        <p>${err.message}</p>
      </div>
    `;
  }
}

function renderTrackerDetails(order) {
  const body = $("#trackerBody");
  if (!body) return;

  const style = styleById(order.styleId) || { name: order.styleName, bg: 'bg-ink', cap: 'line', text: order.styleName, days: 3 };

  // Status step progression mapping
  const steps = [
    { id: 'placed', label: 'Order Placed', desc: 'Order persisted on server', done: true },
    { id: 'intake', label: 'Brief / Assets', desc: order.footageLink ? 'Footage link verified' : (order.script ? 'Script provided' : 'Awaiting assets'), done: ['paid', 'intake_received', 'in_production', 'review_ready', 'completed'].includes(order.status) },
    { id: 'prod', label: 'In Production', desc: 'Editing & motion sound design', done: ['in_production', 'review_ready', 'completed'].includes(order.status) },
    { id: 'review', label: 'Review Draft', desc: 'Watermark-free preview ready', done: ['review_ready', 'completed'].includes(order.status) },
    { id: 'done', label: 'Delivered', desc: 'Final render & sources released', done: order.status === 'completed' }
  ];

  const canEdit = ['pending_payment', 'intake_received'].includes(order.status);
  const canCancel = ['pending_payment', 'intake_received'].includes(order.status);

  body.innerHTML = `
    <!-- Top banner -->
    <div class="tracker-pick">
      <div class="tp-tile">${tileHTML(style)}</div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <div style="font-family:var(--font-d);font-size:20px;font-weight:700">${order.styleName || style.name}</div>
          <div class="dc-price" style="font-size:20px">${money(order.pricing?.total || 0)}</div>
        </div>
        <div style="font-size:13.5px;color:var(--muted);margin-top:2px">
          ${order.len === 's90' ? 'Up to 90 seconds' : 'Up to 60 seconds'} · Quantity: ${order.qty} video${order.qty > 1 ? 's' : ''}
          ${order.revision ? ' · Two revision rounds' : ' · One revision round'}
        </div>
        <div style="font-size:12.5px;color:var(--muted2);margin-top:4px">Client: ${order.customerEmail}</div>
      </div>
    </div>

    <!-- Live Step Progression -->
    <div class="timeline">
      ${steps.map((st, i) => `
        <div class="t-step ${st.done ? 'on' : ''}">
          <div class="t-ring">${st.done ? '✓' : i + 1}</div>
          <div class="t-content">
            <div class="t-title">${st.label}</div>
            <div class="t-desc">${st.desc}</div>
          </div>
        </div>
      `).join("")}
    </div>

    <!-- Intake & Assets Detail / Editable Section -->
    <div class="tracker-section">
      <div class="ts-head">Production Assets & Intake</div>
      <div class="ts-body">
        <div class="field">
          <label>Footage Link</label>
          <input id="trackFootage" type="url" value="${order.footageLink || ''}" placeholder="Paste Google Drive or Dropbox link" ${canEdit ? '' : 'readonly'}>
        </div>
        <div class="field" style="margin-top:10px">
          <label>Creative Notes & Guidance</label>
          <textarea id="trackNotes" rows="2" placeholder="Key moments, caption requests" ${canEdit ? '' : 'readonly'}>${order.notes || ''}</textarea>
        </div>
        ${canEdit ? `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px">
            <button class="btn btn-p btn-s" id="btnSaveOrderUpdates">Save Updates</button>
            ${canCancel ? `<button class="btn btn-g btn-s" id="btnCancelOrder" style="color:var(--bad)">Cancel Order</button>` : ''}
          </div>
        ` : `
          <div class="note" style="margin-top:8px">This order is currently in active production. To request edits, contact hello@heypitch.in.</div>
        `}
      </div>
    </div>
  `;

  $("#btnSaveOrderUpdates")?.addEventListener("click", async () => {
    const btn = $("#btnSaveOrderUpdates");
    btn.disabled = true;
    btn.textContent = "Saving...";

    const footageLink = $("#trackFootage")?.value.trim();
    const notes = $("#trackNotes")?.value.trim();

    try {
      const res = await HeyPitchAPI.updateOrder(order.orderId, { footageLink, notes });
      toast("Order updated on server!");
      renderTrackerDetails(res.data.order);
    } catch (err) {
      toast(err.message || "Could not update order");
    } finally {
      btn.disabled = false;
      btn.textContent = "Save Updates";
    }
  });

  $("#btnCancelOrder")?.addEventListener("click", async () => {
    if (!confirm(`Are you sure you want to cancel order ${order.orderId}?`)) return;
    try {
      const res = await HeyPitchAPI.cancelOrder(order.orderId);
      toast("Order cancelled.");
      renderTrackerDetails(res.data.order);
    } catch (err) {
      toast(err.message || "Cancellation failed");
    }
  });
}
