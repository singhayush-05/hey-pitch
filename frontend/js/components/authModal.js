/* =========================================================
   HEYPITCH STORE — Authentication & User Profile Modal
   Dynamic login, registration, profile display & session state
   ========================================================= */

let currentUser = null;

/**
 * Check existing authentication session on startup.
 */
async function initAuth() {
  const token = localStorage.getItem('hp_auth_token');
  if (!token) {
    updateNavAuthUI(null);
    return;
  }

  try {
    const res = await HeyPitchAPI.getMe();
    if (res?.data?.user) {
      currentUser = res.data.user;
      updateNavAuthUI(currentUser);
    } else {
      currentUser = null;
      HeyPitchAPI.setToken(null);
      updateNavAuthUI(null);
    }
  } catch {
    currentUser = null;
    HeyPitchAPI.setToken(null);
    updateNavAuthUI(null);
  }
}

/**
 * Updates navbar user action button based on login status.
 */
function updateNavAuthUI(user) {
  const container = $("#navAuthBtn");
  if (!container) return;

  if (user) {
    const initials = (user.name || user.email).slice(0, 2).toUpperCase();
    container.innerHTML = `
      <div class="userpill" id="userMenuTrigger">
        <span class="userav">${initials}</span>
        <span class="username">${user.name || user.email.split('@')[0]}</span>
      </div>
      <div class="usermenu" id="userMenu" style="display:none">
        <div class="umhead"><b>${user.name || 'HeyPitch User'}</b><small>${user.email}</small></div>
        <button class="umitem" id="btnMyOrders"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> My Orders</button>
        <button class="umitem bad" id="btnLogout"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Sign Out</button>
      </div>
    `;

    $("#userMenuTrigger")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const m = $("#userMenu");
      if (m) m.style.display = m.style.display === "none" ? "block" : "none";
    });

    $("#btnMyOrders")?.addEventListener("click", () => {
      $("#userMenu").style.display = "none";
      openDashboard();
    });

    $("#btnLogout")?.addEventListener("click", async () => {
      $("#userMenu").style.display = "none";
      await HeyPitchAPI.logout();
      currentUser = null;
      updateNavAuthUI(null);
      toast("Signed out successfully");
    });
  } else {
    container.innerHTML = `
      <button class="btn btn-g btn-s" id="openAuthModal"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Sign in</button>
    `;
    $("#openAuthModal")?.addEventListener("click", () => openAuthModal());
  }
}

// Close user dropdown when clicking outside
document.addEventListener("click", () => {
  const m = $("#userMenu");
  if (m) m.style.display = "none";
});

/**
 * Open Sign In / Register Modal.
 */
function openAuthModal(defaultMode = "login", onComplete = null) {
  let authMode = defaultMode; // 'login' | 'register'
  const modal = $("#authModal");
  if (!modal) return;

  function render() {
    modal.innerHTML = `
      <div class="mscrim" id="authScrim"></div>
      <div class="mdialog authdialog">
        <div class="mhead">
          <div class="mt">${authMode === 'login' ? 'Sign in to HeyPitch' : 'Create an Account'}</div>
          <button class="mclose" id="authClose">&times;</button>
        </div>
        <div class="authtabs">
          <button class="${authMode === 'login' ? 'on' : ''}" id="tabLogin">Sign in</button>
          <button class="${authMode === 'register' ? 'on' : ''}" id="tabRegister">Register</button>
        </div>
        <div class="mbody">
          <div id="authAlert" class="auth-alert" style="display:none"></div>
          ${authMode === 'register' ? `
            <div class="field">
              <label for="regName">Full Name</label>
              <input id="regName" placeholder="Your name">
            </div>
            <div class="field">
              <label for="regCo">Company / Brand (Optional)</label>
              <input id="regCo" placeholder="ScaleLabs, Creator, etc.">
            </div>
          ` : ''}
          <div class="field">
            <label for="authEmail">Email Address</label>
            <input id="authEmail" type="email" placeholder="you@company.com" required>
          </div>
          <div class="field">
            <label for="authPass">Password</label>
            <input id="authPass" type="password" placeholder="${authMode === 'register' ? 'Minimum 8 characters' : 'Enter password'}" required>
          </div>
          <button class="btn btn-p" id="authSubmit" style="width:100%;justify-content:center;margin-top:6px">
            ${authMode === 'login' ? 'Sign in' : 'Create Account'}
          </button>
          <div class="authtips">
            ${authMode === 'login'
              ? 'New to HeyPitch? <a href="#" id="switchReg" style="color:var(--violet3);text-decoration:underline">Create an account</a>'
              : 'Already have an account? <a href="#" id="switchLog" style="color:var(--violet3);text-decoration:underline">Sign in</a>'
            }
          </div>
        </div>
      </div>
    `;

    $("#authScrim")?.addEventListener("click", closeAuthModal);
    $("#authClose")?.addEventListener("click", closeAuthModal);
    $("#tabLogin")?.addEventListener("click", () => { authMode = "login"; render(); });
    $("#tabRegister")?.addEventListener("click", () => { authMode = "register"; render(); });
    $("#switchReg")?.addEventListener("click", (e) => { e.preventDefault(); authMode = "register"; render(); });
    $("#switchLog")?.addEventListener("click", (e) => { e.preventDefault(); authMode = "login"; render(); });

    $("#authSubmit")?.addEventListener("click", async () => {
      const email = $("#authEmail")?.value.trim();
      const password = $("#authPass")?.value;
      const alertBox = $("#authAlert");
      const btn = $("#authSubmit");

      if (!email || !password) {
        showAlert("Email and password are required");
        return;
      }
      if (authMode === "register" && password.length < 8) {
        showAlert("Password must be at least 8 characters");
        return;
      }

      btn.disabled = true;
      btn.textContent = "Please wait...";

      try {
        if (authMode === "login") {
          const res = await HeyPitchAPI.login({ email, password });
          currentUser = res.data.user;
          updateNavAuthUI(currentUser);
          closeAuthModal();
          toast(`Welcome back, ${currentUser.name || currentUser.email}`);
          if (onComplete) onComplete(currentUser);
        } else {
          const name = $("#regName")?.value.trim() || "";
          const company = $("#regCo")?.value.trim() || "";
          const res = await HeyPitchAPI.register({ email, password, name, company });
          currentUser = res.data.user;
          updateNavAuthUI(currentUser);
          closeAuthModal();
          toast("Account created successfully!");
          if (onComplete) onComplete(currentUser);
        }
      } catch (err) {
        showAlert(err.message || "Authentication failed");
      } finally {
        btn.disabled = false;
        btn.textContent = authMode === 'login' ? 'Sign in' : 'Create Account';
      }
    });

    function showAlert(msg) {
      const box = $("#authAlert");
      if (box) {
        box.textContent = msg;
        box.style.display = "block";
      }
    }
  }

  render();
  modal.style.display = "block";
}

function closeAuthModal() {
  const modal = $("#authModal");
  if (modal) modal.style.display = "none";
}
