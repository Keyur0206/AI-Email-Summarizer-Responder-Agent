import { google } from "googleapis";

//  Gmail Client
export function getGmailClient(user) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
  auth.setCredentials({
    access_token: user.accessToken,
    refresh_token: user.refreshToken,
  });
  return google.gmail({ version: "v1", auth });
}

//  Extract  email 
export function extractEmail(address = "") {
  const match = address.match(/<(.+)>/);
  return (match ? match[1] : address).trim().toLowerCase();
}

//  Fetch emails (last 24h)
export async function fetchEmails(gmail) {
  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: "newer_than:1d category:primary -category:promotions -from:(noreply no-reply do-not-reply donotreply linkedin.com facebook.com twitter.com)",
    });

    const messages = res.data.messages || [];
    return await Promise.all(
      messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });
        const headers = full.data.payload.headers;
        const getHeader = (name, fallback = "") =>
          headers.find((h) => h.name.toLowerCase() === name)?.value || fallback;

        const from = extractEmail(getHeader("from", "unknown"));
        const subject = getHeader("subject", "No Subject");

        let body = "";
        const payload = full.data.payload;
        if (payload.parts) {
          const part = payload.parts.find((p) => p.mimeType === "text/plain");
          body = part
            ? Buffer.from(part.body.data, "base64").toString("utf-8")
            : "";
        } else if (payload.body?.data) {
          body = Buffer.from(payload.body.data, "base64").toString("utf-8");
        }

        return {
          id: msg.id,
          from,
          subject,
          snippet: full.data.snippet || body,
          body,
          threadId: full.data.threadId,
        };
      })
    );
  } catch (err) {
    console.error("Error fetching emails:", err.message.slice(0, 80));
    return [];
  }
}

//  Check if draft already exists
async function draftExists(gmail, to, subject) {
  try {
    const res = await gmail.users.drafts.list({ userId: "me" });
    const drafts = res.data.drafts || [];

    for (const d of drafts) {
      const full = await gmail.users.drafts.get({ userId: "me", id: d.id });
      const headers = full.data.message.payload.headers;
      const draftTo = extractEmail(
        headers.find((h) => h.name.toLowerCase() === "to")?.value
      );
      const draftSubject = (
        headers.find((h) => h.name.toLowerCase() === "subject")?.value || ""
      )
        .trim()
        .toLowerCase();

      if (
        draftTo === to.trim().toLowerCase() &&
        draftSubject === subject.trim().toLowerCase()
      ) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error("Error checking drafts:", err.message.slice(0, 80));
    return false;
  }
}

//  Create draft if not exists
export async function createDraft(gmail, to, subject, body, threadId) {
  if (await draftExists(gmail, to, subject)) {
    console.log(`Draft already exists for ${to}`);
    return;
  }

  try {
    const raw = `From: me\nTo: ${to}\nSubject: ${subject}\n\n${body}`;
    const encoded = Buffer.from(raw)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.drafts.create({
      userId: "me",
      requestBody: { message: { threadId, raw: encoded } },
    });

    console.log(` Draft created for ${to}`);
  } catch (err) {
    console.error(`Error creating draft for ${to}:`, err.message.slice(0, 80));
  }
}
