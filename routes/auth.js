import express from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "../config.js";
import {
  getGmailClient,
  fetchEmails,
  createDraft,
  extractEmail,
} from "../gmail.js";
import { summarizeEmails, generateReplyDrafts } from "../openai.js";

const router = express.Router();

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      accessType: "offline",
      scope: [
        "email",
        "profile",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.compose",
      ],
    },
    (accessToken, refreshToken, profile, done) => {
      done(null, { profile, accessToken, refreshToken });
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Login route
router.get("/google", passport.authenticate("google"));

// Callback route
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req, res) => {
    if (!req.user) return res.redirect("/");
    // res.render("index", { user: req.user });
    res.redirect("/")

    // try {
    //   // Fetch emails
    //   const emails = await fetchEmails(gmail);

    //   // Generate summary
    //   let summaryText = emails.length
    //     ? await summarizeEmails(emails)
    //     : "No emails today";

    //   if (Array.isArray(summaryText)) summaryText = summaryText.join("\n");
    //   else if (typeof summaryText !== "string") summaryText = String(summaryText);

    //   const summary = summaryText.split("\n").filter((line) => line.trim());

    //   // Generate drafts
    //   if (emails.length) {
    //     const drafts = await generateReplyDrafts(emails);

    //     for (const { to, subject, body, threadId } of drafts) {
    //       // Create draft only if it doesn't exist (handled in createDraft)
    //       await createDraft(gmail, to, subject, body, threadId);

    //       // Optional delay to avoid Gmail API limits
    //       await new Promise((r) => setTimeout(r, 500));
    //     }
    //   }

    //   res.render("summary", { summary });
    // } catch (err) {
    //   console.error(err);
    //   res.status(500).send("Error processing emails");
    // }
  }
);

router.get("/", (req, res) => {
  if (!req.user) return res.redirect("/");

  res.render("index", { user: req.user });
});


// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return next(err);
      }
      res.redirect("/");
    });
  });
});

export default router;
