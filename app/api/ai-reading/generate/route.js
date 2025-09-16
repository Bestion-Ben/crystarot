export async function POST(request) {
  try {
    // ✅ 接收用户上下文信息
    const { cards, question, planType, userContext } = await request.json();
    
    // 验证必需参数
    if (!cards || !cards.length || !question) {
      return Response.json({ 
        error: 'Missing required parameters',
        fallback: true 
      }, { status: 400 });
    }

    console.log('🔮 AI Reading Request:', { 
      cardCount: cards.length, 
      planType, 
      questionLength: question.length,
      userEmotion: userContext?.emotion,
      userScenario: userContext?.scenario,
      category: userContext?.category
    });

    // ✅ 传递完整用户上下文给AI解读生成函数
    const reading = await generateAIReading(cards, question, planType, userContext);
    
    console.log('✅ AI Reading Generated Successfully');
    
    return Response.json(reading);
    
  } catch (error) {
    console.error('❌ AI Reading Generation Error:', error);
    
    return Response.json({ 
      error: 'AI service temporarily unavailable',
      fallback: true,
      message: error.message 
    }, { status: 500 });
  }
}

// ✅ 优化后的AI解读生成核心逻辑
async function generateAIReading(cards, question, planType, userContext = {}) {
  const card = cards[0];
  
  // ✅ 构建优化后的prompt，包含用户上下文
  const prompt = buildOptimizedPrompt(card, question, userContext);
  
  console.log('🧠 Generating personalized reading with user context...');
  
  try {
    const response = await callDeepseekAPI(prompt);
    console.log('✅ AI Reading Generated Successfully');
    return response;
  } catch (error) {
    console.error('💫 AI reading generation failed:', error.message);
    throw error;
  }
}

// ✅ 优化后的Deepseek API调用 - 更温和的系统消息
async function callDeepseekAPI(prompt) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const response = await fetch('https://api.deepseek.com/chat/completions', {
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
          content: `You are a wise and intuitive tarot reader who offers gentle guidance through card symbolism.

You help people gain new perspectives on their questions with warmth and respect for their free will. Your insights feel personally relevant without being presumptuous or judgmental.

Your approach:
• Connect the card's imagery to their specific situation naturally
• Acknowledge their feelings and context when provided  
• Offer illuminating possibilities rather than definitive statements
• Provide gentle guidance that empowers their own decision-making
• Keep responses concise and impactful

You are like a thoughtful friend who helps them see their own wisdom more clearly.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.8,
      stream: false
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('❌ API Error Details:', {
      status: response.status,
      statusText: response.statusText,
      errorData
    });
    throw new Error(`Deepseek API error ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices.length) {
    throw new Error('Invalid response from Deepseek API');
  }
  
  const content = data.choices[0].message.content;
  console.log('📜 Raw AI Response Length:', content.length);
  
  return parseAIResponse(content);
}

// ✅ 全新优化的prompt构建 - 三段式结构：牌意→关联→指导
function buildOptimizedPrompt(card, question, userContext = {}) {
  const cardInfo = `Card Drawn: ${card.name} (${card.upright ? 'Upright' : 'Reversed'})
Card Element: ${card.element}
Traditional Meaning: ${card.meaning}`;

  const userInfo = `User's Question: "${question}"
${userContext.emotion ? `Current Feeling: ${userContext.emotion}` : ''}
${userContext.scenario ? `Situation Context: ${userContext.scenario}` : ''}
${userContext.category ? `Question Area: ${userContext.category}` : ''}`;

  return `${cardInfo}

${userInfo}

Please provide a structured tarot reading with clear educational flow:

Format your response as:

CARD_MEANING:
[Explain what this card represents in tarot tradition. What themes, energies, or life situations does it typically address? Keep to 30-40 words, accessible language.]

CONNECTION:
[Explain how this specific card relates to their question and current situation. Why did this card appear for this question? Connect the card's themes to their context. 40-50 words.]

GUIDANCE:
[Based on the card's message, what practical guidance or perspective can you offer for their situation? Be supportive and actionable. Acknowledge their feelings if provided. 40-50 words.]

KEY_INSIGHT:
[One powerful, quotable takeaway that captures the essence of this reading - maximum 15 words.]

Guidelines:
• Use clear, conversational language that educates while guiding
• Be warm and supportive, not mystical or dramatic
• Help them understand WHY this card is relevant to their question
• Focus on possibilities and gentle guidance rather than predictions
• Make each section distinct and valuable
• Avoid assumptions about hidden motives or psychological analysis

Remember: The goal is to help them understand both the card's wisdom and how it applies to their specific situation.`;
}

// ✅ 优化的解析函数 - 处理三段式结构
function parseAIResponse(content) {
  try {
    const cardMeaningMatch = content.match(/CARD_MEANING:\s*([\s\S]*?)(?=CONNECTION:|$)/i);
    const connectionMatch = content.match(/CONNECTION:\s*([\s\S]*?)(?=GUIDANCE:|$)/i);
    const guidanceMatch = content.match(/GUIDANCE:\s*([\s\S]*?)(?=KEY_INSIGHT:|$)/i);
    const insightMatch = content.match(/KEY_INSIGHT:\s*([\s\S]*?)$/i);
    
    const cardMeaning = cardMeaningMatch ? cardMeaningMatch[1].trim() : '';
    const connection = connectionMatch ? connectionMatch[1].trim() : '';
    const guidance = guidanceMatch ? guidanceMatch[1].trim() : '';
    const keyInsight = insightMatch ? insightMatch[1].trim() : extractFallbackInsight(content);
    
    // 简单清理，移除方括号
    const cleanCardMeaning = cardMeaning.replace(/^\[|\]$/g, '').trim();
    const cleanConnection = connection.replace(/^\[|\]$/g, '').trim();
    const cleanGuidance = guidance.replace(/^\[|\]$/g, '').trim();
    const cleanInsight = keyInsight.replace(/^\[|\]$/g, '').trim();
    
    // 组合完整的解读，如果某部分缺失则跳过
    const readingParts = [
      cleanCardMeaning,
      cleanConnection, 
      cleanGuidance
    ].filter(part => part.length > 0);
    
    const fullReading = readingParts.length > 0 ? readingParts.join('\n\n') : content.slice(0, 300);
    
    return {
      reading: fullReading,
      cardMeaning: cleanCardMeaning,
      connection: cleanConnection,
      guidance: cleanGuidance,
      keyInsight: cleanInsight,
      provider: 'deepseek'
    };
  } catch (error) {
    console.error('🔍 Error parsing AI response:', error);
    
    // 简单fallback，保持内容价值
    return {
      reading: content.slice(0, 300).trim(),
      keyInsight: extractFallbackInsight(content),
      provider: 'deepseek'
    };
  }
}

// ✅ 辅助函数：从内容中提取关键洞察
function extractFallbackInsight(content) {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // 寻找简洁有力的句子
  const powerfulSentence = sentences.find(sentence => {
    const trimmed = sentence.trim();
    return trimmed.length > 15 && trimmed.length < 80;
  });
  
  return powerfulSentence ? powerfulSentence.trim() : "Trust your inner wisdom to guide you forward";
}