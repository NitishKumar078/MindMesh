"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Provider, AIPROVIDERS } from "@/app/lib/types";
import { motion } from "framer-motion";

const PROVIDER_META: Record<
  string,
  { color: string; hint: string }
> = {
  Perplexity: {
    color: "from-teal-500 to-cyan-500",
    hint: "Get your key at perplexity.ai/settings/api",
  },
  OpenAI: {
    color: "from-green-500 to-emerald-500",
    hint: "Get your key at platform.openai.com/api-keys",
  },
  Gemini: {
    color: "from-violet-500 to-blue-500",
    hint: "Get your key at aistudio.google.com/app/apikey",
  },
};

export default function Modoleinfo() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("Perplexity");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedProvider =
      (localStorage.getItem("aiProvider") as Provider) || "Perplexity";
    const storedApiKey = localStorage.getItem("aiApiKey") || "";
    if (storedProvider) setProvider(storedProvider);
    if (storedApiKey) setApiKey(storedApiKey);
    if (storedApiKey) setSaved(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      localStorage.setItem("aiProvider", provider);
      localStorage.setItem("aiApiKey", apiKey);
      localStorage.setItem("chat", "true");
      setSaved(true);
      await new Promise((r) => setTimeout(r, 400));
      router.push("/chat");
    } finally {
      setSaving(false);
    }
  };

  const meta = PROVIDER_META[provider];

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Card */}
      <div className="relative rounded-2xl border border-neutral-200 dark:border-white/[0.08] bg-white/80 dark:bg-white/[0.04] backdrop-blur-xl shadow-xl dark:shadow-none overflow-hidden">
        {/* Accent bar */}
        <div
          className={cn(
            "h-1 w-full bg-gradient-to-r",
            meta.color
          )}
        />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Model Settings
            </h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-white/40">
              Choose your AI provider and enter your API key.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Provider selector */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/70">
                Provider
              </label>
              <div className="relative">
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as Provider)}
                  className={cn(
                    "w-full appearance-none rounded-xl border py-2.5 pl-4 pr-10 text-sm",
                    "outline-none transition-all duration-200",
                    "bg-neutral-50 dark:bg-white/[0.05]",
                    "border-neutral-200 dark:border-white/10",
                    "focus:border-violet-400 dark:focus:border-violet-500/60",
                    "text-neutral-900 dark:text-white",
                    "cursor-pointer"
                  )}
                >
                  {AIPROVIDERS.map((p) => (
                    <option
                      key={p}
                      value={p}
                      className="bg-white text-neutral-900 dark:bg-[#1a1d25] dark:text-white"
                    >
                      {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-white/40" />
              </div>
            </div>

            {/* API Key input */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-white/70">
                API Key
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                  <KeyRound className="h-4 w-4 text-neutral-400 dark:text-white/30" />
                </div>
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your API key…"
                  className={cn(
                    "w-full rounded-xl border bg-neutral-50 dark:bg-white/[0.05] pl-10 pr-10 py-2.5 text-sm",
                    "outline-none transition-all duration-200",
                    "border-neutral-200 dark:border-white/10",
                    "focus:border-violet-400 dark:focus:border-violet-500/60",
                    "text-neutral-900 placeholder:text-neutral-400 dark:text-white dark:placeholder:text-white/25"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute inset-y-0 right-2 flex items-center justify-center rounded-lg px-2 text-neutral-400 hover:text-neutral-700 dark:text-white/40 dark:hover:text-white/80 transition-colors"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-neutral-400 dark:text-white/30">
                {meta.hint} — stored locally in your browser only.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <motion.button
                type="submit"
                disabled={saving || !apiKey.trim()}
                whileHover={{ scale: apiKey.trim() ? 1.01 : 1 }}
                whileTap={{ scale: apiKey.trim() ? 0.98 : 1 }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 w-full px-5 py-3 text-sm font-medium rounded-xl",
                  "transition-all duration-200",
                  apiKey.trim() && !saving
                    ? "bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25"
                    : "bg-neutral-200 text-neutral-400 dark:bg-white/[0.06] dark:text-white/30 cursor-not-allowed"
                )}
              >
                {saving ? (
                  <span>Saving…</span>
                ) : (
                  <>
                    <span>{saved ? "Update & Continue" : "Save & Start Chat"}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
}
