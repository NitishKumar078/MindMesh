"use client";

import React, { useEffect, useState } from "react";
import { Eye, EyeOff, KeyRound, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { span } from "framer-motion/client";

const PROVIDERS = ["OpenAI", "Gemini", "Perplexity"] as const;

type Provider = (typeof PROVIDERS)[number];

export default function Modoleinfo() {
  const [apiKey, setApiKey] = useState("");
  const [provider, setProvider] = useState<Provider>("Perplexity");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const storedProvider =
      (localStorage.getItem("aiProvider") as Provider) || "Perplexity";
    const storedApiKey = localStorage.getItem("aiApiKey") || "";
    if (storedProvider) setProvider(storedProvider);
    if (storedApiKey) setApiKey(storedApiKey);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      localStorage.setItem("aiProvider", provider);
      localStorage.setItem("aiApiKey", apiKey);
      setSavedAt(new Date().toLocaleTimeString());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className=" flex items-center justify-center p-6">
      <div className="absolute -inset-px rounded-2xl pointer-events-none bg-gradient-to-b from-transparent via-white/20 to-transparent opacity-[0.04]" />

      <div className="p-6 sm:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
            Model Settings
          </h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-white/50">
            Choose your AI provider and add your API key. Perplexity is selected
            by default.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-800 dark:text-white/80">
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
                placeholder="API KEY ..."
                className={cn(
                  "w-full rounded-lg border bg-transparent pl-10 pr-10 py-2.5 text-sm",
                  "outline-none transition-colors",
                  "border-neutral-300/70 focus:border-neutral-500/80 dark:border-white/10 dark:focus:border-white/20",
                  "text-neutral-900 placeholder:text-neutral-400 dark:text-white dark:placeholder:text-white/30"
                )}
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md px-2 text-neutral-500 hover:text-neutral-800 dark:text-white/50 dark:hover:text-white/90"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-white/40">
              Your key is stored locally in this browser.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-neutral-800 dark:text-white/80">
              Provider
            </label>
            <div className="relative">
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className={cn(
                  "w-full appearance-none rounded-lg border bg-transparent py-2.5 pl-4 pr-10 text-sm",
                  "outline-none transition-colors",
                  "border-neutral-300/70 focus:border-neutral-500/80 dark:border-white/10 dark:focus:border-white/20",
                  "text-neutral-900 dark:text-white"
                )}
              >
                {PROVIDERS.map((p) => (
                  <option
                    key={p}
                    value={p}
                    className="bg-white text-neutral-900 dark:bg-neutral-900 dark:text-white"
                  >
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-white/50" />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className={cn(
                "inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg",
                "bg-neutral-900 text-white hover:bg-black dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
                "transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                "shadow-[0_8px_20px_-6px_rgba(0,0,0,0.35)] dark:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)]"
              )}
            >
              {saving ? (
                <span>Saving…</span>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>
                    {" "}
                    {savedAt ? <span>Saved ✅</span> : <span>save </span>}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
