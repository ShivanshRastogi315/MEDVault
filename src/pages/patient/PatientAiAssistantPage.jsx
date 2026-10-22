import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { sendChatMessage } from "../../services/geminiService";
import {
  Bot,
  User,
  Send,
  Trash2,
  Sparkles,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

const INITIAL_WELCOME =
  "Hello! I'm your MedVault AI Assistant. Ask me anything — from first aid steps and general health questions to navigating your medical records and appointments.";

const SUGGESTED_QUESTIONS = [
  "What should I do if I cut myself?",
  "First aid steps for minor burns",
  "How can I view my medical reports?",
  "Where can I find my active prescriptions?",
  "How does emergency access work?",
  "Tips for managing headaches",
];

export default function PatientAiAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: "welcome-msg",
      sender: "bot",
      text: INITIAL_WELCOME,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLiveGemini, setIsLiveGemini] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat container
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const message = (textToSend || inputMessage).trim();
    if (!message || loading) return;

    setError(null);
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: message,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      // Format history for context
      const history = messages.map((m) => ({
        sender: m.sender,
        text: m.text,
      }));

      const res = await sendChatMessage(message, history);

      if (res.isLiveGemini !== undefined) {
        setIsLiveGemini(res.isLiveGemini);
      }

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("[PatientAiAssistant] Error generating response:", err);
      setError("Unable to retrieve an AI response at this moment. Please check your connection and try again.");
    } finally {
      setLoading(false);
      // Refocus input field
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text: INITIAL_WELCOME,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setError(null);
    setInputMessage("");
  };

  /**
   * Simple markdown formatter for clean bullet points, bolding, and code snippets
   */
  const renderFormattedText = (text) => {
    if (!text) return null;
    const lines = text.split("\n");

    return lines.map((line, idx) => {
      // Bullet items
      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ");
      const isNumber = /^\d+\.\s/.test(line.trim());
      const cleanLine = isBullet
        ? line.trim().substring(2)
        : isNumber
        ? line.trim().replace(/^\d+\.\s/, "")
        : line;

      // Split bold markers **text**
      const parts = cleanLine.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={pIdx}
              className="bg-slate-100 text-teal-700 px-1.5 py-0.5 rounded font-mono text-xs border border-slate-200"
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs sm:text-sm text-slate-700 my-0.5">
            {formattedParts}
          </li>
        );
      }
      if (isNumber) {
        return (
          <li key={idx} className="ml-5 list-decimal text-xs sm:text-sm text-slate-700 my-0.5">
            {formattedParts}
          </li>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-0.5">
          {formattedParts}
        </p>
      );
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-6.5rem)] pb-2 space-y-3">
      {/* Top Header Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/25 shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                MedVault AI Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                {isLiveGemini ? "Gemini AI Active" : "Smart AI Active"}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Your intelligent assistant for first aid advice, everyday health questions, and portal navigation.
            </p>
          </div>
        </div>

        {/* Clear Chat Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleClearChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Clear Chat</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pl-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((question, i) => (
          <button
            key={i}
            onClick={() => handleSend(question)}
            disabled={loading}
            className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border border-slate-200 hover:border-teal-300 transition-all font-medium shadow-2xs disabled:opacity-50 cursor-pointer"
          >
            {question}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-2xs p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${
                isUser ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold shadow-2xs ${
                  isUser
                    ? "bg-blue-600 text-white"
                    : "bg-gradient-to-tr from-teal-600 to-blue-600 text-white"
                }`}
              >
                {isUser ? (
                  user?.fullName?.[0] || user?.name?.[0] || <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div>
                <div
                  className={`px-4 py-3 rounded-2xl text-xs sm:text-sm shadow-2xs ${
                    isUser
                      ? "bg-blue-600 text-white rounded-tr-xs"
                      : "bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div className="space-y-1">{renderFormattedText(msg.text)}</div>
                  )}
                </div>
                <span
                  className={`text-[10px] text-slate-400 mt-1 block px-1 ${
                    isUser ? "text-right" : "text-left"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 max-w-[80%] mr-auto items-end">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-xs px-4 py-3 flex items-center gap-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" />
              <span className="text-xs text-slate-400 font-medium ml-1.5">Generating response...</span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleSend()}
              className="text-xs font-semibold text-rose-700 underline hover:text-rose-900 ml-3 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box & Disclaimer */}
      <div className="shrink-0 space-y-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-white p-2 border border-slate-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="Ask any question — first aid, health & wellness, or MedVault portal..."
            className="flex-1 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-40 text-white transition-colors shrink-0 shadow-2xs cursor-pointer"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Medical & Privacy Safety Disclaimer */}
        <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="truncate">
            General guidance only. Not medical advice. In life-threatening emergencies, call 911 or your local emergency number immediately.
          </span>
        </div>
      </div>
    </div>
  );
}
