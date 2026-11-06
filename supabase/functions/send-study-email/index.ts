import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createAcademicEmail,
  normalizeAcademicRows,
  parseAllowedOrigins,
  requiresReminderOptIn,
  validateEmailRequest,
} from "./emailLogic.js";

const baseHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
  Vary: "Origin",
};

const htmlEscapeCharacters: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

const response = (
  body: Record<string, unknown>,
  status = 200,
  headers: Record<string, string> = baseHeaders,
) => new Response(JSON.stringify(body), { status, headers });

const isValidEmail = (value: unknown): value is string =>
  typeof value === "string"
  && value.length <= 254
  && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const cleanString = (value: unknown, maximumLength: number) =>
  typeof value === "string"
  && value.trim().length > 0
  && value.trim().length <= maximumLength
  && !/[\u0000-\u001f\u007f]/.test(value)
    ? value.trim()
    : null;

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => (
  htmlEscapeCharacters[character] || character
));

const formatDate = (value: string) => new Date(`${value}T00:00:00.000Z`)
  .toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const renderEmail = (
  name: string,
  email: { subject: string; sections: Array<{ heading: string; lines: string[] }> },
) => {
  const safeName = escapeHtml(name);
  const htmlSections = email.sections.map((section) => (
    `<section style="margin:24px 0 0"><h2 style="margin:0 0 10px;font-size:18px;color:#0c4a6e">${escapeHtml(section.heading)}</h2>${section.lines.map((line) => `<p style="margin:0 0 10px;line-height:1.6;color:#334155">${escapeHtml(line)}</p>`).join("")}</section>`
  )).join("");
  const textSections = email.sections.map((section) => (
    `${section.heading}\n${section.lines.join("\n")}`
  )).join("\n\n");

  return {
    subject: email.subject,
    html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a"><main style="width:100%;max-width:600px;margin:0 auto;padding:24px 14px"><article style="background:#fff;border:1px solid #dbeafe;border-radius:14px;padding:24px"><p style="margin:0 0 18px;font-size:13px;font-weight:bold;letter-spacing:.08em;color:#0284c7">STUDYTRACK</p><p style="margin:0 0 8px">Hello ${safeName},</p>${htmlSections}<p style="margin:24px 0 0;color:#64748b;font-size:12px">You can manage reminder preferences in StudyTrack.</p></article></main></body></html>`,
    text: `StudyTrack\n\nHello ${name},\n\n${textSections}\n\nYou can manage reminder preferences in StudyTrack.`,
  };
};

const main = async (request: Request) => {
  const allowedOrigins = parseAllowedOrigins(Deno.env.get("STUDYTRACK_ALLOWED_ORIGINS"));
  if (!allowedOrigins.length) {
    console.error("StudyTrack email function has no valid allowed origins configured.");
    return response({ error: "Email delivery is not configured on the server." }, 500);
  }

  const origin = request.headers.get("Origin");
  if (origin && !allowedOrigins.includes(origin)) {
    return response({ error: "This origin is not allowed." }, 403);
  }

  const corsHeaders = origin
    ? { ...baseHeaders, "Access-Control-Allow-Origin": origin }
    : baseHeaders;

  if (request.method === "OPTIONS") {
    return origin
      ? new Response(null, { status: 204, headers: corsHeaders })
      : response({ error: "An allowed origin is required." }, 403);
  }
  if (request.method !== "POST") {
    return response({ error: "Method not allowed." }, 405, corsHeaders);
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("application/json")) {
    return response({ error: "Content-Type must be application/json." }, 415, corsHeaders);
  }

  const authorization = request.headers.get("Authorization") || "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  if (!tokenMatch) return response({ error: "Sign in to use StudyTrack email." }, 401, corsHeaders);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("STUDYTRACK_FROM_EMAIL") || "StudyTrack <onboarding@resend.dev>";
  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey || !resendApiKey
    || from.length > 254 || /[\r\n]/.test(from)) {
    console.error("StudyTrack email function is missing valid server configuration.");
    return response({ error: "Email delivery is not configured on the server." }, 500, corsHeaders);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${tokenMatch[1]}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let user;
  try {
    const { data, error } = await userClient.auth.getUser(tokenMatch[1]);
    if (error || !data.user) {
      return response({ error: "Your sign-in could not be verified. Please sign in again." }, 401, corsHeaders);
    }
    user = data.user;
  } catch (error) {
    console.error("StudyTrack could not verify the authenticated user.", error);
    return response({ error: "Unable to verify your sign-in right now." }, 502, corsHeaders);
  }

  if (!isValidEmail(user.email)) {
    return response({ error: "Your authenticated account does not have a valid email address." }, 400, corsHeaders);
  }

  let requestBody: string;
  try {
    requestBody = await request.text();
  } catch (error) {
    console.error("StudyTrack could not read the email request body.", error);
    return response({ error: "Unable to read the email request." }, 400, corsHeaders);
  }
  if (requestBody.length > 8_000) {
    return response({ error: "The email request is too large." }, 413, corsHeaders);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(requestBody);
  } catch {
    return response({ error: "The email request must contain valid JSON." }, 400, corsHeaders);
  }
  const emailRequest = validateEmailRequest(parsedBody);
  if (!emailRequest) {
    return response({ error: "The email request contains invalid or incomplete data." }, 400, corsHeaders);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const callAdminRpc = async (functionName: string, args: Record<string, unknown>) => {
    const result = await adminClient.rpc(functionName, args);
    if (result.error) {
      console.error(`StudyTrack ${functionName} RPC failed.`, result.error.message);
      throw new Error("Email settings could not be verified. Please try again.");
    }
    return result.data;
  };

  if (emailRequest.type === "get_preferences") {
    try {
      const remindersEnabled = await callAdminRpc("get_email_reminders_enabled", {
        p_user_id: user.id,
      });
      if (typeof remindersEnabled !== "boolean") {
        throw new Error("Email settings returned an invalid preference.");
      }
      return response({ remindersEnabled }, 200, corsHeaders);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email settings could not be loaded.";
      return response({ error: message }, 503, corsHeaders);
    }
  }

  if (emailRequest.type === "set_preferences") {
    try {
      const remindersEnabled = await callAdminRpc("set_email_reminders_enabled", {
        p_user_id: user.id,
        p_enabled: emailRequest.remindersEnabled,
      });
      if (remindersEnabled !== emailRequest.remindersEnabled) {
        throw new Error("Email settings could not be saved.");
      }
      return response({ remindersEnabled }, 200, corsHeaders);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email settings could not be saved.";
      return response({ error: message }, 503, corsHeaders);
    }
  }

  if (requiresReminderOptIn(emailRequest.type)) {
    try {
      const remindersEnabled = await callAdminRpc("get_email_reminders_enabled", {
        p_user_id: user.id,
      });
      if (remindersEnabled !== true) {
        return response({
          error: "Enable email reminders in StudyTrack before sending a study reminder.",
        }, 403, corsHeaders);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email settings could not be verified.";
      return response({ error: message }, 503, corsHeaders);
    }
  }

  if (emailRequest.type !== "test") {
    try {
      const remindersEnabled = await callAdminRpc("get_email_reminders_enabled", {
        p_user_id: user.id,
      });
      if (typeof remindersEnabled !== "boolean") {
        throw new Error("Email settings returned an invalid preference.");
      }
      if (!remindersEnabled) {
        return response({
          error: "Enable email reminders in StudyTrack before sending a study reminder.",
        }, 403, corsHeaders);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Email settings could not be verified.";
      return response({ error: message }, 503, corsHeaders);
    }
  }

  let email: { subject: string; sections: Array<{ heading: string; lines: string[] }> } | null = null;
  if (["weak_subject", "ten_day", "study_checkin"].includes(emailRequest.type)) {
    let rows;
    try {
      const { data, error } = await userClient
        .from("grades")
        .select("grade,previous_grade,target_grade,subjects(name)")
        .eq("user_id", user.id);
      if (error) throw error;
      rows = data || [];
    } catch (error) {
      console.error("StudyTrack could not load academic records for the verified user.", error);
      return response({ error: "Your saved academic records could not be loaded. No email was sent." }, 502, corsHeaders);
    }

    email = createAcademicEmail(emailRequest.type, normalizeAcademicRows(rows));
    if (!email) {
      return response({
        error: "No valid current grades are available in your saved academic records for this reminder.",
      }, 409, corsHeaders);
    }
  } else if (emailRequest.type === "focus") {
    email = {
      subject: `Upcoming study focus: ${emailRequest.subject}`,
      sections: [{
        heading: `Your study focus: ${emailRequest.subject}`,
        lines: [
          `Planned topic: ${emailRequest.topic}`,
          `Target study date: ${formatDate(emailRequest.date)}`,
          "A short review session can help you make steady progress toward this goal.",
        ],
      }],
    };
  } else {
    email = {
      subject: "Your StudyTrack test email",
      sections: [{
        heading: "Email connection test",
        lines: [
          "You requested a test message from StudyTrack.",
          "If you can read this, the email provider accepted a message for your account.",
        ],
      }],
    };
  }

  let claimToken: string | null = null;
  if (emailRequest.type === "ten_day") {
    claimToken = crypto.randomUUID();
    let claimResult: unknown;
    try {
      claimResult = await callAdminRpc("claim_ten_day_email", {
        p_user_id: user.id,
        p_claim_token: claimToken,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "The reminder send could not be reserved.";
      return response({ error: message }, 503, corsHeaders);
    }

    if (claimResult !== "claimed") {
      const messages: Record<string, string> = {
        disabled: "Enable email reminders in StudyTrack before sending a study reminder.",
        cooldown: "A 10-day check-in was already accepted within the last 10 days.",
        in_progress: "A 10-day check-in is already being processed. Please wait before trying again.",
      };
      return response({
        error: messages[String(claimResult)] || "A 10-day check-in could not be reserved.",
      }, claimResult === "disabled" ? 403 : 409, corsHeaders);
    }
  }

  const releaseClaim = async () => {
    if (!claimToken) return true;
    try {
      const released = await callAdminRpc("finish_ten_day_email", {
        p_user_id: user.id,
        p_claim_token: claimToken,
        p_provider_accepted: false,
      });
      return released === true;
    } catch (error) {
      console.error("StudyTrack could not release a rejected email claim.", error);
      return false;
    }
  };

  const rendered = renderEmail(
    cleanString(user.user_metadata?.full_name, 80) || user.email.split("@")[0] || "Student",
    email,
  );
  let providerResponse: Response;
  try {
    providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        from,
        to: [user.email],
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
      }),
    });
  } catch (error) {
    console.error("StudyTrack could not confirm a response from Resend.", error);
    return response({
      error: "The email provider response could not be confirmed. A 10-day claim remains reserved temporarily to avoid duplicate sends.",
    }, 502, corsHeaders);
  }

  let providerResult: { id?: unknown; message?: unknown } | null = null;
  try {
    providerResult = await providerResponse.json();
  } catch {
    providerResult = null;
  }
  if (!providerResponse.ok) {
    const definiteRejection = providerResponse.status >= 400 && providerResponse.status < 500;
    const released = definiteRejection ? await releaseClaim() : false;
    console.error("Resend rejected the StudyTrack email.", providerResponse.status, providerResult?.message);
    return response({
      error: "Resend did not accept the email. Check the sender configuration and try again.",
      ...(claimToken && !released ? { claimRemainsReserved: true } : {}),
    }, 502, corsHeaders);
  }
  if (typeof providerResult?.id !== "string" || !providerResult.id) {
    return response({
      error: "Resend returned an ambiguous response. A 10-day claim remains reserved temporarily to avoid duplicate sends.",
    }, 502, corsHeaders);
  }

  if (claimToken) {
    let finalized = false;
    try {
      finalized = await callAdminRpc("finish_ten_day_email", {
        p_user_id: user.id,
        p_claim_token: claimToken,
        p_provider_accepted: true,
      }) === true;
    } catch (error) {
      console.error("Resend accepted the email, but StudyTrack could not finalize its cooldown.", error);
    }

    if (!finalized) {
      return response({
        accepted: true,
        id: providerResult.id,
        cooldownRecorded: false,
        message: "Resend accepted the email, but its 10-day cooldown could not be confirmed. The temporary claim may remain active until it expires.",
      }, 200, corsHeaders);
    }
  }

  return response({
    accepted: true,
    id: providerResult.id,
    ...(claimToken ? { cooldownRecorded: true } : {}),
  }, 200, corsHeaders);
};

Deno.serve(main);
