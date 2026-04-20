'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, AlertCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface HydrationChatProps {
  initialPrompt: string;
  onComplete: (finalPrompt: string) => void;
  onCancel: () => void;
}

export function HydrationChat({ initialPrompt, onComplete, onCancel }: HydrationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize with the first analysis
  useEffect(() => {
    const startHydration = async () => {
      setIsAnalyzing(true);
      try {
        const res = await fetch('/api/bounty/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: initialPrompt }),
        });
        const data = await res.json();
        
        if (data.isReady) {
          setIsReady(true);
          setMessages([{ role: 'user', content: initialPrompt }]);
        } else {
          setMessages([
            { role: 'user', content: initialPrompt },
            { role: 'assistant', content: data.reply }
          ]);
        }
      } catch (err) {
        setError('Failed to reach Prompt Architect');
      } finally {
        setIsAnalyzing(false);
      }
    };
    startHydration();
  }, [initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue || isAnalyzing) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    setIsAnalyzing(true);
    setError(null);

    // Merge history into a single conceptual prompt for the Architect to evaluate
    const consolidatedPrompt = newMessages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');

    try {
      const res = await fetch('/api/bounty/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: consolidatedPrompt,
          history: messages 
        }),
      });
      const data = await res.json();

      if (data.isReady) {
        setIsReady(true);
      } else {
        setMessages([...newMessages, { role: 'assistant' as const, content: data.reply }]);
      }
    } catch (err) {
      setError('Connection interrupted. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto w-full"
    >
      <Card className="bg-[#191c22] border-[#3b4b37]/20 overflow-hidden flex flex-col min-h-[500px] relative" style={{ borderRadius: '0px' }}>
        {/* Header - Architect Agent Status */}
        <div className="p-4 border-b border-[#3b4b37]/30 bg-[#0b0e14]/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#00ff41]/10 border border-[#00ff41]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#00ff41] text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                smart_toy
              </span>
            </div>
            <div>
              <h3 className="text-sm font-['Space_Grotesk'] font-bold tracking-tight uppercase">Architect Agent</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#00ff41] animate-pulse"></span>
                <p className="text-[10px] font-mono text-[#00ff41] uppercase tracking-widest">STATUS: ACTIVE</p>
              </div>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-[10px] font-['Space_Grotesk'] font-bold text-[#84967e] hover:text-[#e1e2eb] transition-colors uppercase tracking-widest"
          >
            ABORT
          </button>
        </div>

        {/* Chat Area - Terminal Interface */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-sm bg-[#0b0e14]"
        >
          {/* System Init */}
          {messages.length === 0 && !isAnalyzing && (
            <div className="text-[#84967e] text-xs mb-8 border-b border-[#3b4b37]/30 pb-4 space-y-1">
              <p>{">"} INITIATING_SESSION_ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</p>
              <p>{">"} ARCHITECT_MODEL: HYDRA-INSTRUCT</p>
              <p>{">"} LOAD_PARAMS: STRICT_CONSISTENCY=TRUE, LATENCY_BUDGET=LOW</p>
              <p>{">"} AWAITING_INPUT...</p>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 ${
                m.role === 'user' 
                  ? 'bg-[#1d2026] border border-[#3b4b37]/30 text-[#e1e2eb]' 
                  : 'bg-[#191c22] border border-[#00ff41]/10 text-[#e1e2eb]/90'
              }`}
              style={{ 
                borderRadius: '0px',
                position: 'relative'
              }}>
                {/* Technical Trace for assistant messages */}
                {m.role === 'assistant' && (
                  <div className="absolute left-[-16px] top-4 bottom-4 w-px bg-[#00ff41]/30"></div>
                )}
                {/* Role Header */}
                <div className="flex justify-between items-center mb-2 border-b border-[#3b4b37]/30 pb-2">
                  <span className="text-[10px] font-mono text-[#b9ccb2] uppercase">
                    {m.role === 'user' ? 'CTO_USER [AUTHORITY: HIGH]' : 'ARCHITECT_AGENT'}
                  </span>
                  <span className="text-[10px] text-[#84967e]">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            </motion.div>
          ))}

          {isAnalyzing && (
            <div className="flex justify-start">
               <div className="bg-[#191c22] border border-[#00ff41]/10 p-4 flex items-center gap-3" style={{ borderRadius: '0px' }}>
                  {/* Typing Indicator */}
                  <div className="flex items-center text-[#00ff41] text-xs animate-pulse">
                    <span className="mr-2">{" >"}</span>
                    <span className="bg-[#00ff41] w-2 h-4 block"></span>
                  </div>
               </div>
            </div>
          )}

          {error && (
            <div className="p-3 flex items-center gap-2 text-[#ffb4ab] text-xs border border-[#ffb4ab]/20 bg-[#93000a]/10" style={{ borderRadius: '0px' }}>
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Ready-to-dispatch confirmation banner */}
        {isReady && (
          <div className="px-6 py-4 bg-[#00ff41]/5 border-y border-[#00ff41]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 bg-[#00ff41] animate-pulse" />
              <div>
                <div className="font-['Space_Grotesk'] font-bold text-[#00ff41] text-[11px] uppercase tracking-widest">PROMPT CLEARED FOR DISPATCH</div>
                <div className="font-mono text-[9px] text-[#84967e] mt-0.5">Architect verified sufficient context · ready to run discovery</div>
              </div>
            </div>
            <button
              onClick={() => onComplete(messages.map(m => m.content).join('\n\n'))}
              className="px-5 py-2 bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_16px_rgba(0,255,65,0.3)]"
              style={{ borderRadius: '0px' }}
            >
              DISPATCH NOW
            </button>
          </div>
        )}

        {/* Info Banner - Hunting Readiness Vectors */}
        {!isReady && (
        <div className="px-6 py-3 bg-[#0b0e14] border-y border-[#3b4b37]/20 flex items-center justify-between">
           <div className="flex items-center gap-4">
             <p className="text-[10px] font-mono text-[#84967e] uppercase tracking-tight">
               Refining constraints for the Billion Dollar Build...
             </p>
             <div className="flex items-center gap-2">
               <span className="text-[9px] font-mono text-[#b9ccb2]">CLARITY:</span>
               <div className="w-12 h-1 bg-[#272a31]">
                 <div className="h-full bg-[#feb700]" style={{ width: '65%' }}></div>
               </div>
             </div>
           </div>
           <button
             onClick={() => onComplete(messages.map(m => m.content).join('\n\n'))}
             className="text-[10px] font-['Space_Grotesk'] font-bold text-[#00ff41] hover:text-[#72ff70] transition-colors uppercase tracking-widest"
           >
             Override & Dispatch
           </button>
        </div>
        )}

        {/* Input Area - Terminal Command Line */}
        <div className="p-4 bg-[#0b0e14]">
          <div className="relative bg-[#191c22] border border-[#3b4b37]/20 p-1 focus-within:border-[#00ff41]/30 transition-colors" style={{ borderRadius: '0px' }}>
            <div className="flex items-start p-2">
              <span className="font-mono text-[#00ff41] mt-1 mr-2 text-sm">{"\u003E"}</span>
              <Input
                placeholder="Define constraints or paste architectural specifications..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-transparent border-none outline-none font-mono text-sm text-[#e1e2eb] placeholder-[#84967e]/50 focus:ring-0 w-full p-0 h-auto"
              />
            </div>
            <div className="flex justify-between items-center p-2 border-t border-[#3b4b37]/20">
              <div className="flex gap-2">
                <button className="px-2 py-1 text-[10px] font-mono text-[#84967e] hover:text-[#e1e2eb] bg-[#272a31] border border-[#3b4b37] hover:border-[#84967e] transition-colors" style={{ borderRadius: '0px' }}>
                  /upload_spec
                </button>
                <button className="px-2 py-1 text-[10px] font-mono text-[#84967e] hover:text-[#e1e2eb] bg-[#272a31] border border-[#3b4b37] hover:border-[#84967e] transition-colors" style={{ borderRadius: '0px' }}>
                  /diagram
                </button>
              </div>
              <Button 
                size="sm"
                disabled={isAnalyzing || !inputValue}
                onClick={handleSend}
                className="bg-[#00ff41] hover:bg-[#72ff70] text-[#003907] font-['Space_Grotesk'] font-bold h-8 px-4 shadow-[0_0_10px_rgba(0,255,65,0.2)] transition-all"
                style={{ borderRadius: '0px' }}
              >
                EXECUTE <span className="material-symbols-outlined text-[14px] ml-1">keyboard_return</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Ambient Glow Effect */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#00ff41]/5 blur-[100px] rounded-full z-0"></div>
      </Card>
    </motion.div>
  );
}
