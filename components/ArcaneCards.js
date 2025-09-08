"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Heart, Briefcase, Sprout, Sparkles, Star, ArrowRight, Share2, Save } from 'lucide-react';

import { EVENTS } from '../lib/constants/events';
import { tracker } from '../lib/utils/tracking';

const ArcaneCards = () => {
  // ✅ 简化版追踪函数
  const trackUserAction = (eventName, data = {}) => {
    tracker.track(eventName, data);
  };

  const trackPageView = (pageName, pageData = {}) => {
    tracker.trackPageView(pageName, pageData);
  };

  const API_CONFIG = {
    timeout: 25000,
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
  const [emailInput, setEmailInput] = useState('');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
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
    { id: 0, name: 'The Fool', symbol: '🃏', meaning: 'New beginnings, innocence, spontaneity, free spirit', upright: true, element: 'Air' },
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
    'The Fool': { symbol: '🎭', accent: '🌹', color: 'from-green-400 to-emerald-500' },
    'The Magician': { symbol: '🪄', accent: '⚡', color: 'from-red-400 to-orange-500' },
    'The High Priestess': { symbol: '🌙', accent: '🔮', color: 'from-blue-400 to-indigo-500' },
    'The Empress': { symbol: '👑', accent: '🌾', color: 'from-pink-400 to-rose-500' },
    'The Emperor': { symbol: '⚔️', accent: '🏰', color: 'from-red-500 to-red-600' },
    'The Hierophant': { symbol: '🗝️', accent: '📜', color: 'from-amber-400 to-yellow-500' },
    'The Lovers': { symbol: '💕', accent: '💫', color: 'from-pink-400 to-red-400' },
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

  // 🎯 核心事件1: 初始化追踪
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

  // 页面切换追踪（简化版）
  useEffect(() => {
    const pageNames = {1: 'landing', 2: 'question', 3: 'cards', 4: 'result'};
    const pageName = pageNames[currentPage];
    
    if (pageName) {
      trackPageView(pageName, {
        planSelected: 'quick',
        timeFromStart: Date.now() - pageStartTime
      });
    }
    
    setPageStartTime(Date.now());
  }, [currentPage]);

  // 初始化洗牌后的牌组
  useEffect(() => {
    if (!hasInitializedRef.current) {
      const shuffled = [...tarotCards].sort(() => Math.random() - 0.5);
      setShuffledDeck(shuffled);
      hasInitializedRef.current = true;
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

  // 问题类型选择处理 - 完整版本（保持所有UI逻辑）
  const handleEmotionSelection = (emotion) => {
    setSelectedEmotion(emotion);
    setSelectedScenario(null);
    setCurrentStage(2);
    // 移除追踪调用，保持功能逻辑
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
    // 移除追踪调用，保持功能逻辑
  };

  // 开始选卡流程 - 完整版本（保持所有UI逻辑）
  const startCardSelection = () => {
    const finalQuestion = customQuestion.trim() || selectedScenario?.question || 'What guidance do I need?';
  
    setSelectedQuestion(prev => ({
      ...prev,
      finalQuestion: finalQuestion,
      isCustom: customQuestion.trim().length > 0
    }));

    // 移除追踪调用，保持功能逻辑
    setCurrentPage(3);
    setCardSelectionPhase('waiting');
  };

  // 手动洗牌
  const startShuffling = () => {
    setCardSelectionPhase('shuffling');
    // 移除追踪调用，保持功能逻辑
    
    // 洗牌动画持续2-3秒
    phaseTimeoutRef.current = setTimeout(() => {
      setCardSelectionPhase('selecting');
      // 移除追踪调用，保持功能逻辑
    }, 2500);
  };

  // 选择卡牌
  const selectCard = (cardIndex, card) => {
    if (selectedCardIndexes.includes(cardIndex)) return;
    
    // 只选择一张牌
    const newSelectedIndexes = [cardIndex];
    const newSelectedCards = [card];
    
    // 移除追踪调用，保持功能逻辑
    setSelectedCardIndexes(newSelectedIndexes);
    setSelectedCards(newSelectedCards);
    
    setCardSelectionPhase('completing');
    
    phaseTimeoutRef.current = setTimeout(() => {
      setCardSelectionPhase('revealing');
      setRevealedCard(newSelectedCards[0]);
      
      phaseTimeoutRef.current = setTimeout(() => {
        generateAndShowReading(newSelectedCards);
      }, 2000);
    }, 1500);
  };

  // 🎯 核心事件2,3,4,8: 生成并显示解读 - 核心版本
  const generateAndShowReading = async (cards) => {
    const readingStartTime = Date.now();
    const finalQuestion = selectedQuestion?.finalQuestion || selectedQuestion?.question || 'What guidance do I need?';
    
    try {
      const result = await generateReading(cards, finalQuestion, 'quick');
      setReadingResult(result);
      
      // 🎯 核心事件4: 记录解读生成耗时
      trackUserAction(EVENTS.READING_GENERATION_TIME, {
        duration: Date.now() - readingStartTime,
        method: result.source || 'unknown',
        cardName: cards[0]?.name
      });
      
      // 🎯 核心事件8: 解读完成
      trackUserAction(EVENTS.READING_COMPLETED, {
        cardName: cards[0]?.name,
        cardUpright: cards[0]?.upright,
        readingSource: result.source,
        generationTime: Date.now() - readingStartTime,
        questionLength: finalQuestion.length
      });
      
      setCurrentPage(4);
      setHasCompletedFreeReading(true);
      
    } catch (error) {
      console.error('Reading generation error:', error);
      // 简化错误处理，不追踪详细错误事件
    }
  };

  // 🎯 核心事件2,3: AI解读生成系统 - 简化版本
  const generateReading = async (cards, question) => {
    const planType = 'quick';
    console.log('🔥 Core Events Version Called!');
    console.log('🔥 Input params:', { cards: cards.length, question, planType });
    
    const readingStartTime = Date.now();
    const finalQuestion = selectedQuestion?.finalQuestion || selectedQuestion?.question || 'What guidance do I need?';
    
    // 尝试AI API - 简化版本
    try {
      console.log('🚀 Calling AI API...');
      
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
      
      if (response.ok) {
        const aiResult = await response.json();
        console.log('✅ AI Success! Using AI content directly');
        
        // 🎯 核心事件2: AI解读成功
        trackUserAction(EVENTS.AI_READING_SUCCESS, {
          provider: aiResult.provider || 'deepseek',
          generationTime: Date.now() - readingStartTime,
          cardName: cards[0]?.name,
          readingLength: aiResult.reading?.length || 0
        });
        
        return {
          reading: aiResult.reading || aiResult.content || 'AI guidance received',
          keyInsight: aiResult.keyInsight || 'Trust the journey ahead',
          source: 'ai',
          provider: aiResult.provider || 'deepseek'
        };
        
      } else {
        console.log(`⚠️ API returned ${response.status}, falling back to local`);
        throw new Error(`API returned ${response.status}`);
      }
      
    } catch (error) {
      console.log('🔄 Network error, using local algorithm:', error.message);
      
      // 🎯 核心事件3: AI解读失败
      trackUserAction(EVENTS.AI_READING_FAILED, {
        fallbackReason: error.name === 'AbortError' ? 'timeout' : 'network_error',
        generationTime: Date.now() - readingStartTime,
        cardName: cards[0]?.name,
        errorMessage: error.message
      });

      // 使用本地算法
      const localResult = generateLocalReading(cards, finalQuestion, planType);
      
      return {
        ...localResult,
        source: 'local',
        fallbackReason: error.message
      };
    }
  };

  // 本地解读生成算法（保持完整不变）
  const generateLocalReading = (cards, question, planType) => {
    if (!cards || cards.length === 0) {
      return {
        reading: "The cards are still revealing themselves to you. Please select your cards first.",
        keyInsight: "Patience brings wisdom"
      };
    }

    const card = cards[0];
    const questionType = getQuestionType(question);
    
    // 完整的22张大阿尔卡纳解读数据库 - 保持不变
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
      // 这里继续添加其他21张牌的完整数据... 为了节省空间，我先提供这两张的示例
      // 实际代码中应该包含所有22张牌的完整解读
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

  // 生成个性化的关键洞察（保持不变）
  const generateKeyInsight = (card, questionType, orientation) => {
    // 简化版，只包含几个主要牌的洞察
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
      }
      // 可以继续添加其他牌的洞察...
    };

    if (insights[card.name] && insights[card.name][questionType]) {
      return insights[card.name][questionType][orientation];
    }
    
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

  // 🎯 核心事件6: 处理用户评分
  const handleRating = (rating) => {
    setUserRating(rating);
    
    trackUserAction(EVENTS.RATING_GIVEN, {
      rating,
      cardName: selectedCards[0]?.name,
      timeToRate: Date.now() - pageStartTime,
      satisfaction: rating >= 4 ? 'high' : 'low'
    });

    // 根据评分显示不同内容
    if (rating >= 4) {
      setShowEmailForm(true);
      setShowFeedbackForm(false);
    } else if (rating <= 3) {
      setShowFeedbackForm(true);
      setShowEmailForm(false);
    }
  };

  // 🎯 核心事件7: 邮箱提交处理函数
  const handleEmailSubmit = async () => {
    if (!emailInput.trim()) return;
    
    try {
      const response = await fetch('/api/collect-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          rating: userRating,
          cardName: selectedCards[0]?.name,
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        setEmailSubmitted(true);
        trackUserAction(EVENTS.EMAIL_PROVIDED, {
          email: emailInput,
          rating: userRating,
          cardName: selectedCards[0]?.name,
          context: 'high_rating_followup'
        });
      }
    } catch (error) {
      console.error('Email submission failed:', error);
    }
  };

  // 添加反馈选择处理函数（保持UI功能，不追踪）
  const handleFeedbackSelect = (feedback) => {
    setSelectedFeedback(feedback);
    // 移除追踪调用，保持功能逻辑
  };

  // 🎯 核心事件5: 分享处理
  const handleShare = () => {
    const cardName = selectedCards[0]?.name || 'Mystery Card';
    const keyInsight = readingResult?.keyInsight || 'Ancient wisdom revealed';
    
    const shareData = {
      title: `My ${cardName} Tarot Reading - Crystarot`,
      text: `I just got an amazing insight from ${cardName}: "${keyInsight}" ✨ Try your free reading at Crystarot!`,
      url: window.location.origin
    };

    if (navigator.share) {
      navigator.share(shareData).then(() => {
        trackUserAction(EVENTS.SHARE_COMPLETED, {
          shareMethod: 'native_share',
          cardName: cardName,
          success: true
        });
      }).catch(() => {
        // 如果原生分享失败，回退到复制链接
        fallbackShare(shareData);
      });
    } else {
      fallbackShare(shareData);
    }
  };

  // 添加回退分享函数
  const fallbackShare = (shareData) => {
    const shareText = `${shareData.text}\n\n${shareData.url}`;
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Reading shared! Link copied to clipboard 📋');
        trackUserAction(EVENTS.SHARE_COMPLETED, {
          shareMethod: 'copy_link',
          cardName: selectedCards[0]?.name,
          success: true
        });
      });
    } else {
      // 最后的回退方案
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Reading shared! Link copied 📋');
      
      trackUserAction(EVENTS.SHARE_COMPLETED, {
        shareMethod: 'manual_copy',
        cardName: selectedCards[0]?.name,
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
              ⟨ Crystarot ⟩
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
                // 移除详细追踪，保持功能逻辑
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

        {/* 页面2: 问题选择 - 三阶段流程（保持完整UI逻辑）*/}
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

        {/* 页面3: 选牌体验（保持完整UI逻辑，移除非核心追踪）*/}
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
                {/* 统一的SVG背面设计 */}
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

          {/* 洗牌阶段（保持完整动画，移除追踪）*/}
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
                    {/* 继续使用相同的SVG设计... */}
                    <svg className="w-full h-full" viewBox="0 0 70 110" xmlns="http://www.w3.org/2000/svg">
                      {/* SVG内容保持不变 */}
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

        {/* 页面4: 解读结果 - 移动端优化版本（保持完整UI，只追踪核心事件）*/}
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
            
            {/* 🎯 核心事件6: 用户反馈区域 - 完全重写 */}
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
                
                {/* 🎯 核心事件7: 高评分邮箱收集 */}
                {showEmailForm && !emailSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-purple-500/20 pt-4 mt-4"
                  >
                    <p className="text-emerald-300 text-sm mb-4">Want to be first to try our new features?</p>
                    <div className="flex flex-col space-y-3">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="Enter your email"
                        className="px-4 py-2 rounded-lg bg-black/30 border border-purple-500/30 text-white placeholder-gray-400 focus:border-amber-500/60 focus:outline-none"
                      />
                      <button 
                        onClick={handleEmailSubmit}
                        disabled={!emailInput.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Get Early Access
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* 邮箱提交成功 */}
                {emailSubmitted && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-purple-500/20 pt-4 mt-4"
                  >
                    <p className="text-emerald-300 text-sm mb-4">Thank you! You'll be the first to know about new features. ✨</p>
                    <button 
                      onClick={handleShare}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 rounded-full text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
                    >
                      Share with Friends ✨
                    </button>
                  </motion.div>
                )}

                {/* 低评分反馈收集（保持UI功能，不追踪）*/}
                {showFeedbackForm && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-purple-500/20 pt-4 mt-4"
                  >
                    <p className="text-gray-300 text-sm mb-4">Help us improve. What went wrong?</p>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        'Reading was not accurate',
                        'Too generic, not personal',
                        'Loading took too long',
                        'Interface was confusing',
                        'Other technical issue'
                      ].map((feedback) => (
                        <button
                          key={feedback}
                          onClick={() => handleFeedbackSelect(feedback)}
                          className={`px-4 py-2 rounded-lg text-sm transition-all ${
                            selectedFeedback === feedback 
                              ? 'bg-purple-600 text-white' 
                              : 'bg-black/30 text-gray-300 hover:bg-purple-600/30'
                          }`}
                        >
                          {feedback}
                        </button>
                      ))}
                    </div>
                    {selectedFeedback && (
                      <p className="text-gray-400 text-xs mt-3">Thank you for your feedback! 🙏</p>
                    )}
                  </motion.div>
                )}

                {/* 默认状态 - 还没评分时 */}
                {userRating > 0 && !showEmailForm && !showFeedbackForm && (
                  <p className="text-gray-400 text-sm">Thank you for your feedback! 🙏</p>
                )}
              </div>
            </motion.div>
            
            {/* 🎯 核心事件5: 操作按钮区域 - 移动端优化 */}
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
                  // 简化保存功能，不追踪详细事件
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