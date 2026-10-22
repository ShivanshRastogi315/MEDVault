import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Server-side proxy middleware for Google Gemini API.
 * Keeps API keys completely private on the server side so they are never exposed in browser code.
 */
function geminiApiPlugin() {
  return {
    name: 'gemini-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res, next) => {
        if (req.method !== 'POST') {
          return next();
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const { message, history } = JSON.parse(body || '{}');
            const apiKey =
              process.env.GEMINI_API_KEY ||
              process.env.VITE_GEMINI_API_KEY;

            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json');
              return res.end(
                JSON.stringify({
                  isConfigured: false,
                  note: 'GEMINI_API_KEY is not set. Please set GEMINI_API_KEY in your environment or .env.local file.',
                })
              );
            }

            // Call official Google GenAI SDK on the server side
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey });

            const systemInstruction = `You are the MedVault AI Assistant — an intelligent, empathetic, and versatile AI companion. You function as a full, knowledgeable chatbot capable of answering questions naturally, clearly, and conversationally.

Core Guidance & Behavior:
1. First Aid & Immediate Guidance:
   When users ask about cuts, wounds, bleeding, minor burns, sprains, nosebleeds, insect stings, or basic first aid:
   - Provide immediate, clear, practical, step-by-step first aid instructions right away (e.g. how to stop bleeding, clean with water, apply ointment/petroleum jelly, bandage).
   - Detail clear warning signs for when they should seek urgent medical care or stitches (e.g. bleeding won't stop after 10-15 mins of direct pressure, gaping or deep cut, dirty/rusty object requiring tetanus, loss of sensation or function).
2. General Health, Science & Everyday Questions:
   - Answer general questions (symptoms, common remedies, nutrition, wellness, internet-available health and science topics, everyday queries) thoroughly and informatively like a normal assistant.
   - Do NOT restrict yourself or refuse to answer by saying you can only navigate the portal. Always be helpful, engaging, and direct.
3. MedVault Portal Navigation:
   When the user asks about the portal or their records, guide them to the appropriate portal section:
   - Medical Records: View lab results, radiology scans, blood tests, and discharge summaries in the "Medical Records" sidebar tab.
   - Medications: Check active prescriptions, daily dosage schedules, and instructions in the "Medications" tab.
   - Appointments: Check upcoming doctor visits, locations, and timings in the "Appointments" tab.
   - Emergency Code: Locate their unique Emergency Code (e.g. MV-EMRG-XXXX) in the "Emergency Info" tab to allow ER doctors immediate access to critical allergies and blood group.

Tone & Safety:
- Warm, reassuring, direct, and empathetic.
- In severe or life-threatening situations (e.g. arterial bleeding, difficulty breathing, chest pain, stroke signs), immediately advise contacting emergency services (911 or local emergency numbers) while providing calm, critical initial safety steps.
- Format responses cleanly with Markdown headers, bold highlights, and readable bullet points.`;

            const contents = [];
            if (Array.isArray(history)) {
              for (const h of history.slice(-6)) {
                contents.push({
                  role: h.sender === 'user' ? 'user' : 'model',
                  parts: [{ text: h.text }],
                });
              }
            }
            contents.push({
              role: 'user',
              parts: [{ text: message }],
            });

            // Resilient candidate models that are active and highly responsive
            const candidateModels = [
              'gemini-flash-lite-latest',
              'gemini-3.5-flash-lite',
              'gemini-flash-latest',
              'gemini-3.8-flash',
            ];

            let reply = '';
            let lastError = null;

            for (const model of candidateModels) {
              try {
                const result = await ai.models.generateContent({
                  model,
                  contents,
                  config: {
                    systemInstruction,
                  },
                });
                if (result && result.text) {
                  reply = result.text;
                  break;
                }
              } catch (err) {
                lastError = err;
                console.warn(`[GeminiProxy] Model '${model}' attempt:`, err.message || err);
              }
            }

            if (!reply && lastError) {
              throw lastError;
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ reply, isConfigured: true }));
          } catch (error) {
            console.error('[GeminiProxy Error]:', error);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: error.message || 'Internal error in Gemini assistant service',
              })
            );
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    geminiApiPlugin(),
  ],
  server: {
    proxy: {
      '/dev': {
        target: 'https://3v0ebwlgxa.execute-api.ap-southeast-2.amazonaws.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
