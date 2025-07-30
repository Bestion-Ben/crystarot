export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, sheet_name = 'User_Interactions' } = req.body;
    
    // 数据验证和清理
    const cleanedData = sanitizeSheetData(data);
    
    // 发送到Google Sheets
    const response = await appendToGoogleSheet(cleanedData, sheet_name);
    
    res.status(200).json({ 
      success: true, 
      row_id: response.updates.updatedRows 
    });
  } catch (error) {
    console.error('Sheets API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save data' 
    });
  }
}

async function appendToGoogleSheet(data, sheetName) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${process.env.GOOGLE_SHEETS_SPREADSHEET_ID}/values/${sheetName}:append`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GOOGLE_SHEETS_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      values: [Object.values(data)]
    })
  });

  return response.json();
}