"use client";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function ThemeButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <motion.button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      className="absolute top-4 right-4 z-50 cursor-pointer p-2.5 rounded-xl
        bg-white/70 dark:bg-white/[0.07]
        border border-neutral-200 dark:border-white/[0.1]
        text-neutral-600 dark:text-white/70
        hover:text-neutral-900 dark:hover:text-white
        hover:bg-white dark:hover:bg-white/[0.12]
        shadow-sm backdrop-blur-sm
        transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </motion.button>
  );
}
