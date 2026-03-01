/**
 * Al-Forqan Quran School – Registration App Logic
 * Handles form validation, submission, and confirmation display.
 */

'use strict';

/* ---- Utilities -------------------------------------------------- */

/**
 * Generate a short registration ID (e.g. AFQ-20260301-A3B2).
 */
function generateRegId() {
  const now = new Date();
  const datePart = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AFQ-${datePart}-${rand}`;
}

/**
 * Basic email format check.
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Phone: allow digits, spaces, +, -, () — at least 7 digits.
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && /^[0-9\s+\-().]+$/.test(phone.trim());
}

/* ---- Field validation -------------------------------------------
   Each validator returns an error string, or '' if valid.
------------------------------------------------------------------- */
const validators = {
  studentNameAr(v) {
    if (!v.trim()) return 'الاسم الكامل مطلوب.';
    if (v.trim().length < 3) return 'يجب أن يحتوي الاسم على 3 أحرف على الأقل.';
    return '';
  },
  studentNameEn(v) {
    if (!v.trim()) return 'Full name in English is required.';
    if (v.trim().length < 3) return 'Name must be at least 3 characters.';
    return '';
  },
  dateOfBirth(v) {
    if (!v) return 'Date of birth is required.';
    const dob = new Date(v);
    const today = new Date();
    if (isNaN(dob.getTime())) return 'Invalid date.';
    if (dob >= today) return 'Date of birth must be in the past.';
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    if (age < 4) return 'Student must be at least 4 years old.';
    if (age > 100) return 'Please enter a valid date of birth.';
    return '';
  },
  gender(v) {
    if (!v) return 'Please select a gender.';
    return '';
  },
  guardianRelation(v) {
    if (!v) return 'Please select a relationship.';
    return '';
  },
  guardianName(v) {
    if (!v.trim()) return "Parent / guardian name is required.";
    if (v.trim().length < 3) return 'Name must be at least 3 characters.';
    return '';
  },
  guardianPhone(v) {
    if (!v.trim()) return 'Phone number is required.';
    if (!isValidPhone(v)) return 'Please enter a valid phone number.';
    return '';
  },
  guardianEmail(v) {
    if (v.trim() && !isValidEmail(v)) return 'Please enter a valid email address.';
    return '';
  },
  quranLevel(v) {
    if (!v) return 'Please select a Quran level.';
    return '';
  },
  preferredTime(v) {
    if (!v) return 'Please select a preferred schedule.';
    return '';
  },
};

/* ---- DOM helpers ------------------------------------------------ */

/**
 * Mark a form group valid or invalid and display error text.
 * @param {HTMLElement} group  .form-group element
 * @param {string} errorMsg   empty string = valid
 */
function setValidity(group, errorMsg) {
  const errEl = group.querySelector('.field-error');
  if (errorMsg) {
    group.classList.add('invalid');
    if (errEl) errEl.textContent = errorMsg;
  } else {
    group.classList.remove('invalid');
    if (errEl) errEl.textContent = '';
  }
}

/**
 * Validate a single form group by its input/select name.
 * @param {HTMLFormElement} form
 * @param {string} fieldName
 * @returns {boolean} true if valid
 */
function validateField(form, fieldName) {
  const el = form.elements[fieldName];
  if (!el) return true;
  const group = el.closest('.form-group');
  if (!group) return true;
  const validator = validators[fieldName];
  if (!validator) return true;
  const error = validator(el.value);
  setValidity(group, error);
  return error === '';
}

/* ---- Registration form initialisation ----------------------- */

function initRegistrationForm() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  const successBanner = document.getElementById('success-banner');
  const regIdEl = document.getElementById('generated-reg-id');

  /* Live validation on blur */
  Object.keys(validators).forEach(name => {
    const el = form.elements[name];
    if (el) {
      el.addEventListener('blur', () => validateField(form, name));
      el.addEventListener('input', () => {
        /* Clear error while typing once user has already blurred */
        if (el.closest('.form-group').classList.contains('invalid')) {
          validateField(form, name);
        }
      });
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    /* Validate all fields */
    const validFlags = Object.keys(validators).map(name => validateField(form, name));
    const allValid = validFlags.every(Boolean);

    if (!allValid) {
      /* Scroll to first invalid field */
      const firstInvalid = form.querySelector('.form-group.invalid');
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Collect form data */
    const data = Object.fromEntries(new FormData(form).entries());
    data.regId = generateRegId();
    data.submittedAt = new Date().toISOString();

    /* Persist to localStorage (school admin can export from browser) */
    try {
      const existing = JSON.parse(localStorage.getItem('afq_registrations') || '[]');
      existing.push(data);
      localStorage.setItem('afq_registrations', JSON.stringify(existing));
    } catch (_) { /* storage unavailable – silently continue */ }

    /* Show success banner */
    if (regIdEl) regIdEl.textContent = data.regId;
    if (successBanner) {
      successBanner.classList.add('visible');
      successBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* Hide the form */
    form.style.display = 'none';
    const formFooter = document.getElementById('form-footer');
    if (formFooter) formFooter.style.display = 'none';
  });
}

/* ---- Bootstrap on DOM ready --------------------------------- */
document.addEventListener('DOMContentLoaded', initRegistrationForm);
