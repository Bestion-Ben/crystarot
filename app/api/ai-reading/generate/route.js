 export async function POST(request) {
  try {
    const { cards, question, planType } = await request.json();
    
    // 临时返回模拟数据，稍后会添加真实AI逻辑
    return Response.json({
      reading: "The universe is aligning to bring you clarity and guidance. Trust in the wisdom that emerges from this moment of reflection.",
      keyInsight: "Your path forward is illuminated by inner wisdom",
      provider: "nextjs-api"
    });
    
  } catch (error) {
    return Response.json({ 
      error: 'API temporarily unavailable',
      fallback: true 
    }, { status: 500 });
  }
}
