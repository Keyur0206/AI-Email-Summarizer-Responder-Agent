import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 🔹 Helper function to call OpenAI
async function askOpenAI(prompt, max_tokens = 300) {
  try {
    const res = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful email assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens
    });
    return res?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("OpenAI API Error:", err.message || err);
    return "";
  }
}

// 🔹 Summarize emails
export async function summarizeEmails(emails) {
  if (!emails.length) return ["No emails found."];

  let prompt = "Summarize these emails into 5 clear bullet points:\n" +
    emails.map((e, i) => `${i + 1}. From: ${e.from}, Subject: ${e.subject}, Snippet: ${e.snippet}`).join("\n");

  const result = await askOpenAI(prompt, 300);
  return result ? result.split("\n").filter(line => line.trim()) : ["Summary could not be generated."];
}

// 🔹 Generate draft replies
export async function generateReplyDrafts(emails) {
  if (!emails.length) return [];

  let prompt = "Write short, polite replies (max 120 words) for these emails:\n" +
    emails.map((e, i) => `${i + 1}. From: ${e.from}, Subject: ${e.subject}, Snippet: ${e.snippet}`).join("\n");

  const result = await askOpenAI(prompt, 500);
  if (!result) {
    return emails.map(e => ({
      to: e.from,
      subject: e.subject,
      body: "Draft not created due to OpenAI API error.",
      threadId: e.threadId
    }));
  }

  // Split by numbered replies
  const replies = result.split(/\n\d+\.\s/).filter(r => r.trim());

  return replies.map((body, i) => ({
    to: emails[i].from,
    subject: emails[i].subject,
    body: body.trim(),
    threadId: emails[i].threadId
  }));
}
