import "dotenv/config";
import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import emailjs from "@emailjs/nodejs";

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = "https://keiner-alvarado-quintero.top";

// Middleware
app.use(express.json());
app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || origin === ALLOWED_ORIGIN) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        }
    })
);

// Ruta para obtener una frase inspiradora
app.post("/quote", async (req, res) => {
    try {
        const { lang = "es" } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            return res.status(500).json({ error: "API Key missing" });
        }

        const prompt = `Dame otra frase inspiradora (que no hayas enviado hace poco) en ${lang}, con su autor. Responde solo con el formato JSON:
        {
          "text": "Aquí la frase",
          "author": "Aquí el autor"
        }`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            }
        );

        const data = await response.json();
        let quoteText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        quoteText = quoteText.replace(/```json/g, "").replace(/```/g, "").trim();

        let quote;
        try {
            quote = JSON.parse(quoteText);
        } catch (err) {
            console.error("Error parsing quote:", err);
            const defaultQuotes = lang === "es"
                ? [{ text: "El éxito es la suma de pequeños esfuerzos repetidos día tras día.", author: "Robert Collier" }]
                : [{ text: "The only way to do great work is to love what you do.", author: "Steve Jobs" }];
            quote = defaultQuotes[0];
        }

        res.json(quote);
    } catch (error) {
        console.error("Error fetching quote:", error);
        res.status(500).json({ error: "Failed to fetch quote" });
    }
});

// Ruta para enviar correo con EmailJS
app.post("/send-email", async (req, res) => {
    try {
        const { name, email, message } = req.body;
        const serviceID = "service_zyto9nc";
        const templateID = "template_jhxtafk";
        const publicKey = process.env.EMAILJS_API_PUBLIC_KEY;
        const privateKey = process.env.EMAILJS_API_PRIVATE_KEY;

        if (!privateKey || !publicKey) {
            return res.status(500).json({ error: "Faltan las claves de EmailJS" });
        }

        const templateParams = {
            from_name: name,
            to_name: "Keiner Alvarado",
            reply_to: email,
            message: message,
        };

        const emailResponse = await emailjs.send(
            serviceID,
            templateID,
            templateParams,
            { publicKey, privateKey }
        );

        console.log("Respuesta de EmailJS:", emailResponse);
        res.json({ success: true, message: "¡Correo enviado exitosamente!" });
    } catch (error) {
        console.error("Error al enviar el correo:", error);
        res.status(500).json({ error: "No se pudo enviar el correo" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});