// api/google-sheets.js - 修正后的导出格式

// 使用CommonJS导出 - Vercel推荐的格式
module.exports = async function handler(req, res) {
  // CORS设置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json'); // 强制设置JSON响应
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 环境检查端点 - 处理 ?test=env 请求
  if (req.method === 'GET' && req.query.test === 'env') {
    const envStatus = {
      hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
      hasProjectId: !!process.env.GOOGLE_PROJECT_ID,
      hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      clientEmailDomain: process.env.GOOGLE_CLIENT_EMAIL ? 
        process.env.GOOGLE_CLIENT_EMAIL.split('@')[1] : 'missing',
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY ? 
        process.env.GOOGLE_PRIVATE_KEY.length : 0
    };
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      vercel_function: true, // 确认这是从Vercel Function返回的
      environment: envStatus,
      allConfigured: Object.values(envStatus).slice(0, 4).every(Boolean)
    });
  }

  // 只处理POST请求进行数据写入
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 验证环境变量
    const required_vars = [
      'GOOGLE_CLIENT_EMAIL',
      'GOOGLE_PRIVATE_KEY', 
      'GOOGLE_PROJECT_ID',
      'GOOGLE_SHEETS_SPREADSHEET_ID'
    ];
    
    const missing_vars = required_vars.filter(varName => !process.env[varName]);
    if (missing_vars.length > 0) {
      return res.status(500).json({
        success: false,
        error: `缺少环境变量: ${missing_vars.join(', ')}`,
        debug: '请检查Vercel环境配置'
      });
    }

    const { data, sheet_name = 'User_Interactions' } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Missing data payload'
      });
    }

    // 数据验证和清理
    const cleanedData = sanitizeSheetData(data);
    
    // 发送到Google Sheets
    const response = await appendToGoogleSheet(cleanedData, sheet_name);
    
    console.log(`✅ 数据已写入Google Sheets: ${data.event_name || 'unknown_event'}`);
    
    res.status(200).json({ 
      success: true, 
      row_id: response.updates?.updatedRows || 1,
      updatedRange: response.updates?.updatedRange,
      timestamp: cleanedData.timestamp,
      event: cleanedData.event_name
    });

  } catch (error) {
    console.error('Sheets API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save data',
      details: error.message,
      type: error.name
    });
  }
};

// 使用Service Account认证写入Google Sheets
async function appendToGoogleSheet(data, sheetName) {
  // 获取Service Account访问令牌
  const accessToken = await getServiceAccountToken();
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}/values/${sheetName}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  
  // 确保数据顺序正确
  const orderedRow = [
    data.timestamp,
    data.session_id,
    data.event_name,
    data.email,
    data.question_text,
    data.question_category,
    data.selected_plan,
    data.selected_card,
    data.card_orientation,
    data.ai_reading,
    data.user_rating,
    data.user_feedback,
    data.plan_interest,
    data.utm_source,
    data.device_type,
    data.location,
    data.notes
  ];
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [orderedRow]
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google Sheets API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return response.json();
}

// 获取Service Account访问令牌
async function getServiceAccountToken() {
  // 动态导入crypto模块
  const { createSign } = await import('crypto');
  
  const client_email = process.env.GOOGLE_CLIENT_EMAIL;
  const private_key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  // 创建JWT
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const signature = createSign('RSA-SHA256')
    .update(signatureInput)
    .sign(private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  const jwt = `${signatureInput}.${signature}`;

  // 获取访问令牌
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const tokenData = await tokenResponse.json();
  
  if (!tokenResponse.ok) {
    throw new Error(`Token获取失败: ${tokenData.error} - ${tokenData.error_description}`);
  }

  return tokenData.access_token;
}

// 数据清理函数
function sanitizeSheetData(data) {
  return {
    timestamp: data.timestamp || new Date().toISOString(),
    session_id: (data.session_id || '').toString().substring(0, 50),
    event_name: (data.event_name || '').toString().substring(0, 50),
    email: (data.email || '').toString().substring(0, 100),
    question_text: (data.question_text || '').toString().substring(0, 500),
    question_category: (data.question_category || '').toString().substring(0, 50),
    selected_plan: (data.selected_plan || '').toString().substring(0, 50),
    selected_card: (data.selected_card || '').toString().substring(0, 50),
    card_orientation: (data.card_orientation || '').toString().substring(0, 20),
    ai_reading: (data.ai_reading || '').toString().substring(0, 1000),
    user_rating: parseInt(data.user_rating) || 0,
    user_feedback: (data.user_feedback || '').toString().substring(0, 500),
    plan_interest: (data.plan_interest || '').toString().substring(0, 100),
    utm_source: (data.utm_source || '').toString().substring(0, 100),
    device_type: (data.device_type || '').toString().substring(0, 50),
    location: (data.location || 'Kampong Loyang, SG').toString().substring(0, 100),
    notes: (data.notes || '').toString().substring(0, 200)
  };
}

// 工具函数
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}