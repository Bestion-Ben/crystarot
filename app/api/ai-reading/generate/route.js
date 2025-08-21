export async function POST(request) {
  try {
    const { cards, question, planType } = await request.json();
    
    // éªŒè¯å¿…éœ€å‚æ•°
    if (!cards || !cards.length || !question) {
      return Response.json({ 
        error: 'Missing required parameters',
        fallback: true 
      }, { status: 400 });
    }

    console.log('ðŸ”® AI Reading Request:', { 
      cardCount: cards.length, 
      planType, 
      questionLength: question.length 
    });

    // ç”ŸæˆAIè§£è¯»
    const reading = await generateAIReading(cards, question, planType);
    
    console.log('âœ… AI Reading Generated Successfully');
    console.log('ðŸ“¤ About to send response:', reading); // ðŸ‘ˆ åŠ è¿™ä¸€è¡Œ
    
    return Response.json(reading);
    
  } catch (error) {
    console.error('âŒ AI Reading Generation Error:', error);
    
    return Response.json({ 
      error: 'AI service temporarily unavailable',
      fallback: true,
      message: error.message 
    }, { status: 500 });
  }
}

// AIè§£è¯»ç”Ÿæˆæ ¸å¿ƒé€»è¾‘
async function generateAIReading(cards, question, planType) {
  const card = cards[0]; // ä¸»è¦ä½¿ç”¨ç¬¬ä¸€å¼ ç‰Œ
  const questionType = getQuestionType(question);
  
  // æ ¹æ®å¥—é¤ç±»åž‹é€‰æ‹©ä¸åŒçš„prompt
  const prompt = buildPrompt(card, question, questionType, planType);
  
  console.log('ðŸ§  Calling Deepseek API...');
  
  try {
    // è°ƒç”¨Deepseek API
    return await callDeepseekAPI(prompt);
  } catch (error) {
    console.error('ðŸ’« Deepseek API failed:', error.message);
    throw error; // è®©ä¸Šå±‚å¤„ç†é™çº§
  }
}

// Deepseek APIè°ƒç”¨
async function callDeepseekAPI(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a wise and empathetic tarot reader with deep knowledge of symbolism and human psychology. Provide insightful, practical guidance that helps people navigate their life challenges.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
      stream: false
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Deepseek API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices.length) {
    throw new Error('Invalid response from Deepseek API');
  }
  
  const content = data.choices[0].message.content;
  console.log('ðŸ“œ Raw AI Response Length:', content.length);
  
  return parseAIResponse(content);
}

// æž„å»ºä¸åŒå¥—é¤çš„Prompt
function buildPrompt(card, question, questionType, planType) {
  const cardContext = `Card: ${card.name} (${card.upright ? 'Upright' : 'Reversed'})
Element: ${card.element}
Traditional Meaning: ${card.meaning}
Question Category: ${questionType}
User Question: "${question}"`;

  if (planType === 'quick') {
    return `${cardContext}

Please provide a focused, actionable tarot reading in exactly this format:

READING:
[2-3 sentences of direct, practical guidance related to their specific question. Be encouraging but realistic.]

KEY_INSIGHT:
[One powerful, memorable sentence that captures the essence of the guidance]

Keep the tone warm, wise, and hopeful. Focus on actionable advice they can apply immediately.`;

  } else if (planType === 'deep') {
    return `${cardContext}

Please provide a comprehensive 3-card style reading in exactly this format:

READING:
[4-5 sentences covering: 1) What this card reveals about their current situation, 2) The deeper lesson or pattern involved, 3) Specific guidance for moving forward, 4) Timeline or next steps to expect]

KEY_INSIGHT:
[A profound, memorable insight that could be life-changing for them]

Provide deep psychological insight while remaining practical and actionable. Address both the emotional and practical aspects of their situation.`;

  } else { // full analysis
    return `${cardContext}

Please provide a master-level tarot analysis in exactly this format:

READING:
[6-7 sentences covering: 1) Deep spiritual significance of this card for their journey, 2) Hidden influences and subconscious patterns, 3) How this connects to their life purpose, 4) Practical steps for transformation, 5) Long-term spiritual guidance, 6) Integration advice for lasting change]

KEY_INSIGHT:
[A transformative spiritual insight that reveals a deeper truth about their path]

Provide profound spiritual wisdom while keeping it grounded and applicable. Help them see the bigger picture of their soul's journey.`;
  }
}

// è§£æžAIå“åº”
function parseAIResponse(content) {
  try {
    // æå–READINGå’ŒKEY_INSIGHTéƒ¨åˆ†
    const readingMatch = content.match(/READING:\s*([\s\S]*?)(?=KEY_INSIGHT:|$)/i);
    const insightMatch = content.match(/KEY_INSIGHT:\s*([\s\S]*?)$/i);
    
    const reading = readingMatch ? readingMatch[1].trim() : content;
    const keyInsight = insightMatch ? insightMatch[1].trim() : "Trust in the wisdom revealed by this moment";
    
    // æ¸…ç†æ–‡æœ¬
    const cleanReading = reading.replace(/^\[|\]$/g, '').trim();
    const cleanInsight = keyInsight.replace(/^\[|\]$/g, '').trim();
    
    return {
      reading: cleanReading,
      keyInsight: cleanInsight,
      provider: 'deepseek'
    };
  } catch (error) {
    console.error('ðŸ“ Error parsing AI response:', error);
    return {
      reading: content.slice(0, 300), // é™çº§ï¼šä½¿ç”¨åŽŸå§‹å†…å®¹çš„å‰300å­—ç¬¦
      keyInsight: "The universe guides your path forward",
      provider: 'deepseek'
    };
  }
}

// èŽ·å–é—®é¢˜ç±»åž‹
function getQuestionType(question) {
  if (!question) return 'spiritual';
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes('love') || lowerQuestion.includes('relationship') || lowerQuestion.includes('romantic')) return 'love';
  if (lowerQuestion.includes('career') || lowerQuestion.includes('job') || lowerQuestion.includes('work') || lowerQuestion.includes('money') || lowerQuestion.includes('professional')) return 'career';
  if (lowerQuestion.includes('growth') || lowerQuestion.includes('personal') || lowerQuestion.includes('develop') || lowerQuestion.includes('potential')) return 'growth';
  return 'spiritual';
}