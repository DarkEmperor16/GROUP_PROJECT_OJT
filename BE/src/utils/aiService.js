/**
 * AI Service Connector
 *
 * Forwards student questions to an external AI/RAG pipeline if `AI_SERVICE_URL` is set in .env.
 * If `AI_SERVICE_URL` is absent or fails, provides a structured fallback response
 * to ensure local development and testing do not break.
 */

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
        const answer = data.answer || data.response || data.result || data.message;
        if (answer) return answer;
      }

      console.warn(`[aiService] External AI call returned status ${response.status}. Using fallback response.`);
    } catch (error) {
      console.warn('[aiService] Failed to reach external AI service:', error.message);
    }
  }

  // Default Mock/Fallback AI response for dev/testing when AI_SERVICE_URL is not configured
  return `[AI Assistant - ${courseCode || 'General'}] Here is an explanation for your question about "${question}": In ${courseTitle || 'this course'}, key concepts should be thoroughly reviewed. Please check course materials for detailed slides.`;
}

module.exports = {
  sendQuestionToAI,
};
