"use client";
import { AnimatedAIChat } from "@/components/ui/animated-ai-chat";

export default function chat() {
  const APIkey = localStorage.getItem("aiApiKey");
  const AIProvider = localStorage.getItem("aiProvider");
  const chat = localStorage.getItem("chat");
  console.log(APIkey, AIProvider, chat);
  return (
    <div className="flex w-screen overflow-x-hidden">
      <AnimatedAIChat />
    </div>
  );
}
