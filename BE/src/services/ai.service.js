const crypto = require('crypto');

function buildIndexPayload(document, course, user) {
  return {
    documentId: document._id.toString(),
    courseId: course._id.toString(),
    courseCode: course.code,
    userId: user._id.toString(),
    title: document.title,
    version: document.version,
    description: document.description,
    fileName: document.fileName,
    storagePath: document.storagePath,
    mimeType: document.mimeType,
    size: document.size,
  };
}

async function requestDocumentIndex(payload) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    return {
      accepted: true,
      requestId: `mock-${crypto.randomUUID()}`,
      providerStatus: 'queued',
    };
  }

  const endpoint = `${aiServiceUrl.replace(/\/$/, '')}/documents/index`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AI_SERVICE_API_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        accepted: false,
        errorMessage: data.message || 'AI Service rejected indexing request',
      };
    }

    return {
      accepted: true,
      requestId: data.requestId || data.jobId || `ai-${crypto.randomUUID()}`,
      providerStatus: data.status || 'processing',
    };
  } catch (error) {
    return {
      accepted: false,
      errorMessage: error.name === 'AbortError' ? 'AI Service timeout' : 'AI Service unavailable',
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function notifyDocumentStatusChange(payload) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    return {
      accepted: true,
      providerStatus: payload.status,
    };
  }

  const endpoint = `${aiServiceUrl.replace(/\/$/, '')}/documents/status`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.AI_SERVICE_API_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        accepted: false,
        errorMessage: data.message || 'AI Service rejected document status update',
      };
    }

    return {
      accepted: true,
      providerStatus: data.status || payload.status,
    };
  } catch (error) {
    return {
      accepted: false,
      errorMessage: error.name === 'AbortError' ? 'AI Service timeout' : 'AI Service unavailable',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  buildIndexPayload,
  requestDocumentIndex,
  notifyDocumentStatusChange,
};
