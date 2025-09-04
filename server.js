import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import emailRoutes from "./routes/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes);
app.use("/email", emailRoutes);

app.get("/", (req, res) => {
  res.render("index", { user: req.user });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
