const contactForm = document.getElementById("contact-form");
const contactSuccess = document.getElementById("contact-success");
const contactStatus = document.getElementById("contact-status");
const submitButton = document.getElementById("contact-submit-button");
const submitButtonText = submitButton?.querySelector(".contact-submit__text");
const submitButtonSpinner = submitButton?.querySelector(".contact-submit__spinner");

const TABLE_NAME = "contact_submissions";

function resolveSupabaseClient(options = {}) {
  if (typeof window.getSupabaseClient === "function") {
    return window.getSupabaseClient(options);
  }

  if (!window.supabase || !window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    throw new Error("Supabase client configuration is unavailable.");
  }

  const storageType = options.storageType === "session" ? "session" : "local";
  const cacheKey = storageType === "session" ? "__SUPABASE_CLIENT_SESSION__" : "__SUPABASE_CLIENT_LOCAL__";

  if (window[cacheKey]) {
    return window[cacheKey];
  }

  const config =
    storageType === "session"
      ? {
          auth: {
            storage: window.sessionStorage,
            persistSession: true,
          },
        }
      : {};

  window[cacheKey] = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, config);
  return window[cacheKey];
}

function setLoading(isLoading) {
  if (submitButton) {
    submitButton.disabled = isLoading;
  }

  if (submitButtonSpinner) {
    submitButtonSpinner.hidden = !isLoading;
  }

  if (submitButtonText) {
    submitButtonText.textContent = isLoading ? "Submitting…" : "Submit";
  }

  if (contactStatus && isLoading) {
    contactStatus.hidden = true;
  }
}

function setError(message) {
  if (!contactStatus) return;
  contactStatus.textContent = message;
  contactStatus.classList.add("contact-status--error");
  contactStatus.hidden = false;
}

function clearStatus() {
  if (!contactStatus) return;
  contactStatus.textContent = "";
  contactStatus.classList.remove("contact-status--error");
  contactStatus.hidden = true;
}

function initFormState() {
  clearStatus();
  setLoading(false);
  if (contactSuccess) {
    contactSuccess.hidden = true;
  }
}

initFormState();

if (contactForm && contactSuccess) {
  const supabaseClient = resolveSupabaseClient();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    window.trackAnalyticsEvent?.("submit", "Contact Form", "Contact page submit");

    clearStatus();
    contactSuccess.hidden = true;
    setLoading(true);

    const formData = new FormData(contactForm);
    const full_name = formData.get("name")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const subject = formData.get("subject")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";

    try {
      const { error } = await supabaseClient.from(TABLE_NAME).insert([
        {
          full_name,
          email,
          subject,
          message,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) {
        throw error;
      }

      contactForm.reset();
      contactSuccess.hidden = false;
      contactSuccess.focus();
    } catch (error) {
      console.error("Supabase insert error:", error);
      setError(
        "Sorry, we could not submit your message right now. Please try again in a moment."
      );
    } finally {
      setLoading(false);
    }
  });
}
