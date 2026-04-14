"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export const AnimatedTooltip = ({
  items,
  className,
}: {
  items: {
    id: number;
    hostname: string | null;
    url: string;
    favicon: string | null;
  }[];
  className?: string;
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const x = useMotionValue(0);

  const handleMouseMove = (
    event: React.MouseEvent<HTMLImageElement, MouseEvent>
  ) => {
    const halfWidth = (event.target as HTMLImageElement).offsetWidth / 2;
    x.set(event.nativeEvent.offsetX - halfWidth);
  };
  function customImageLoader({ src }: { src: string }) {
    return src; // just return the URL directly
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {items.map((item) => (
        <div
          className="-mr-4 relative group"
          key={item.id}
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence mode="popLayout">
            {hoveredIndex === item.id && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 16,
                  },
                }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                style={{
                  translateX: "-50%",
                  left: "50%",
                  top: "-70px",
                  position: "absolute",
                  whiteSpace: "nowrap",
                  zIndex: 50,
                }}
                className="flex text-xs flex-col items-center justify-center rounded-md bg-foreground shadow-xl px-4 py-2"
              >
                <div className="font-bold text-background relative z-30 text-base">
                  {item.hostname ?? item.url}
                </div>
                <div className="text-muted-foreground text-xs">{item.url}</div>
              </motion.div>
            )}
          </AnimatePresence>
          {item.favicon ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              style={{ display: "inline-block" }}
            >
              <Image
                loader={customImageLoader}
                onMouseMove={handleMouseMove}
                height={32}
                width={32}
                src={item.favicon}
                alt={item.hostname ?? item.url}
                className="object-cover !m-0 !p-0 object-top rounded-full size-8 border-2 group-hover:scale-105 group-hover:z-30 border-background relative transition duration-500 cursor-pointer"
              />
            </a>
          ) : (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={-1}
              className="inline-flex items-center justify-center size-8 rounded-full bg-neutral-200 dark:bg-white/10 text-xs font-bold text-neutral-600 dark:text-white/60 border-2 border-background"
            >
              {(item.hostname ?? item.url).charAt(0).toUpperCase()}
            </a>
          )}
        </div>
      ))}
    </div>
  );
};
