/**
 * pwa-app.js
 * Apli PMPML Progressive Web App Controller
 * Handles Service Worker registration, version checking, install prompts, update toasts, and offline state notifications.
 */
(function () {
  'use strict';

  let deferredPrompt = null;
  let newWorker = null;
  let currentRegistration = null;

  // 1. REGISTER SERVICE WORKER & VERSION CHECKING
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' })
        .then(function (registration) {
          currentRegistration = registration;
          console.log('[PWA] Service Worker registered with scope:', registration.scope);

          // Check for app version updates against version.json
          checkForAppUpdates(registration);

          // Check if an update is already waiting
          if (registration.waiting) {
            showUpdateToast(registration.waiting);
          }

          // Listen for new service worker installing
          registration.onupdatefound = function () {
            const installingWorker = registration.installing;
            if (!installingWorker) return;

            installingWorker.onstatechange = function () {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New service worker version found and installed!');
                showUpdateToast(installingWorker);
              }
            };
          };
        })
        .catch(function (error) {
          console.error('[PWA] Service Worker registration failed:', error);
        });

      // Reload page when new service worker takes over
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });

    // Re-check version on window focus
    window.addEventListener('focus', function () {
      if (currentRegistration) {
        checkForAppUpdates(currentRegistration);
      }
    });
  }

  // Check version.json live from network
  function checkForAppUpdates(registration) {
    if (!navigator.onLine) return;

    fetch('./version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (response) {
        if (response.ok) {
          return response.json();
        }
      })
      .then(function (data) {
        if (!data || !data.version) return;

        const storedVersion = localStorage.getItem('apli_pmpml_version');
        console.log('[PWA] Current build version:', data.version, '| Stored:', storedVersion);

        if (storedVersion && storedVersion !== data.version) {
          console.log('[PWA] Deployed version differs from client version! Triggering service worker update...');
          registration.update().then(function () {
            localStorage.setItem('apli_pmpml_version', data.version);
          });
        } else {
          localStorage.setItem('apli_pmpml_version', data.version);
        }
      })
      .catch(function (err) {
        console.warn('[PWA] Could not fetch version.json:', err);
      });
  }

  // 2. CHECK INSTALLED STATE
  function isAppInstalled() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    );
  }

  // 3. PWA INSTALL PROMPT HANDLER
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;

    if (!isAppInstalled()) {
      showInstallBanner();
    }
  });

  window.addEventListener('appinstalled', function () {
    console.log('[PWA] App successfully installed');
    deferredPrompt = null;
    hideInstallBanner();
  });

  // 4. CREATE UI COMPONENTS (Install Banner, Update Toast, Offline Banner)
  document.addEventListener('DOMContentLoaded', function () {
    createPwaUiElements();
    setupNetworkStatusListeners();
  });

  function createPwaUiElements() {
    if (document.getElementById('pwa-install-banner')) return;

    const container = document.createElement('div');
    container.id = 'pwa-container';
    container.innerHTML = `
      <!-- Install Banner -->
      <div id="pwa-install-banner" class="pwa-banner hidden" role="dialog" aria-label="Install App">
        <div class="pwa-banner-content">
          <img src="./assets/PMPML-LOGO.png" alt="Apli PMPML Logo" class="pwa-banner-logo">
          <div class="pwa-banner-text">
            <strong>Install Apli PMPML</strong>
            <span>Quick access & offline bus schedule support</span>
          </div>
        </div>
        <div class="pwa-banner-actions">
          <button id="pwa-install-btn" class="pwa-btn primary">Install</button>
          <button id="pwa-dismiss-btn" class="pwa-btn secondary" aria-label="Dismiss">✕</button>
        </div>
      </div>

      <!-- Update Notification Toast -->
      <div id="pwa-update-toast" class="pwa-toast hidden" role="alert">
        <div class="pwa-toast-text">
          <strong>New Version Available</strong>
          <span>An updated version of Apli PMPML is ready.</span>
        </div>
        <button id="pwa-update-btn" class="pwa-btn primary">Update Now</button>
      </div>

      <!-- Offline Indicator -->
      <div id="pwa-offline-indicator" class="pwa-offline-bar hidden" role="status">
        ⚠️ Offline Mode: Showing cached schedule and pages.
      </div>
    `;
    document.body.appendChild(container);

    // Install Button Handler
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) {
      installBtn.addEventListener('click', function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.then(function (choiceResult) {
            if (choiceResult.outcome === 'accepted') {
              console.log('[PWA] User accepted install prompt');
            } else {
              console.log('[PWA] User dismissed install prompt');
            }
            deferredPrompt = null;
            hideInstallBanner();
          });
        }
      });
    }

    // Dismiss Button Handler
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', function () {
        hideInstallBanner();
        sessionStorage.setItem('pwa_install_dismissed', 'true');
      });
    }

    // Check if dismissed in current session
    if (sessionStorage.getItem('pwa_install_dismissed') === 'true') {
      hideInstallBanner();
    }
  }

  function showInstallBanner() {
    if (isAppInstalled()) return;
    if (sessionStorage.getItem('pwa_install_dismissed') === 'true') return;
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.remove('hidden');
    }
  }

  function hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.classList.add('hidden');
    }
  }

  function showUpdateToast(worker) {
    newWorker = worker;
    const toast = document.getElementById('pwa-update-toast');
    const updateBtn = document.getElementById('pwa-update-btn');

    if (toast && updateBtn) {
      toast.classList.remove('hidden');
      updateBtn.onclick = function () {
        if (newWorker) {
          newWorker.postMessage({ type: 'SKIP_WAITING' });
        }
      };
    }
  }

  // 5. NETWORK STATUS LISTENER
  function setupNetworkStatusListeners() {
    function updateOnlineStatus() {
      const indicator = document.getElementById('pwa-offline-indicator');
      if (!indicator) return;

      if (navigator.onLine) {
        indicator.classList.add('hidden');
        if (currentRegistration) {
          checkForAppUpdates(currentRegistration);
        }
      } else {
        indicator.classList.remove('hidden');
      }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if (!navigator.onLine) {
      updateOnlineStatus();
    }
  }

})();
