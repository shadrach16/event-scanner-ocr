/* ===== Analytics & Interactions ===== */
(function () {
  'use strict';

  // --- Google Analytics 4 Event Helper ---
  function gtag() { window.dataLayer = window.dataLayer || []; window.dataLayer.push(arguments); }

  // --- Download Click Tracking ---
  document.querySelectorAll('a[href*="play.google.com"]').forEach(function (link) {
    link.addEventListener('click', function () {
      gtag('event', 'download_click', {
        event_category: 'engagement',
        event_label: link.closest('section')?.id || 'unknown',
        link_url: link.href
      });
    });
  });

  // --- Scroll Depth Tracking ---
  var scrollThresholds = [25, 50, 75, 100];
  var scrollFired = {};
  window.addEventListener('scroll', function () {
    var scrollPct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
    scrollThresholds.forEach(function (threshold) {
      if (scrollPct >= threshold && !scrollFired[threshold]) {
        scrollFired[threshold] = true;
        gtag('event', 'scroll_depth', { depth: threshold + '%' });
      }
    });
  }, { passive: true });

  // --- Time on Page Milestones ---
  var timeMilestones = [15, 30, 60, 120];
  var timeFired = {};
  timeMilestones.forEach(function (seconds) {
    setTimeout(function () {
      if (!timeFired[seconds]) {
        timeFired[seconds] = true;
        gtag('event', 'time_on_page', { seconds: seconds });
      }
    }, seconds * 1000);
  });

  // --- Exit Intent Detection ---
  var exitFired = false;
  document.addEventListener('mouseleave', function (e) {
    if (e.clientY < 10 && !exitFired) {
      exitFired = true;
      gtag('event', 'exit_intent', { event_category: 'engagement' });
    }
  });

  // --- Section Visibility Tracking ---
  if ('IntersectionObserver' in window) {
    var sectionsFired = {};
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !sectionsFired[entry.target.id]) {
          sectionsFired[entry.target.id] = true;
          gtag('event', 'section_view', { section: entry.target.id });
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('section[id]').forEach(function (section) {
      observer.observe(section);
    });
  }

  // --- Page Visit Counter ---
  try {
    var visits = parseInt(localStorage.getItem('p2c_visits') || '0', 10) + 1;
    localStorage.setItem('p2c_visits', String(visits));
    gtag('event', 'page_visit', { visit_count: visits });
  } catch (e) { /* localStorage unavailable */ }

  // --- Scroll Reveal Animation ---
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show all
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  // --- Navbar Scroll State ---
  var navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }, { passive: true });

  // --- Mobile Menu ---
  var hamburger = document.querySelector('.hamburger');
  var mobileMenu = document.querySelector('.mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('active');
    });
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
      });
    });
  }

  // --- FAQ Accordion ---
  document.querySelectorAll('.faq-question').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.parentElement;
      var wasActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item.active').forEach(function (el) {
        el.classList.remove('active');
      });
      if (!wasActive) item.classList.add('active');
    });
  });

  // --- Smooth Scroll for Anchor Links ---
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')) || 72;
        window.scrollTo({
          top: target.offsetTop - offset,
          behavior: 'smooth'
        });
      }
    });
  });

})();
