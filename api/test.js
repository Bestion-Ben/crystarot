// api/test.js - 简单的测试API文件

module.exports = function handler(req, res) {
  // 设置响应头
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 返回简单的JSON响应
  return res.status(200).json({
    success: true,
    message: '🎉 API Functions正常工作！',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    vercel_function: true,
    test_passed: true
  });
};