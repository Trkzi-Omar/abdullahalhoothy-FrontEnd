import { useEffect, useRef, useState } from 'react';
import { HiArrowRight, HiX } from 'react-icons/hi';
import Loader from '../../../Loader/Loader';

interface ReportAIChatPanelProps {
  messages: Array<{
    content: string;
    isUser: boolean;
    isBlocked?: boolean;
    timestamp: string;
  }>;
  isLoading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (message: string) => void;
}

function ReportAIChatPanel({
  messages,
  isLoading,
  isOpen,
  onClose,
  onSendMessage,
}: ReportAIChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 1 || isLoading) return;
    onSendMessage(input);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = '40px';
    }
  };

  const renderMessage = (
    message: { content: string; isUser: boolean; isBlocked?: boolean; timestamp: string },
    index: number
  ) => {
    const isBot = !message.isUser;
    const isLastMessage = index === messages.length - 1;

    let bubbleClass: string;
    if (message.isBlocked) {
      bubbleClass =
        'bg-amber-50 rounded-2xl p-4 rounded-tl-none border border-amber-200 text-amber-900';
    } else if (isBot) {
      bubbleClass = 'bg-gray-100 rounded-2xl p-4 rounded-tl-none border border-gray-200';
    } else {
      bubbleClass = 'bg-gem-gradient text-white rounded-2xl p-4 rounded-tr-none';
    }

    return (
      <div
        key={index}
        className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 ${isLastMessage ? 'animate-fade-in-up' : ''}`}
      >
        <div className={`${bubbleClass} max-w-[85%]`}>
          <div className="whitespace-pre-wrap break-words overflow-wrap break-word">
            {message.content}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`fixed bottom-40 right-4 lg:bottom-40 lg:right-6
        lg:w-[400px] w-[95vw] max-h-[70vh] bg-white rounded-2xl shadow-xl
        transform-gpu transition-all duration-500 ease-out z-20
        ${isOpen ? '-translate-x-0 scale-100 opacity-100' : '-translate-x-1/4 scale-95 opacity-0 pointer-events-none'}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gem-gradient-animated bg-200% animate-gradient-shift p-4 rounded-t-2xl">
        <h2 className="text-gray-100 font-semibold">AI Assistant</h2>
        <button
          onClick={onClose}
          className="text-gray-100 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="p-4 space-y-4 min-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{ maxHeight: 'calc(70vh - 140px)' }}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-gray-100 rounded-2xl p-4 rounded-tl-none border border-gray-200">
              <Loader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex items-center overflow-hidden">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 p-2 border-none focus:ring-0 focus:outline-none resize-none min-h-[40px] h-[40px] max-h-24 leading-6 overflow-y-auto scrollbar-hide"
            onInput={e => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = '40px';
              target.style.height = `${Math.min(target.scrollHeight, 96)}px`;
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            disabled={isLoading}
            rows={1}
          />
          <button
            type="submit"
            disabled={input.trim().length < 1 || isLoading}
            className={`flex-shrink-0 p-2 ${
              input.trim().length < 1 || isLoading
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gem-green hover:text-gem-green/80 transition-colors'
            }`}
            aria-label="Send message"
          >
            <HiArrowRight className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ReportAIChatPanel;
