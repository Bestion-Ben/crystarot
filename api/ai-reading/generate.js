export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowedMethods: ['POST'] 
    });
  }

  try {
    const { cards, question, planType } = req.body;
    
    // 验证输入
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid input: cards array is required' 
      });
    }
    
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid input: question string is required' 
      });
    }

    // 构建AI提示词
    const prompt = buildTarotPrompt(cards, question, planType);
    
    // 调用Deepseek API
    const aiResponse = await callDeepseekAPI(prompt, planType);
    
    // 处理AI响应
    const reading = aiResponse.choices[0].message.content;
    const keyInsight = extractKeyInsight(reading);
    
    // 分析问题类型
    const questionAnalysis = analyzeQuestion(question);
    
    // 返回成功响应
    return res.status(200).json({
      success: true,
      reading: reading,
      keyInsight: keyInsight,
      provider: 'deepseek',
      timestamp: new Date().toISOString(),
      metadata: {
        cardCount: cards.length,
        questionType: getQuestionType(question),
        planType: planType,
        isSpecificQuestion: questionAnalysis.isSpecific,
        questionLength: question.length,
        personalizedLevel: questionAnalysis.personalizedLevel
      }
    });

  } catch (error) {
    console.error('AI Reading API Error:', error);
    
    // 区分不同类型的错误
    if (error.message.includes('API key') || error.message.includes('401')) {
      return res.status(401).json({
        error: 'AI_AUTH_ERROR',
        message: 'AI service authentication failed',
        fallback: true
      });
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
      return res.status(429).json({
        error: 'AI_QUOTA_EXCEEDED',
        message: 'AI service quota exceeded',
        fallback: true
      });
    }
    
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      return res.status(504).json({
        error: 'AI_TIMEOUT',
        message: 'AI service timeout',
        fallback: true
      });
    }
    
    // 通用错误
    return res.status(500).json({
      error: 'AI_SERVICE_ERROR',
      message: 'AI service temporarily unavailable',
      fallback: true,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// 分析问题的个性化程度
function analyzeQuestion(question) {
  const defaultQuestions = [
    'What do I need to know about my love life?',
    'What opportunities await me?',
    'How can I unlock my potential?',
    'What message does the universe have for me?'
  ];
  
  const isSpecific = !defaultQuestions.includes(question) && question.length > 20;
  
  // 个性化程度评分
  let personalizedLevel = 'generic';
  if (question.length > 40 && (question.includes('I') || question.includes('my') || question.includes('me'))) {
    personalizedLevel = 'highly_personal';
  } else if (question.length > 20 && isSpecific) {
    personalizedLevel = 'somewhat_personal';
  }
  
  return {
    isSpecific,
    personalizedLevel,
    wordCount: question.split(' ').length,
    hasPersonalPronouns: /\b(I|my|me|myself)\b/i.test(question),
    hasQuestionWords: /\b(should|how|what|why|when|where|can|will)\b/i.test(question)
  };
}

// 构建塔罗牌AI提示词 - 重新设计
function buildTarotPrompt(cards, question, planType) {
  const questionType = getQuestionType(question);
  const questionAnalysis = analyzeQuestion(question);
  const card = cards[0]; // 主要关注第一张卡
  
  // 系统角色定义
  const systemRole = `You are ArcaneCards AI, a wise and supportive tarot guide who helps people find clarity, direction, and empowerment through ancient wisdom applied to modern life. Your readings are warm, insightful, and focused on personal growth rather than prediction.`;

  if (planType === 'quick' || cards.length === 1) {
    // 单卡解读
    if (questionAnalysis.isSpecific && questionAnalysis.personalizedLevel !== 'generic') {
      // 高度个性化prompt - 针对具体问题
      return `${systemRole}

PERSONALIZED READING REQUEST:
Card Drawn: ${card.name} (${card.upright ? 'Upright' : 'Reversed'})
User's Specific Question: "${question}"
Question Category: ${questionType}
Card Element: ${card.element}
Question Analysis: ${questionAnalysis.personalizedLevel}

This user has shared a specific, personal question that deserves a tailored response. Provide a highly personalized tarot reading (90-110 words) that:

🎯 DIRECT ADDRESSING:
- Speak directly to their specific situation and concern
- Explain how the ${card.name} energy specifically applies to their question
- Address the underlying hopes, fears, or motivations in their question

💡 ACTIONABLE WISDOM:
- Provide concrete steps they can take regarding their specific concern
- Offer practical advice they can implement this week
- Bridge the card's ancient wisdom with their modern situation

✨ EMPOWERING TONE:
- Acknowledge their courage in asking this question
- Highlight their personal agency and power to create change
- End with confidence and encouragement specific to their path

Remember: This card appeared for THIS question for a reason. Help them understand why.`;

    } else {
      // 标准prompt - 通用分类指导
      return `${systemRole}

GENERAL GUIDANCE REQUEST:
Card Drawn: ${card.name} (${card.upright ? 'Upright' : 'Reversed'})
Guidance Area: ${questionType}
Card Element: ${card.element}
Context: General life guidance in ${questionType} matters

Provide warm, encouraging tarot guidance (80-90 words) for ${questionType} that:

🌟 UNIVERSAL WISDOM:
- Explain how ${card.name} guides ${questionType} decisions and growth
- Share insights that apply to common ${questionType} situations
- Connect the card's energy to this life area

🎯 PRACTICAL GUIDANCE:
- Offer 1-2 actionable steps for ${questionType} improvement
- Provide guidance that feels relevant to most people's ${questionType} journeys
- Focus on growth opportunities and positive outcomes

✨ EMPOWERING MESSAGE:
- Maintain optimistic, supportive tone
- Encourage personal agency and positive change
- End with motivation for taking inspired action`;
    }
  } else {
    // 三卡解读
    const pastCard = cards[0];
    const presentCard = cards[1];
    const futureCard = cards[2];
    
    if (questionAnalysis.isSpecific) {
      // 个性化三卡解读
      return `${systemRole}

PERSONALIZED THREE-CARD READING:
Past: ${pastCard.name} (${pastCard.upright ? 'Upright' : 'Reversed'})
Present: ${presentCard.name} (${presentCard.upright ? 'Upright' : 'Reversed'}) 
Future: ${futureCard.name} (${futureCard.upright ? 'Upright' : 'Reversed'})

User's Specific Question: "${question}"
Category: ${questionType}

Provide a comprehensive, personalized 3-card reading (130-160 words) that:

🔄 NARRATIVE FLOW:
- Past: How past experiences directly relate to their current question
- Present: Current energies and opportunities specific to their concern
- Future: Likely outcomes if they follow the cards' guidance for this situation

🎯 QUESTION-FOCUSED:
- Weave their specific question throughout all three timeframes
- Show how each card specifically addresses their concern
- Create a coherent story that answers their question

💪 EMPOWERED ACTION:
- Provide specific next steps based on all three cards
- Show how they can influence the future outcome
- End with confidence about their ability to create positive change

Make this feel like a deeply personal reading created just for them and their unique situation.`;

    } else {
      // 通用三卡解读
      return `${systemRole}

THREE-CARD GUIDANCE READING:
Past: ${pastCard.name} (${pastCard.upright ? 'Upright' : 'Reversed'})
Present: ${presentCard.name} (${presentCard.upright ? 'Upright' : 'Reversed'})
Future: ${futureCard.name} (${futureCard.upright ? 'Upright' : 'Reversed'})

Guidance Focus: ${questionType}

Provide comprehensive 3-card guidance (120-140 words) for ${questionType} growth that:

🔄 TEMPORAL WISDOM:
- Past: How past experiences in ${questionType} shape the present
- Present: Current ${questionType} opportunities and challenges
- Future: Positive outcomes through conscious ${questionType} choices

🌟 INTEGRATED GUIDANCE:
- Show connections between all three cards
- Create a coherent ${questionType} growth narrative
- Balance honesty about challenges with hope for positive outcomes

💫 ACTIONABLE WISDOM:
- Provide specific steps for ${questionType} improvement
- Show how to apply each card's energy practically
- End with empowering next steps for their ${questionType} journey`;
    }
  }
}

// 调用Deepseek API
async function callDeepseekAPI(prompt, planType) {
  const maxTokens = planType === 'quick' ? 140 : 200; // 增加token以支持更详细的回答
  
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are a wise, supportive tarot guide focused on personal growth and empowerment. Your readings are warm, insightful, and help people find clarity and direction through ancient wisdom applied to modern life.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.75, // 稍微提高创造性
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Deepseek API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
  }

  return await response.json();
}

// 智能提取关键洞察
function extractKeyInsight(reading) {
  // 去除emoji和特殊字符进行分析
  const cleanReading = reading.replace(/[🎯💡✨🌟🔄💪💫⭐]/g, '').trim();
  const sentences = cleanReading.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  // 优先寻找包含行动词汇的句子
  const actionSentences = sentences.filter(s => 
    /\b(take|embrace|focus|trust|remember|allow|create|choose|move|open|believe|step|start|begin|commit|practice)\b/i.test(s)
  );
  
  if (actionSentences.length > 0) {
    const actionSentence = actionSentences[actionSentences.length - 1].trim();
    if (actionSentence.length > 10 && actionSentence.length < 100) {
      return actionSentence;
    }
  }
  
  // 寻找包含"you"的直接指导句子
  const directGuidance = sentences.filter(s => 
    /\byou\b/i.test(s) && s.length > 15 && s.length < 90
  );
  
  if (directGuidance.length > 0) {
    return directGuidance[directGuidance.length - 1].trim();
  }
  
  // 寻找最后一句有意义的话
  if (sentences.length > 0) {
    const lastSentence = sentences[sentences.length - 1].trim();
    if (lastSentence.length > 10 && lastSentence.length < 80) {
      return lastSentence;
    }
  }
  
  // 备用洞察基于问题类型
  const fallbackInsights = {
    'love': "Trust your heart and take courageous steps toward authentic love",
    'career': "Your unique talents are ready to shine in new opportunities", 
    'growth': "Embrace change as your pathway to personal transformation",
    'spiritual': "Your inner wisdom holds the answers you seek"
  };
  
  const questionType = getQuestionType(reading);
  return fallbackInsights[questionType] || "Trust your inner wisdom and take inspired action";
}

// 获取问题类型
function getQuestionType(question) {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('love') || lowerQuestion.includes('relationship') || 
      lowerQuestion.includes('romantic') || lowerQuestion.includes('partner') ||
      lowerQuestion.includes('dating') || lowerQuestion.includes('marriage')) {
    return 'love';
  }
  
  if (lowerQuestion.includes('career') || lowerQuestion.includes('job') || 
      lowerQuestion.includes('work') || lowerQuestion.includes('money') || 
      lowerQuestion.includes('professional') || lowerQuestion.includes('business') ||
      lowerQuestion.includes('salary') || lowerQuestion.includes('promotion')) {
    return 'career';
  }
  
  if (lowerQuestion.includes('growth') || lowerQuestion.includes('personal') || 
      lowerQuestion.includes('develop') || lowerQuestion.includes('potential') ||
      lowerQuestion.includes('improve') || lowerQuestion.includes('change') ||
      lowerQuestion.includes('confidence') || lowerQuestion.includes('healing')) {
    return 'growth';
  }
  
  return 'spiritual';
}