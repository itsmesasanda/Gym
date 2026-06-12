import * as Sentry from "@sentry/react-native";

/**
 * Central error/observability helpers on top of Sentry.
 *
 * Crashes are captured automatically by Sentry. These helpers add the things a
 * non-technical beta needs: who the user is, explicit reporting of caught
 * failures that wouldn't otherwise crash, and a user-driven feedback channel.
 */

// Tie every subsequent event to a user so a report maps to a real person.
export const setSentryUser = (email) => {
  try {
    Sentry.setUser(email ? { email } : null);
  } catch {}
};

// Report a caught error that would otherwise be swallowed (e.g. a failed API
// call that only shows an Alert). `context` is attached as extra data.
export const reportError = (error, context = {}) => {
  try {
    const err = error instanceof Error ? error : new Error(String(error));
    Sentry.captureException(err, { extra: context });
  } catch {}
  if (__DEV__) console.error("[report]", error, context);
};

// Send a user's "Report a Problem" note as a Sentry event (user context is
// already attached via setSentryUser).
export const reportFeedback = (message, context = {}) => {
  try {
    Sentry.captureMessage(`User report: ${message}`, { level: "info", extra: context });
    return true;
  } catch {
    return false;
  }
};

// Lightweight trail of failed requests. Breadcrumbs ride along with the next
// real event (they don't count against the Sentry quota) so a crash report
// shows which API calls failed just before it.
export const addRequestBreadcrumb = (url, info = {}) => {
  try {
    Sentry.addBreadcrumb({ category: "fetch", level: "error", message: `Request failed: ${url}`, data: info });
  } catch {}
};
