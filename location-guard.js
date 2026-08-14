/**
 * location-guard.js
 * Include this script in every app page (except location.html itself).
 * If the device/browser location is denied, it immediately redirects
 * to location.html. The user cannot access any app page until location
 * is enabled.
 */
(function () {
  'use strict';

  // Don't guard location.html itself
  if (window.location.pathname.endsWith('location.html')) return;

  if (!navigator.geolocation) return; // geolocation not supported — allow access

  function redirectToLocation() {
    window.location.replace('./location.html');
  }

  function tryGetPosition(onGranted, onDenied) {
    navigator.geolocation.getCurrentPosition(
      onGranted,
      function (err) {
        if (err.code === err.PERMISSION_DENIED) {
          onDenied();
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
    );
  }

  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then(function (result) {
      if (result.state === 'denied') {
        redirectToLocation();
      } else if (result.state === 'prompt') {
        // Ask the browser — if user denies, redirect
        tryGetPosition(function () { /* granted, stay */ }, redirectToLocation);
      }
      // 'granted' → stay on the page

      // React to live permission changes (e.g. user revokes from browser settings)
      result.onchange = function () {
        if (this.state === 'denied') {
          redirectToLocation();
        }
      };
    }).catch(function () {
      // Permissions API not supported; silently try once
      tryGetPosition(function () { /* ok */ }, redirectToLocation);
    });
  } else {
    // Fallback for browsers without Permissions API
    tryGetPosition(function () { /* ok */ }, redirectToLocation);
  }
})();
