const express = require("express");
const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const qrcode = require("qrcode");

const app = express();
let sock;

app.get("/", async (req, res) => {
  if (!sock) {
    const { state, saveCreds } = await useMultiFileAuthState("session");

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { qr, connection } = update;

      if (qr) {
        // Génération QR Code pour connexion
        const qrImage = await qrcode.toDataURL(qr);
        res.send(`
          <h1>Scanne ce QR avec WhatsApp</h1>
          <img src="${qrImage}" />
        `);
      }

      if (connection === "open") {
        console.log("✅ Bot connecté !");
        // Récupérer la Session ID et l’envoyer en DM
        const sessionId = JSON.stringify(state.creds, null, 2);

        // Envoie la session en DM à toi-même
        await sock.sendMessage(sock.user.id, {
          text: `📌 Voici ta Session ID :\n\n\`\`\`${sessionId}\`\`\``
        });
      }
    });
  } else {
    res.send("Bot déjà connecté ✅");
  }
});

// Export obligatoire pour Vercel
module.exports = app;
