import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function POST(request) {
  try {
    const { email, rating, cardName, questionType, timestamp } = await request.json();
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // 设置 Google Sheets 认证
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // 连接到 Google Sheets
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEETS_ID, serviceAccountAuth);
    await doc.loadInfo();
    
    // 获取第一个工作表，如果不存在则创建
    let sheet = doc.sheetsByIndex[0];
    if (!sheet) {
      sheet = await doc.addSheet({ 
        title: 'Email Subscriptions',
        headerValues: ['Email', 'Rating', 'Card Name', 'Question Type', 'Timestamp']
      });
    }

    // 添加新行
    await sheet.addRow({
      'Email': email,
      'Rating': rating,
      'Card Name': cardName,
      'Question Type': questionType,
      'Timestamp': timestamp
    });

    console.log('Email saved to Google Sheets:', email);
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Google Sheets error:', error);
    return Response.json({ 
      error: 'Failed to save email',
      details: error.message 
    }, { status: 500 });
  }
}