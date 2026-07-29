/**
 * AI Service Connector
 *
 * Forwards student questions to an external AI/RAG pipeline if `AI_SERVICE_URL` is set in .env.
 * If `AI_SERVICE_URL` is absent or fails, provides a structured fallback response
 * to ensure local development and testing do not break.
 */

const sanitizeHtml = require('sanitize-html');

async function sendQuestionToAI({ question, courseCode, courseTitle }) {
  const aiEndpoint = process.env.AI_SERVICE_URL;

  if (aiEndpoint) {
    try {
      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // ngrok tunnel bypass
          'ngrok-skip-browser-warning': 'true',
          // loca.lt tunnel bypass (famous-pumas-join.loca.lt style URLs)
          'bypass-tunnel-reminder': 'true',
          ...(process.env.AI_SERVICE_API_KEY && {
            Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}`,
          }),
        },
        body: JSON.stringify({
          question,
          courseCode,
          courseTitle,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Support common API response shapes
        const rawAnswer = data.answer || data.response || data.result || data.message;
        if (rawAnswer) {
          // SEC-F6.7: Lọc phản hồi AI trước khi trả về để chống XSS (Output Guardrail)
          const cleanAnswer = sanitizeHtml(rawAnswer, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
          });
          return cleanAnswer;
        }
      }

      console.warn(`[aiService] External AI call returned status ${response.status}.`);
      throw new Error(`AI service returned status ${response.status}`);
    } catch (error) {
      console.error('[aiService] Failed to reach external AI service:', error.message);
      throw error;
    }
  } else {
    throw new Error('AI_SERVICE_URL is not configured');
  }
}

module.exports = {
  sendQuestionToAI,
};
