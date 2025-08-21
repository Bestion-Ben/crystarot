"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Briefcase, Sprout, Sparkles, Star, ArrowRight, Share2, Save } from 'lucide-react';

import { EVENTS } from '../lib/constants/events';
import { tracker } from '../lib/utils/tracking';


const ArcaneCards = () => {
  // ✅ 临时替换追踪函数 - 简单的控制台日志

  const trackUserAction = (eventName, data = {}) => {
    tracker.track(eventName, data);
  };

  const trackPageView = (pageName, pageData = {}) => {
    tracker.trackPageView(pageName, pageData);
  };

  const API_CONFIG = {
    timeout: 25000, // 25秒超时
    retries: 2,
    baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''
  };
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [selectedCards, setSelectedCards] = useState([]);
  const [shuffledDeck, setShuffledDeck] = useState([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const [questionInputFocused, setQuestionInputFocused] = useState(false);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [currentStage, setCurrentStage] = useState(1);
  const ShuffleText = () => {
    const [textIndex, setTextIndex] = useState(0);
    const texts = [
      "The cards are choosing their moment...",
      "Ancient wisdom awakens...",
      "Cosmic energy flows through the deck...",
      "Your destiny is being woven..."
    ];
    
    useEffect(() => {
      const interval = setInterval(() => {
        setTextIndex(prev => (prev + 1) % texts.length);
      }, 700);
      return () => clearInterval(interval);
    }, []);
    
    return (
      <motion.p 
        key={textIndex}
        className="text-amber-200 font-serif text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        {texts[textIndex]}
      </motion.p>
    );
  };

  
  const handleEmailCollection = (email, planId) => {
    trackUserAction('email_provided', {
      email: email,
      plan_id: planId,
      plan_interest: `${planId}_reading_waitlist`,
      question_category: selectedQuestion?.id,
      collection_source: 'payment_intent_dialog',
      user_rating: userRating,
      follow_up_status: 'pending'
    });
  };

  const handleReadingComplete = (reading, cards) => {
    trackUserAction('reading_completed', {
      question_text: selectedQuestion?.question,
      question_category: selectedQuestion?.id,
      plan_id: 'quick',
      card_name: cards[0]?.name,
      card_upright: cards[0]?.upright,
      ai_reading: reading.reading,
      key_insight: reading.keyInsight,
      reading_length: reading.reading?.length || 0
    });
  };

  const handleDetailedRating = (rating, feedback = '') => {
    trackUserAction('rating_given', {
      rating: rating,
      user_feedback: feedback,
      plan_id: 'quick',
      card_name: selectedCards[0]?.name,
      question_category: selectedQuestion?.id,
      time_to_rate: Date.now() - pageStartTime,
      detailed_feedback: rating >= 4 ? 'positive_experience' : 'needs_improvement'
    });
  };
  
  // 选牌页面的内部状态
  const [cardSelectionPhase, setCardSelectionPhase] = useState('preparing');
  const [selectedCardIndexes, setSelectedCardIndexes] = useState([]);
  const [revealedCard, setRevealedCard] = useState(null);
  
  // 数据追踪相关状态
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [readingResult, setReadingResult] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [hasCompletedFreeReading, setHasCompletedFreeReading] = useState(false);
  
  // 使用ref来避免不必要的重新渲染
  const phaseTimeoutRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // 22张大阿尔卡纳塔罗牌
  const tarotCards = [
    { id: 0, name: 'The Fool', symbol: '𝔀€', meaning: 'New beginnings, innocence, spontaneity, free spirit', upright: true, element: 'Air' },
    { id: 1, name: 'The Magician', symbol: '☿', meaning: 'Manifestation, resourcefulness, power, inspired action', upright: true, element: 'Fire' },
    { id: 2, name: 'The High Priestess', symbol: '☽', meaning: 'Intuition, sacred knowledge, inner voice, mystery', upright: false, element: 'Water' },
    { id: 3, name: 'The Empress', symbol: '♀', meaning: 'Femininity, beauty, nature, nurturing, abundance', upright: true, element: 'Earth' },
    { id: 4, name: 'The Emperor', symbol: '♂', meaning: 'Authority, structure, control, father figure', upright: false, element: 'Fire' },
    { id: 5, name: 'The Hierophant', symbol: '♉', meaning: 'Spiritual wisdom, religious beliefs, tradition', upright: true, element: 'Earth' },
    { id: 6, name: 'The Lovers', symbol: '♊', meaning: 'Love, harmony, relationships, values alignment', upright: true, element: 'Air' },
    { id: 7, name: 'The Chariot', symbol: '♋', meaning: 'Control, willpower, determination, triumph', upright: false, element: 'Water' },
    { id: 8, name: 'Strength', symbol: '♌', meaning: 'Inner strength, bravery, compassion, focus', upright: true, element: 'Fire' },
    { id: 9, name: 'The Hermit', symbol: '♍', meaning: 'Soul searching, introspection, inner guidance', upright: true, element: 'Earth' },
    { id: 10, name: 'Wheel of Fortune', symbol: '♃', meaning: 'Good luck, karma, life cycles, destiny', upright: true, element: 'Fire' },
    { id: 11, name: 'Justice', symbol: '♎', meaning: 'Justice, fairness, truth, law, balance', upright: false, element: 'Air' },
    { id: 12, name: 'The Hanged Man', symbol: '♆', meaning: 'Suspension, restriction, letting go, sacrifice', upright: true, element: 'Water' },
    { id: 13, name: 'Death', symbol: '♏', meaning: 'Endings, transformation, transition, renewal', upright: false, element: 'Water' },
    { id: 14, name: 'Temperance', symbol: '♐', meaning: 'Balance, moderation, patience, purpose', upright: true, element: 'Fire' },
    { id: 15, name: 'The Devil', symbol: '♑', meaning: 'Shadow self, attachment, addiction, restriction', upright: false, element: 'Earth' },
    { id: 16, name: 'The Tower', symbol: '♂', meaning: 'Sudden change, upheaval, chaos, revelation', upright: true, element: 'Fire' },
    { id: 17, name: 'The Star', symbol: '♒', meaning: 'Hope, faith, purpose, renewal, spirituality', upright: true, element: 'Air' },
    { id: 18, name: 'The Moon', symbol: '♓', meaning: 'Illusion, fear, anxiety, subconscious, intuition', upright: false, element: 'Water' },
    { id: 19, name: 'The Sun', symbol: '☉', meaning: 'Positivity, fun, warmth, success, vitality', upright: true, element: 'Fire' },
    { id: 20, name: 'Judgement', symbol: '♇', meaning: 'Judgement, rebirth, inner calling, absolution', upright: true, element: 'Fire' },
    { id: 21, name: 'The World', symbol: '♄', meaning: 'Completion, accomplishment, travel, fulfillment', upright: true, element: 'Earth' }
  ];

  // 塔罗牌艺术符号设计
  const CardSymbols = {
    'The Fool': { symbol: '🎒', accent: '🌹', color: 'from-green-400 to-emerald-500' },
    'The Magician': { symbol: '🪄', accent: '⚡', color: 'from-red-400 to-orange-500' },
    'The High Priestess': { symbol: '🌙', accent: '🔮', color: 'from-blue-400 to-indigo-500' },
    'The Empress': { symbol: '👑', accent: '🌾', color: 'from-pink-400 to-rose-500' },
    'The Emperor': { symbol: '⚔️', accent: '🏰', color: 'from-red-500 to-red-600' },
    'The Hierophant': { symbol: '🗝️', accent: '📜', color: 'from-amber-400 to-yellow-500' },
    'The Lovers': { symbol: '💕', accent: '👫', color: 'from-pink-400 to-red-400' },
    'The Chariot': { symbol: '🏆', accent: '⚡', color: 'from-purple-400 to-purple-600' },
    'Strength': { symbol: '🦁', accent: '💪', color: 'from-orange-400 to-red-500' },
    'The Hermit': { symbol: '🏮', accent: '⭐', color: 'from-gray-400 to-slate-500' },
    'Wheel of Fortune': { symbol: '🎰', accent: '🔄', color: 'from-purple-400 to-blue-500' },
    'Justice': { symbol: '⚖️', accent: '👁️', color: 'from-blue-500 to-indigo-600' },
    'The Hanged Man': { symbol: '🙃', accent: '🌊', color: 'from-teal-400 to-cyan-500' },
    'Death': { symbol: '🦋', accent: '🌅', color: 'from-gray-500 to-slate-600' },
    'Temperance': { symbol: '⚗️', accent: '🌈', color: 'from-blue-400 to-purple-500' },
    'The Devil': { symbol: '😈', accent: '⛓️', color: 'from-red-600 to-black' },
    'The Tower': { symbol: '🗽', accent: '⚡', color: 'from-red-500 to-orange-600' },
    'The Star': { symbol: '⭐', accent: '✨', color: 'from-blue-300 to-purple-400' },
    'The Moon': { symbol: '🌙', accent: '🐺', color: 'from-indigo-400 to-purple-600' },
    'The Sun': { symbol: '☀️', accent: '🌻', color: 'from-yellow-400 to-orange-500' },
    'Judgement': { symbol: '📯', accent: '👼', color: 'from-white to-blue-300' },
    'The World': { symbol: '🌍', accent: '🎉', color: 'from-green-400 to-blue-500' }
  };

  const emotionalStates = [
    {
      id: 'uncertain',
      emoji: '😰', 
      title: "I'm feeling uncertain",
      subtitle: "Something feels unclear in my life",
      color: 'from-blue-500 to-indigo-500',
      scenarios: [
        { id: 'relationships', emoji: '💔', title: 'About my relationships', question: 'What do I need to know about my love life?' },
        { id: 'career', emoji: '💼', title: 'About my career path', question: 'What direction should my career take?' },
        { id: 'direction', emoji: '🌱', title: 'About my life direction', question: 'What path should I choose in life?' },
        { id: 'purpose', emoji: '⭐', title: 'About my purpose', question: 'What is my true calling in life?' }
      ]
    },
    {
      id: 'curious',
      emoji: '💭',
      title: "I'm curious about...",
      subtitle: "I want to explore possibilities", 
      color: 'from-purple-500 to-pink-500',
      scenarios: [
        { id: 'romantic_future', emoji: '❤️', title: 'My romantic future', question: 'What does love have in store for me?' },
        { id: 'financial_path', emoji: '💰', title: 'My financial path', question: 'What opportunities await me financially?' },
        { id: 'hidden_potential', emoji: '🎯', title: 'My hidden potential', question: 'What talents should I develop?' },
        { id: 'whats_next', emoji: '🌟', title: "What's coming next", question: 'What should I expect in the near future?' }
      ]
    },
    {
      id: 'bothered',
      emoji: '😤',
      title: "Something's bothering me", 
      subtitle: "I need clarity on a situation",
      color: 'from-red-500 to-orange-500',
      scenarios: [
        { id: 'conflict', emoji: '💔', title: 'A relationship conflict', question: 'How can I resolve this relationship issue?' },
        { id: 'decision', emoji: '🤔', title: 'A difficult decision', question: 'What should I consider in making this choice?' },
        { id: 'obstacle', emoji: '🚧', title: 'An obstacle I face', question: 'How can I overcome this challenge?' },
        { id: 'stress', emoji: '😟', title: 'Stress or anxiety', question: 'What can help me find peace right now?' }
      ]
    },
    {
      id: 'ready_for_change',
      emoji: '✨',
      title: "I'm ready for change",
      subtitle: "I want to grow and transform",
      color: 'from-green-500 to-emerald-500', 
      scenarios: [
        { id: 'self_improvement', emoji: '🌱', title: 'Personal growth', question: 'How can I become my best self?' },
        { id: 'new_beginning', emoji: '🌅', title: 'A fresh start', question: 'How should I approach this new chapter?' },
        { id: 'breaking_patterns', emoji: '🔓', title: 'Breaking old patterns', question: 'What habits should I change?' },
        { id: 'manifestation', emoji: '✨', title: 'Manifesting my dreams', question: 'How can I turn my vision into reality?' }
      ]
    }
  ];

  const formatReading = (text) => {
    if (!text) return ['Your reading is being prepared...'];
    
    // 如果AI已经用\n\n分段了
    if (text.includes('\n\n')) {
      return text.split('\n\n').filter(p => p.trim());
    }
    
    // 如果没分段，按句号智能分段（fallback）
    const sentences = text.split('. ');
    const paragraphs = [];
    let currentParagraph = '';
    
    sentences.forEach((sentence, index) => {
      currentParagraph += sentence + (index < sentences.length - 1 ? '. ' : '');
      
      // 每2-3句成一段，最多3段
      if ((index + 1) % 3 === 0 || index === sentences.length - 1) {
        if (currentParagraph.trim()) {
          paragraphs.push(currentParagraph.trim());
          currentParagraph = '';
        }
      }
    });
    
    // 确保至少有内容，最多3段
    const result = paragraphs.filter(p => p.length > 0);
    return result.length > 0 ? result.slice(0, 3) : [text];
  };

  // 初始化追踪
  useEffect(() => {
    const getScreenSize = () => {
      if (typeof window !== 'undefined' && window.screen) {
        return `${window.screen.width}x${window.screen.height}`;
      }
      return 'unknown';
    };

    const getUserAgent = () => {
      if (typeof navigator !== 'undefined') {
        return navigator.userAgent;
      }
      return 'unknown';
    };

    trackUserAction(EVENTS.SESSION_START, {
      timestamp: Date.now(),
      userAgent: getUserAgent(),
      screenSize: getScreenSize()
    });
  }, []);

  // 页面切换追踪
  useEffect(() => {
    const pageNames = {1: 'landing', 2: 'question', 3: 'cards', 4: 'result'};
    const pageName = pageNames[currentPage];
    
    if (pageName) {
      trackPageView(pageName, {
        planSelected: 'quick', // 固定值
        questionSelected: selectedQuestion?.id,
        timeFromStart: Date.now() - pageStartTime
      });
    }
    
    // 重置页面开始时间
    setPageStartTime(Date.now());
  }, [currentPage, selectedQuestion]);

  // 初始化洗牌后的牌组
  useEffect(() => {
    if (!hasInitializedRef.current) {
      const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
      setShuffledDeck(shuffled);
      hasInitializedRef.current = true;
      
      trackUserAction(EVENTS.DECK_SHUFFLED, {
        totalCards: shuffled.length
      });
    }
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (phaseTimeoutRef.current) {
        clearTimeout(phaseTimeoutRef.current);
      }
    };
  }, []);

  // 星空背景组件
  const StarField = React.memo(() => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    // 只在客户端渲染星星
    if (!isClient) {
      return <div className="absolute inset-0 overflow-hidden pointer-events-none"></div>;
    }

    const stars = Array.from({ length: 20 }, (_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${Math.random() * 2 + 1}px`,
          height: `${Math.random() * 2 + 1}px`,
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: Math.random() * 3 + 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    ));
    return <div className="absolute inset-0 overflow-hidden pointer-events-none">{stars}</div>;
  });

  // 升级的卡片组件
  const Card = React.memo(({ card, index, isSelected, onClick, isRevealed = false }) => {
    const cardSymbol = CardSymbols[card.name] || { 
      symbol: '✦', 
      accent: '✨', 
      color: 'from-purple-400 to-violet-500' 
    };

    return (
      <motion.div
        className="relative cursor-pointer select-none rounded-xl overflow-hidden"
        style={{
          width: '105px',
          height: '190px',
        }}
        animate={{ 
          scale: isSelected ? 1.1 : 1,
          zIndex: isSelected ? 10 : 1
        }}
        transition={{ 
          duration: 0.3,
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        whileHover={!isSelected ? { 
          scale: 1.05, 
          y: -5,
          transition: { type: "spring", stiffness: 400, damping: 30 }
        } : {}}
        whileTap={{ scale: 0.95 }}
        onClick={() => onClick(index, card)}
      >
        {/* 卡牌背面 - 新的SVG设计 */}
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            border: isSelected ? '2px solid #fbbf24' : '1px solid rgba(168, 85, 247, 0.3)',
          }}
          animate={{ rotateY: isRevealed ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* 神秘塔罗卡背设计 */}
          <svg className="w-full h-full rounded-xl" viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id={`backgroundGradient-${index}`} cx="50%" cy="50%" r="80%">
                <stop offset="0%" style={{stopColor:'#1a0033', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#0f0027', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#000015', stopOpacity:1}} />
              </radialGradient>
              
              <linearGradient id={`goldGradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                <stop offset="50%" style={{stopColor:'#F4D03F', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#B8860B', stopOpacity:1}} />
              </linearGradient>
              
              <filter id={`glow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* 背景 */}
            <rect width="70" height="110" fill={`url(#backgroundGradient-${index})`} rx="8"/>
            
            {/* 外边框 */}
            <rect x="2" y="2" width="66" height="106" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.8" rx="6"/>
            <rect x="4" y="4" width="62" height="102" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.4" rx="4"/>
            
            {/* 顶部月相 */}
            <g transform="translate(35,12)">
              <g transform="translate(-12,0)">
                <circle r="2.5" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.4"/>
                <circle r="2" cx="1" cy="0" fill="#1a0033"/>
              </g>
              <circle r="3.5" fill={`url(#goldGradient-${index})`} opacity="0.9" filter={`url(#glow-${index})`}/>
              <circle r="2.5" fill="#1a0033" opacity="0.3"/>
              <g transform="translate(12,0)">
                <circle r="2.5" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.4"/>
                <circle r="2" cx="-1" cy="0" fill="#1a0033"/>
              </g>
            </g>
            
            {/* 中央主图案 */}
            <g transform="translate(35,55)">
              {/* 外圆环 */}
              <circle r="20" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6" opacity="0.6"/>
              <circle r="17" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.3" opacity="0.4"/>
              
              {/* 太阳光芒 */}
              <g>
                <line x1="0" y1="-15" x2="0" y2="-18" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="11" y1="-11" x2="13" y2="-13" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="15" y1="0" x2="18" y2="0" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="11" y1="11" x2="13" y2="13" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="0" y1="15" x2="0" y2="18" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="-11" y1="11" x2="-13" y2="13" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="-15" y1="0" x2="-18" y2="0" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <line x1="-11" y1="-11" x2="-13" y2="-13" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
              </g>
              
              {/* 中央水晶球 */}
              <circle r="11" fill={`url(#goldGradient-${index})`} opacity="0.1"/>
              <circle r="9" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
              
              {/* 全视之眼 */}
              <g opacity="0.8">
                <polygon points="0,-6 -5,3 5,3" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.6"/>
                <ellipse cx="0" cy="-1" rx="3" ry="1.5" fill={`url(#goldGradient-${index})`} opacity="0.7"/>
                <circle cx="0" cy="-1" r="1" fill="#1a0033"/>
                <circle cx="0" cy="-1" r="0.5" fill={`url(#goldGradient-${index})`}/>
              </g>
            </g>
            
            {/* 底部月相 */}
            <g transform="translate(35,98)">
              <g transform="translate(-12,0)">
                <circle r="2.5" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.4"/>
                <circle r="2" cx="1" cy="0" fill="#1a0033"/>
              </g>
              <circle r="3.5" fill={`url(#goldGradient-${index})`} opacity="0.9" filter={`url(#glow-${index})`}/>
              <circle r="2.5" fill="#1a0033" opacity="0.3"/>
              <g transform="translate(12,0)">
                <circle r="2.5" fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.4"/>
                <circle r="2" cx="-1" cy="0" fill="#1a0033"/>
              </g>
            </g>
            
            {/* 星空点缀 */}
            <g fill={`url(#goldGradient-${index})`} opacity="0.6">
              <circle cx="15" cy="25" r="0.5"/>
              <circle cx="55" cy="30" r="0.5"/>
              <circle cx="12" cy="75" r="0.4"/>
              <circle cx="58" cy="80" r="0.4"/>
              <circle cx="20" cy="85" r="0.3"/>
              <circle cx="50" cy="20" r="0.3"/>
            </g>
            
            {/* 角落装饰 */}
            <g fill="none" stroke={`url(#goldGradient-${index})`} strokeWidth="0.3" opacity="0.5">
              <path d="M 6 6 L 12 6 M 6 6 L 6 12"/>
              <path d="M 64 6 L 58 6 M 64 6 L 64 12"/>
              <path d="M 6 104 L 12 104 M 6 104 L 6 98"/>
              <path d="M 64 104 L 58 104 M 64 104 L 64 98"/>
            </g>
          </svg>

          {/* 选中状态的光晕效果 */}
          {isSelected && (
            <motion.div
              className="absolute -inset-1 rounded-xl bg-gradient-to-r from-amber-400/30 to-orange-400/30 -z-10 blur-sm"
              animate={{ 
                opacity: [0.3, 0.7, 0.3], 
                scale: [1, 1.03, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </motion.div>

        {/* 卡牌正面（当翻转时显示）*/}
        {isRevealed && (
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${cardSymbol.color} rounded-xl border-2 border-amber-400 shadow-2xl`}
            initial={{ rotateY: -180 }}
            animate={{ rotateY: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* 装饰性背景图案 */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-1 left-1 text-xs">✦</div>
              <div className="absolute top-1 right-1 text-xs">✦</div>
              <div className="absolute bottom-1 left-1 text-xs">✦</div>
              <div className="absolute bottom-1 right-1 text-xs">✦</div>
            </div>

            {/* 主要内容 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <motion.div 
                className="text-xl mb-1 filter drop-shadow-lg"
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {cardSymbol.symbol}
              </motion.div>
              
              <div className="text-xs font-bold text-center px-1 mb-1 leading-tight">
                {card.name.length > 12 ? card.name.slice(0, 12) + '..' : card.name}
              </div>
              
              <div className="text-xs opacity-80 text-center">
                {card.upright ? 'Upright' : 'Reversed'}
              </div>
              
              <motion.div 
                className="text-sm mt-1"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {cardSymbol.accent}
              </motion.div>
            </div>

            {/* 金色边框效果 */}
            <div className="absolute inset-0 rounded-xl border border-amber-300/50 pointer-events-none"></div>
          </motion.div>
        )}
      </motion.div>
    );
  });



  // 问题类型选择处理 - 完整版本
  const handleEmotionSelection = (emotion) => {
    setSelectedEmotion(emotion);
    setSelectedScenario(null);
    setCurrentStage(2);
    
    trackUserAction('emotion_selected', {
      emotionId: emotion.id,
      emotionTitle: emotion.title,
      timeOnPage: Date.now() - pageStartTime
    });
  };

  const handleScenarioSelection = (scenario) => {
    setSelectedScenario(scenario);
    setCurrentStage(3);
    
    // 构建问题对象
    setSelectedQuestion({
      id: `${selectedEmotion.id}_${scenario.id}`,
      emotion: selectedEmotion,
      scenario: scenario,
      defaultQuestion: scenario.question,
      finalQuestion: scenario.question
    });
    
    trackUserAction('scenario_selected', {
      emotionId: selectedEmotion.id,
      scenarioId: scenario.id,
      defaultQuestion: scenario.question
    });
  };

  // 开始选卡流程 - 完整版本
  const startCardSelection = () => {
    const finalQuestion = customQuestion.trim() || selectedScenario?.question || 'What guidance do I need?';
  
      setSelectedQuestion(prev => ({
        ...prev,
        finalQuestion: finalQuestion,
        isCustom: customQuestion.trim().length > 0
      }));
    const timeOnPage = Date.now() - pageStartTime;
    const customQuestionText = customQuestion.trim();
    const hasCustomQuestion = customQuestionText.length > 0;
    
    
    // 分析自定义问题质量
    const questionAnalysis = analyzeCustomQuestion(customQuestionText);
    
    // 详细追踪开始选卡
    trackUserAction(EVENTS.CARD_SELECTION_START, {
      planType: 'quick',
      questionType: selectedQuestion?.id,
      hasCustomQuestion: hasCustomQuestion,
      questionAnalysis: questionAnalysis,
      finalQuestion: finalQuestion,
      questionMetrics: {
        customQuestionLength: customQuestionText.length,
        wordCount: customQuestionText.split(' ').length,
        hasPersonalPronouns: /\b(I|my|me|myself)\b/i.test(customQuestionText),
        hasQuestionWords: /\b(should|how|what|why|when|where|can|will)\b/i.test(customQuestionText),
        isSpecific: questionAnalysis.isSpecific
      },
      userJourney: {
        requiredCards: 1,
        questionSelectionTime: timeOnPage,
        timeFromLanding: Date.now() - pageStartTime,
        planSelectedFirst: 'quick'
      }
    });

    // 如果用户输入了自定义问题，单独追踪
    if (hasCustomQuestion) {
      trackUserAction(EVENTS.CUSTOM_QUESTION_ENTERED, {
        questionType: selectedQuestion?.id,
        questionLength: customQuestionText.length,
        wordCount: customQuestionText.split(' ').length,
        quality: questionAnalysis.quality,
        isSpecific: questionAnalysis.isSpecific,
        personalizedLevel: questionAnalysis.personalizedLevel,
        timeToComplete: timeOnPage,
        category: selectedQuestion?.id
      });
    }

    // 保存最终问题到状态（用于后续AI调用）
    setSelectedQuestion({
      ...selectedQuestion,
      finalQuestion: finalQuestion,
      isCustom: hasCustomQuestion,
      questionAnalysis: questionAnalysis
    });

    setCurrentPage(3);
    setCardSelectionPhase('waiting');
  };

  // 辅助函数：分析自定义问题质量
  const analyzeCustomQuestion = (question) => {
    if (!question || question.length === 0) {
      return {
        quality: 'none',
        isSpecific: false,
        personalizedLevel: 'generic',
        wordCount: 0
      };
    }
    
    const wordCount = question.split(' ').length;
    const hasPersonalPronouns = /\b(I|my|me|myself)\b/i.test(question);
    const hasQuestionWords = /\b(should|how|what|why|when|where|can|will)\b/i.test(question);
    const hasSpecificDetails = wordCount > 8 && (hasPersonalPronouns || question.includes('?'));
    
    let quality = 'basic';
    let personalizedLevel = 'generic';
    
    if (wordCount > 15 && hasPersonalPronouns && hasQuestionWords) {
      quality = 'excellent';
      personalizedLevel = 'highly_personal';
    } else if (wordCount > 8 && (hasPersonalPronouns || hasQuestionWords)) {
      quality = 'good';
      personalizedLevel = 'somewhat_personal';
    } else if (wordCount > 5) {
      quality = 'basic';
      personalizedLevel = 'slightly_personal';
    }
    
    return {
      quality,
      isSpecific: hasSpecificDetails,
      personalizedLevel,
      wordCount,
      hasPersonalPronouns,
      hasQuestionWords,
      length: question.length
    };
  };

  // 手动洗牌
  const startShuffling = () => {
    setCardSelectionPhase('shuffling');
    trackUserAction(EVENTS.CARDS_SHUFFLING, {
      planType: 'quick'
    });
    
    // 洗牌动画持续2-3秒
    phaseTimeoutRef.current = setTimeout(() => {
      setCardSelectionPhase('selecting');
      trackUserAction(EVENTS.CARDS_READY_FOR_SELECTION, {
        availableCards: 9 // 显示9张牌
      });
    }, 2500);
  };

  // 选择卡牌
  const selectCard = (cardIndex, card) => {
    if (selectedCardIndexes.includes(cardIndex)) return;
    
    // 只选择一张牌
    const newSelectedIndexes = [cardIndex];
    const newSelectedCards = [card];
    
    // 追踪单卡选择
    trackUserAction(EVENTS.CARD_SELECTED, {
      cardIndex,
      cardName: card.name,
      cardElement: card.element,
      cardUpright: card.upright,
      selectionOrder: 1,
      totalSelected: 1,
      requiredCards: 1
    });
    
    setSelectedCardIndexes(newSelectedIndexes);
    setSelectedCards(newSelectedCards);
    
    // 选择后立即进入完成阶段
    trackUserAction(EVENTS.CARDS_SELECTION_COMPLETE, {
      selectedCards: newSelectedCards.map(c => ({
        name: c.name,
        element: c.element,
        upright: c.upright
      })),
      totalSelectionTime: Date.now() - pageStartTime,
      planType: 'quick'
    });

    setCardSelectionPhase('completing');
    
    phaseTimeoutRef.current = setTimeout(() => {
      setCardSelectionPhase('revealing');
      setRevealedCard(newSelectedCards[0]);
      
      phaseTimeoutRef.current = setTimeout(() => {
        generateAndShowReading(newSelectedCards);
      }, 2000);
    }, 1500);
  };

  // 生成并显示解读 - 完整版本
  const generateAndShowReading = async (cards) => {
    const readingStartTime = Date.now();
    const finalQuestion = selectedQuestion?.finalQuestion || selectedQuestion?.question || 'What guidance do I need?';
    const isCustomQuestion = selectedQuestion?.isCustom || false;
    const questionAnalysis = selectedQuestion?.questionAnalysis || {};
    
    // 追踪解读生成开始
    trackUserAction(EVENTS.READING_GENERATION_START, {
      planType: 'quick',
      questionType: selectedQuestion?.id,
      selectedCards: cards.map(c => ({
        name: c.name,
        element: c.element,
        upright: c.upright
      })),
      readingMethod: 'attempting_ai',
      questionContext: {
        isCustomQuestion: isCustomQuestion,
        questionLength: finalQuestion.length,
        questionQuality: questionAnalysis.quality,
        personalizedLevel: questionAnalysis.personalizedLevel,
        hasPersonalPronouns: questionAnalysis.hasPersonalPronouns,
        wordCount: questionAnalysis.wordCount
      },
      userJourney: {
        totalSelectionTime: Date.now() - pageStartTime,
        cardSelectionTime: readingStartTime - pageStartTime
      }
    });
    
    // 追踪问题类型使用（自定义vs通用）
    if (isCustomQuestion) {
      trackUserAction(EVENTS.SPECIFIC_QUESTION_USED, {
        questionLength: finalQuestion.length,
        questionType: selectedQuestion?.id,
        planType: 'quick',
        quality: questionAnalysis.quality,
        personalizedLevel: questionAnalysis.personalizedLevel,
        expectedBetterResults: questionAnalysis.quality === 'excellent'
      });
    } else {
      trackUserAction(EVENTS.GENERIC_QUESTION_USED, {
        defaultQuestion: finalQuestion,
        questionType: selectedQuestion?.id,
        planType: 'quick',
        userSkippedCustomInput: customQuestion.length === 0
      });
    }

    try {
      const result = await generateReading(cards, finalQuestion, 'quick');
      
      setReadingResult(result);
      
      // 成功生成解读的详细追踪
      trackUserAction(EVENTS.READING_COMPLETED, {
        planType: 'quick',
        questionType: selectedQuestion?.id,
        isCustomQuestion: isCustomQuestion,
        questionMetrics: {
          questionLength: finalQuestion.length,
          questionQuality: questionAnalysis.quality,
          personalizedLevel: questionAnalysis.personalizedLevel,
          wordCount: questionAnalysis.wordCount
        },
        readingMetrics: {
          cardName: cards[0]?.name,
          cardElement: cards[0]?.element,
          cardUpright: cards[0]?.upright,
          readingSource: result.source,
          provider: result.provider,
          readingLength: result.reading?.length || 0,
          keyInsightLength: result.keyInsight?.length || 0,
          generationTime: Date.now() - readingStartTime,
          wasAIUsed: result.source === 'ai'
        },
        userExperience: {
          timeFromStart: Date.now() - pageStartTime,
          expectedPersonalization: isCustomQuestion ? 'high' : 'medium'
        }
      });
      
      // 如果使用了AI且是自定义问题，单独追踪AI个性化成功
      if (result.source === 'ai' && isCustomQuestion) {
        trackUserAction('ai_personalized_reading_success', {
          questionQuality: questionAnalysis.quality,
          readingLength: result.reading?.length,
          generationTime: Date.now() - readingStartTime,
          personalizedLevel: questionAnalysis.personalizedLevel
        });
      }

      setCurrentPage(4);
      
      // 标记已完成免费解读
      setHasCompletedFreeReading(true);
      trackUserAction('free_reading_completed', {
        isCustomQuestion: isCustomQuestion,
        questionQuality: questionAnalysis.quality,
        readingSource: result.source,
        userSatisfactionExpected: questionAnalysis.quality === 'excellent' ? 'high' : 'medium'
      });
      
    } catch (error) {
      console.error('Reading generation error:', error);
      
      trackUserAction(EVENTS.ERROR_OCCURRED, {
        errorType: 'reading_generation_failed',
        errorMessage: error.message,
        planType: 'quick',
        isCustomQuestion: isCustomQuestion,
        questionLength: finalQuestion.length,
        stage: 'generate_and_show_reading',
        fallbackAvailable: true,
        userImpact: 'high'
      });
      
      // 如果是自定义问题且失败，特别追踪
      if (isCustomQuestion) {
        trackUserAction('custom_question_reading_failed', {
          questionQuality: questionAnalysis.quality,
          questionLength: finalQuestion.length,
          errorType: error.message,
          willRetryWithGeneric: false
        });
      }
    }
  };

  // 添加到组件中，用于追踪问题输入行为
  const handleCustomQuestionChange = (e) => {
    const newQuestion = e.target.value;
    const oldLength = customQuestion.length;
    const newLength = newQuestion.length;
    
    setCustomQuestion(newQuestion);
    
    // 追踪重要的输入里程碑
    if (oldLength === 0 && newLength > 0) {
      // 开始输入
      trackUserAction('custom_question_input_started', {
        questionType: selectedQuestion?.id,
        timeFromSelection: Date.now() - pageStartTime
      });
    } else if (oldLength > 0 && newLength === 0) {
      // 清空输入
      trackUserAction(EVENTS.CUSTOM_QUESTION_CLEARED, {
        clearedQuestionLength: oldLength,
        questionType: selectedQuestion?.id,
        wasManualClear: true
      });
    } else if (newLength === 10 || newLength === 25 || newLength === 50) {
      // 输入长度里程碑
      trackUserAction('custom_question_milestone', {
        questionLength: newLength,
        questionType: selectedQuestion?.id,
        milestone: `${newLength}_characters`
      });
    }
  };

  // 焦点追踪
  const handleQuestionInputFocus = () => {
    setQuestionInputFocused(true);
    trackUserAction(EVENTS.QUESTION_INPUT_FOCUSED, {
      questionType: selectedQuestion?.id,
      currentQuestionLength: customQuestion.length,
      timeFromSelection: Date.now() - pageStartTime
    });
  };

  const handleQuestionInputBlur = () => {
    setQuestionInputFocused(false);
    const questionLength = customQuestion.trim().length;
    
    if (questionLength > 0) {
      const analysis = analyzeCustomQuestion(customQuestion.trim());
      trackUserAction('custom_question_input_completed', {
        questionType: selectedQuestion?.id,
        questionLength: questionLength,
        wordCount: analysis.wordCount,
        quality: analysis.quality,
        timeSpentTyping: Date.now() - pageStartTime,
        isSpecific: analysis.isSpecific
      });
    }
  };

  // 增强版AI解读生成系统
  const generateLocalReading = (cards, question, planType) => {
    // 保持你现有的完整本地算法不变
    if (!cards || cards.length === 0) {
      return {
        reading: "The cards are still revealing themselves to you. Please select your cards first.",
        keyInsight: "Patience brings wisdom"
      };
    }

    const card = cards[0];
    const questionType = getQuestionType(question);
    
    // 完整的22张大阿尔卡纳解读数据库
    const cardDatabase = {
      'The Fool': {
        love: {
          upright: "A beautiful new romantic chapter is unfolding before you! The Fool suggests you're ready to take a leap of faith in love. If you're single, an unexpected encounter could spark something magical. Trust your heart's calling and don't let past disappointments hold you back. Your soul is ready for authentic, adventurous love.",
          reversed: "Love requires patience right now. The Fool reversed suggests you may be rushing into relationships without proper foundation. Take time to heal from past wounds and understand what you truly want in a partner. Slow down and let genuine connections develop naturally."
        },
        career: {
          upright: "Exciting career opportunities are calling! The Fool indicates it's time to pursue that dream job, start your own business, or pivot to something more aligned with your passion. Trust your innovative ideas - they have the potential to lead somewhere amazing. Take calculated risks now.",
          reversed: "Career decisions need more careful planning. The Fool reversed warns against impulsive job changes or risky investments. Do your research, seek mentorship, and create a solid foundation before making major professional moves. Patience will serve you better than haste."
        },
        growth: {
          upright: "You're standing at the threshold of incredible personal transformation! The Fool encourages you to embrace beginner's mind and trust your journey of self-discovery. This is your time to break free from limiting beliefs and explore new aspects of yourself. Adventure awaits!",
          reversed: "Personal growth is happening, but requires more self-reflection. The Fool reversed suggests you may be avoiding important inner work. Take time to understand your patterns and motivations before making major life changes. True growth comes from conscious choice, not impulsive action."
        },
        spiritual: {
          upright: "The universe is calling you toward a profound spiritual awakening! The Fool represents the beginning of a sacred journey. Trust the signs, synchronicities, and inner knowing that's emerging. You're being guided toward your highest truth - have faith in the path unfolding.",
          reversed: "Your spiritual journey needs grounding and discernment. The Fool reversed suggests you may be too focused on external spiritual experiences while neglecting inner wisdom. Balance mystical exploration with practical application. True spirituality transforms daily life."
        }
      },
      
      'The Magician': {
        love: {
          upright: "You have incredible power to manifest the love you desire! The Magician shows you possess all the tools needed for romantic success. If you're in a relationship, it's time to actively create positive changes. Single? Your magnetic energy is attracting someone special. Take inspired action.",
          reversed: "Romantic manipulation or self-deception may be present. The Magician reversed warns against using your charm to control others or lying to yourself about a relationship's potential. Focus on authentic communication and honest self-expression instead."
        },
        career: {
          upright: "Your professional magic is at its peak! The Magician indicates you have all the skills, resources, and connections needed to achieve your career goals. It's time to take decisive action, present your ideas boldly, and make things happen. Your manifesting power is strong right now.",
          reversed: "Your talents aren't being used effectively. The Magician reversed suggests missed opportunities, lack of focus, or misuse of your abilities. Reassess your goals and make sure you're applying your skills in the right direction. Avoid manipulation or cutting corners."
        },
        growth: {
          upright: "You're becoming the master of your own destiny! The Magician represents your growing ability to consciously create your reality. You have all the elements needed for transformation - now it's time to combine them skillfully. Trust in your personal power and take action.",
          reversed: "Your personal power is scattered or misdirected. The Magician reversed indicates you may be doubting your abilities or using them for the wrong purposes. Reconnect with your authentic goals and focus your energy more effectively."
        },
        spiritual: {
          upright: "You're learning to work with divine energy as a co-creator! The Magician shows your growing ability to channel spiritual power into material reality. Your prayers, intentions, and rituals are particularly potent now. You're bridging the gap between heaven and earth.",
          reversed: "Spiritual bypassing or misuse of metaphysical knowledge may be happening. The Magician reversed warns against using spiritual practices for ego gratification or manipulation. Return to humble service and authentic spiritual development."
        }
      },

      'The High Priestess': {
        love: {
          upright: "Trust your deepest intuition about matters of the heart. The High Priestess reveals hidden truths in your love life that logic alone can't grasp. If you're sensing something beneath the surface in your relationship, pay attention. Your psychic awareness about love is heightened right now.",
          reversed: "You may be ignoring important emotional signals. The High Priestess reversed suggests you're disconnected from your romantic intuition or avoiding uncomfortable truths about a relationship. Listen to your inner voice - it's trying to protect and guide you."
        },
        career: {
          upright: "Your professional intuition is exceptionally sharp right now. The High Priestess suggests that quiet observation and patient waiting will serve you better than aggressive action. Trust your gut feelings about people and situations at work. Hidden information may soon be revealed.",
          reversed: "You're making career decisions from fear rather than wisdom. The High Priestess reversed indicates you may be ignoring your professional instincts or letting others override your better judgment. Reconnect with your inner knowing about your career path."
        },
        growth: {
          upright: "A period of deep inner knowing and spiritual wisdom is emerging. The High Priestess encourages you to trust your intuitive insights and spend time in quiet reflection. Your subconscious mind is processing important information that will guide your next steps.",
          reversed: "You're disconnected from your inner wisdom. The High Priestess reversed suggests you may be ignoring your intuition or being influenced too heavily by others' opinions. Create space for solitude and inner listening to reconnect with your authentic truth."
        },
        spiritual: {
          upright: "You're accessing profound mystical wisdom and psychic insights. The High Priestess indicates your spiritual sensitivity is heightened - pay attention to dreams, synchronicities, and subtle energy. You're being initiated into deeper levels of spiritual understanding.",
          reversed: "Spiritual confusion or over-reliance on external guidance may be present. The High Priestess reversed suggests you're seeking answers everywhere except within yourself. Trust your own spiritual experiences rather than constantly looking to others for validation."
        }
      },

      'The Empress': {
        love: {
          upright: "Love is flourishing with abundance and sensual pleasure! The Empress indicates a period of romantic fertility, whether that means deeper intimacy in existing relationships or the blossoming of new love. Embrace your sensuality and allow love to nurture and be nurtured.",
          reversed: "Love may feel smothering or unbalanced. The Empress reversed suggests issues with codependency, jealousy, or neglecting self-care in relationships. Focus on loving yourself first and creating healthy boundaries with others."
        },
        career: {
          upright: "Your creative and nurturing abilities are your greatest professional assets right now. The Empress suggests success through collaboration, beauty, and caring for others. If you work in creative, healing, or service industries, expect particular abundance.",
          reversed: "Work-life balance is suffering, or creative blocks are present. The Empress reversed indicates you may be neglecting your well-being for career success or struggling to birth new projects. Nurture yourself to restore your creative flow."
        },
        growth: {
          upright: "You're in a powerful phase of personal creativity and abundance. The Empress encourages you to nurture your dreams and allow your authentic self to flourish. This is a time of rich personal growth and the manifestation of your deepest desires.",
          reversed: "Self-neglect or creative stagnation may be blocking your growth. The Empress reversed suggests you need to practice better self-care and remove obstacles to your creative expression. Nurture yourself as lovingly as you do others."
        },
        spiritual: {
          upright: "You're connecting with the divine feminine and earth-based spirituality. The Empress represents abundance, fertility, and the sacred creative force. Your spiritual practice is bearing fruit, and you're learning to work with natural cycles and rhythms.",
          reversed: "Spiritual materialism or disconnection from nature may be present. The Empress reversed suggests you may be too focused on spiritual acquisition rather than embodied wisdom. Return to simple, earth-based practices that nurture your soul."
        }
      },

      'The Emperor': {
        love: {
          upright: "Structure and commitment are strengthening your love life. The Emperor indicates a relationship is moving toward greater stability, or you're ready to take on more responsibility in love. Strong, protective energy surrounds your romantic situation.",
          reversed: "Control issues or rigidity may be affecting your relationships. The Emperor reversed warns against being overly dominating or stubborn with your partner. Soften your approach and allow more flexibility in how love expresses itself."
        },
        career: {
          upright: "Leadership opportunities and professional authority are yours for the taking! The Emperor suggests you're ready to take charge, establish systems, and build something lasting in your career. Your organizational abilities are particularly strong right now.",
          reversed: "Abuse of power or lack of discipline may be hindering your career. The Emperor reversed indicates issues with authority figures or your own leadership style. Focus on leading through service rather than control."
        },
        growth: {
          upright: "You're developing strong personal discipline and self-mastery. The Emperor represents your growing ability to structure your life effectively and take responsibility for your outcomes. You're becoming the ruler of your own kingdom.",
          reversed: "Lack of self-discipline or fear of responsibility may be blocking your progress. The Emperor reversed suggests you need to take greater control over your life and stop avoiding difficult decisions. Embrace your personal power."
        },
        spiritual: {
          upright: "You're learning to embody spiritual principles in practical, structured ways. The Emperor represents grounded spirituality that creates order and meaning in daily life. Your spiritual practice is becoming more disciplined and integrated.",
          reversed: "Spiritual authoritarianism or rigid thinking may be limiting your growth. The Emperor reversed warns against becoming too dogmatic in your beliefs or trying to control others' spiritual journeys. Embrace flexibility and humility."
        }
      },

      'The Hierophant': {
        love: {
          upright: "Traditional love and committed partnership are highlighted. The Hierophant suggests marriage, formal commitment, or following conventional relationship wisdom. Your love life benefits from established traditions and shared values with your partner.",
          reversed: "You're breaking free from conventional relationship patterns. The Hierophant reversed indicates you may be questioning traditional relationship roles or choosing unconventional forms of love. Trust your unique path to romantic fulfillment."
        },
        career: {
          upright: "Formal education, mentorship, or working within established systems serves your career well. The Hierophant suggests success through following proven methods, gaining credentials, or finding wise mentors who can guide your professional development.",
          reversed: "You're ready to challenge workplace orthodoxy or become a pioneer in your field. The Hierophant reversed indicates success through innovation, non-traditional approaches, or breaking free from institutional limitations."
        },
        growth: {
          upright: "Learning from wisdom traditions and established teachings accelerates your growth. The Hierophant encourages you to find mentors, study proven methods, or explore spiritual traditions that have stood the test of time.",
          reversed: "Your growth requires breaking away from limiting beliefs or institutions. The Hierophant reversed suggests you've outgrown certain teachings or need to forge your own unique path of development."
        },
        spiritual: {
          upright: "Traditional spiritual practices and religious community provide guidance and support. The Hierophant represents connection to established wisdom traditions, finding spiritual mentors, or deepening your involvement in organized religion.",
          reversed: "You're called to develop your own unique spiritual path. The Hierophant reversed indicates you may be outgrowing traditional religious structures or need to trust your personal spiritual experiences over institutional doctrine."
        }
      },

      'The Lovers': {
        love: {
          upright: "True love and soul-level connection are possible! The Lovers represents profound romantic partnership based on mutual respect, shared values, and genuine compatibility. If you're facing a choice in love, follow your heart toward authentic connection.",
          reversed: "Relationship challenges or difficult romantic choices lie ahead. The Lovers reversed suggests disharmony, incompatible values, or the need to choose between conflicting romantic options. Self-love must come before partnered love."
        },
        career: {
          upright: "Partnership and collaboration lead to professional success. The Lovers indicates beneficial business partnerships, team harmony, or career choices that align with your values. Follow your passion rather than just financial gain.",
          reversed: "Workplace conflicts or value misalignment may be causing problems. The Lovers reversed suggests tension with colleagues or career paths that don't match your authentic self. Seek work that honors your true values."
        },
        growth: {
          upright: "You're learning to integrate different aspects of yourself harmoniously. The Lovers represents the union of opposites within you and the importance of making choices that align with your authentic self. Personal relationships accelerate your growth.",
          reversed: "Internal conflict or poor choices may be hindering your development. The Lovers reversed indicates you may be ignoring your true desires or struggling to integrate different parts of your personality. Seek inner harmony first."
        },
        spiritual: {
          upright: "You're experiencing divine love and spiritual union. The Lovers represents the sacred marriage within yourself and your connection to divine love. Your spiritual practice is opening your heart to universal compassion and wisdom.",
          reversed: "Spiritual relationships or practices may be causing confusion. The Lovers reversed suggests conflicts between different spiritual paths or the need to find better balance between human love and divine love."
        }
      },

      'The Chariot': {
        love: {
          upright: "Determination and focused effort lead to romantic victory! The Chariot indicates you can overcome relationship challenges through willpower and clear direction. If pursuing someone, your confidence and persistence will pay off.",
          reversed: "Lack of direction or self-control may be sabotaging your love life. The Chariot reversed suggests scattered romantic energy or letting emotions drive your decisions. Regain control and focus on what you truly want in love."
        },
        career: {
          upright: "Professional success through determination and focused action! The Chariot represents career victory achieved through hard work, self-discipline, and staying on course despite obstacles. Your ambitious goals are within reach.",
          reversed: "Career momentum is stalled due to lack of focus or direction. The Chariot reversed indicates you may be struggling with conflicting professional goals or letting setbacks derail your progress. Regain control and refocus your efforts."
        },
        growth: {
          upright: "You're mastering self-discipline and achieving personal victories through focused effort. The Chariot represents your growing ability to direct your willpower toward meaningful goals and overcome internal obstacles.",
          reversed: "Lack of self-control or scattered energy is hindering your progress. The Chariot reversed suggests you need better focus and discipline to achieve your personal goals. Identify what's pulling you in different directions."
        },
        spiritual: {
          upright: "Spiritual discipline and focused practice are leading to mastery. The Chariot represents your ability to harness spiritual energy for positive transformation and your growing control over your consciousness and spiritual development.",
          reversed: "Spiritual practice lacks focus or discipline. The Chariot reversed suggests you may be trying too many spiritual approaches at once or lacking the persistence needed for real spiritual growth. Choose your path and stick to it."
        }
      },

      'Strength': {
        love: {
          upright: "Gentle strength and compassionate love overcome all obstacles. Strength indicates that patience, kindness, and inner courage are the keys to romantic success. Your loving nature has the power to heal and transform relationships.",
          reversed: "Self-doubt or harsh treatment may be damaging your love life. Strength reversed suggests you may be being too hard on yourself or others in relationships. Practice self-compassion and gentle courage instead of force."
        },
        career: {
          upright: "Your inner strength and gentle persistence lead to professional success. Strength indicates you can overcome workplace challenges through patience, compassion, and quiet confidence rather than aggressive tactics.",
          reversed: "Professional insecurity or being overly forceful may be counterproductive. Strength reversed suggests you may doubt your abilities or be trying too hard to prove yourself. Trust in your quiet competence."
        },
        growth: {
          upright: "You're developing true inner strength through compassion and self-acceptance. Strength represents the courage to face your fears with love rather than force, and the power that comes from embracing your authentic self.",
          reversed: "Self-criticism or harsh self-treatment is weakening your growth. Strength reversed indicates you may be your own worst enemy. Practice self-compassion and gentle encouragement instead of internal bullying."
        },
        spiritual: {
          upright: "Spiritual strength comes through love, compassion, and gentle persistence. Strength represents your growing ability to transform challenges through love rather than resistance, and your deepening connection to divine compassion.",
          reversed: "Spiritual struggle or lack of faith may be present. Strength reversed suggests you may be fighting your spiritual journey rather than surrendering to it. Trust in divine love and practice self-compassion."
        }
      },

      'The Hermit': {
        love: {
          upright: "A period of romantic solitude leads to greater self-understanding and wisdom about love. The Hermit suggests you need time alone to understand what you truly want in relationships before you can attract or maintain healthy love.",
          reversed: "Isolation or refusing guidance may be hurting your love life. The Hermit reversed indicates you may be withdrawing too much from relationships or ignoring wise counsel about your romantic patterns."
        },
        career: {
          upright: "Professional success comes through expertise, independent work, or sharing your wisdom with others. The Hermit indicates you may benefit from solo projects, teaching, or becoming a recognized expert in your field.",
          reversed: "Career isolation or refusal to seek mentorship may be limiting your growth. The Hermit reversed suggests you need more professional connection and guidance rather than trying to figure everything out alone."
        },
        growth: {
          upright: "Deep self-reflection and inner searching lead to profound wisdom and personal breakthrough. The Hermit represents a necessary period of solitude and introspection that illuminates your true path forward.",
          reversed: "Excessive isolation or avoiding inner work may be stunting your growth. The Hermit reversed suggests you may be hiding from necessary self-examination or cutting yourself off from supportive community."
        },
        spiritual: {
          upright: "Spiritual wisdom comes through contemplation, meditation, and inner guidance. The Hermit represents your growing ability to find divine truth within yourself and your readiness to share spiritual wisdom with others.",
          reversed: "Spiritual confusion or rejection of inner guidance may be present. The Hermit reversed suggests you may be looking everywhere except within for spiritual answers, or refusing to trust your own spiritual insights."
        }
      },

      'Wheel of Fortune': {
        love: {
          upright: "Lucky breaks and positive changes are coming to your love life! The Wheel of Fortune indicates romantic fortune is turning in your favor. Embrace new opportunities and trust that the universe is conspiring to bring you love.",
          reversed: "Romantic setbacks are temporary - better times are ahead. The Wheel of Fortune reversed suggests you may be experiencing relationship challenges, but these are part of a larger cycle leading to positive change."
        },
        career: {
          upright: "Professional good fortune and exciting opportunities are on the horizon! The Wheel of Fortune indicates career advancement, lucky breaks, or positive changes beyond your control that benefit your professional life.",
          reversed: "Career challenges are temporary setbacks in a larger positive cycle. The Wheel of Fortune reversed suggests current professional difficulties are preparing you for something better that's coming."
        },
        growth: {
          upright: "You're entering a fortunate period of personal expansion and positive change. The Wheel of Fortune represents the cyclical nature of growth and indicates you're moving into a phase of greater opportunity and joy.",
          reversed: "Current challenges are part of a necessary cycle leading to positive change. The Wheel of Fortune reversed suggests difficulties you're facing are temporary and serving your ultimate good."
        },
        spiritual: {
          upright: "Divine timing and spiritual destiny are working in your favor. The Wheel of Fortune represents karmic rewards, spiritual opportunities, and the universe aligning to support your highest good and spiritual evolution.",
          reversed: "Spiritual tests or challenges are preparing you for growth. The Wheel of Fortune reversed indicates that current spiritual difficulties are part of divine timing leading to greater wisdom and strength."
        }
      },

      'Justice': {
        love: {
          upright: "Balance, fairness, and karmic love are manifesting in your relationships. Justice indicates that romantic situations will resolve fairly, and you'll receive what you truly deserve in love. Honest communication brings harmony.",
          reversed: "Unfairness or imbalance in relationships needs to be addressed. Justice reversed suggests one-sided relationships, dishonesty, or avoiding accountability in love. Seek balance and truthfulness."
        },
        career: {
          upright: "Professional fairness, legal success, or recognition for your work is coming. Justice indicates that career decisions will be made fairly, contracts will be honored, and your professional integrity will be rewarded.",
          reversed: "Workplace unfairness or legal complications may arise. Justice reversed suggests discrimination, broken agreements, or the need to stand up for what's right in your professional life."
        },
        growth: {
          upright: "You're developing greater personal integrity and moral clarity. Justice represents your growing ability to make ethical choices, take responsibility for your actions, and create balance in all areas of your life.",
          reversed: "Self-judgment or avoiding accountability may be hindering your growth. Justice reversed suggests you may be too harsh on yourself or failing to take responsibility for your part in difficult situations."
        },
        spiritual: {
          upright: "Karmic balance and divine justice are working in your spiritual life. Justice represents the law of cause and effect, spiritual accountability, and your growing understanding of divine order and universal balance.",
          reversed: "Spiritual injustice or karmic imbalance may be present. Justice reversed suggests you may be experiencing spiritual tests or need to examine where you're out of alignment with divine principles."
        }
      },

      'The Hanged Man': {
        love: {
          upright: "Romantic sacrifice or patience leads to deeper understanding about love. The Hanged Man suggests you may need to let go of control in relationships or see romantic situations from a completely different perspective to find resolution.",
          reversed: "Needless romantic sacrifice or martyrdom isn't serving you. The Hanged Man reversed indicates you may be giving too much in relationships without receiving balance, or avoiding necessary relationship changes."
        },
        career: {
          upright: "Professional progress requires patience and a new perspective. The Hanged Man suggests career advancement may come through waiting, sacrifice, or approaching work challenges from an entirely different angle.",
          reversed: "Career stagnation due to avoidance or fear of change. The Hanged Man reversed indicates you may be stuck in professional patterns that no longer serve you or avoiding necessary career transitions."
        },
        growth: {
          upright: "Personal breakthrough comes through surrender and seeing life from a new angle. The Hanged Man represents the wisdom gained through letting go of old patterns and allowing necessary life changes to unfold.",
          reversed: "Resistance to change or unnecessary martyrdom is blocking your growth. The Hanged Man reversed suggests you may be avoiding important life changes or sacrificing yourself in ways that don't serve your highest good."
        },
        spiritual: {
          upright: "Spiritual enlightenment comes through surrender and releasing attachment. The Hanged Man represents the sacred pause, spiritual sacrifice, and the wisdom that comes from letting go of ego control over your spiritual journey.",
          reversed: "Spiritual stagnation or false martyrdom may be present. The Hanged Man reversed suggests you may be stuck in spiritual patterns or making unnecessary sacrifices that don't serve authentic spiritual growth."
        }
      },

      'Death': {
        love: {
          upright: "A profound transformation in your love life is necessary and beneficial. Death indicates the end of old romantic patterns and the birth of new, healthier ways of loving. Embrace the changes - they lead to greater happiness.",
          reversed: "Resistance to necessary romantic changes is causing stagnation. Death reversed suggests you may be clinging to relationships or patterns that have already ended energetically. Let go to make room for new love."
        },
        career: {
          upright: "Major professional transformation brings new opportunities. Death indicates the end of one career phase and the beginning of something more aligned with your true purpose. Trust the process of professional rebirth.",
          reversed: "Fear of career change is keeping you stuck in unfulfilling work. Death reversed suggests you may be avoiding necessary professional transitions out of security concerns. Embrace change for growth."
        },
        growth: {
          upright: "Profound personal transformation is occurring - embrace the rebirth! Death represents the end of old versions of yourself and the emergence of who you're truly meant to be. This change is necessary for your evolution.",
          reversed: "Resistance to personal change is causing stagnation and frustration. Death reversed indicates you may be clinging to outdated aspects of yourself. Allow the old to die so the new can be born."
        },
        spiritual: {
          upright: "Spiritual death and rebirth lead to higher consciousness. Death represents ego death, spiritual transformation, and the cyclical nature of spiritual growth. You're being reborn into a higher version of yourself.",
          reversed: "Spiritual stagnation or fear of ego death may be limiting your growth. Death reversed suggests you may be avoiding necessary spiritual transformation or clinging to outdated spiritual beliefs."
        }
      },

      'Temperance': {
        love: {
          upright: "Patience and moderation create harmony in your love life. Temperance indicates that balanced, steady approach to relationships leads to lasting love. Healing and integration are happening in your romantic connections.",
          reversed: "Impatience or excess may be causing relationship problems. Temperance reversed suggests lack of moderation in love, rushing relationships, or inability to find middle ground with your partner."
        },
        career: {
          upright: "Professional success through patience, cooperation, and balanced approach. Temperance indicates that steady, moderate efforts and good teamwork lead to sustainable career growth and workplace harmony.",
          reversed: "Career impatience or extremism may be counterproductive. Temperance reversed suggests you may be pushing too hard professionally or lacking the patience needed for steady advancement."
        },
        growth: {
          upright: "Personal growth through balance, integration, and patient practice. Temperance represents your ability to blend different aspects of yourself harmoniously and maintain steady progress toward your goals.",
          reversed: "Lack of balance or patience is hindering your personal development. Temperance reversed suggests you may be taking extreme approaches or lacking the steady persistence needed for lasting growth."
        },
        spiritual: {
          upright: "Spiritual growth through balance, integration, and gradual practice. Temperance represents the middle path, divine alchemy, and your growing ability to blend spiritual and material life harmoniously.",
          reversed: "Spiritual imbalance or extremism may be present. Temperance reversed suggests you may be pursuing spiritual practices in an unbalanced way or struggling to integrate spiritual insights into daily life."
        }
      },

      'The Devil': {
        love: {
          upright: "Passionate attraction and intense desire dominate your love life. The Devil indicates powerful sexual chemistry and deep romantic obsession, but warns against losing yourself in unhealthy relationship patterns or addiction to drama.",
          reversed: "You're breaking free from toxic relationship patterns or unhealthy romantic obsessions. The Devil reversed indicates liberation from codependency, manipulation, or addictive relationship dynamics."
        },
        career: {
          upright: "Material success through ambition, but beware of compromising your values. The Devil indicates professional advancement driven by desire for money or status, but warns against unethical practices or becoming trapped by golden handcuffs.",
          reversed: "You're breaking free from unfulfilling work or corrupt professional environments. The Devil reversed indicates liberation from jobs that compromise your integrity or workplaces that feel spiritually toxic."
        },
        growth: {
          upright: "You're confronting your shadow self and recognizing unhealthy patterns. The Devil represents acknowledgment of your darker impulses, addictions, or limiting beliefs. Awareness of these patterns is the first step to freedom.",
          reversed: "You're breaking free from self-imposed limitations and negative patterns. The Devil reversed indicates liberation from addictions, toxic habits, or limiting beliefs that have been holding you back from your true potential."
        },
        spiritual: {
          upright: "Spiritual materialism or attachment to ego may be present. The Devil represents the trap of pursuing spiritual practices for selfish gain or becoming attached to spiritual identity rather than true liberation.",
          reversed: "You're breaking free from spiritual dogma or false gurus. The Devil reversed indicates liberation from religious oppression, spiritual materialism, or any spiritual practice that doesn't serve your authentic growth."
        }
      },

      'The Tower': {
        love: {
          upright: "Sudden romantic upheaval brings necessary change and clarity. The Tower indicates shocking revelations, breakdowns, or dramatic events in love that ultimately serve your highest good by clearing away what wasn't authentic.",
          reversed: "You're avoiding necessary changes in your love life. The Tower reversed suggests you may be resisting obvious signs that a relationship needs to end or change dramatically. Face the truth to prevent bigger upheavals."
        },
        career: {
          upright: "Sudden professional changes or workplace upheaval lead to better opportunities. The Tower indicates job loss, company changes, or career disruptions that initially feel devastating but ultimately redirect you toward your true calling.",
          reversed: "You're avoiding necessary career changes or workplace confrontations. The Tower reversed suggests you may be staying in situations that are clearly not working to avoid short-term disruption."
        },
        growth: {
          upright: "Sudden revelation or life disruption catalyzes rapid personal growth. The Tower represents breakthrough moments where old structures of identity crumble, making way for authentic self-expression and freedom.",
          reversed: "You're resisting necessary personal changes or avoiding confronting limiting beliefs. The Tower reversed suggests you may be clinging to familiar patterns even when they clearly aren't serving your growth."
        },
        spiritual: {
          upright: "Spiritual awakening through crisis or sudden revelation. The Tower represents the destruction of false spiritual beliefs or ego structures, leading to authentic spiritual breakthrough and liberation from illusion.",
          reversed: "You're avoiding necessary spiritual transformation or clinging to outdated beliefs. The Tower reversed suggests resistance to spiritual growth that's trying to happen naturally through life circumstances."
        }
      },

      'The Star': {
        love: {
          upright: "Hope, healing, and divine love illuminate your romantic path. The Star indicates renewal after relationship difficulties, spiritual connection with your partner, or the arrival of a soulmate who brings inspiration and joy.",
          reversed: "Lost hope or lack of faith in love needs healing. The Star reversed suggests you may be feeling discouraged about romance or disconnected from your heart's desires. Reconnect with your capacity for love and hope."
        },
        career: {
          upright: "Professional inspiration and recognition for your unique talents. The Star indicates career success through creativity, innovation, or sharing your gifts with the world. Your authentic talents are being acknowledged and appreciated.",
          reversed: "Professional discouragement or lack of recognition for your talents. The Star reversed suggests you may be feeling unappreciated at work or doubting your professional abilities. Reconnect with your unique gifts."
        },
        growth: {
          upright: "Renewed hope and clear vision guide your personal development. The Star represents healing from past wounds, clarity about your life purpose, and the inspiration needed to pursue your dreams with confidence.",
          reversed: "Lost sense of purpose or diminished hope about your future. The Star reversed suggests you may be feeling discouraged about your life direction or disconnected from your dreams. Reconnect with what inspires you."
        },
        spiritual: {
          upright: "Divine guidance and spiritual inspiration illuminate your path. The Star represents connection to higher wisdom, answered prayers, and the renewal of faith in your spiritual journey and divine support.",
          reversed: "Spiritual discouragement or disconnection from divine guidance. The Star reversed suggests you may be feeling abandoned by the universe or struggling to maintain faith. Trust that divine support is always available."
        }
      },

      'The Moon': {
        love: {
          upright: "Intuition and emotional depth reveal hidden truths about love. The Moon indicates that your romantic situation is more complex than it appears. Trust your psychic impressions and pay attention to what's happening beneath the surface.",
          reversed: "Romantic illusions or emotional confusion are clearing. The Moon reversed suggests that deception, fantasy, or emotional manipulation in relationships is being exposed, leading to greater honesty and clarity."
        },
        career: {
          upright: "Professional intuition and creative inspiration guide your work. The Moon indicates success in creative fields, work involving psychology or healing, or situations where your emotional intelligence gives you professional advantage.",
          reversed: "Workplace deception or professional confusion is being cleared up. The Moon reversed suggests that hidden information, office politics, or unclear professional situations are becoming more transparent."
        },
        growth: {
          upright: "Deep emotional healing and psychic development accelerate your growth. The Moon represents work with your subconscious mind, dream work, or healing old emotional wounds that have been limiting your progress.",
          reversed: "Mental clarity and emotional stability are returning after a period of confusion. The Moon reversed indicates that psychological fog is clearing and you're gaining clearer perspective on your life circumstances."
        },
        spiritual: {
          upright: "Psychic abilities and mystical experiences deepen your spiritual understanding. The Moon represents enhanced intuition, prophetic dreams, or spiritual experiences that transcend ordinary consciousness.",
          reversed: "Spiritual delusions or psychic confusion are being cleared. The Moon reversed suggests that false spiritual beliefs, psychic overwhelm, or mystical confusion is giving way to grounded spiritual wisdom."
        }
      },

      'The Sun': {
        love: {
          upright: "Pure joy, success, and vitality bless your love life! The Sun indicates happy relationships, engagement, marriage, or the arrival of a love that brings out your best self. Celebrate the abundance of love in your life.",
          reversed: "Temporary clouds over your happiness in love will soon clear. The Sun reversed suggests minor relationship setbacks or delayed romantic joy, but ultimate happiness and success in love are assured."
        },
        career: {
          upright: "Professional success, recognition, and achievement bring great satisfaction. The Sun indicates career advancement, public recognition, successful projects, or work that brings you genuine joy and fulfillment.",
          reversed: "Career success may be delayed but is still coming. The Sun reversed suggests temporary professional setbacks or delayed recognition, but your ultimate career success and satisfaction are guaranteed."
        },
        growth: {
          upright: "Radiant confidence, vitality, and joy mark your personal development. The Sun represents a time of great personal achievement, clarity about your life purpose, and the energy to pursue your dreams successfully.",
          reversed: "Self-confidence or life satisfaction may be temporarily dimmed. The Sun reversed suggests you may be experiencing self-doubt or delayed gratification, but your natural radiance and life force are returning."
        },
        spiritual: {
          upright: "Spiritual enlightenment and divine joy illuminate your path. The Sun represents spiritual achievement, divine blessing, clear spiritual vision, and the joy that comes from alignment with your highest purpose.",
          reversed: "Spiritual confidence or divine connection may feel temporarily weakened. The Sun reversed suggests spiritual doubt or feeling disconnected from source, but your spiritual light and divine connection are being restored."
        }
      },

      'Judgement': {
        love: {
          upright: "Romantic renewal and second chances bring healing and growth. Judgement indicates forgiveness in relationships, rekindled romance, or the call to love more authentically and compassionately than before.",
          reversed: "Self-judgment or harsh criticism may be damaging your relationships. Judgement reversed suggests you may be too critical of yourself or others in love, preventing the forgiveness needed for relationship healing."
        },
        career: {
          upright: "Professional calling and career resurrection lead to meaningful work. Judgement indicates recognition for past efforts, career renewal, or answering a call to work that serves your higher purpose and helps others.",
          reversed: "Professional self-doubt or avoiding your true calling may be limiting your career growth. Judgement reversed suggests fear of stepping into your full professional potential or harsh self-criticism about your abilities."
        },
        growth: {
          upright: "Spiritual awakening and personal renewal transform your life. Judgement represents rebirth, forgiveness of past mistakes, and the call to live more authentically according to your highest values and purpose.",
          reversed: "Self-forgiveness and release of past regrets are needed for growth. Judgement reversed suggests you may be stuck in past mistakes or harsh self-judgment, preventing the personal renewal that's trying to occur."
        },
        spiritual: {
          upright: "Spiritual awakening and divine calling guide your path forward. Judgement represents spiritual rebirth, divine grace, and the call to serve your highest spiritual purpose with renewed faith and commitment.",
          reversed: "Spiritual self-doubt or resistance to your spiritual calling may be present. Judgement reversed suggests you may be avoiding your spiritual purpose or being too critical of your spiritual progress."
        }
      },

      'The World': {
        love: {
          upright: "Complete romantic fulfillment and successful love relationships. The World indicates achievement of your romantic goals, whether that's finding your soulmate, deepening existing love, or experiencing the fullness of love in all its forms.",
          reversed: "Romantic goals are nearly achieved but need final effort. The World reversed suggests you're close to romantic fulfillment but may need to complete some personal work or make final adjustments to achieve lasting love."
        },
        career: {
          upright: "Professional achievement and completion of major career goals. The World indicates reaching the pinnacle of success in your chosen field, international recognition, or the satisfaction of having built something meaningful and lasting.",
          reversed: "Career success is within reach but requires final push. The World reversed suggests you're close to achieving your professional goals but may need to overcome final obstacles or complete remaining tasks."
        },
        growth: {
          upright: "Personal mastery and completion of a major life cycle. The World represents achieving your full potential, integration of all aspects of yourself, and the satisfaction of having become who you were meant to be.",
          reversed: "Personal goals are nearly achieved but need final integration. The World reversed suggests you've done most of the work needed for personal transformation but may need to integrate your achievements more fully."
        },
        spiritual: {
          upright: "Spiritual mastery and cosmic consciousness. The World represents enlightenment, divine union, completion of your spiritual journey, and the achievement of perfect harmony between your human and divine nature.",
          reversed: "Spiritual achievement is close but needs final surrender. The World reversed suggests you're near spiritual breakthrough but may need to release final attachments or complete remaining spiritual work."
        }
      }
    };

    const cardData = cardDatabase[card.name];
    let reading = '';
    let keyInsight = '';

    if (cardData && cardData[questionType]) {
      const orientation = card.upright ? 'upright' : 'reversed';
      reading = cardData[questionType][orientation];
      keyInsight = generateKeyInsight(card, questionType, orientation);
    } else {
      // 通用解读逻辑（备用）
      const baseReading = `The ${card.name} appears with ${card.element} energy flowing ${card.upright ? 'harmoniously' : 'with some restriction'}. ${card.meaning}. `;
      const contextualGuidance = getContextualGuidance(questionType, card.upright, card.element);
      reading = baseReading + contextualGuidance;
      keyInsight = generateGenericKeyInsight(card, questionType);
    }

    return { reading, keyInsight };
  };

  // 在 ArcaneCards.js 中替换整个 generateReading 函数

  const generateReading = async (cards, question) => {
    const planType = 'quick'; // 固定值
    console.log('🔥 NEW SIMPLIFIED VERSION CALLED!'); // 确认新版本
    console.log('📥 Input params:', { cards: cards.length, question, planType });
    
    const readingStartTime = Date.now();
    const finalQuestion = selectedQuestion?.finalQuestion || selectedQuestion?.question || 'What guidance do I need?';
    
    // 追踪解读生成开始
    trackUserAction(EVENTS.READING_GENERATION_START, {
      planType: planType,
      questionType: selectedQuestion?.id,
      selectedCards: cards.map(c => ({ name: c.name, element: c.element, upright: c.upright })),
      readingMethod: 'attempting_ai'
    });
    
    // 尝试AI API - 简化版本
    try {
      console.log('🚀 Calling AI API...');
      console.log('📤 Request payload:', { cards, question: finalQuestion, planType });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
      
      const response = await fetch('/api/ai-reading/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cards,
          question: finalQuestion,
          planType: planType
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      console.log('📨 Response received:', { 
        ok: response.ok, 
        status: response.status,
        statusText: response.statusText 
      });
      
      if (response.ok) {
        const aiResult = await response.json();
        console.log('✅ AI JSON parsed:', aiResult); // 👈 关键！
        console.log('✅ AI Success! Using AI content directly');
        
        // 追踪AI成功
        trackUserAction(EVENTS.READING_GENERATED, {
          planType,
          questionType: selectedQuestion?.id,
          generationTime: Date.now() - readingStartTime,
          readingMethod: 'ai_success',
          provider: aiResult.provider || 'deepseek',
          readingLength: aiResult.reading?.length || 0
        });
        
        // 直接返回AI结果，不做复杂验证
        return {
          reading: aiResult.reading || aiResult.content || 'AI guidance received',
          keyInsight: aiResult.keyInsight || 'Trust the journey ahead',
          source: 'ai',
          provider: aiResult.provider || 'deepseek'
        };
        
      } else {
        // HTTP错误状态，降级
        console.log(`⚠️ API returned ${response.status}, falling back to local`);
        throw new Error(`API returned ${response.status}`);
      }
      
    } catch (error) {
      // 只有真正的网络/解析错误才降级
      console.log('🔄 Network error, using local algorithm:', error.message);
      
      // 追踪降级原因
      trackUserAction(EVENTS.READING_GENERATED, {
        planType,
        questionType: selectedQuestion?.id,
        generationTime: Date.now() - readingStartTime,
        readingMethod: 'local_fallback',
        fallbackReason: error.name === 'AbortError' ? 'timeout' : 'network_error',
        errorMessage: error.message
      });
      
      // 使用本地算法
      const localResult = generateLocalReading(cards, finalQuestion, planType);
      
      trackUserAction('local_reading_generated', {
        planType,
        readingLength: localResult.reading?.length || 0,
        source: 'local_algorithm'
      });
      
      return {
        ...localResult,
        source: 'local',
        fallbackReason: error.message
      };
    }
  };

  // 生成个性化的关键洞察
  const generateKeyInsight = (card, questionType, orientation) => {
    const insights = {
      'The Fool': {
        love: { 
          upright: "Trust your heart's adventure - love rewards the brave",
          reversed: "Slow down and heal before leaping into love"
        },
        career: {
          upright: "Your innovative ideas are your golden ticket",
          reversed: "Plan first, then pursue your professional dreams"
        },
        growth: {
          upright: "Embrace the unknown - it holds your greatest gifts",
          reversed: "Reflect on recent lessons before moving forward"
        },
        spiritual: {
          upright: "The universe is calling you to a sacred journey",
          reversed: "Ground your spiritual insights in daily practice"
        }
      },
      'The Magician': {
        love: {
          upright: "You have all the tools needed to create lasting love",
          reversed: "Use your charm authentically, not manipulatively"
        },
        career: {
          upright: "Your moment to shine professionally has arrived",
          reversed: "Focus your scattered talents for maximum impact"
        },
        growth: {
          upright: "You are the master of your own transformation",
          reversed: "Reconnect with your authentic personal power"
        },
        spiritual: {
          upright: "You're learning to co-create with divine energy",
          reversed: "Return to humble spiritual service and growth"
        }
      },
      'The High Priestess': {
        love: {
          upright: "Your intuition knows the truth about this relationship",
          reversed: "Listen to your inner voice about love's reality"
        },
        career: {
          upright: "Trust your professional instincts over others' advice",
          reversed: "Reconnect with your inner career compass"
        },
        growth: {
          upright: "Wisdom emerges from quiet inner listening",
          reversed: "Stop seeking answers outside - they're within you"
        },
        spiritual: {
          upright: "Your psychic gifts are awakening and strengthening",
          reversed: "Trust your own spiritual experiences over others'"
        }
      },
      'The Empress': {
        love: {
          upright: "Love flourishes when you nurture yourself first",
          reversed: "Set healthy boundaries to restore relationship balance"
        },
        career: {
          upright: "Your creativity and nurturing nature are professional assets",
          reversed: "Self-care is essential for professional success"
        },
        growth: {
          upright: "You're fertile ground for amazing personal growth",
          reversed: "Nurture yourself as lovingly as you do others"
        },
        spiritual: {
          upright: "Divine feminine energy blesses your spiritual path",
          reversed: "Return to earth-based, nurturing spiritual practices"
        }
      },
      'The Emperor': {
        love: {
          upright: "Strong, stable love is building in your life",
          reversed: "Soften your approach to create space for love"
        },
        career: {
          upright: "Leadership opportunities are yours for the taking",
          reversed: "Lead through service, not control or dominance"
        },
        growth: {
          upright: "Self-discipline creates the life you truly want",
          reversed: "Take responsibility for your life circumstances"
        },
        spiritual: {
          upright: "Structure your spiritual practice for lasting growth",
          reversed: "Embrace spiritual flexibility and humility"
        }
      },
      'The Hierophant': {
        love: {
          upright: "Traditional commitment brings relationship stability",
          reversed: "Your unique approach to love is perfectly valid"
        },
        career: {
          upright: "Mentorship and formal learning advance your career",
          reversed: "Innovation and unconventional approaches bring success"
        },
        growth: {
          upright: "Wisdom traditions offer valuable guidance for growth",
          reversed: "Trust your unique path of personal development"
        },
        spiritual: {
          upright: "Established spiritual practices provide solid foundation",
          reversed: "Your personal spiritual path is divinely guided"
        }
      },
      'The Lovers': {
        love: {
          upright: "True partnership based on shared values awaits",
          reversed: "Choose self-love before seeking romantic partnership"
        },
        career: {
          upright: "Follow your passion over purely financial considerations",
          reversed: "Align your work with your authentic values"
        },
        growth: {
          upright: "Integration of all parts of yourself brings wholeness",
          reversed: "Resolve inner conflicts before making major choices"
        },
        spiritual: {
          upright: "Divine love flows through all your relationships",
          reversed: "Balance human love with spiritual devotion"
        }
      },
      'The Chariot': {
        love: {
          upright: "Determination and focus manifest romantic success",
          reversed: "Gain emotional control before pursuing love goals"
        },
        career: {
          upright: "Your career victory requires focused, persistent effort",
          reversed: "Clarify your professional direction before moving forward"
        },
        growth: {
          upright: "Willpower and discipline create personal breakthroughs",
          reversed: "Focus scattered energy on what truly matters"
        },
        spiritual: {
          upright: "Spiritual mastery comes through disciplined practice",
          reversed: "Choose one spiritual path and commit to it fully"
        }
      },
      'Strength': {
        love: {
          upright: "Gentle courage and patience conquer all in love",
          reversed: "Practice self-compassion to heal relationship wounds"
        },
        career: {
          upright: "Your quiet confidence leads to professional respect",
          reversed: "Trust your abilities instead of doubting yourself"
        },
        growth: {
          upright: "True strength comes from self-acceptance and courage",
          reversed: "Be gentler with yourself during times of growth"
        },
        spiritual: {
          upright: "Love and compassion are your greatest spiritual powers",
          reversed: "Have faith in your spiritual journey's perfect timing"
        }
      },
      'The Hermit': {
        love: {
          upright: "Solitude brings clarity about what you want in love",
          reversed: "Balance alone time with openness to love connections"
        },
        career: {
          upright: "Your expertise and wisdom are valuable professional assets",
          reversed: "Seek mentorship and professional community for growth"
        },
        growth: {
          upright: "Inner wisdom emerges through contemplation and solitude",
          reversed: "Balance introspection with supportive community"
        },
        spiritual: {
          upright: "Deep spiritual wisdom comes from within your own soul",
          reversed: "Trust your inner spiritual guidance over external voices"
        }
      },
      'Wheel of Fortune': {
        love: {
          upright: "Lucky timing brings positive romantic changes",
          reversed: "Relationship challenges are temporary - better times ahead"
        },
        career: {
          upright: "Professional fortune and opportunity cycles in your favor",
          reversed: "Current career setbacks lead to better opportunities"
        },
        growth: {
          upright: "You're entering a fortunate cycle of growth and expansion",
          reversed: "Present challenges prepare you for coming success"
        },
        spiritual: {
          upright: "Divine timing supports your spiritual evolution perfectly",
          reversed: "Trust that spiritual tests strengthen your faith"
        }
      },
      'Justice': {
        love: {
          upright: "Fair, balanced love brings harmony to your relationships",
          reversed: "Address relationship imbalances with honest communication"
        },
        career: {
          upright: "Professional integrity and fairness lead to recognition",
          reversed: "Stand up for what's right in your workplace"
        },
        growth: {
          upright: "Personal integrity and ethical choices guide your path",
          reversed: "Take responsibility for your part in difficult situations"
        },
        spiritual: {
          upright: "Divine justice and karmic balance support your journey",
          reversed: "Examine where you're out of alignment with truth"
        }
      },
      'The Hanged Man': {
        love: {
          upright: "Patient surrender reveals new perspectives on love",
          reversed: "Stop sacrificing yourself unnecessarily in relationships"
        },
        career: {
          upright: "Career breakthrough comes through patience and new perspective",
          reversed: "Stop avoiding necessary professional changes"
        },
        growth: {
          upright: "Let go of control to allow natural growth to unfold",
          reversed: "Release unnecessary sacrifice and embrace positive change"
        },
        spiritual: {
          upright: "Spiritual wisdom comes through surrender and letting go",
          reversed: "Avoid spiritual martyrdom - embrace authentic growth"
        }
      },
      'Death': {
        love: {
          upright: "Relationship transformation leads to deeper, truer love",
          reversed: "Release relationships that have already ended energetically"
        },
        career: {
          upright: "Professional transformation aligns you with your true calling",
          reversed: "Stop avoiding necessary career changes out of fear"
        },
        growth: {
          upright: "Let the old version of yourself die to birth who you're becoming",
          reversed: "Embrace change instead of clinging to what no longer serves"
        },
        spiritual: {
          upright: "Spiritual death and rebirth elevate your consciousness",
          reversed: "Allow ego structures to dissolve for authentic growth"
        }
      },
      'Temperance': {
        love: {
          upright: "Patient, balanced approach creates lasting romantic harmony",
          reversed: "Find moderation and middle ground in relationship conflicts"
        },
        career: {
          upright: "Steady, collaborative effort leads to sustainable success",
          reversed: "Practice patience instead of pushing too hard professionally"
        },
        growth: {
          upright: "Balance and integration accelerate your personal development",
          reversed: "Avoid extreme approaches - seek the middle path"
        },
        spiritual: {
          upright: "Divine alchemy transforms your spiritual understanding",
          reversed: "Balance spiritual practice with grounded daily living"
        }
      },
      'The Devil': {
        love: {
          upright: "Acknowledge unhealthy relationship patterns to break free",
          reversed: "You're liberating yourself from toxic love dynamics"
        },
        career: {
          upright: "Don't compromise your values for material success",
          reversed: "Break free from unfulfilling work that traps your soul"
        },
        growth: {
          upright: "Face your shadow to reclaim your authentic power",
          reversed: "You're breaking free from self-imposed limitations"
        },
        spiritual: {
          upright: "Beware of spiritual ego and material spiritual pursuits",
          reversed: "Liberation from spiritual dogma opens authentic growth"
        }
      },
      'The Tower': {
        love: {
          upright: "Romantic upheaval clears the path for authentic love",
          reversed: "Stop avoiding obvious relationship changes that need to happen"
        },
        career: {
          upright: "Professional disruption redirects you toward your true calling",
          reversed: "Face workplace realities instead of avoiding necessary changes"
        },
        growth: {
          upright: "Sudden revelation liberates you from limiting beliefs",
          reversed: "Stop resisting the personal changes trying to happen"
        },
        spiritual: {
          upright: "Spiritual breakthrough comes through destruction of false beliefs",
          reversed: "Embrace spiritual transformation instead of clinging to old patterns"
        }
      },
      'The Star': {
        love: {
          upright: "Hope and inspiration guide you toward soulmate connection",
          reversed: "Heal your heart to restore faith in love's possibilities"
        },
        career: {
          upright: "Your unique talents deserve recognition and appreciation",
          reversed: "Reconnect with what makes your professional gifts special"
        },
        growth: {
          upright: "Renewed hope and clear vision illuminate your life purpose",
          reversed: "Rekindle your dreams and believe in your potential again"
        },
        spiritual: {
          upright: "Divine guidance and inspiration bless your spiritual path",
          reversed: "Trust that divine support is always available to you"
        }
      },
      'The Moon': {
        love: {
          upright: "Trust your intuition to reveal hidden relationship truths",
          reversed: "Romantic illusions are clearing - truth brings freedom"
        },
        career: {
          upright: "Your emotional intelligence gives you professional advantage",
          reversed: "Professional confusion is clearing up - clarity returns"
        },
        growth: {
          upright: "Deep emotional healing unlocks your hidden potential",
          reversed: "Mental fog is lifting - clearer perspective returns"
        },
        spiritual: {
          upright: "Psychic gifts and mystical experiences expand your awareness",
          reversed: "Spiritual clarity replaces confusion and overwhelm"
        }
      },
      'The Sun': {
        love: {
          upright: "Pure joy and celebration mark your romantic success",
          reversed: "Temporary romantic delays lead to even greater happiness"
        },
        career: {
          upright: "Professional achievement and recognition bring deep satisfaction",
          reversed: "Career success is coming - trust in the perfect timing"
        },
        growth: {
          upright: "Radiant confidence and vitality fuel your personal success",
          reversed: "Your natural light and life force are returning strongly"
        },
        spiritual: {
          upright: "Spiritual enlightenment and divine joy illuminate your path",
          reversed: "Divine connection and spiritual confidence are being restored"
        }
      },
      'Judgement': {
        love: {
          upright: "Forgiveness and second chances heal and renew your relationships",
          reversed: "Practice self-forgiveness to open your heart to love"
        },
        career: {
          upright: "Your professional calling aligns with serving your higher purpose",
          reversed: "Stop doubting yourself - step into your full career potential"
        },
        growth: {
          upright: "Spiritual awakening calls you to live more authentically",
          reversed: "Forgive your past mistakes to embrace personal renewal"
        },
        spiritual: {
          upright: "Divine grace and spiritual rebirth transform your path",
          reversed: "Answer your spiritual calling despite self-doubt"
        }
      },
      'The World': {
        love: {
          upright: "Complete romantic fulfillment crowns your love journey",
          reversed: "Final steps remain to achieve your relationship goals"
        },
        career: {
          upright: "Professional mastery and recognition fulfill your career dreams",
          reversed: "Career success requires one final push to completion"
        },
        growth: {
          upright: "You've achieved integration and mastery of your life lessons",
          reversed: "Personal transformation is nearly complete - integrate your growth"
        },
        spiritual: {
          upright: "Spiritual mastery and cosmic consciousness crown your journey",
          reversed: "Final spiritual surrender completes your enlightenment"
        }
      }
    };

    if (insights[card.name] && insights[card.name][questionType]) {
      return insights[card.name][questionType][orientation];
    }
    
    // 备用关键洞察生成
    return generateGenericKeyInsight(card, questionType);
  };

  // 生成通用关键洞察（备用）
  const generateGenericKeyInsight = (card, questionType) => {
    const elementInsights = {
      'Fire': {
        love: card.upright ? "Passion and action create romantic breakthroughs" : "Cool down emotional reactions to find love's truth",
        career: card.upright ? "Bold action and leadership advance your career" : "Temper your professional ambition with patience",
        growth: card.upright ? "Dynamic energy fuels rapid personal transformation" : "Channel your inner fire more constructively",
        spiritual: card.upright ? "Spiritual passion ignites divine connection" : "Balance spiritual enthusiasm with grounded practice"
      },
      'Water': {
        love: card.upright ? "Emotional depth and intuition guide love's flow" : "Heal emotional wounds to restore love's natural current",
        career: card.upright ? "Trust your professional instincts and emotional intelligence" : "Don't let emotions cloud your career judgment",
        growth: card.upright ? "Deep feeling and intuition accelerate personal growth" : "Process emotions healthily to continue growing",
        spiritual: card.upright ? "Spiritual intuition and emotional wisdom guide your path" : "Balance spiritual sensitivity with practical grounding"
      },
      'Air': {
        love: card.upright ? "Clear communication and mental connection strengthen love" : "Overcome overthinking to connect heart-to-heart",
        career: card.upright ? "Ideas, communication, and mental agility drive career success" : "Stop overthinking and take practical career action",
        growth: card.upright ? "New perspectives and learning accelerate your development" : "Balance mental analysis with intuitive knowing",
        spiritual: card.upright ? "Spiritual wisdom and higher consciousness expand your awareness" : "Ground spiritual insights in practical daily application"
      },
      'Earth': {
        love: card.upright ? "Practical love and stable commitment build lasting relationships" : "Address material concerns affecting your love life",
        career: card.upright ? "Steady effort and practical skills create career security" : "Focus on concrete actions rather than just planning",
        growth: card.upright ? "Grounded practice and patience create lasting personal change" : "Take practical steps instead of just dreaming of change",
        spiritual: card.upright ? "Embodied spirituality integrates wisdom into daily life" : "Ground your spiritual insights through practical service"
      }
    };

    return elementInsights[card.element][questionType];
  };

  // 获取问题类型
  const getQuestionType = (question) => {
    if (!question) return 'spiritual';
    const lowerQuestion = question.toLowerCase();
    if (lowerQuestion.includes('love') || lowerQuestion.includes('relationship') || lowerQuestion.includes('romantic')) return 'love';
    if (lowerQuestion.includes('career') || lowerQuestion.includes('job') || lowerQuestion.includes('work') || lowerQuestion.includes('money') || lowerQuestion.includes('professional')) return 'career';
    if (lowerQuestion.includes('growth') || lowerQuestion.includes('personal') || lowerQuestion.includes('develop') || lowerQuestion.includes('potential')) return 'growth';
    return 'spiritual';
  };

  // 获取情境化指导（备用函数）
  const getContextualGuidance = (questionType, isUpright, element) => {
    const guidance = {
      love: isUpright ? 
        `Your ${element.toLowerCase()} energy brings positive romantic flow. Trust your heart's wisdom and allow love to unfold naturally. The universe supports authentic connections that honor your true self.` :
        `Your ${element.toLowerCase()} energy needs balancing in love. Take time to understand what patterns need healing before pursuing new romantic connections. Self-love creates the foundation for all other love.`,
      career: isUpright ?
        `Your ${element.toLowerCase()} energy creates professional opportunities. This is an excellent time to pursue career goals that align with your authentic talents and passions. Trust your unique professional gifts.` :
        `Your ${element.toLowerCase()} energy requires more focus in your career. Reassess your professional direction and ensure your work aligns with your deeper values and long-term vision for success.`,
      growth: isUpright ?
        `Your ${element.toLowerCase()} energy supports powerful personal transformation. Embrace the changes occurring within you and trust that this growth serves your highest evolution and authentic self-expression.` :
        `Your ${element.toLowerCase()} energy needs more conscious direction for growth. Identify what patterns or beliefs are limiting you and take concrete steps to transform them into sources of strength.`,
      spiritual: isUpright ?
        `Your ${element.toLowerCase()} energy enhances spiritual connection and divine guidance. This is a time of heightened spiritual awareness and the potential for profound spiritual insights and experiences.` :
        `Your ${element.toLowerCase()} energy requires more grounding in spiritual practice. Balance your spiritual aspirations with practical application and ensure your spiritual growth serves your daily life and service to others.`
    };
    return guidance[questionType];
  };

  // 处理用户评分
  const handleRating = (rating) => {
    setUserRating(rating);
    
    trackUserAction(EVENTS.RATING_GIVEN, {
      rating,
      planType: 'quick',
      questionType: selectedQuestion?.id,
      cardName: selectedCards[0]?.name,
      timeToRate: Date.now() - pageStartTime
    });
  };

  // 处理分享
  const handleShare = () => {
    const shareData = {
      title: 'My Tarot Reading Results',
      text: `I just got an amazing tarot reading from ArcaneCards! The insights from ${selectedCards[0]?.name} were so enlightening. You should try it too!`,
      url: window.location.origin
    };
    
    trackUserAction(EVENTS.SHARE_CLICKED, {
      shareMethod: 'native_share',
      planType: 'quick',
      userRating: userRating,
      cardName: selectedCards[0]?.name
    });

    if (navigator.share) {
      navigator.share(shareData).then(() => {
        trackUserAction(EVENTS.SHARE_COMPLETED, {
          shareMethod: 'native_share',
          success: true
        });
      }).catch(() => {
        trackUserAction(EVENTS.SHARE_COMPLETED, {
          shareMethod: 'native_share',
          success: false
        });
      });
    } else {
      navigator.clipboard.writeText(shareData.url);
      alert('Link copied! Share it with your friends 🔮');
      trackUserAction(EVENTS.SHARE_COMPLETED, {
        shareMethod: 'copy_link',
        success: true
      });
    }
  };

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-gray-900 via-purple-950 to-black text-white relative overflow-hidden">
      <StarField />
      
      <div className="relative z-10 min-h-screen">
        
        {/* 页面1: Landing页 */}
        <motion.div 
          className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center"
          // 使用 flex 布局让内容垂直居中
          animate={{ 
            opacity: currentPage === 1 ? 1 : 0,
            pointerEvents: currentPage === 1 ? 'auto' : 'none'
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="mb-8"
            animate={{ 
              y: currentPage === 1 ? 0 : -20,
              opacity: currentPage === 1 ? 1 : 0
            }}
            transition={{ delay: currentPage === 1 ? 0.1 : 0, duration: 0.4 }}
          >
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500 bg-clip-text text-transparent">
              ⟐ ArcaneCards ⟐
            </h1>
            <p className="text-base sm:text-lg opacity-90 font-serif text-amber-100/80">
              Ancient Wisdom, Modern Insight
            </p>
          </motion.div>
          
          <motion.div 
            className="mb-16"
            animate={{ 
              opacity: currentPage === 1 ? 1 : 0
            }}
            transition={{ delay: currentPage === 1 ? 0.2 : 0, duration: 0.4 }}
          >
            <p className="text-lg sm:text-xl italic opacity-80 font-serif text-amber-100/70">
              "What does the universe want to reveal today?"
            </p>
          </motion.div>
          
          <motion.div 
            className="mb-16"
            animate={{ 
              opacity: currentPage === 1 ? 1 : 0
            }}
            transition={{ delay: currentPage === 1 ? 0.3 : 0, duration: 0.4 }}
          >
            <motion.button
              className="bg-gradient-to-r from-emerald-600 to-green-700 px-8 py-4 rounded-2xl font-bold text-white border border-emerald-500/30 shadow-2xl"
              animate={{ 
                y: currentPage === 1 ? 0 : 20,
                opacity: currentPage === 1 ? 1 : 0
              }}
              transition={{ 
                delay: currentPage === 1 ? 0.4 : 0,
                duration: 0.4,
                type: "spring",
                stiffness: 120
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -3,
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.4)",
                transition: { type: "spring", stiffness: 400, damping: 30 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                trackUserAction(EVENTS.PLAN_SELECTED, {
                  planId: 'quick',
                  selectionTime: Date.now() - pageStartTime,
                  planType: 'free'
                });
                setCurrentPage(2);
              }}
            >
              ✨ BEGIN JOURNEY
            </motion.button>
            
            <motion.p 
              className="text-sm text-emerald-200/80 mt-3 font-serif"
              animate={{ opacity: currentPage === 1 ? 1 : 0 }}
              transition={{ delay: currentPage === 1 ? 0.5 : 0, duration: 0.4 }}
            >
              Free • No signup required • Instant insights
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="mt-12 flex items-center justify-center space-x-1"
            animate={{ 
              opacity: currentPage === 1 ? 1 : 0
            }}
            transition={{ delay: currentPage === 1 ? 0.6 : 0, duration: 0.4 }}
          >
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="ml-2 text-xs sm:text-sm opacity-80">50k+ satisfied users</span>
          </motion.div>

          <motion.div 
            className="mt-20 text-center opacity-20"
            animate={{ 
              opacity: currentPage === 1 ? 0.2 : 0
            }}
            transition={{ delay: currentPage === 1 ? 1.0 : 0, duration: 0.6 }}
          >
            <div className="text-amber-400/30 text-lg font-serif">
              ✦ ✧ ✦ ✧ ✦
            </div>
          </motion.div>
        </motion.div>

        {/* 页面2: 问题选择 - 新的三阶段流程 */}
        <motion.div 
          className="absolute inset-0 p-4"
          animate={{ 
            opacity: currentPage === 2 ? 1 : 0,
            pointerEvents: currentPage === 2 ? 'auto' : 'none'
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="text-center mb-10 mt-20"
            animate={{ 
              y: currentPage === 2 ? 0 : -20,
              opacity: currentPage === 2 ? 1 : 0
            }}
            transition={{ delay: currentPage === 2 ? 0.1 : 0, duration: 0.4 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-amber-100">
              {currentStage === 1 && "How are you feeling today?"}
              {currentStage === 2 && `You're feeling ${selectedEmotion?.title.toLowerCase().replace("i'm feeling ", "")}...`}
              {currentStage === 3 && "Make it personal"}
            </h2>
            <p className="text-sm opacity-70 font-serif">
              {currentStage === 1 && "Choose what resonates with you right now"}
              {currentStage === 2 && "What area needs attention?"}
              {currentStage === 3 && "Share details for deeper insights (optional)"}
            </p>
          </motion.div>

          {/* 阶段1: 情感状态选择 */}
          {currentStage === 1 && (
            <div className="grid grid-cols-1 gap-6 max-w-md mx-auto mb-12">
              {emotionalStates.map((emotion, index) => (
                <motion.div
                  key={emotion.id}
                  className={`p-4 rounded-2xl cursor-pointer border relative ${
                    selectedEmotion?.id === emotion.id 
                      ? `bg-gradient-to-br ${emotion.color} border-amber-400/50` 
                      : 'bg-black/30 backdrop-blur-sm border-purple-500/30'
                  }`}
                  animate={{ 
                    y: currentPage === 2 ? 0 : 20,
                    opacity: currentPage === 2 ? 1 : 0
                  }}
                  transition={{ 
                    delay: currentPage === 2 ? 0.15 + index * 0.1 : 0,
                    duration: 0.3
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEmotionSelection(emotion)}
                >
                  {/* 轻微的引导动画 - 只对第一个选项 */}
                  {index === 0 && !selectedEmotion && (
                    <motion.div
                      className="absolute -inset-1 bg-blue-500/10 rounded-2xl -z-10"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{emotion.emoji}</span>
                    <div>
                      <h3 className="font-bold text-sm">{emotion.title}</h3>
                      <p className="text-xs opacity-70">{emotion.subtitle}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* 阶段2: 场景选择 */}
          {currentStage === 2 && selectedEmotion && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-12"
            >
              {selectedEmotion.scenarios.map((scenario, index) => (
                <motion.div
                  key={scenario.id}
                  className={`p-4 rounded-xl cursor-pointer text-center border ${
                    selectedScenario?.id === scenario.id
                      ? 'bg-gradient-to-br from-amber-500 to-orange-500 border-amber-400 shadow-lg shadow-amber-500/25'
                      : 'bg-black/30 backdrop-blur-sm border-purple-500/30'
                  }`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleScenarioSelection(scenario)}
                >
                  <div className="text-lg mb-1">{scenario.emoji}</div>
                  <h3 className="font-semibold text-xs">{scenario.title}</h3>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* 阶段3: 自定义输入 - 优化版 */}
          {currentStage === 3 && selectedScenario && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto mb-12"
            >
              {/* 当前问题展示 - 优化版 */}
              <motion.div 
                className="bg-gradient-to-r from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-xs text-amber-300 mb-1">💭 Your question:</p>
                <p className="text-sm text-amber-100 font-serif italic">
                  "{selectedScenario.question}"
                </p>
              </motion.div>
              
              {/* 输入区域 */}
              <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
                <div className="relative">
                  <textarea
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Tell me more about your situation..."
                    className="w-full bg-black/30 border border-purple-500/30 rounded-lg p-3 text-white placeholder-gray-400 resize-none focus:border-amber-500/60 focus:outline-none transition-colors"
                    rows="3"
                    maxLength="200"
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                    {customQuestion.length}/200
                  </div>
                </div>
                
                {/* 智能反馈提示 */}
                <div className="mt-3 text-center">
  

                  {customQuestion.length > 10 && customQuestion.length < 50 && (
                    <p className="text-xs text-amber-300">
                      ✨ Good! Your reading will be more tailored
                    </p>
                  )}

                  {customQuestion.length >= 50 && (
                    <p className="text-xs text-emerald-300">
                      🌟 Perfect! Expect a highly personalized reading
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Continue按钮 - 仅在第三阶段显示 */}
          {currentStage === 3 && (
            <motion.div 
              className="text-center"
              animate={{ 
                y: currentPage === 2 ? 0 : 20,
                opacity: currentPage === 2 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 sm:px-8 py-3 rounded-full font-semibold flex items-center mx-auto text-sm sm:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startCardSelection}
              >
                Start Reading <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
              </motion.button>
              
              <p className="text-xs text-gray-500 mt-2">
                {customQuestion.length > 0 
                  ? "Ready for your personalized reading" 
                  : "Using your selected scenario"
                }
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* 页面3: 选牌体验 */}
        <motion.div 
          className="absolute inset-0 p-4"
          animate={{ 
            opacity: currentPage === 3 ? 1 : 0,
            pointerEvents: currentPage === 3 ? 'auto' : 'none'
          }}
          transition={{ duration: 0.3 }}
        >
          <motion.div 
            className="text-center mb-4 mt-6"
            animate={{ 
              y: currentPage === 3 ? 0 : -20,
              opacity: currentPage === 3 ? 1 : 0
            }}
            transition={{ delay: currentPage === 3 ? 0.1 : 0, duration: 0.4 }}
          >
            <h2 className="text-xl sm:text-2xl font-serif mb-2 text-amber-100">
              {cardSelectionPhase === 'waiting' && 'Ready for Your Reading?'}
              {cardSelectionPhase === 'shuffling' && 'Shuffling the Ancient Deck...'}
              {cardSelectionPhase === 'selecting' && 'Choose Your Destiny Card'}
              {cardSelectionPhase === 'completing' && 'Cards Chosen...'}
              {cardSelectionPhase === 'revealing' && 'Your Destiny Reveals...'}
            </h2>
            
            <p className="text-xs sm:text-sm opacity-60">
              {cardSelectionPhase === 'waiting' && 'Click below to shuffle the mystical deck'}
              {cardSelectionPhase === 'shuffling' && '22 cards dancing with cosmic energy...'}
              {cardSelectionPhase === 'selecting' && 'Trust your intuition and select the card that calls to you'}
              {cardSelectionPhase === 'completing' && 'The cards have chosen you...'}
              {cardSelectionPhase === 'revealing' && 'Ancient wisdom awakens...'}
            </p>
          </motion.div>

          {/* 等待洗牌阶段 */}
          {cardSelectionPhase === 'waiting' && (
            <motion.div 
              className="text-center mt-16"
              animate={{ 
                opacity: currentPage === 3 ? 1 : 0,
                scale: currentPage === 3 ? 1 : 0.9
              }}
              transition={{ duration: 0.4 }}
            >
              {/* 显示用户的具体问题 */}
              {selectedQuestion?.finalQuestion && (
                <motion.div 
                  className="mb-8 max-w-sm mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
                    <p className="text-xs text-amber-300 mb-2">Your Question:</p>
                    <p className="text-sm text-white font-serif italic">
                      "{selectedQuestion.finalQuestion}"
                    </p>
                  </div>
                </motion.div>
              )}

              <motion.div
                className="w-24 h-36 mx-auto bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg border border-amber-500/30 mb-8 overflow-hidden"
                whileHover={{ scale: 1.05 }}
                animate={{ 
                  boxShadow: ["0 0 20px rgba(255, 215, 0, 0.3)", "0 0 30px rgba(255, 215, 0, 0.6)", "0 0 20px rgba(255, 215, 0, 0.3)"]
                }}
                transition={{ 
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                <motion.div
                  className="w-24 h-36 mx-auto bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg border border-amber-500/30 mb-8 overflow-hidden"
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    boxShadow: ["0 0 20px rgba(255, 215, 0, 0.3)", "0 0 30px rgba(255, 215, 0, 0.6)", "0 0 20px rgba(255, 215, 0, 0.3)"]
                  }}
                  transition={{ 
                    boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                  }}
                >
                  {/* 添加统一的SVG背面设计 */}
                  <svg className="w-full h-full rounded-lg" viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="waitingBackgroundGradient" cx="50%" cy="50%" r="80%">
                        <stop offset="0%" style={{stopColor:'#1a0033', stopOpacity:1}} />
                        <stop offset="50%" style={{stopColor:'#0f0027', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#000015', stopOpacity:1}} />
                      </radialGradient>
                      
                      <linearGradient id="waitingGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                        <stop offset="50%" style={{stopColor:'#F4D03F', stopOpacity:1}} />
                        <stop offset="100%" style={{stopColor:'#B8860B', stopOpacity:1}} />
                      </linearGradient>
                      
                      <filter id="waitingGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                        <feMerge> 
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* 背景 */}
                    <rect width="70" height="110" fill="url(#waitingBackgroundGradient)" rx="8"/>
                    
                    {/* 外边框 */}
                    <rect x="2" y="2" width="66" height="106" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.8" rx="6"/>
                    <rect x="4" y="4" width="62" height="102" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.4" rx="4"/>
                    
                    {/* 顶部月相 */}
                    <g transform="translate(35,12)">
                      <g transform="translate(-12,0)">
                        <circle r="2.5" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.4"/>
                        <circle r="2" cx="1" cy="0" fill="#1a0033"/>
                      </g>
                      <circle r="3.5" fill="url(#waitingGoldGradient)" opacity="0.9" filter="url(#waitingGlow)"/>
                      <circle r="2.5" fill="#1a0033" opacity="0.3"/>
                      <g transform="translate(12,0)">
                        <circle r="2.5" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.4"/>
                        <circle r="2" cx="-1" cy="0" fill="#1a0033"/>
                      </g>
                    </g>
                    
                    {/* 中央主图案 */}
                    <g transform="translate(35,55)">
                      <circle r="20" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.6" opacity="0.6"/>
                      <circle r="17" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.3" opacity="0.4"/>
                      
                      {/* 太阳光芒 */}
                      <g>
                        <line x1="0" y1="-15" x2="0" y2="-18" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="11" y1="-11" x2="13" y2="-13" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="15" y1="0" x2="18" y2="0" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="11" y1="11" x2="13" y2="13" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="0" y1="15" x2="0" y2="18" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="-11" y1="11" x2="-13" y2="13" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="-15" y1="0" x2="-18" y2="0" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <line x1="-11" y1="-11" x2="-13" y2="-13" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                      </g>
                      
                      {/* 中央水晶球 */}
                      <circle r="11" fill="url(#waitingGoldGradient)" opacity="0.1"/>
                      <circle r="9" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                      
                      {/* 全视之眼 */}
                      <g opacity="0.8">
                        <polygon points="0,-6 -5,3 5,3" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.6"/>
                        <ellipse cx="0" cy="-1" rx="3" ry="1.5" fill="url(#waitingGoldGradient)" opacity="0.7"/>
                        <circle cx="0" cy="-1" r="1" fill="#1a0033"/>
                        <circle cx="0" cy="-1" r="0.5" fill="url(#waitingGoldGradient)"/>
                      </g>
                    </g>
                    
                    {/* 底部月相 */}
                    <g transform="translate(35,98)">
                      <g transform="translate(-12,0)">
                        <circle r="2.5" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.4"/>
                        <circle r="2" cx="1" cy="0" fill="#1a0033"/>
                      </g>
                      <circle r="3.5" fill="url(#waitingGoldGradient)" opacity="0.9" filter="url(#waitingGlow)"/>
                      <circle r="2.5" fill="#1a0033" opacity="0.3"/>
                      <g transform="translate(12,0)">
                        <circle r="2.5" fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.4"/>
                        <circle r="2" cx="-1" cy="0" fill="#1a0033"/>
                      </g>
                    </g>
                    
                    {/* 星空点缀 */}
                    <g fill="url(#waitingGoldGradient)" opacity="0.6">
                      <circle cx="15" cy="25" r="0.5"/>
                      <circle cx="55" cy="30" r="0.5"/>
                      <circle cx="12" cy="75" r="0.4"/>
                      <circle cx="58" cy="80" r="0.4"/>
                      <circle cx="20" cy="85" r="0.3"/>
                      <circle cx="50" cy="20" r="0.3"/>
                    </g>
                    
                    {/* 角落装饰 */}
                    <g fill="none" stroke="url(#waitingGoldGradient)" strokeWidth="0.3" opacity="0.5">
                      <path d="M 6 6 L 12 6 M 6 6 L 6 12"/>
                      <path d="M 64 6 L 58 6 M 64 6 L 64 12"/>
                      <path d="M 6 104 L 12 104 M 6 104 L 6 98"/>
                      <path d="M 64 104 L 58 104 M 64 104 L 64 98"/>
                    </g>
                  </svg>
                </motion.div>
              </motion.div>
              
              <motion.button
                className="bg-gradient-to-r from-amber-600 to-orange-500 px-8 py-4 rounded-2xl font-bold text-white border-2 border-amber-400/50 shadow-2xl"
                whileHover={{ scale: 1.05, boxShadow: "0 10px 30px rgba(255, 193, 7, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                onClick={startShuffling}
                animate={{ 
                  y: [0, -5, 0],
                  boxShadow: ["0 5px 15px rgba(255, 193, 7, 0.3)", "0 8px 25px rgba(255, 193, 7, 0.5)", "0 5px 15px rgba(255, 193, 7, 0.3)"]
                }}
                transition={{ 
                  y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                  boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                }}
              >
                🔮 Shuffle the Deck
              </motion.button>
              
              <p className="text-amber-200/60 font-serif mt-4 text-sm">
                Focus on your question as you shuffle...
              </p>
            </motion.div>
          )}

          {/* 洗牌阶段 */}
          {cardSelectionPhase === 'shuffling' && (
            <motion.div 
              className="text-center mt-12"
              animate={{ 
                opacity: currentPage === 3 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              {/* 放大的动画容器 */}
              <div className="relative mx-auto mb-8" style={{ width: '320px', height: '240px' }}>
                
                {/* 添加能量粒子背景 */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute w-1 h-1 bg-amber-300 rounded-full opacity-60"
                      animate={{
                        x: [
                          Math.random() * 320,
                          Math.random() * 320,
                          Math.random() * 320
                        ],
                        y: [
                          Math.random() * 240,
                          Math.random() * 240,
                          Math.random() * 240
                        ],
                        opacity: [0, 0.8, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        delay: i * 0.25,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>

                {/* 卡牌动画 - 放大版本 */}
                {Array.from({ length: 7 }).map((_, i) => (
                  <motion.div
                    key={`shuffle-card-${i}`}
                    className="absolute w-24 h-36 rounded-lg border border-amber-500/30 overflow-hidden shadow-2xl"
                    style={{
                      left: `${120 + i * 12}px`,
                      top: `${80 + i * 8}px`,
                      zIndex: 7 - i,
                      filter: `blur(${i * 0.3}px)` // 景深效果
                    }}
                    animate={{
                      x: [
                        0, 
                        (i - 3) * 60 + Math.random() * 40 - 20, 
                        (i - 3) * -45 + Math.random() * 30 - 15,
                        0
                      ],
                      y: [
                        0, 
                        Math.sin(i * 0.8) * 50 + Math.random() * 30 - 15,
                        Math.cos(i * 1.2) * 40 + Math.random() * 25 - 12,
                        0
                      ],
                      rotate: [
                        0, 
                        (i - 3) * 45 + Math.random() * 60 - 30,
                        (i - 3) * -30 + Math.random() * 40 - 20,
                        0
                      ],
                      scale: [
                        1, 
                        1.1 + Math.random() * 0.2,
                        0.95 + Math.random() * 0.15,
                        1
                      ]
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: 1,
                      ease: "easeInOut",
                      delay: i * 0.08
                    }}
                  >
                    {/* 统一的SVG背面设计 */}
                    <svg className="w-full h-full" viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id={`shuffleBackgroundGradient-${i}`} cx="50%" cy="50%" r="80%">
                          <stop offset="0%" style={{stopColor:'#1a0033', stopOpacity:1}} />
                          <stop offset="50%" style={{stopColor:'#0f0027', stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:'#000015', stopOpacity:1}} />
                        </radialGradient>
                        
                        <linearGradient id={`shuffleGoldGradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:'#FFD700', stopOpacity:1}} />
                          <stop offset="50%" style={{stopColor:'#F4D03F', stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:'#B8860B', stopOpacity:1}} />
                        </linearGradient>
                        
                        <filter id={`shuffleGlow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                          <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
                          <feMerge> 
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      {/* 背景 */}
                      <rect width="70" height="110" fill={`url(#shuffleBackgroundGradient-${i})`} rx="8"/>
                      
                      {/* 外边框 */}
                      <rect x="2" y="2" width="66" height="106" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.8" rx="6"/>
                      <rect x="4" y="4" width="62" height="102" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.4" rx="4"/>
                      
                      {/* 顶部月相 */}
                      <g transform="translate(35,12)">
                        <g transform="translate(-12,0)">
                          <circle r="2.5" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.4"/>
                          <circle r="2" cx="1" cy="0" fill="#1a0033"/>
                        </g>
                        <circle r="3.5" fill={`url(#shuffleGoldGradient-${i})`} opacity="0.9" filter={`url(#shuffleGlow-${i})`}/>
                        <circle r="2.5" fill="#1a0033" opacity="0.3"/>
                        <g transform="translate(12,0)">
                          <circle r="2.5" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.4"/>
                          <circle r="2" cx="-1" cy="0" fill="#1a0033"/>
                        </g>
                      </g>
                      
                      {/* 中央主图案 */}
                      <g transform="translate(35,55)">
                        <circle r="20" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6" opacity="0.6"/>
                        <circle r="17" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.3" opacity="0.4"/>
                        
                        {/* 太阳光芒 */}
                        <g>
                          <line x1="0" y1="-15" x2="0" y2="-18" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="11" y1="-11" x2="13" y2="-13" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="15" y1="0" x2="18" y2="0" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="11" y1="11" x2="13" y2="13" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="0" y1="15" x2="0" y2="18" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="-11" y1="11" x2="-13" y2="13" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="-15" y1="0" x2="-18" y2="0" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <line x1="-11" y1="-11" x2="-13" y2="-13" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                        </g>
                        
                        {/* 中央水晶球 */}
                        <circle r="11" fill={`url(#shuffleGoldGradient-${i})`} opacity="0.1"/>
                        <circle r="9" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                        
                        {/* 全视之眼 */}
                        <g opacity="0.8">
                          <polygon points="0,-6 -5,3 5,3" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.6"/>
                          <ellipse cx="0" cy="-1" rx="3" ry="1.5" fill={`url(#shuffleGoldGradient-${i})`} opacity="0.7"/>
                          <circle cx="0" cy="-1" r="1" fill="#1a0033"/>
                          <circle cx="0" cy="-1" r="0.5" fill={`url(#shuffleGoldGradient-${i})`}/>
                        </g>
                      </g>
                      
                      {/* 底部月相 */}
                      <g transform="translate(35,98)">
                        <g transform="translate(-12,0)">
                          <circle r="2.5" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.4"/>
                          <circle r="2" cx="1" cy="0" fill="#1a0033"/>
                        </g>
                        <circle r="3.5" fill={`url(#shuffleGoldGradient-${i})`} opacity="0.9" filter={`url(#shuffleGlow-${i})`}/>
                        <circle r="2.5" fill="#1a0033" opacity="0.3"/>
                        <g transform="translate(12,0)">
                          <circle r="2.5" fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.4"/>
                          <circle r="2" cx="-1" cy="0" fill="#1a0033"/>
                        </g>
                      </g>
                      
                      {/* 星空点缀 */}
                      <g fill={`url(#shuffleGoldGradient-${i})`} opacity="0.6">
                        <circle cx="15" cy="25" r="0.5"/>
                        <circle cx="55" cy="30" r="0.5"/>
                        <circle cx="12" cy="75" r="0.4"/>
                        <circle cx="58" cy="80" r="0.4"/>
                        <circle cx="20" cy="85" r="0.3"/>
                        <circle cx="50" cy="20" r="0.3"/>
                      </g>
                      
                      {/* 角落装饰 */}
                      <g fill="none" stroke={`url(#shuffleGoldGradient-${i})`} strokeWidth="0.3" opacity="0.5">
                        <path d="M 6 6 L 12 6 M 6 6 L 6 12"/>
                        <path d="M 64 6 L 58 6 M 64 6 L 64 12"/>
                        <path d="M 6 104 L 12 104 M 6 104 L 6 98"/>
                        <path d="M 64 104 L 58 104 M 64 104 L 64 98"/>
                      </g>
                    </svg>
                    
                    {/* 卡片发光效果 */}
                    <motion.div
                      className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-lg -z-10 blur-sm"
                      animate={{ 
                        opacity: [0.2, 0.5, 0.2],
                        scale: [1, 1.05, 1]
                      }}
                      transition={{ 
                        duration: 1.5 + i * 0.2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                ))}
              </div>
              
              {/* 动态文案 */}
              <ShuffleText />
            </motion.div>
          )}

          {/* 选牌阶段 */}
          {cardSelectionPhase === 'selecting' && (
            <motion.div 
              className="mt-6"
              animate={{ 
                opacity: currentPage === 3 ? 1 : 0,
                scale: currentPage === 3 ? 1 : 0.95
              }}
              transition={{ duration: 0.4 }}
            >
              {/* 卡牌网格 - 3排每排3张 */}
              <motion.div 
                className="grid grid-cols-3 gap-5 max-w-xs mx-auto mb-6"
                animate={{ 
                  opacity: currentPage === 3 && cardSelectionPhase === 'selecting' ? 1 : 0,
                  y: currentPage === 3 && cardSelectionPhase === 'selecting' ? 0 : 20
                }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                {shuffledDeck.slice(0, 9).map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1 
                    }}
                    transition={{ 
                      delay: index * 0.12,
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200
                    }}
                  >
                    <Card
                      card={card}
                      index={index}
                      isSelected={selectedCardIndexes.includes(index)}
                      onClick={selectCard}
                      isRevealed={false}
                    />
                  </motion.div>
                ))}
              </motion.div>

              <motion.p 
                className="text-center text-amber-200/80 font-serif text-sm mb-4"
                animate={{ 
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Choose the card that resonates with your soul...
              </motion.p>
            </motion.div>
          )}

          {/* 完成阶段 */}
          {cardSelectionPhase === 'completing' && (
            <motion.div 
              className="text-center mt-16"
              animate={{ 
                opacity: currentPage === 3 ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="text-4xl mb-6"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                ✨
              </motion.div>
              <p className="text-amber-200 font-serif">The universe has chosen...</p>
            </motion.div>
          )}

          {/* 翻牌阶段 */}
          {cardSelectionPhase === 'revealing' && revealedCard && (
            <motion.div 
              className="text-center mt-12"
              animate={{ 
                opacity: currentPage === 3 ? 1 : 0,
                scale: currentPage === 3 ? 1 : 0.8
              }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex justify-center mb-4">
                <Card
                  card={revealedCard}
                  index={0}
                  isSelected={true}
                  onClick={() => {}}
                  isRevealed={true}
                />
              </div>
              <motion.p 
                className="text-amber-200 font-serif"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.4 }}
              >
                Your destiny is revealed...
              </motion.p>
            </motion.div>
          )}
        </motion.div>

        {/* 页面4: 解读结果 - 移动端优化版本 */}
        <motion.div 
          className="absolute inset-0 overflow-y-auto"
          animate={{ 
            opacity: currentPage === 4 ? 1 : 0,
            pointerEvents: currentPage === 4 ? 'auto' : 'none'
          }}
          transition={{ duration: 0.3 }}
        >
          <div className="min-h-full px-4 py-6">
            {/* 标题区域 */}
            <motion.div 
              className="text-center mb-6"
              animate={{ 
                y: currentPage === 4 ? 0 : -20,
                opacity: currentPage === 4 ? 1 : 0
              }}
              transition={{ delay: currentPage === 4 ? 0.1 : 0, duration: 0.5 }}
            >
              <h2 className="text-2xl font-bold text-amber-100 mb-2">Your Reading Revealed</h2>
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
            </motion.div>

            {/* 卡片展示区域 - 优化布局 */}
            <motion.div 
              className="relative bg-gradient-to-br from-emerald-900/30 via-black/50 to-emerald-800/30 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-sm mx-auto border border-emerald-500/30"
              animate={{ 
                opacity: currentPage === 4 ? 1 : 0,
                scale: currentPage === 4 ? 1 : 0.9
              }}
              transition={{ delay: currentPage === 4 ? 0.2 : 0, duration: 0.5 }}
            >
              <div className="text-center">
                {selectedCards[0] && CardSymbols[selectedCards[0].name] ? (
                  <>
                    <div className="text-5xl mb-3 filter drop-shadow-2xl">
                      {CardSymbols[selectedCards[0].name].symbol}
                    </div>
                    <motion.div 
                      className="text-2xl mb-4"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {CardSymbols[selectedCards[0].name].accent}
                    </motion.div>
                  </>
                ) : (
                  <div className="text-5xl mb-3 filter drop-shadow-2xl text-emerald-300">
                    ✦
                  </div>
                )}
                <h3 className="font-bold text-xl mb-2 text-emerald-100">
                  {selectedCards[0]?.name || 'The Mystery Card'}
                </h3>
                <p className="text-sm opacity-80 text-emerald-200/70 font-serif">
                  {selectedCards[0] ? 
                    `${selectedCards[0].upright ? 'Upright' : 'Reversed'} • ${selectedCards[0].element} Element` :
                    'Ancient Wisdom • Universal Element'
                  }
                </p>
              </div>
            </motion.div>
            
            {/* 解读内容区域 - 移动端专属优化 */}
            <motion.div 
              className="max-w-lg mx-auto mb-8"
              animate={{ 
                y: currentPage === 4 ? 0 : 20,
                opacity: currentPage === 4 ? 1 : 0
              }}
              transition={{ delay: currentPage === 4 ? 0.4 : 0, duration: 0.5 }}
            >
              {/* 主要解读内容 - 重新设计格式 */}
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-emerald-500/20 mb-6 overflow-hidden">
                {/* 内容标题 */}
                <div className="bg-emerald-500/10 px-6 py-4 border-b border-emerald-500/20">
                  <h4 className="text-emerald-200 font-semibold text-sm flex items-center">
                    <span className="text-emerald-400 mr-2">📖</span>
                    Your Tarot Guidance
                  </h4>
                </div>
                
                {/* 解读文本 - 优化排版 */}
                <div className="p-6">
                  <div className="space-y-6">
                    {formatReading(readingResult?.reading || 'Your reading is being prepared...').map((paragraph, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: currentPage === 4 ? 0.5 + index * 0.3 : 0 }}
                        className="relative"
                      >
                        {/* 段落装饰 */}
                        {index === 0 && (
                          <div className="absolute -left-4 top-0 w-2 h-full bg-gradient-to-b from-emerald-400 to-transparent opacity-30 rounded-full"></div>
                        )}
                        
                        <p className="text-gray-200 leading-7 text-base font-serif">
                          {paragraph}
                        </p>
                        
                        {/* 段落间分隔线 */}
                        {index < formatReading(readingResult?.reading || '').length - 1 && (
                          <div className="mt-6 flex justify-center">
                            <div className="w-8 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Key Insight区域 - 独立卡片设计 */}
              <motion.div 
                className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 backdrop-blur-sm rounded-2xl border border-amber-500/30 overflow-hidden"
                animate={{ 
                  opacity: currentPage === 4 ? 1 : 0
                }}
                transition={{ delay: currentPage === 4 ? 0.8 : 0, duration: 0.4 }}
              >
                {/* Insight标题区域 */}
                <div className="bg-amber-500/10 px-6 py-4 border-b border-amber-500/20">
                  <h5 className="text-amber-200 font-semibold text-sm flex items-center">
                    <span className="text-amber-400 mr-2">✨</span>
                    Key Insight
                  </h5>
                </div>
                
                {/* Insight内容 */}
                <div className="p-6">
                  <div className="relative">
                    <div className="absolute -left-4 top-0 w-2 h-full bg-gradient-to-b from-amber-400 to-transparent opacity-40 rounded-full"></div>
                    <p className="text-amber-100 font-serif italic text-base leading-7 pl-2">
                      "{readingResult?.keyInsight || "Trust in the wisdom revealed by this moment"}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* 用户反馈区域 - 简化设计 */}
            <motion.div 
              className="text-center mb-8 max-w-sm mx-auto"
              animate={{ 
                opacity: currentPage === 4 ? 1 : 0
              }}
              transition={{ delay: currentPage === 4 ? 1.0 : 0, duration: 0.4 }}
            >
              <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
                <p className="text-sm mb-5 text-gray-300">How helpful was this reading?</p>
                <div className="flex justify-center space-x-4 mb-6">
                  {[1,2,3,4,5].map(star => (
                    <motion.button 
                      key={star}
                      onClick={() => handleRating(star)}
                      className="text-3xl transition-all duration-200 hover:scale-110 focus:outline-none"
                      whileTap={{ scale: 0.9 }}
                    >
                      {userRating >= star ? '⭐' : '☆'}
                    </motion.button>
                  ))}
                </div>
                
                {/* 评分后的反馈 */}
                {userRating > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-purple-500/20 pt-4 mt-4"
                  >
                    {userRating >= 4 ? (
                      <div>
                        <p className="text-emerald-300 text-sm mb-4">✨ Thank you! Share this wisdom?</p>
                        <button 
                          onClick={handleShare}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                        >
                          Share with Friends ✨
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm">Thank you for your feedback! 🙏</p>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            {/* 操作按钮区域 - 移动端优化 */}
            <motion.div 
              className="flex flex-col space-y-4 max-w-sm mx-auto mb-8"
              animate={{ 
                opacity: currentPage === 4 ? 1 : 0
              }}
              transition={{ delay: currentPage === 4 ? 1.2 : 0, duration: 0.4 }}
            >
              <motion.button 
                className="bg-black/30 backdrop-blur-sm px-6 py-4 rounded-xl flex items-center justify-center border border-purple-500/30 text-sm font-medium hover:bg-black/40 transition-all duration-200 w-full"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  trackUserAction(EVENTS.SAVE_CLICKED, {
                    planType: 'quick',
                    cardName: selectedCards[0]?.name
                  });
                  navigator.clipboard?.writeText(`My Tarot Reading: ${readingResult?.reading || ''}\n\nKey Insight: ${readingResult?.keyInsight || ''}`);
                  alert('Reading copied to clipboard! 📱');
                }}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Reading
              </motion.button>
              
              <motion.button 
                className="bg-black/30 backdrop-blur-sm px-6 py-4 rounded-xl flex items-center justify-center border border-purple-500/30 text-sm font-medium hover:bg-black/40 transition-all duration-200 w-full"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Reading
              </motion.button>
            </motion.div>

            {/* 底部装饰和安全距离 */}
            <motion.div 
              className="text-center opacity-20 pb-8 pt-4"
              animate={{ 
                opacity: currentPage === 4 ? 0.2 : 0
              }}
              transition={{ delay: currentPage === 4 ? 1.5 : 0, duration: 0.6 }}
            >
              <div className="text-amber-400/30 text-sm font-serif">
                ✦ ✧ ✦ ✧ ✦
              </div>
              <p className="text-xs text-gray-500 mt-4">Scroll up to re-read your guidance</p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArcaneCards;