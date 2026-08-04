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

async function requestWithRetry(endpoint, fetchOptionsCreator, retries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const options = fetchOptionsCreator(controller.signal);
    
    try {
      const response = await fetch(endpoint, options);
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      const isAbort = error.name === 'AbortError';
      if (isAbort || attempt === retries) {
        throw error;
      }
      // Wait before retrying (exponential backoff / incremented delay)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}

async function requestDocumentIndex(payload) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    throw new Error('AI_SERVICE_URL is not configured');
  }

  const endpoint = `${aiServiceUrl.replace(/\/$/, '')}/api/v1/documents/index`;
  const optionsCreator = (signal) => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.AI_SERVICE_API_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  try {
    const response = await requestWithRetry(endpoint, optionsCreator);
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
  }
}

async function notifyDocumentStatusChange(payload) {
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    throw new Error('AI_SERVICE_URL is not configured');
  }

  const endpoint = `${aiServiceUrl.replace(/\/$/, '')}/api/v1/documents/status`;
  const optionsCreator = (signal) => ({
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.AI_SERVICE_API_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  try {
    const response = await requestWithRetry(endpoint, optionsCreator);
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
  }
}

async function requestDocumentDeletion(payload) {
  const { fileName } = payload;
  const aiServiceUrl = process.env.AI_SERVICE_URL;

  if (!aiServiceUrl) {
    throw new Error('AI_SERVICE_URL is not configured');
  }

  const encodedFileName = encodeURIComponent(fileName);
  const endpoint = `${aiServiceUrl.replace(/\/$/, '')}/api/v1/documents/by-filename/${encodedFileName}`;
  const optionsCreator = (signal) => ({
    method: 'DELETE',
    headers: {
      ...(process.env.AI_SERVICE_API_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` } : {}),
    },
    signal,
  });

  try {
    const response = await requestWithRetry(endpoint, optionsCreator);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        accepted: false,
        errorMessage: data.detail || data.message || 'AI Service rejected document deletion',
      };
    }

    return {
      accepted: true,
      message: data.message || 'Document deleted from AI Service',
    };
  } catch (error) {
    return {
      accepted: false,
      errorMessage: error.name === 'AbortError' ? 'AI Service timeout during deletion' : 'AI Service unavailable during deletion',
    };
  }
}

async function proxyRequest(method, path, data = null, params = null) {
  const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8000';
  const url = new URL(`${aiServiceUrl.replace(/\/$/, '')}${path}`);
  if (params) {
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.AI_SERVICE_API_KEY ? { Authorization: `Bearer ${process.env.AI_SERVICE_API_KEY}` } : {}),
    },
  };
  
  if (data && method !== 'GET' && method !== 'HEAD') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url.toString(), options);
    const result = await response.json().catch(() => null);
    
    if (!response.ok) {
      throw new Error((result && result.message) || `AI Server Error: ${response.statusText}`);
    }
    
    return result;
  } catch (error) {
    throw new Error(`Error proxying to AI Service: ${error.message}`);
  }
}

module.exports = {
  buildIndexPayload,
  requestDocumentIndex,
  notifyDocumentStatusChange,
  requestDocumentDeletion,
  proxyRequest,
};

