(function() {
  'use strict';

  if (!window.__app) {
    window.__app = {};
  }

  var app = window.__app;

  if (app._initialized) {
    return;
  }

  function debounce(func, wait) {
    var timeout;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function() {
        func.apply(context, args);
      }, wait);
    };
  }

  function throttle(func, limit) {
    var inThrottle;
    return function() {
      var args = arguments;
      var context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(function() {
          inThrottle = false;
        }, limit);
      }
    };
  }

  function initBurgerMenu() {
    if (app._burgerInit) return;
    app._burgerInit = true;

    var nav = document.querySelector('.c-nav, .navbar-collapse');
    var toggle = document.querySelector('.c-nav__toggle, .navbar-toggler');
    var navList = document.querySelector('.c-nav__list, .navbar-nav');
    var navLinks = document.querySelectorAll('.c-nav__link, .nav-link');
    var body = document.body;

    if (!nav || !toggle || !navList) return;

    var focusableElements = [];
    var firstFocusable = null;
    var lastFocusable = null;

    function updateFocusableElements() {
      focusableElements = Array.from(navList.querySelectorAll('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(function(el) {
        return el.offsetParent !== null;
      });
      firstFocusable = focusableElements[0];
      lastFocusable = focusableElements[focusableElements.length - 1];
    }

    function openMenu() {
      nav.classList.add('is-open', 'show');
      toggle.setAttribute('aria-expanded', 'true');
      body.classList.add('u-no-scroll');
      updateFocusableElements();
      if (firstFocusable) {
        setTimeout(function() {
          firstFocusable.focus();
        }, 100);
      }
    }

    function closeMenu() {
      nav.classList.remove('is-open', 'show');
      toggle.setAttribute('aria-expanded', 'false');
      body.classList.remove('u-no-scroll');
    }

    function trapFocus(e) {
      if (!nav.classList.contains('is-open')) return;

      if (e.key === 'Tab' || e.keyCode === 9) {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    }

    toggle.addEventListener('click', function(e) {
      e.preventDefault();
      if (nav.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if ((e.key === 'Escape' || e.keyCode === 27) && nav.classList.contains('is-open')) {
        closeMenu();
        toggle.focus();
      }
      trapFocus(e);
    });

    document.addEventListener('click', function(e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && !toggle.contains(e.target)) {
        closeMenu();
      }
    });

    for (var i = 0; i < navLinks.length; i++) {
      navLinks[i].addEventListener('click', function() {
        if (nav.classList.contains('is-open')) {
          closeMenu();
        }
      });
    }

    var resizeHandler = debounce(function() {
      if (window.innerWidth >= 1024) {
        closeMenu();
      }
    }, 200);

    window.addEventListener('resize', resizeHandler);
  }

  function initSmoothScroll() {
    if (app._smoothScrollInit) return;
    app._smoothScrollInit = true;

    var isHomePage = window.location.pathname === '/' || window.location.pathname.endsWith('/index.html') || window.location.pathname === '';

    if (!isHomePage) {
      var sectionLinks = document.querySelectorAll('a[href^="#"]');
      for (var i = 0; i < sectionLinks.length; i++) {
        var link = sectionLinks[i];
        var href = link.getAttribute('href');
        if (href && href !== '#' && href !== '#!' && href.length > 1) {
          link.setAttribute('href', '/' + href);
        }
      }
    }

    function getHeaderHeight() {
      var header = document.querySelector('.l-header, header');
      return header ? header.offsetHeight : 64;
    }

    function smoothScrollTo(target) {
      var headerHeight = getHeaderHeight();
      var targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

      if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      } else {
        window.scrollTo(0, targetPosition);
      }
    }

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }

      if (!target) return;

      var href = target.getAttribute('href');
      if (!href || href === '#' || href === '#!') return;

      if (href.startsWith('#')) {
        var targetElement = document.querySelector(href);
        if (targetElement) {
          e.preventDefault();
          smoothScrollTo(targetElement);
          history.pushState(null, '', href);
        }
      }
    });

    if (window.location.hash) {
      setTimeout(function() {
        var targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
          smoothScrollTo(targetElement);
        }
      }, 300);
    }
  }

  function initScrollSpy() {
    if (app._scrollSpyInit) return;
    app._scrollSpyInit = true;

    var navLinks = document.querySelectorAll('.c-nav__link[href^="#"], .nav-link[href^="#"]');
    if (navLinks.length === 0) return;

    var sections = [];
    for (var i = 0; i < navLinks.length; i++) {
      var href = navLinks[i].getAttribute('href');
      if (href && href !== '#' && href.length > 1) {
        var section = document.querySelector(href);
        if (section) {
          sections.push({
            link: navLinks[i],
            section: section,
            id: href
          });
        }
      }
    }

    if (sections.length === 0) return;

    function updateActiveLink() {
      var scrollPosition = window.pageYOffset + 100;

      for (var i = sections.length - 1; i >= 0; i--) {
        var item = sections[i];
        var sectionTop = item.section.offsetTop;

        if (scrollPosition >= sectionTop) {
          for (var j = 0; j < sections.length; j++) {
            sections[j].link.classList.remove('active', 'is-active');
            sections[j].link.removeAttribute('aria-current');
          }
          item.link.classList.add('active', 'is-active');
          item.link.setAttribute('aria-current', 'page');
          return;
        }
      }
    }

    var scrollHandler = throttle(updateActiveLink, 100);
    window.addEventListener('scroll', scrollHandler);
    updateActiveLink();
  }

  function initActiveMenu() {
    if (app._activeMenuInit) return;
    app._activeMenuInit = true;

    var navLinks = document.querySelectorAll('.c-nav__link, .nav-link');
    var currentPath = window.location.pathname;

    if (currentPath.endsWith('/')) {
      currentPath = currentPath.slice(0, -1);
    }

    for (var i = 0; i < navLinks.length; i++) {
      var link = navLinks[i];
      var linkPath = link.getAttribute('href');

      if (!linkPath || linkPath.startsWith('#')) continue;

      var normalizedLinkPath = linkPath;
      if (normalizedLinkPath.endsWith('/')) {
        normalizedLinkPath = normalizedLinkPath.slice(0, -1);
      }

      if (normalizedLinkPath === currentPath || 
          (currentPath === '' && (normalizedLinkPath === '/' || normalizedLinkPath === '/index.html')) ||
          (currentPath === '/' && (normalizedLinkPath === '' || normalizedLinkPath === '/index.html')) ||
          (currentPath === '/index.html' && (normalizedLinkPath === '' || normalizedLinkPath === '/'))) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('active');
      } else {
        link.removeAttribute('aria-current');
        link.classList.remove('active');
      }
    }
  }

  function initFormValidation() {
    if (app._formValidationInit) return;
    app._formValidationInit = true;

    var forms = document.querySelectorAll('form, .c-form');

    var patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\+]?[\d\s\-\(\)]{10,20}$/,
      name: /^[a-zA-ZÀ-ÿ\s\-']{2,50}$/
    };

    function validateField(field) {
      var value = field.value.trim();
      var type = field.type;
      var id = field.id || field.name;
      var isValid = true;
      var message = '';

      if (field.hasAttribute('required') && !value) {
        isValid = false;
        message = 'Šis lauks ir obligāts';
      } else if (value) {
        if (type === 'email' || id.includes('email')) {
          if (!patterns.email.test(value)) {
            isValid = false;
            message = 'Ievadiet derīgu e-pasta adresi';
          }
        } else if (type === 'tel' || id.includes('phone')) {
          if (!patterns.phone.test(value)) {
            isValid = false;
            message = 'Ievadiet derīgu tālruņa numuru';
          }
        } else if (id.includes('name') || id.includes('Name')) {
          if (!patterns.name.test(value)) {
            isValid = false;
            message = 'Ievadiet derīgu vārdu';
          }
        } else if (field.tagName === 'TEXTAREA' && field.hasAttribute('minlength')) {
          var minLength = parseInt(field.getAttribute('minlength'));
          if (value.length < minLength) {
            isValid = false;
            message = 'Ziņojumam jābūt vismaz ' + minLength + ' rakstzīmēm';
          }
        }
      }

      if (field.type === 'checkbox' && field.hasAttribute('required') && !field.checked) {
        isValid = false;
        message = 'Jums jāpiekrīt, lai turpinātu';
      }

      return { isValid: isValid, message: message };
    }

    function showError(field, message) {
      field.classList.add('is-invalid', 'has-error');
      field.setAttribute('aria-invalid', 'true');

      var errorId = field.id + '-error';
      var errorElement = document.getElementById(errorId);

      if (!errorElement) {
        errorElement = field.parentElement.querySelector('.c-form__error, .invalid-feedback');
      }

      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('is-visible', 'd-block');
        field.setAttribute('aria-describedby', errorElement.id || errorId);
      }
    }

    function clearError(field) {
      field.classList.remove('is-invalid', 'has-error');
      field.removeAttribute('aria-invalid');

      var errorId = field.id + '-error';
      var errorElement = document.getElementById(errorId);

      if (!errorElement) {
        errorElement = field.parentElement.querySelector('.c-form__error, .invalid-feedback');
      }

      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('is-visible', 'd-block');
      }
    }

    function createNotification(message, type) {
      var container = document.getElementById('notification-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
      }

      var alert = document.createElement('div');
      alert.className = 'alert alert-' + (type || 'info') + ' alert-dismissible fade show';
      alert.setAttribute('role', 'alert');
      alert.innerHTML = message + '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
      container.appendChild(alert);

      var closeBtn = alert.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          alert.classList.remove('show');
          setTimeout(function() {
            if (alert.parentNode) {
              alert.parentNode.removeChild(alert);
            }
          }, 150);
        });
      }

      setTimeout(function() {
        alert.classList.remove('show');
        setTimeout(function() {
          if (alert.parentNode) {
            alert.parentNode.removeChild(alert);
          }
        }, 150);
      }, 5000);
    }

    for (var i = 0; i < forms.length; i++) {
      (function(form) {
        var fields = form.querySelectorAll('input, textarea, select');
        var submitBtn = form.querySelector('button[type="submit"], .c-button[type="submit"]');
        var submissionTime = 0;

        for (var j = 0; j < fields.length; j++) {
          (function(field) {
            field.addEventListener('blur', function() {
              var validation = validateField(field);
              if (!validation.isValid) {
                showError(field, validation.message);
              } else {
                clearError(field);
              }
            });

            field.addEventListener('input', function() {
              if (field.classList.contains('is-invalid')) {
                clearError(field);
              }
            });
          })(fields[j]);
        }

        form.addEventListener('submit', function(e) {
          e.preventDefault();
          e.stopPropagation();

          var currentTime = Date.now();
          if (currentTime - submissionTime < 3000) {
            return;
          }

          var isFormValid = true;
          var firstInvalidField = null;

          for (var k = 0; k < fields.length; k++) {
            var field = fields[k];
            var validation = validateField(field);

            if (!validation.isValid) {
              showError(field, validation.message);
              isFormValid = false;
              if (!firstInvalidField) {
                firstInvalidField = field;
              }
            } else {
              clearError(field);
            }
          }

          if (!isFormValid) {
            if (firstInvalidField) {
              firstInvalidField.focus();
            }
            return;
          }

          if (!submitBtn) return;

          submissionTime = currentTime;

          var originalText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.classList.add('is-disabled');
          submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Sūta...';

          var formData = new FormData(form);
          var data = {};
          formData.forEach(function(value, key) {
            data[key] = value;
          });

          setTimeout(function() {
            submitBtn.disabled = false;
            submitBtn.classList.remove('is-disabled');
            submitBtn.innerHTML = originalText;

            createNotification('Jūsu ziņojums ir veiksmīgi nosūtīts!', 'success');
            form.reset();

            for (var m = 0; m < fields.length; m++) {
              clearError(fields[m]);
            }

            setTimeout(function() {
              window.location.href = 'thank_you.html';
            }, 1500);
          }, 1500);
        });
      })(forms[i]);
    }

    app.notify = createNotification;
  }

  function initCookieBanner() {
    if (app._cookieInit) return;
    app._cookieInit = true;

    var banner = document.querySelector('.cookie-banner');
    if (!banner) return;

    var acceptBtn = document.getElementById('acceptCookies');
    var rejectBtn = document.getElementById('rejectCookies');

    var cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent) {
      banner.remove();
      return;
    }

    if (acceptBtn) {
      acceptBtn.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'accepted');
        banner.remove();
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', function() {
        localStorage.setItem('cookieConsent', 'rejected');
        banner.remove();
      });
    }
  }

  function initScrollToTop() {
    if (app._scrollTopInit) return;
    app._scrollTopInit = true;

    var scrollTopBtn = document.querySelector('[data-scroll-top], .c-button--scroll-top');
    if (!scrollTopBtn) return;

    function toggleVisibility() {
      if (window.pageYOffset > 300) {
        scrollTopBtn.classList.add('is-visible');
      } else {
        scrollTopBtn.classList.remove('is-visible');
      }
    }

    scrollTopBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });

    var scrollHandler = throttle(toggleVisibility, 200);
    window.addEventListener('scroll', scrollHandler);
    toggleVisibility();
  }

  function initImages() {
    if (app._imagesInit) return;
    app._imagesInit = true;

    var images = document.querySelectorAll('img');

    function createPlaceholderSVG() {
      return 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect fill="#e9ecef" width="400" height="300"/><text fill="#6c757d" font-family="sans-serif" font-size="18" x="50%" y="50%" text-anchor="middle" dy=".3em">Image unavailable</text></svg>'
      );
    }

    for (var i = 0; i < images.length; i++) {
      var img = images[i];
      var isLogo = img.classList.contains('c-logo__img');
      var isCritical = img.hasAttribute('data-critical');

      if (!img.hasAttribute('loading') && !isLogo && !isCritical) {
        img.setAttribute('loading', 'lazy');
      }

      if (!img.classList.contains('img-fluid')) {
        img.classList.add('img-fluid');
      }

      (function(image, isLogoImg) {
        image.addEventListener('error', function() {
          image.src = createPlaceholderSVG();
          image.alt = 'Image not available';
          if (isLogoImg) {
            image.style.maxHeight = '40px';
          }
        });
      })(img, isLogo);
    }
  }

  function initCountUp() {
    if (app._countUpInit) return;
    app._countUpInit = true;

    var stats = document.querySelectorAll('[data-count]');
    if (stats.length === 0) return;

    function animateCount(element) {
      var target = parseInt(element.getAttribute('data-count'));
      var duration = parseInt(element.getAttribute('data-duration')) || 2000;
      var start = 0;
      var increment = target / (duration / 16);
      var current = start;

      function updateCount() {
        current += increment;
        if (current < target) {
          element.textContent = Math.floor(current);
          requestAnimationFrame(updateCount);
        } else {
          element.textContent = target;
        }
      }

      updateCount();
    }

    for (var i = 0; i < stats.length; i++) {
      (function(stat) {
        var hasAnimated = false;
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting && !hasAnimated) {
              hasAnimated = true;
              animateCount(stat);
              observer.unobserve(stat);
            }
          });
        }, { threshold: 0.5 });

        observer.observe(stat);
      })(stats[i]);
    }
  }

  app.init = function() {
    if (app._initialized) return;
    app._initialized = true;

    initBurgerMenu();
    initSmoothScroll();
    initScrollSpy();
    initActiveMenu();
    initFormValidation();
    initCookieBanner();
    initScrollToTop();
    initImages();
    initCountUp();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', app.init);
  } else {
    app.init();
  }

})();