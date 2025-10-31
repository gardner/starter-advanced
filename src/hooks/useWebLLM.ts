/**
 * Custom hook for managing Web-LLM engine lifecycle
 * AIDEV-NOTE: This hook encapsulates all Web-LLM related state and logic
 */

import { useCallback, useRef, useState } from "react";
import { createEngine, checkWebGPUSupport, type ProgressCallback } from "../lib/webllm";

export interface UseWebLLMOptions {
  modelId?: string;
}

export type ChatMessage = { role: string; content: string };
export type ChatHistory = Array<ChatMessage>;

export interface UseWebLLMReturn {
  ask: (prompt: string) => Promise<string | null>;
  reset: () => Promise<void>;
  loading: boolean;
  progress: { text: string; progress?: number } | null;
  error: string | null;
  isReady: boolean;
  chatHistory: ChatHistory;
}


const removeThinking = (chatHistory: ChatHistory): ChatHistory => {
  return chatHistory.map((msg) => {
    return {
      role: msg.role,
      content: msg.content.replace(/<think>[\s\S]*?<\/think>/, '').trim()
    }
  })
}

export function useWebLLM(options: UseWebLLMOptions = {}): UseWebLLMReturn {
  const { modelId = "Qwen3-0.6B-q4f16_1-MLC" } = options;

  // Refs to prevent duplicate initialization under React 19 StrictMode
  const engineRef = useRef<any>(null);
  const initRef = useRef(false);

  // State management
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<{ text: string; progress?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory>([]);


  // Initialize the engine
  const ensureEngine = useCallback(async () => {
    console.log("ensureEngine called");
    if (engineRef.current) {
      console.log("Engine already exists");
      return engineRef.current;
    }
    if (initRef.current) {
      console.log("Already initializing");
      return null;
    }

    // Check WebGPU support
    if (!checkWebGPUSupport()) {
      console.log("WebGPU not supported");
      setError("WebGPU is not supported in this browser. Please use Chrome, Edge, or Safari 17+ with WebGPU enabled.");
      return null;
    }

    console.log("Starting engine initialization");
    initRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const progressCallback: ProgressCallback = (p) => {
        // Enhance progress with stage detection
        console.log(p)
        let enhancedProgress = { ...p };

        if (p.text) {
          const text = p.text.toLowerCase();
          if (text.includes('init') || text.includes('initializing')) {
            enhancedProgress.progress = Math.min(p.progress || 10, 25);
          } else if (text.includes('download') || text.includes('loading')) {
            enhancedProgress.progress = Math.min(Math.max(p.progress || 25, 25), 75);
          } else if (text.includes('process') || text.includes('compile')) {
            enhancedProgress.progress = Math.min(Math.max(p.progress || 75, 75), 95);
          } else if (text.includes('ready') || text.includes('complete')) {
            enhancedProgress.progress = 100;
          }
        }

        setProgress(enhancedProgress);
      };

      const engine = await createEngine(modelId, progressCallback);
      engineRef.current = engine;
      setIsReady(true);
      setProgress(null);
      return engine;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Failed to initialize Web-LLM: ${errorMessage}`);
      console.error("Web-LLM initialization error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [modelId]);

  // Ask the model a question
  const ask = useCallback(async (prompt: string): Promise<string | null> => {
    if (!prompt.trim()) {
      return null;
    }

    const engine = await ensureEngine();
    if (!engine) {
      console.error("Unable to initialize the engine.")
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Add user message to history
      const userMessage = { role: "user", content: prompt };
      const updatedHistory = [...chatHistory, userMessage];
      setChatHistory(updatedHistory);

      // Create completion
      const response = await engine.chat.completions.create({
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          ...removeThinking(updatedHistory),
        ],
        stream: false,
        max_tokens: 4096,
      });

      const assistantMessage = response.choices?.[0]?.message?.content || "";

      // Add assistant response to history
      setChatHistory(prev => [...prev, { role: "assistant", content: assistantMessage }]);

      return assistantMessage;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(`Failed to generate response: ${errorMessage}`);
      console.error("Web-LLM generation error:", e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [ensureEngine, chatHistory]);

  // Reset the chat
  const reset = useCallback(async () => {
    if (engineRef.current) {
      try {
        await engineRef.current.resetChat();
      } catch (e) {
        console.error("Error resetting chat:", e);
      }
    }
    setChatHistory([]);
    setError(null);
    setProgress(null);
  }, []);

  return {
    ask,
    reset,
    loading,
    progress,
    error,
    isReady,
    chatHistory,
  };
}