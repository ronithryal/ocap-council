'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles, AlertCircle, Zap, Search } from 'lucide-react';

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
          onComplete(initialPrompt);
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

    const newMessages = [...messages, { role: 'user', content: inputValue }];
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
        // Final polish: let the architect finalize the Brockman prompt
        onComplete(consolidatedPrompt);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
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
      className="max-w-3xl mx-auto w-full"
    >
      <Card className="glass-card border-blue-500/30 overflow-hidden flex flex-col min-h-[500px] shadow-[0_0_50px_rgba(37,99,235,0.1)]">
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Sparkles className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Council Hydration</h3>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">Architect Active</p>
            </div>
          </div>
          <button 
            onClick={onCancel}
            className="text-[10px] font-bold text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest"
          >
            Cancel
          </button>
        </div>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className="flex-1 p-6 overflow-y-auto space-y-6 font-mono text-sm custom-scrollbar"
        >
          {messages.length === 0 && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="animate-pulse flex flex-col items-center">
                <Search className="h-8 w-8 text-blue-500/30 mb-2" />
                <p className="text-white/40">Initializing hydration sequence...</p>
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-2xl ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white shadow-lg rounded-tr-none' 
                  : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
              }`}>
                {m.content}
              </div>
            </motion.div>
          ))}

          {isAnalyzing && (
            <div className="flex justify-start">
               <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-bounce" />
                  </div>
               </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400 text-xs">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="px-6 py-2 bg-blue-500/5 border-y border-blue-500/10 flex items-center justify-between">
           <p className="text-[10px] text-blue-400/60 font-mono uppercase tracking-tighter">
             Refining your request for the Billion Dollar Build...
           </p>
           <button 
            onClick={() => onComplete(messages.map(m => m.content).join('\n\n'))}
            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase underline underline-offset-4"
           >
             Override & Dispatch
           </button>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-black/40 backdrop-blur-xl">
          <div className="relative">
            <Input 
              placeholder="Provide more context..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="bg-white/5 border-white/10 h-12 pr-12 focus:border-blue-500/50 transition-all font-mono"
            />
            <Button 
              size="icon"
              disabled={isAnalyzing || !inputValue}
              onClick={handleSend}
              className="absolute right-1 top-1 h-10 w-10 bg-blue-600 hover:bg-blue-700 transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
