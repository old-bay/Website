/**
 * UMBC HvZ Website - Main JavaScript
 */

(function () {
  'use strict';

  // --- Mobile Navigation Toggle ---
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.getElementById('mobile-nav');

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      const isOpen = mobileNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile nav when clicking a link
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close mobile nav on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) {
        mobileNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.focus();
      }
    });
  }

  // --- FAQ Accordion ---
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(function (button) {
    button.addEventListener('click', function () {
      const targetId = this.getAttribute('aria-controls');
      const answer = document.getElementById(targetId);
      if (!answer) return;

      const isExpanded = this.getAttribute('aria-expanded') === 'true';

      // Close all other FAQs
      faqQuestions.forEach(function (other) {
        if (other !== button) {
          other.setAttribute('aria-expanded', 'false');
          var otherId = other.getAttribute('aria-controls');
          var otherAnswer = document.getElementById(otherId);
          if (otherAnswer) otherAnswer.classList.remove('open');
        }
      });

      // Toggle this one
      this.setAttribute('aria-expanded', String(!isExpanded));
      answer.classList.toggle('open', !isExpanded);
    });
  });

  // --- Achievement Filter ---
  const filterButtons = document.querySelectorAll('.btn-filter');
  const achievementTiers = document.querySelectorAll('.achievement-tier');

  if (filterButtons.length && achievementTiers.length) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = this.getAttribute('data-filter');

        // Update active button
        filterButtons.forEach(function (b) {
          b.classList.remove('active', 'btn-primary');
          b.classList.add('btn-outline');
        });
        this.classList.add('active', 'btn-primary');
        this.classList.remove('btn-outline');

        // Show/hide tiers
        achievementTiers.forEach(function (tier) {
          if (filter === 'all' || tier.getAttribute('data-tier') === filter) {
            tier.style.display = '';
          } else {
            tier.style.display = 'none';
          }
        });
      });
    });
  }

  // --- Smooth scroll for same-page anchor links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href').slice(1);
      if (!targetId) return;
      var target = document.getElementById(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Update focus for accessibility
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
    });
  });

})();
