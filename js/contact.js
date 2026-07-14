/* =========================================================
   ANANT MEDIA — CONTACT PAGE LOGIC (contact.html only)
   Direct conversation delivery through /api/send + Resend.
   ========================================================= */

(function () {

  const isTouch = window.matchMedia(
    "(hover: none), (pointer: coarse)"
  ).matches;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Ambient cursor-follow light ---------- */

  function initLightField() {
    if (isTouch || reducedMotion) return;

    window.addEventListener(
      "mousemove",
      (e) => {
        const xPct = (e.clientX / window.innerWidth) * 100;
        const yPct = (e.clientY / window.innerHeight) * 100;

        document.body.style.setProperty("--mx", xPct + "%");
        document.body.style.setProperty("--my", yPct + "%");
      },
      { passive: true }
    );
  }

  /* ---------- Pill selector ---------- */

  function initPills() {
    const pills = document.querySelectorAll(".idea-pill");

    pills.forEach((pill) => {
      pill.addEventListener("click", () => {
        pills.forEach((p) =>
          p.setAttribute("aria-pressed", "false")
        );

        pill.setAttribute("aria-pressed", "true");

        const selected =
          pill.dataset.value || pill.textContent.trim();

        const hidden =
          document.getElementById("idea-category");

        if (hidden) {
          hidden.value = selected;
        }
      });
    });
  }

  /* ---------- Editorial validation ---------- */

  function showError(fieldId, message) {
    const errorEl =
      document.getElementById(fieldId + "-error");

    if (!errorEl) return;

    errorEl.textContent = message;
    errorEl.classList.add("is-visible");
  }

  function clearError(fieldId) {
    const errorEl =
      document.getElementById(fieldId + "-error");

    if (!errorEl) return;

    errorEl.classList.remove("is-visible");
    errorEl.textContent = "";
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* ---------- Channel status ---------- */

  function setChannelStatus(statusEl, message, state = "") {
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.classList.add("is-visible");

    statusEl.classList.remove(
      "is-success",
      "is-error",
      "is-loading"
    );

    if (state) {
      statusEl.classList.add(`is-${state}`);
    }
  }

  /* ---------- Reset idea selector ---------- */

  function resetPills() {
    const pills = document.querySelectorAll(".idea-pill");
    const categoryEl =
      document.getElementById("idea-category");

    pills.forEach((pill) =>
      pill.setAttribute("aria-pressed", "false")
    );

    if (categoryEl) {
      categoryEl.value = "";
    }
  }

  /* ---------- Direct Resend submission ---------- */

  function initForm() {
    const form = document.getElementById("idea-form");

    if (!form) return;

    const statusEl =
      document.getElementById("channel-status");

    const submitButton = form.querySelector(
      'button[type="submit"]'
    );

    let isSubmitting = false;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (isSubmitting) return;

      const nameEl =
        document.getElementById("idea-name");

      const emailEl =
        document.getElementById("idea-email");

      const messageEl =
        document.getElementById("idea-message");

      const referenceEl =
        document.getElementById("idea-reference");

      const categoryEl =
        document.getElementById("idea-category");

      const name = nameEl.value.trim();
      const email = emailEl.value.trim();
      const message = messageEl.value.trim();

      const reference = referenceEl
        ? referenceEl.value.trim()
        : "";

      const category = categoryEl
        ? categoryEl.value.trim()
        : "";

      [
        "idea-name",
        "idea-email",
        "idea-message",
      ].forEach(clearError);

      let valid = true;

      if (!name) {
        showError(
          "idea-name",
          "WE NEED A NAME TO BEGIN."
        );

        valid = false;
      }

      if (!email || !isValidEmail(email)) {
        showError(
          "idea-email",
          "WHERE SHOULD THE REPLY FIND YOU?"
        );

        valid = false;
      }

      if (!message) {
        showError(
          "idea-message",
          "GIVE THE IDEA A FEW WORDS."
        );

        valid = false;
      }

      if (!valid) return;

      isSubmitting = true;

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute(
          "aria-disabled",
          "true"
        );
      }

      setChannelStatus(
        statusEl,
        "OPENING THE CHANNEL…",
        "loading"
      );

      try {
        const response = await fetch("/api/send", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name,
            email,
            ideaType: category,
            message,
            reference,
          }),
        });

        let result = null;

        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (!response.ok || !result?.success) {
          throw new Error(
            result?.message ||
            "The channel did not open."
          );
        }

        setChannelStatus(
          statusEl,
          "CHANNEL OPEN. YOUR IDEA IS ON ITS WAY.",
          "success"
        );

        form.reset();
        resetPills();

        window.setTimeout(() => {
          if (!statusEl) return;

          statusEl.textContent =
            "I'LL MEET YOU ON THE OTHER SIDE.";

          statusEl.classList.remove("is-loading");
          statusEl.classList.add("is-success");
        }, reducedMotion ? 0 : 1800);

      } catch (error) {
        console.error(
          "ANANT MEDIA contact error:",
          error
        );

        setChannelStatus(
          statusEl,
          "THE CHANNEL DIDN'T OPEN. TRY AGAIN IN A MOMENT.",
          "error"
        );

      } finally {
        isSubmitting = false;

        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute(
            "aria-disabled"
          );
        }
      }
    });
  }

  /* ---------- Bootstrap ---------- */

  document.addEventListener(
    "DOMContentLoaded",
    () => {
      initLightField();
      initPills();
      initForm();
    }
  );

})();