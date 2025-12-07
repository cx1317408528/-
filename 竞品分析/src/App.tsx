import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronDown, Send, Sparkles, Loader2, User, Heart } from 'lucide-react';

// 导入AI智能体组件
const AIAgentSection = () => {
  const [messages, setMessages] = useState<any[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是陈鑫的 AI 助手。我可以回答关于陈鑫的经历、AI 产品经验、模型评测、Prompt 工程、项目作品等问题。请问有什么我可以帮助你的？',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [messages]);

  useEffect(() => {
    if (window.location.hash === '#ai-agent') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  const getUserId = () => {
    let userId = localStorage.getItem('coze_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('coze_user_id', userId);
    }
    return userId;
  };

  const handleSend = async (question?: string) => {
    const messageContent = question || input.trim();
    if (!messageContent || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const textareaElement = document.querySelector('textarea');
    if (textareaElement) {
      textareaElement.focus();
    }

    try {
      const requestBody = {
        bot_id: '7578106254300921875',
        user: getUserId(),
        query: userMessage.content,
        stream: true
      };

      const response = await fetch('https://api.coze.cn/open_api/v2/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer pat_YhFKvIfmRbsPoruKybxnwLOEb9BONwygzrmTHgcUkEA69V0tcZVdH2SgATVT0I3h`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`API 请求失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let assistantMessageId = (Date.now() + 1).toString();
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          if (trimmedLine.startsWith('data:')) {
            const dataStr = trimmedLine.slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              if (data.event === 'message') {
                const message = data.message;
                if (message.role === 'assistant' && message.type === 'answer') {
                  const contentChunk = message.content || '';
                  accumulatedContent += contentChunk;
                  if (isFirstChunk) {
                    const assistantMessage = {
                      id: assistantMessageId,
                      role: 'assistant' as const,
                      content: accumulatedContent,
                      timestamp: new Date(),
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    isFirstChunk = false;
                  } else {
                    setMessages(prev =>
                      prev.map(msg =>
                        msg.id === assistantMessageId
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      )
                    );
                  }
                }
              }
            } catch (parseError) {
              console.error('解析流式数据失败:', parseError);
            }
          }
        }
      }

      if (isFirstChunk) {
        const assistantMessage = {
          id: assistantMessageId,
          role: 'assistant' as const,
          content: '抱歉，我暂时无法回答这个问题。',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('Coze API error:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `抱歉，我遇到了一些技术问题：${error.message}。不过我可以告诉你：\n\n` +
          '• 陈鑫是一位 AI 产品经理，专注于大模型应用与智能体产品设计\n' +
          '• 他拥有 AIGC 课件生成平台的完整项目经验\n' +
          '• 熟悉 Prompt 工程，优化过 50+ 版本的 Prompt 方案\n' +
          '• 进行过多个主流大模型的评测（GPT-4、Gemini、Qwen 等）\n\n' +
          '你可以查看页面下方的详细经历了解更多信息！',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "介绍一下你的 AI 产品经验",
    "你做过哪些 Prompt 工程工作？",
    "你评测过哪些大模型？",
    "说说 AIGC 课件生成项目",
  ];

  return (
    <section id="ai-agent" className="py-20 lg:py-32 relative">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">AI 智能助手</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold">
              与 <span className="text-gradient-primary">AI 助手</span> 对话
            </h2>

            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              这里是陈鑫为个人网站构建的智能体，可以回答你关于我的经历、AI 产品、模型评测、Prompt、个人作品等问题。
            </p>
          </div>

          <div className="overflow-hidden border border-border/50 shadow-card bg-card/50 backdrop-blur-sm animate-scale-in rounded-xl">
            <div className="h-[500px] overflow-y-auto p-6 space-y-6 scroll-smooth">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} gap-4`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                      <Sparkles className="h-5 w-5" />
                    </div>
                  )}
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                    <div className={`rounded-2xl px-4 py-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 opacity-70 ${message.role === 'assistant' ? 'text-left' : 'text-right'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                  <div className="max-w-[80%]">
                    <div className="rounded-2xl px-4 py-3 bg-muted">
                      <p className="text-sm text-muted-foreground">正在思考...</p>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length === 1 && (
              <div className="px-6 pb-4">
                <p className="text-xs text-muted-foreground mb-3">💡 试试这些问题：</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSend(question)}
                      className="text-xs px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-border/50 p-4">
              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题...（按 Enter 发送，Shift+Enter 换行）"
                  className="resize-none min-h-[60px] bg-background/50 input flex-1"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="self-end bg-gradient-primary hover:opacity-90 transition-opacity rounded-full w-12 h-12 flex items-center justify-center text-white"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const sections = [
    { id: 'hero', label: '首页' },
    { id: 'ai-agent', label: 'AI 智能体' },
    { id: 'about', label: '关于我' },
    { id: 'abilities', label: '我的能力' },
    { id: 'portfolio', label: '作品集' },
    { id: 'education', label: '教育背景' },
    { id: 'experience', label: '工作经历' },
    { id: 'projects', label: '项目经历' },
    { id: 'contact', label: '联系方式' },
    { id: 'thank-you', label: '致谢' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
    } else {
      setLikes(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="navbar sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="text-xl font-bold text-gradient-primary">
              陈鑫 - AI 产品经理
            </div>
            
            {/* 桌面端导航 */}
            <div className="hidden md:flex items-center space-x-1">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {section.label}
                </a>
              ))}
            </div>
            
            {/* 移动端菜单按钮 */}
            <button
              className="md:hidden text-foreground p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* 移动端菜单 */}
        <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="flex flex-col space-y-4">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSection(section.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                {section.label}
              </a>
            ))}
          </div>
        </div>
        
        {/* 遮罩层 */}
        <div
          className={`overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      </nav>

      {/* 滚动指示器 */}
      <div className="scroll-indicator" style={{ width: `${(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%` }} />

      {/* 首页 */}
      <section id="hero" className="section hero-section flex items-center justify-center py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-6 animate-fade-in-up">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                陈鑫
                <span className="block text-xl lg:text-2xl font-medium text-primary mt-2">AI 产品经理</span>
              </h1>
              
              <div className="flex flex-wrap gap-2">
                <span className="tag">专注 AI 产品与体验设计</span>
                <span className="tag">深耕大模型与评测研究</span>
                <span className="tag">热爱构建智能体与自动化流程</span>
              </div>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                具备从 0 到 1 推动 AIGC 产品落地的能力，熟悉模型评测、流程设计与 Prompt 工程。
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-primary">📧</span>
                  <span>1317408528@qq.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary">📱</span>
                  <span>17651711813</span>
                </div>
              </div>
              
              <a href="#contact" className="btn-primary inline-block">
                联系合作
              </a>
            </div>
            
            <div className="lg:w-1/2 animate-scale-in">
              <div className="relative">
                <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-full bg-gradient-primary p-2">
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
                    <img 
                      src="https://via.placeholder.com/250" 
                      alt="陈鑫头像" 
                      className="w-56 h-56 lg:w-72 lg:h-72 rounded-full object-cover border-4 border-primary"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-accent rounded-full flex items-center justify-center animate-pulse">
                  <span className="text-xl font-bold">AI</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI 智能体 */}
      <AIAgentSection />

      {/* 关于我 */}
      <section id="about" className="section py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">关于我</h2>
            <p className="section-subtitle">了解我的优势和特点</p>
          </div>
          
          {/* 三个小标签卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { title: '学习能力强', description: '快速掌握业务逻辑与 AI 产品知识' },
              { title: '结构化思维', description: '擅长需求拆解、流程设计和方案落地' },
              { title: '跨部门协作', description: '能有效推动研发、运营等多方对齐' },
            ].map((card, index) => (
              <div 
                key={index} 
                className="card hover-lift animate-fade-in-up delay-100"
              >
                <h3 className="text-xl font-semibold mb-2">{card.title}</h3>
                <p className="text-muted-foreground">{card.description}</p>
              </div>
            ))}
          </div>
          
          {/* 我的优势 */}
          <div className="card animate-fade-in-up delay-200">
            <h3 className="text-2xl font-semibold mb-6">我的优势</h3>
            <ul className="space-y-3">
              <li className="list-item">参与 0→1 AIGC 项目落地，熟悉模型评测与 Prompt 工程</li>
              <li className="list-item">拥有完整调研、需求文档、MVP 设计经验</li>
              <li className="list-item">熟悉 AI 产品工作流、内容生成质量优化</li>
              <li className="list-item">逻辑清晰，具备明确的表达与协作能力</li>
              <li className="list-item">持续关注 AI 行业动态，快速学习新技术与方法论</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 我的能力 */}
      <section id="abilities" className="section py-20 lg:py-32 bg-card/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">我的能力</h2>
            <p className="section-subtitle">产品能力与 AI 技术理解</p>
          </div>
          
          {/* 第一行：产品能力和 AI 技术理解 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* 产品能力 */}
            <div className="card ability-card animate-fade-in-up delay-100">
              <h3 className="text-2xl font-semibold mb-6">产品能力</h3>
              <ul className="space-y-3">
                <li className="list-item">用户调研与需求分析</li>
                <li className="list-item">MVP & PRD 设计</li>
                <li className="list-item">竞品分析框架</li>
                <li className="list-item">流程拆解与体验优化</li>
                <li className="list-item">指标体系与数据复盘</li>
              </ul>
            </div>
            
            {/* AI 技术理解 */}
            <div className="card ability-card animate-fade-in-up delay-200">
              <h3 className="text-2xl font-semibold mb-6">AI 技术理解</h3>
              <ul className="space-y-3">
                <li className="list-item">主流大模型能力与局限（GPT、Gemini、Qwen、Kimi 等）</li>
                <li className="list-item">模型评测方法论（性能、成本、响应度、中文能力等）</li>
                <li className="list-item">Prompt 设计与提示词模板</li>
                <li className="list-item">Agent / RAG 基础框架理解</li>
                <li className="list-item">多模型对齐与调用策略</li>
              </ul>
            </div>
          </div>
          
          {/* 第二行：工具 & 软件 */}
          <div className="card ability-card animate-fade-in-up delay-300">
            <h3 className="text-2xl font-semibold mb-6">工具 & 软件</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {[
                'Figma', 'Miro', '飞书', '墨刀', 
                'Coze', 'Dify', 'Notion', 'Excel / PowerPoint'
              ].map((tool, index) => (
                <div key={index} className="tool-icon flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <span className="text-primary">📱</span>
                  </div>
                  <span className="text-sm text-center">{tool}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 作品集 */}
      <section id="portfolio" className="section py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">作品集</h2>
            <p className="section-subtitle">个人作品｜工作复盘｜模型评测｜知识库</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 个人作品 */}
            <div className="card project-card animate-fade-in-up delay-100">
              <h3 className="text-2xl font-semibold mb-6">个人作品</h3>
              <ul className="space-y-4">
                <li>
                  <a href="https://ucnx21w5u1i8.feishu.cn/drive/folder/SLX9fLSznlDCttden2uccFAMnib" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Coze Agents</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="https://ucnx21w5u1i8.feishu.cn/drive/folder/GdP6fgQEEl54oxdZxrycG0yxnvH" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Dify Agents</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
              </ul>
            </div>
            
            {/* 工作复盘 */}
            <div className="card project-card animate-fade-in-up delay-200">
              <h3 className="text-2xl font-semibold mb-6">工作复盘</h3>
              <ul className="space-y-4">
                <li>
                  <a href="https://ucnx21w5u1i8.feishu.cn/drive/folder/OUsAfPE14lyVkydGnWwcWKTRnVb" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>竞品分析</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>PRD 文档</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>流程拆解</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
              </ul>
            </div>
            
            {/* 模型评测 */}
            <div className="card project-card animate-fade-in-up delay-300">
              <h3 className="text-2xl font-semibold mb-6">模型评测</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Gemini 3</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>GPT-5.1</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Grok 4.1</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Qwen 3</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Deep seek-V3.2</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
              </ul>
            </div>
            
            {/* 知识库 */}
            <div className="card project-card animate-fade-in-up delay-400">
              <h3 className="text-2xl font-semibold mb-6">知识库</h3>
              <ul className="space-y-4">
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>RAG</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>Agent</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
                <li>
                  <a href="#" className="flex items-center justify-between hover:text-primary transition-colors">
                    <span>大模型架构</span>
                    <ChevronDown className="h-4 w-4 transform rotate-[-90deg]" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 教育背景 */}
      <section id="education" className="section py-20 lg:py-32 bg-card/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">教育背景</h2>
            <p className="section-subtitle">学校与荣誉展示</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <div className="card education-card animate-fade-in-up delay-100">
              <h3 className="text-2xl font-semibold mb-6">东南大学成贤学院</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-primary font-medium">本科</span>
                  <span className="text-muted-foreground">2021–2025</span>
                </div>
                <p>专业方向：AI 产品（求职方向）</p>
              </div>
            </div>
            
            <div className="mt-8 card education-card animate-fade-in-up delay-200">
              <h3 className="text-2xl font-semibold mb-6">荣誉展示</h3>
              <ul className="space-y-3">
                <li className="list-item">江苏省高等数学竞赛一等奖</li>
                <li className="list-item">校级辩论赛冠军队伍+最佳辩手</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 工作经历 */}
      <section id="experience" className="section py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">工作经历</h2>
            <p className="section-subtitle">职业发展历程</p>
          </div>
          
          <div className="max-w-3xl mx-auto timeline">
            <div className="pl-8 animate-fade-in-up delay-100">
              <div className="mb-12">
                <div className="absolute left-0 w-4 h-4 bg-primary rounded-full -ml-2 mt-2"></div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">AI 产品经理</h3>
                  <span className="text-muted-foreground">2024.10–2025.04</span>
                </div>
                <p className="text-primary mb-3">南京贝湾信息科技</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 调研、模型评测、Prompt 工程、MVP 落地</li>
                </ul>
              </div>
              
              <div>
                <div className="absolute left-0 w-4 h-4 bg-primary rounded-full -ml-2 mt-2"></div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xl font-semibold">产品助理</h3>
                  <span className="text-muted-foreground">2024.06–2024.10</span>
                </div>
                <p className="text-primary mb-3">南京湖畔教育</p>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• 调研、流程重组、数据复盘、提升留存率</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 项目经历 */}
      <section id="projects" className="section py-20 lg:py-32 bg-card/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">项目经历</h2>
            <p className="section-subtitle">主要项目成果</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AIGC 课件生成平台 */}
            <div className="card project-card animate-fade-in-up delay-100">
              <h3 className="text-2xl font-semibold mb-6">AIGC 课件生成平台</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-primary mb-2">背景</h4>
                  <p className="text-muted-foreground">解决教育行业课件制作效率低的问题，利用 AI 技术自动生成高质量课件。</p>
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-2">内容</h4>
                  <p className="text-muted-foreground">负责产品调研、需求分析、PRD 设计、模型评测、Prompt 工程优化等工作。</p>
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-2">结果</h4>
                  <p className="text-muted-foreground">成功落地 MVP 版本，课件生成效率提升 80%，获得用户一致好评。</p>
                </div>
              </div>
            </div>
            
            {/* 学习社区流程优化项目 */}
            <div className="card project-card animate-fade-in-up delay-200">
              <h3 className="text-2xl font-semibold mb-6">学习社区流程优化项目</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-primary mb-2">背景</h4>
                  <p className="text-muted-foreground">优化学习社区的用户注册、内容浏览、互动等流程，提升用户体验和留存率。</p>
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-2">内容</h4>
                  <p className="text-muted-foreground">进行用户调研、流程拆解、体验优化、数据复盘等工作。</p>
                </div>
                <div>
                  <h4 className="font-medium text-primary mb-2">结果</h4>
                  <p className="text-muted-foreground">用户注册转化率提升 30%，留存率提升 25%，社区活跃度显著提高。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 联系方式 */}
      <section id="contact" className="section py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="section-title">联系方式</h2>
            <p className="section-subtitle">欢迎联系我洽谈合作 / 交流 AI 产品</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card contact-card animate-fade-in-up delay-100">
              <h3 className="text-xl font-semibold mb-4">📧 邮箱</h3>
              <p>1317408528@qq.com</p>
            </div>
            
            <div className="card contact-card animate-fade-in-up delay-200">
              <h3 className="text-xl font-semibold mb-4">📱 电话</h3>
              <p>17651711813</p>
            </div>
            
            <div className="card contact-card animate-fade-in-up delay-300">
              <h3 className="text-xl font-semibold mb-4">🌐 个人网站</h3>
              <a href="https://www.woshipm.com/u/1665592" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                人人都是产品经理主页
              </a>
            </div>
          </div>
          
          <div className="text-center animate-fade-in-up delay-400">
            <p className="text-xl font-medium">欢迎联系我洽谈合作 / 交流 AI 产品</p>
          </div>
        </div>
      </section>

      {/* 致谢 */}
      <section id="thank-you" className="section py-20 lg:py-32 bg-card/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-8 animate-fade-in-up">
            <h2 className="section-title">致谢</h2>
            <p className="text-xl leading-relaxed">
              感谢你浏览到这里，期待和你一起创造下一款优秀的 AI 产品。
            </p>
            
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleLike}
                className={`like-button ${isLiked ? 'liked' : ''}`}
              >
                <Heart 
                  className={`h-12 w-12 ${isLiked ? 'fill-current' : ''}`} 
                  fill={isLiked ? '#ec4899' : 'none'}
                />
              </button>
              <p className="text-xl font-semibold">{likes}</p>
              <p className="text-muted-foreground">点赞支持</p>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="py-8 bg-background border-t border-border">
        <div className="container mx-auto px-4 lg:px-8 text-center text-muted-foreground">
          <p>© 2025 陈鑫 - AI 产品经理</p>
        </div>
      </footer>
    </div>
  );
}

export default App;