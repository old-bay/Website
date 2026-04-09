/**
 * UMBC HvZ - Shared UI Components
 * Builds nav, sidebar, and footer dynamically on every page.
 */
(function () {
  'use strict';

  const NAV_ITEMS = [
    { href: '/', label: 'Home' },
    { href: '/rules', label: 'Rules' },
    { href: '/news', label: 'News' },
    { href: '/profile', label: 'My Profile' },
    { href: '/players', label: 'Players' },
    { href: '/about', label: 'FAQs' },
    { href: '/mission-tools', label: 'Mission Toolkit' },
    { href: '/contact', label: 'Admins' },
    { href: '/achievements', label: 'Achievements' }
  ];

  function getActivePage() {
    let p = location.pathname;
    if (p.endsWith('.html')) p = p.replace(/\.html$/, '').replace('/index', '/');
    return p;
  }

  function buildNavLinks() {
    const active = getActivePage();
    return NAV_ITEMS.map(n =>
      `<li><a href="${n.href}"${active === n.href ? ' class="active"' : ''}>${n.label}</a></li>`
    ).join('');
  }

  // Build header
  function buildHeader() {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML = `
      <div class="container header-inner">
        <a href="/" class="logo">
          <img src="/images/hvzLogo.png" alt="UMBC HvZ Logo" width="48" height="48">
          <span class="logo-text">UMBC <span>HvZ</span></span>
        </a>
        <nav class="main-nav" aria-label="Primary navigation">
          <ul>${buildNavLinks()}</ul>
        </nav>
        <button class="menu-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-nav">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
      <nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
        <ul>${buildNavLinks()}</ul>
      </nav>`;
    // Wire up toggle
    const toggle = el.querySelector('.menu-toggle');
    const mobileNav = el.querySelector('#mobile-nav');
    if (toggle && mobileNav) {
      toggle.addEventListener('click', () => {
        const open = mobileNav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }
  }

  // Build sidebar
  async function buildSidebar() {
    const el = document.getElementById('sidebar');
    if (!el) return;

    let loginHtml = '';
    try {
      const me = await HvZ.getMe();
      if (me.loggedIn) {
        loginHtml = `
          <p>Welcome, <strong>${HvZ.escapeHtml(me.fname)}</strong>!</p>
          <ul style="list-style:none;padding:0;margin:0.5rem 0;">
            <li><a href="/profile">My Profile</a></li>
            ${me.hasActiveLongGame && me.isRegisteredForLongGame ? '<li><a href="/kill">Log a kill</a></li>' : ''}
            ${me.isAdmin >= 1 ? '<li><a href="/admin">Admin Panel</a></li>' : ''}
          </ul>
          <button class="btn btn-outline" style="width:100%;margin-top:0.5rem;" onclick="doLogout()">Log out</button>`;
      } else {
        loginHtml = buildLoginForm();
      }
    } catch (e) {
      loginHtml = buildLoginForm();
    }

    let sidebarContent = `<div class="sidebar-card">${loginHtml}</div>`;

    // Voting link + slides
    try {
      const sidebar = await HvZ.getSidebar();
      // Voting
      let voteHtml = '<h3>Elections</h3>';
      if (sidebar.voteLink === 'soonOpen' || sidebar.voteLink === 'soonClosed') {
        voteHtml += '<p class="text-center"><strong>Voting opening soon</strong></p>';
      } else if (sidebar.voteLink === 'open') {
        voteHtml += '<p class="text-center"><strong>Voting is now open!</strong></p>';
      }
      if (sidebar.voteLink === 'soonOpen' || sidebar.voteLink === 'open') {
        voteHtml += '<p class="text-center"><a href="/voting">Voting page</a></p>';
      } else {
        voteHtml += '<p class="text-muted text-center">No elections in progress.</p>';
      }
      sidebarContent += `<div class="sidebar-card">${voteHtml}</div>`;

      // Slides
      if (sidebar.slides) {
        const s = sidebar.slides;
        let slidesHtml = `<h2>${HvZ.escapeHtml(s.mainHeading)}</h2>`;
        if (s.first && s.first.url) {
          slidesHtml += `<h3>${HvZ.escapeHtml(s.first.heading)}</h3>
            <iframe src="${s.first.url}" frameborder="0" width="100%" height="300" allowfullscreen></iframe>`;
        }
        if (s.second && s.second.url) {
          slidesHtml += `<h3>${HvZ.escapeHtml(s.second.heading)}</h3>
            <iframe src="${s.second.url}" frameborder="0" width="100%" height="300" allowfullscreen></iframe>`;
        }
        if (s.third && s.third.url) {
          slidesHtml += `<h3>${HvZ.escapeHtml(s.third.heading)}</h3>
            <iframe src="${s.third.url}" frameborder="0" width="100%" height="300" allowfullscreen></iframe>`;
        }
        sidebarContent += `<div class="sidebar-card">${slidesHtml}</div>`;
      }
    } catch (e) { /* sidebar data unavailable */ }

    el.innerHTML = sidebarContent;
  }

  function buildLoginForm() {
    return `
      <h3>Login</h3>
      <form id="login-form" onsubmit="return doLogin(event)">
        <div class="form-group">
          <label for="login-user">Username</label>
          <input class="form-control" type="text" id="login-user" name="username" required>
        </div>
        <div class="form-group">
          <label for="login-pass">Password</label>
          <input class="form-control" type="password" id="login-pass" name="password" required>
        </div>
        <div id="login-error" style="color:var(--color-accent);margin-bottom:0.5rem;display:none;"></div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Login</button>
      </form>
      <p style="margin-top:0.5rem;"><a href="/register">Create account</a> | <a href="/password-recovery">Forgot password?</a></p>`;
  }

  // Build footer
  function buildFooter() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <div class="container footer-inner">
        <ul class="footer-links">
          <li><a href="/">Home</a></li>
          <li><a href="/rules">Rules</a></li>
          <li><a href="/news">News</a></li>
          <li><a href="/about">FAQs</a></li>
          <li><a href="/achievements">Achievements</a></li>
          <li><a href="/contact">Meet the Admins</a></li>
        </ul>
        <p class="footer-copyright">UMBC HvZ &mdash; Art assets borrowed from <a href="http://www.nodethirtythree.com/">nodethirtythree</a>.</p>
      </div>`;
  }

  // Init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    buildHeader();
    buildSidebar();
    buildFooter();
  });

  // Global auth functions
  window.doLogin = async function (e) {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;
    try {
      const { salt } = await HvZ.getSalt();
      // SHA256(salt + SHA256(password))
      const passHash = await sha256(pass);
      const fullHash = await sha256(salt + passHash);
      await HvZ.login(user, fullHash);
      location.reload();
    } catch (err) {
      if (errEl) { errEl.textContent = err.error || 'Login failed'; errEl.style.display = 'block'; }
    }
  };

  window.doLogout = async function () {
    await HvZ.logout();
    location.reload();
  };

  // SHA256 helper using Web Crypto API
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
})();
