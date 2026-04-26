import { useState, useEffect, useRef, useCallback } from 'react';
import { HiOutlineSparkles } from 'react-icons/hi2';
import { IoClose } from 'react-icons/io5';
import ReportAIChatPanel from './ReportAIChatPanel';
import { useReportAIChat } from './useReportAIChat';
import { t } from '../../../../i18n';


interface ReportAIAssistantProps {
  stepTitle?: string;
}

function ReportAIAssistant({ stepTitle }: ReportAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, isLoading, sendMessage } = useReportAIChat();

  const clearTimers = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearTimers();
    setShowGreeting(false);

    showTimerRef.current = setTimeout(() => {
      setShowGreeting(true);
      hideTimerRef.current = setTimeout(() => {
        setShowGreeting(false);
      }, 5000);
    }, 1500);

    return clearTimers;
  }, [stepTitle, clearTimers]);

  const dismissGreeting = useCallback(() => {
    clearTimers();
    setShowGreeting(false);
  }, [clearTimers]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const greetingText = stepTitle ? (
    <>{t("hello-i-can-answer-any-question-you-may-have-regarding")}{' '}
      <strong>{stepTitle}</strong>.
    </>
  ) : (
    <>{t("hello-i-can-answer-any-question-you-may-have-regarding-report-generation")}</>
  );

  return (
    <>
      {/* Greeting bubble */}
      {showGreeting && !isOpen && (
        <div
          className="fixed bottom-[7.5rem] right-20 lg:bottom-[7.5rem] lg:right-[5.5rem] z-50
            bg-white rounded-xl shadow-lg p-3 text-sm text-gray-700 border border-gray-200
            max-w-[260px] animate-fade-in-up"
        >
          <button
            onClick={dismissGreeting}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-200 hover:bg-gray-300
              rounded-full flex items-center justify-center transition-colors"
            aria-label={t("dismiss-greeting")}
          >
            <IoClose className="w-3 h-3 text-gray-600" />
          </button>
          <p>{greetingText}</p>
          {/* Right-pointing caret/arrow */}
          <div
            className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0
              border-t-[6px] border-t-transparent
              border-b-[6px] border-b-transparent
              border-l-[8px] border-l-white"
          />
          <div
            className="absolute top-1/2 -right-[9px] -translate-y-1/2 w-0 h-0
              border-t-[6px] border-t-transparent
              border-b-[6px] border-b-transparent
              border-l-[8px] border-l-gray-200 -z-10"
          />
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={toggleOpen}
        className={`fixed bottom-24 right-4 lg:bottom-24 lg:right-6
          bg-[#6366F1] w-14 h-14 rounded-full shadow-xl
          flex items-center justify-center
          transition-all duration-300 hover:scale-110 hover:brightness-110 z-50
          ${isOpen ? 'opacity-90 pointer-events-none' : 'opacity-100'}`}
        aria-label={t("open-ai-assistant")}
      >
        <HiOutlineSparkles className="text-white w-7 h-7" />
      </button>

      {/* Chat panel */}
      <ReportAIChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={sendMessage}
      />
    </>
  );
}

export default ReportAIAssistant;
