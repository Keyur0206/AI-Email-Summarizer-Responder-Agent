import express from "express";
import { getGmailClient, fetchEmails, createDraft, extractEmail } from "../gmail.js";
import { summarizeEmails, generateReplyDrafts } from "../openai.js";

const router = express.Router();

router.get("/summary", async (req, res) => {
  if (!req.user) return res.status(401).send("Not logged in");
  
  
  const gmail = getGmailClient(req.user);

  try {
    const emails = await fetchEmails(gmail);
    const summaryText = emails.length ? await summarizeEmails(emails) : "No emails today";
    const summary = summaryText.toString().split("\n").filter(line => line.trim());

    for (const email of emails) {
      const drafts = await generateReplyDrafts([email]);
      await createDraft(gmail, drafts[0].to, drafts[0].subject, drafts[0].body, drafts[0].threadId);
    }

    res.render("summary", { summary });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to process emails");
  }
});

export default router;
