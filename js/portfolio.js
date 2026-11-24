(function () {
  'use strict';

  var doc = document.documentElement;
  var body = document.body;
  doc.classList.add('js');

  var desktopMQ = window.matchMedia('(min-width: 1024px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile navigation drawer ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var scrim = document.querySelector('.scrim');
  var sidebar = document.getElementById('sidebar');

  function setNav(open) {
    body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) {
      scrim.hidden = false;
    } else {
      setTimeout(function () { if (!body.classList.contains('nav-open')) scrim.hidden = true; }, 300);
    }
  }

  toggle.addEventListener('click', function () { setNav(!body.classList.contains('nav-open')); });
  scrim.addEventListener('click', function () { setNav(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && body.classList.contains('nav-open')) { setNav(false); toggle.focus(); }
  });
  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('a[href^="#"]') && !desktopMQ.matches) setNav(false);
  });
  desktopMQ.addEventListener && desktopMQ.addEventListener('change', function (e) { if (e.matches) setNav(false); });

  /* ---------- Top bar shadow on scroll ---------- */
  var topbar = document.querySelector('.topbar');
  function onScroll() { topbar.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.main-nav a[data-nav-section]'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('section[data-section]'));

  function setActive(name) {
    navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('data-nav-section') === name); });
  }

  function updateActive() {
    var probe = window.innerHeight * 0.35;
    var current = sections[0];
    for (var i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= probe) current = sections[i];
    }
    // Reached the bottom of the page: highlight last section
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    setActive(current.getAttribute('data-section'));
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(function () { updateActive(); ticking = false; }); ticking = true; }
  }, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Certificates slider ---------- */
  var slider = document.querySelector('.cert-slider');
  if (slider) {
    var slides = slider.querySelectorAll('.cert-slide');
    var dotsWrap = slider.querySelector('.cert-dots');
    var index = 0;

    var dots = Array.prototype.map.call(slides, function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Show certificate ' + (i + 1));
      b.addEventListener('click', function () { show(i); });
      dotsWrap.appendChild(b);
      return b;
    });

    function show(i) {
      index = (i + slides.length) % slides.length;
      Array.prototype.forEach.call(slides, function (s, k) {
        s.classList.toggle('is-active', k === index);
        if (k === index) s.removeAttribute('loading');
      });
      dots.forEach(function (d, k) { d.setAttribute('aria-selected', String(k === index)); });
      // Preload the next one
      var nxt = slides[(index + 1) % slides.length];
      if (nxt) nxt.removeAttribute('loading');
    }

    slider.querySelector('.cert-next').addEventListener('click', function () { show(index + 1); });
    slider.querySelector('.cert-prev').addEventListener('click', function () { show(index - 1); });

    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(index + 1);
      if (e.key === 'ArrowLeft') show(index - 1);
    });

    // Swipe support
    var frame = slider.querySelector('.cert-frame');
    var startX = null, startY = null;
    frame.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    frame.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(index + (dx < 0 ? 1 : -1));
      startX = startY = null;
    });

    show(0);
  }

  /* ---------- Contact form (FormSubmit) ---------- */
  var form = document.querySelector('.contact-form');
  if (form && window.fetch && window.FormData) {
    var statusEl = form.querySelector('.form-status');
    var submitBtn = form.querySelector('.btn-send-message');
    var btnHTML = submitBtn.innerHTML;
    var fields = form.querySelectorAll('[required]');

    function setStatus(type, html) {
      statusEl.className = 'form-status is-' + type;
      statusEl.innerHTML = html;
      statusEl.hidden = false;
    }

    Array.prototype.forEach.call(fields, function (f) {
      f.addEventListener('input', function () { f.classList.remove('is-invalid'); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Validate
      var firstBad = null;
      Array.prototype.forEach.call(fields, function (f) {
        var ok = f.value.trim() !== '' && f.checkValidity();
        f.classList.toggle('is-invalid', !ok);
        if (!ok && !firstBad) firstBad = f;
      });
      if (firstBad) {
        setStatus('error', 'Please fill in your name, a valid email and a message.');
        firstBad.focus();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      statusEl.hidden = true;

      fetch(form.getAttribute('data-ajax'), {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (r.ok && String(r.data.success) === 'true') {
            form.reset();
            setStatus('success', 'Thank you! Your message has been sent. I’ll get back to you soon.');
          } else {
            throw new Error(r.data && r.data.message || 'Request failed');
          }
        })
        .catch(function () {
          setStatus('error', 'Sorry, the message could not be sent. Please email me directly at <a href="mailto:thanusri1601@gmail.com">thanusri1601@gmail.com</a>.');
        })
        .then(function () {
          submitBtn.disabled = false;
          submitBtn.innerHTML = btnHTML;
        });
    });
  }
})();
