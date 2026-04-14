"use client";
import { useEffect, useRef, useCallback, useMemo } from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  MonitorIcon,
  SendIcon,
  XIcon,
  LoaderIcon,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as React from "react";

/** Shape from favicon-extractor — all string fields may be null */
interface SourceItem {
  id: number;
  hostname: string | null;
  url: string;
  favicon: string | null;
}
import { AnimatedTooltip } from "./animated-tooltip";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Number.POSITIVE_INFINITY)
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
  icon: React.ReactNode;
  label: string;
  description: string;
  prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
  showRing?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, showRing = true, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false);

    return (
      <div className={cn("relative", containerClassName)}>
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showRing
              ? "focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              : "",
            className
          )}
          ref={ref}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {showRing && isFocused && (
          <motion.span
            className="absolute inset-0 rounded-md pointer-events-none ring-2 ring-offset-0 ring-violet-500/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

/** Normalised API response from /api/chat */
interface ApiChatResponse {
  text: string;
  citations: string[];
  icons: Array<{ hostname: string; url: string; favicon: string | null; success: boolean }>;
  provider: string;
  timestamp: string;
  error?: string;
}

export function AnimatedAIChat() {
  const [AIProvider, setAIProvider] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 60,
    maxHeight: 200,
  });
  const [inputFocused, setInputFocused] = useState(false);
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const [sourcesMap, setSourcesMap] = useState<SourceItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const commandSuggestions: CommandSuggestion[] = useMemo(
    () => [
      {
        icon: <ImageIcon className="w-4 h-4" />,
        label: "Clone UI",
        description: "Generate a UI from a screenshot",
        prefix: "/clone",
      },
      {
        icon: <MonitorIcon className="w-4 h-4" />,
        label: "Create Page",
        description: "Generate a new web page",
        prefix: "/page",
      },
      {
        icon: <Sparkles className="w-4 h-4" />,
        label: "Improve",
        description: "Improve existing UI design",
        prefix: "/improve",
      },
    ],
    []
  );

  useEffect(() => {
    const provider =
      typeof window !== "undefined" ? localStorage.getItem("aiProvider") : null;
    setAIProvider(provider);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (value.startsWith("/") && !value.includes(" ")) {
      setShowCommandPalette(true);

      const matchingSuggestionIndex = commandSuggestions.findIndex((cmd) =>
        cmd.prefix.startsWith(value)
      );

      if (matchingSuggestionIndex >= 0) {
        setActiveSuggestion(matchingSuggestionIndex);
      } else {
        setActiveSuggestion(-1);
      }
    } else {
      setShowCommandPalette(false);
    }
  }, [value, commandSuggestions]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (activeSuggestion >= 0) {
          const selectedCommand = commandSuggestions[activeSuggestion];
          setValue(selectedCommand.prefix + " ");
          setShowCommandPalette(false);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandPalette(false);
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        handleSendMessage();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!value.trim()) return;

    const userText = value.trim();
    setIsTyping(true);
    setValue("");
    adjustHeight(true);

    // Optimistically add the user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const provider =
        typeof window !== "undefined"
          ? localStorage.getItem("aiProvider") || "Perplexity"
          : "Perplexity";
      const apiKey =
        typeof window !== "undefined" ? localStorage.getItem("aiApiKey") : null;

      if (!apiKey) {
        alert("Please configure your API key in settings first.");
        setIsTyping(false);
        return;
      }

      // Build history for multi-turn context
      const history = messages.map((m) => ({
        role: m.role === "assistant" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          provider,
          apiKey,
          messages: history,
        }),
      });

      const data: ApiChatResponse = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `API request failed: ${response.status}`);
      }

      // Update sources (only Perplexity returns citations/icons)
      if (data.icons && data.icons.length > 0) {
        const sources: SourceItem[] = data.icons.map((icon, index) => ({
          id: index,
          hostname: icon.hostname ?? null,
          url: icon.url,
          favicon: icon.favicon ?? null,
        }));
        setSourcesMap(sources);
      } else {
        setSourcesMap([]);
      }

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message as assistant bubble
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: `⚠️ Error: ${
            error instanceof Error ? error.message : "Failed to send message"
          }`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCommand = commandSuggestions[index];
    setValue(selectedCommand.prefix + " ");
    setShowCommandPalette(false);
  };

  return (
    <div className="w-full flex flex-col items-center bg-slate-100 dark:bg-[#0d0f14] px-6 py-10 relative">
      {/* Ambient background blobs - fixed so they stay visible while scrolling */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/15 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-fuchsia-500/10 dark:bg-fuchsia-500/10 rounded-full mix-blend-normal filter blur-[96px] animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-2xl mx-auto relative flex flex-col h-full">
        <motion.div
          className="relative z-10 flex flex-col gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <div className="text-center space-y-2 mb-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block"
            >
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white/90 pb-1">
                How can I help today?
              </h1>
              <motion.div
                className="h-px bg-gradient-to-r from-transparent via-violet-400/50 dark:via-violet-400/30 to-transparent"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              />
            </motion.div>
            <motion.p
              className="text-sm text-neutral-500 dark:text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {AIProvider
                ? `Chatting with ${AIProvider}`
                : "Type a command or ask a question"}
            </motion.p>
          </div>

          {/* Chat History */}
          {messages.length > 0 && (
            <motion.div
              className="flex flex-col gap-3 pb-48"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {message.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center mr-2 mt-1 bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold">
                      AI
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-violet-600 text-white dark:bg-violet-500 dark:text-white rounded-br-sm shadow-lg shadow-violet-500/20"
                        : "bg-white text-neutral-800 dark:bg-white/[0.07] dark:text-white/90 border border-neutral-200/80 dark:border-white/[0.08] rounded-bl-sm shadow-sm"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <div className="mt-2 flex items-center gap-2 text-[10px] opacity-60">
                      <span>
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {message.role !== "user" && sourcesMap.length > 0 && (
                        <div className="flex items-center">
                          <AnimatedTooltip items={sourcesMap} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator inline in chat */}
              {isTyping && (
                <motion.div
                  className="flex justify-start items-center gap-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-xs font-bold">
                    AI
                  </div>
                  <div className="bg-white dark:bg-white/[0.07] border border-neutral-200/80 dark:border-white/[0.08] rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                    <span className="text-sm text-neutral-500 dark:text-white/60">
                      Thinking
                    </span>
                    <TypingDots />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </motion.div>
          )}

          {/* Input area — sticky at the bottom of the viewport */}
          <motion.div
            className="sticky bottom-4 z-20 relative backdrop-blur-xl bg-white/90 dark:bg-[#0d0f14]/90 rounded-2xl border border-neutral-200 dark:border-white/[0.08] shadow-xl dark:shadow-2xl"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <AnimatePresence>
              {showCommandPalette && (
                <motion.div
                  ref={commandPaletteRef}
                  className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-white dark:bg-[#1a1d25] rounded-xl z-50 shadow-xl border border-neutral-200 dark:border-white/10 overflow-hidden"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="py-1">
                    {commandSuggestions.map((suggestion, index) => (
                      <motion.div
                        key={suggestion.prefix}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 text-xs transition-colors cursor-pointer",
                          activeSuggestion === index
                            ? "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                            : "text-neutral-700 hover:bg-neutral-50 dark:text-white/70 dark:hover:bg-white/5"
                        )}
                        onClick={() => selectCommandSuggestion(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="w-6 h-6 rounded-md flex items-center justify-center bg-neutral-100 dark:bg-white/10 text-neutral-600 dark:text-white/60">
                          {suggestion.icon}
                        </div>
                        <div>
                          <div className="font-medium">{suggestion.label}</div>
                          <div className="text-neutral-400 dark:text-white/30 text-[10px]">
                            {suggestion.prefix} — {suggestion.description}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-4">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  adjustHeight();
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder={
                  AIProvider
                    ? `Ask ${AIProvider} anything…`
                    : "Ask a question…"
                }
                containerClassName="w-full"
                className={cn(
                  "w-full px-4 py-3",
                  "resize-none",
                  "bg-transparent",
                  "border-none",
                  "text-neutral-900 dark:text-white/90 text-sm",
                  "focus:outline-none",
                  "placeholder:text-neutral-400 dark:placeholder:text-white/25",
                  "min-h-[60px]"
                )}
                style={{ overflow: "hidden" }}
                showRing={false}
              />
            </div>

            <AnimatePresence>
              {attachments.length > 0 && (
                <motion.div
                  className="px-4 pb-3 flex gap-2 flex-wrap"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {attachments.map((file, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2 text-xs bg-neutral-100 dark:bg-white/[0.06] py-1.5 px-3 rounded-lg text-neutral-700 dark:text-white/70 border border-neutral-200 dark:border-white/10"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <span>{file}</span>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-neutral-400 hover:text-neutral-800 dark:text-white/40 dark:hover:text-white transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="px-4 pb-4 flex items-center justify-between gap-4">
              <p className="text-xs text-neutral-400 dark:text-white/25">
                Shift+Enter for new line
              </p>
              <motion.button
                type="button"
                onClick={handleSendMessage}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={isTyping || !value.trim()}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  "flex items-center gap-2",
                  value.trim() && !isTyping
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30"
                    : "bg-neutral-200 text-neutral-400 dark:bg-white/[0.06] dark:text-white/30 cursor-not-allowed"
                )}
              >
                {isTyping ? (
                  <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>{isTyping ? "Sending…" : "Send"}</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Quick command chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {commandSuggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion.prefix}
                onClick={() => selectCommandSuggestion(index)}
                className="flex items-center gap-2 px-3 py-2 bg-white/70 hover:bg-white dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-neutral-200 dark:border-white/[0.07] rounded-xl text-sm text-neutral-600 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white/90 transition-all shadow-sm backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {suggestion.icon}
                <span>{suggestion.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Cursor glow effect */}
      {inputFocused && (
        <motion.div
          className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.03] bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 blur-[96px]"
          animate={{
            x: mousePosition.x - 400,
            y: mousePosition.y - 400,
          }}
          transition={{
            type: "spring",
            damping: 25,
            stiffness: 150,
            mass: 0.5,
          }}
        />
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1 gap-0.5">
      {[1, 2, 3].map((dot) => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-violet-500 dark:bg-violet-400 rounded-full"
          initial={{ opacity: 0.3 }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.85, 1.15, 0.85],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: dot * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

const rippleKeyframes = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = rippleKeyframes;
  document.head.appendChild(style);
}
