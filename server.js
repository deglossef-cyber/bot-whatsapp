// server.js
// Bot WhatsApp basé sur l'API WhatsApp Business via Twilio.
// Reçoit les messages entrants sur /webhook, cherche une réponse
// dans faq.json, et répond automatiquement.

const express = require("express");
const bodyParser = require("body-parser");
const { MessagingResponse } = require("twilio").twiml;
const fs = require("fs");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

function loadFaq() {
  const filePath = path.join(__dirname, "faq.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function findAnswer(message) {
  const faq = loadFaq();
  const normalizedMessage = normalize(message);

  for (const entry of faq) {
    const match = entry.keywords.some((kw) =>
      normalizedMessage.includes(normalize(kw))
    );
    if (match) {
      return entry.reponse;
    }
  }

  return (
    "Merci pour ton message ! Je n'ai pas de réponse automatique pour " +
    "cette question, un membre de notre équipe va te répondre au plus vite. " +
    "Tu peux aussi taper 'contact' pour nos coordonnées directes."
  );
}

app.get("/", (req, res) => {
  res.send("Bot WhatsApp actif ✅");
});

app.post("/webhook", (req, res) => {
  const incomingMessage = req.body.Body || "";
  const from = req.body.From || "inconnu";

  console.log(`Message reçu de ${from} : ${incomingMessage}`);

  const reply = findAnswer(incomingMessage);

  const twiml = new MessagingResponse();
  twiml.message(reply);

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

app.listen(PORT, () => {
  console.log(`Bot WhatsApp démarré sur le port ${PORT}`);
});
