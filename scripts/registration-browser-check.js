/* global window, document, Response, setTimeout */
// Run in agent-browser's eval --stdin on the local /register page after hydration.
// All fetch calls are intercepted in this browser for the duration of the check.
// No real registration request is sent. Reload the page before repeating.
(async () => {
  const check = (condition, label) => { if (!condition) throw new Error(label); };
  const settle = () => new Promise((resolve) => setTimeout(resolve, 100));
  const form = document.querySelector("main form");
  check(form, "Registration form must be visible");
  const originalFetch = window.fetch;
  const duplicateMessage = "Ky email ose numër telefoni është regjistruar më parë.";
  let calls = 0;
  let responseBody = { success: false, saved: false, code: "DUPLICATE_REGISTRATION", message: duplicateMessage };
  let responseStatus = 409;
  let payload;
  window.fetch = async (url, options) => {
    check(url === "/api/register", "Only the registration API is expected");
    calls++;
    payload = JSON.parse(options.body);
    return Response.json(responseBody, { status: responseStatus });
  };
  try {
    const values = {
      firstName: "Test", lastName: "Registration", phone: "+355 (69) 123-4567",
      email: "  TEST@Example.COM  ", school: "Test school", classYear: "12",
      board: "Test board", hobbies: "Reading", motivation: "Synthetic browser check.",
    };
    for (const [name, value] of Object.entries(values)) form.elements.namedItem(name).value = value;
    const originalValues = Object.fromEntries(new FormData(form));
    form.requestSubmit();
    await settle();
    check(calls === 1, "Duplicate attempt must send one request");
    check(payload.email === "test@example.com", "Normalize email before submission");
    check(payload.phone === "+355691234567", "Normalize phone before submission");
    check(document.querySelector("main form") === form, "Duplicate must preserve form");
    check(form.querySelector('[role="alert"]').textContent === duplicateMessage, "Show exact Albanian duplicate message");
    check(!document.querySelector("main .success-panel"), "Duplicate must not show success");
    check(JSON.stringify(Object.fromEntries(new FormData(form))) === JSON.stringify(originalValues), "Duplicate must preserve all entered values");
    check(!form.querySelector('button[type="submit"]').disabled, "Duplicate must release submit button");

    responseBody = { success: false, message: "Regjistrimi nuk u konfirmua. Provo përsëri më vonë." };
    responseStatus = 503;
    form.requestSubmit();
    await settle();
    check(form.querySelector('[role="alert"]').textContent === responseBody.message, "Generic failure still renders");
    check(!document.querySelector("main .success-panel"), "Generic failure must not show success");

    responseBody = { success: true };
    responseStatus = 201;
    form.requestSubmit();
    await settle();
    check(document.querySelector("main form") === form, "Unconfirmed save must not show success");

    responseBody = { success: true, saved: true };
    form.requestSubmit();
    await settle();
    check(document.querySelector("main .success-panel"), "Confirmed 201 must show success");
    check(!document.querySelector("main form"), "Confirmed success replaces form");
    check(document.activeElement.id === "registration-title", "Focus confirmation heading");
    return "PASS: duplicate 409 message, no false success, preserved inputs, normalized payload, retry enabled, generic 503, strict confirmed-save success. Browser-only responses; no database writes.";
  } finally { window.fetch = originalFetch; }
})();
