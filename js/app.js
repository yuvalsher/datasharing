(() => {
  const DISMISS_KEY = "data-sharing-install-dismissed";
  const installButtons = Array.from(document.querySelectorAll(".install-btn"));
  const banner = document.getElementById("install-banner");
  const dismissBtn = document.getElementById("dismiss-install");
  const iosHint = document.getElementById("ios-install-hint");
  const swStatus = document.getElementById("sw-status");

  let deferredPrompt = null;

  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const isIos = () => {
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua);
    const iPadOs = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return iOS || iPadOs;
  };

  const setInstallVisible = (visible) => {
    installButtons.forEach((btn) => {
      btn.hidden = !visible;
    });
    if (banner) {
      const dismissed = localStorage.getItem(DISMISS_KEY) === "1";
      banner.hidden = !(visible && !dismissed);
    }
  };

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    setInstallVisible(false);
    if (choice.outcome === "accepted" && swStatus) {
      swStatus.textContent = "App installed — you can open it from your home screen.";
    }
  };

  installButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      void promptInstall();
    });
  });

  dismissBtn?.addEventListener("click", () => {
    localStorage.setItem(DISMISS_KEY, "1");
    if (banner) banner.hidden = true;
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (!isStandalone()) {
      setInstallVisible(true);
    }
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    setInstallVisible(false);
    localStorage.removeItem(DISMISS_KEY);
    if (swStatus) {
      swStatus.textContent = "Installed. Offline access is ready.";
    }
  });

  if (isStandalone()) {
    setInstallVisible(false);
    if (iosHint) iosHint.hidden = true;
  } else if (isIos()) {
    if (iosHint) iosHint.hidden = false;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("./sw.js")
        .then((reg) => {
          if (swStatus && !isStandalone()) {
            swStatus.textContent = "Offline-ready service worker registered.";
          }
          reg.update().catch(() => {});
        })
        .catch(() => {
          if (swStatus) {
            swStatus.textContent = "Service worker unavailable in this context.";
          }
        });
    });
  }
})();
