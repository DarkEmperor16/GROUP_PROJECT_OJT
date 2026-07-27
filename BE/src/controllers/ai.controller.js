const aiService = require('../services/ai.service');

const proxyToAi = async (req, res) => {
  try {
    // Chuyển đổi đường dẫn từ Node.js (ví dụ: /api/ai/chat) 
    // sang đường dẫn chuẩn của Python AI (ví dụ: /api/v1/chat)
    const pythonPath = req.originalUrl.replace('/api/ai', '/api/v1');
    
    const result = await aiService.proxyRequest(
      req.method,
      pythonPath,
      req.body,
      req.query
    );
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  proxyToAi
};
