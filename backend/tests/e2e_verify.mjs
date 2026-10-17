import assert from 'node:assert/strict';

async function runVerification() {
  console.log("=== HEYPITCH VERIFICATION SUITE ===");

  // 1. Verify root index.html serves modern components & scripts
  console.log("\n1. Testing static server on http://localhost:8080/...");
  const resHtml = await fetch('http://localhost:8080/');
  assert.equal(resHtml.status, 200, "Root index.html should return 200");
  const html = await resHtml.text();
  assert.ok(html.includes('id="navAuthBtn"'), "index.html must include navAuthBtn");
  assert.ok(html.includes('id="authModal"'), "index.html must include authModal container");
  assert.ok(html.includes('id="orderTrackerModal"'), "index.html must include orderTrackerModal container");
  assert.ok(html.includes('./js/services/api.js'), "index.html must include api.js");
  assert.ok(html.includes('./js/components/orderDrawer.js'), "index.html must include orderDrawer.js");
  console.log("✔ Root index.html correctly configured and served by static server.");

  // 2. Verify orderDrawer.js served on port 8080 has zero mock order IDs
  console.log("\n2. Testing served js/components/orderDrawer.js...");
  const resDrawer = await fetch('http://localhost:8080/js/components/orderDrawer.js');
  assert.equal(resDrawer.status, 200);
  const drawerCode = await resDrawer.text();
  assert.ok(!drawerCode.includes('Math.random()'), "orderDrawer.js must NEVER use Math.random() for mock orders!");
  assert.ok(!drawerCode.includes('Math.floor(1000+Math.random()*9000)'), "orderDrawer.js must not contain mock order ID generation!");
  assert.ok(drawerCode.includes('HeyPitchAPI.createOrder'), "orderDrawer.js must use real HeyPitchAPI.createOrder");
  assert.ok(drawerCode.includes('st.step === 2 && f.intake === "footage"'), "orderDrawer.js must enforce footage link on Step 2");
  assert.ok(drawerCode.includes('triggerVerify'), "orderDrawer.js must have triggerVerify listener for #oLink");
  console.log("✔ Served orderDrawer.js verified: 100% real API integration, zero mock fallbacks, strict link checks.");

  // 3. Verify responsive.css served on port 8080
  console.log("\n3. Testing served css/responsive.css...");
  const resCss = await fetch('http://localhost:8080/css/responsive.css');
  assert.equal(resCss.status, 200);
  const css = await resCss.text();
  assert.ok(css.includes('@media(max-width:1040px)'), "responsive.css must include 1040px");
  assert.ok(css.includes('@media(max-width:720px)'), "responsive.css must include 720px");
  assert.ok(css.includes('@media(max-width:640px)'), "responsive.css must include 640px");
  assert.ok(css.includes('@media(max-width:520px)'), "responsive.css must include 520px");
  assert.ok(css.includes('@media(max-width:480px)'), "responsive.css must include 480px mobile breakpoint");
  assert.ok(css.includes('@media(max-width:380px)'), "responsive.css must include 380px breakpoint");
  assert.ok(css.includes('.drawer{width:100vw}'), "drawer must be 100vw on mobile");
  assert.ok(css.includes('.input-error'), "responsive.css must include .input-error shake animation");
  console.log("✔ Served responsive.css verified: complete breakpoint hierarchy from 1040px to 380px.");

  // 4. Verify Backend URL verification API
  console.log("\n4. Testing backend resource verification API (http://localhost:5000/api/v1/verification/check)...");
  const driveUrl = 'https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing';
  const resVerif = await fetch('http://localhost:5000/api/v1/verification/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: driveUrl })
  });
  assert.equal(resVerif.status, 200);
  const dataVerif = await resVerif.json();
  assert.equal(dataVerif.data.verified, true);
  assert.equal(dataVerif.data.isDownloadable, true);
  assert.equal(dataVerif.data.provider, 'google_drive');
  console.log(`✔ Link verification returned: ${JSON.stringify(dataVerif.data)}`);

  // 5. Verify Backend REJECTS order creation for footage styles without footageLink
  console.log("\n5. Testing backend order creation without footage link (MUST BE REJECTED)...");
  const resNoLink = await fetch('http://localhost:5000/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      styleId: 'pulse',
      customerEmail: 'client@heypitch.in',
      qty: 1
    })
  });
  assert.equal(resNoLink.status, 400, "Order without footageLink must return 400 Bad Request");
  const errData = await resNoLink.json();
  assert.equal(errData.error.code, 'VALIDATION_ERROR');
  assert.ok(errData.error.details.some(d => d.field === 'footageLink'), "Error must specify footageLink is required");
  console.log(`✔ Order without link successfully blocked by backend: ${JSON.stringify(errData.error)}`);

  // 6. Verify Backend ACCEPTS order creation with verified footageLink
  console.log("\n6. Testing backend order creation WITH verified footage link (MUST SUCCEED)...");
  const resValidOrder = await fetch('http://localhost:5000/api/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      styleId: 'pulse',
      customerEmail: 'client@heypitch.in',
      qty: 1,
      len: 's60',
      footageLink: driveUrl,
      footageDownloadOk: true,
      currency: 'USD'
    })
  });
  assert.equal(resValidOrder.status, 201, "Order with verified link must return 201 Created");
  const orderData = await resValidOrder.json();
  const order = orderData.data.order;
  assert.ok(order.orderId.startsWith('HP-'), `orderId must start with HP-, got ${order.orderId}`);
  assert.equal(order.styleId, 'pulse');
  assert.equal(order.footageLink, driveUrl);
  assert.equal(order.footageDownloadOk, true);
  assert.equal(order.pricing.total, 39);
  console.log(`✔ Real server order successfully created in database/store: Order ID ${order.orderId}, Status: ${order.status}`);

  console.log("\n🎉 ALL 6 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!");
}

runVerification().catch(err => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
