/**
 * LlmChat Component
 * AIDEV-NOTE: This component provides the UI for interacting with Web-LLM
 */

import { useState } from "react";
import { useWebLLM } from "../hooks/useWebLLM";

export function LlmChat() {
  const [input, setInput] = useState("");
  const [currentResponse, setCurrentResponse] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState<{ [key: string]: boolean }>({});

  const { ask, reset, loading, progress, error, isReady, chatHistory } = useWebLLM({
    modelId: import.meta.env.VITE_MLC_MODEL_ID || "Qwen3-0.6B-q4f16_1-MLC",
  });

  // Parse thinking text from response
  const parseThinking = (text: string) => {
    const thinkingMatch = text.match(/<think>([\s\S]*?)<\/think>/);
    if (thinkingMatch) {
      const thinking = thinkingMatch[1].trim();
      const response = text.replace(/<think>[\s\S]*?<\/think>/, '').trim();

      return {
        thinking: thinking,
        response: response || "Thinking in progress...",
        hasThinking: true
      };
    }
    return {
      thinking: null,
      response: text,
      hasThinking: false
    };
  };

  // Toggle thinking visibility for a specific message
  const toggleThinking = (messageId: string) => {
    setShowThinking(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setCurrentResponse(null);
    const response = await ask(input);
    if (response) {
      setCurrentResponse(response);
    }
    setInput("");
  };

  const handleInitialize = async () => {
    console.log("Manual initialization triggered");
    // Trigger initialization by calling ask with a minimal message
    await ask("Hello");
  };

  const handleReset = async () => {
    await reset();
    setCurrentResponse(null);
  };

  // WebGPU not supported
  if (error && error.includes("WebGPU is not supported")) {
    return (
      <div className="llm-chat-container">
        <div className="error-banner">
          <h3>WebGPU Not Supported</h3>
          <p>{error}</p>
          <div className="browser-info">
            <p>Please use one of the following browsers:</p>
            <ul>
              <li>Chrome (latest version)</li>
              <li>Edge (latest version)</li>
              <li>Safari 17+ (enable WebGPU in Settings &gt; Advanced &gt; Experimental Features)</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="llm-chat-container">
      <div className="chat-header">
        <h2>Web-LLM Chat</h2>
        <div className="status-indicator">
          <span className={`status-dot ${isReady ? "ready" : "not-ready"}`}></span>
          <span>{isReady ? "Ready" : "Not Ready"}</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Progress Display */}
      {progress && (
        <div className="progress-container">
          <div className="progress-header">
            <div className="progress-text">{progress.text}</div>
            {progress.progress !== undefined && (
              <div className="progress-percentage">{Math.round(progress.progress)}%</div>
            )}
          </div>
          {progress.progress !== undefined && (
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>
          )}
          <div className="progress-details">
            {progress.progress !== undefined && (
              <div className="progress-stages">
                <div className={`stage ${progress.progress >= 0 ? 'active' : ''}`}>
                  <div className="stage-dot"></div>
                  <span>Initializing</span>
                </div>
                <div className={`stage ${progress.progress >= 25 ? 'active' : ''}`}>
                  <div className="stage-dot"></div>
                  <span>Downloading</span>
                </div>
                <div className={`stage ${progress.progress >= 75 ? 'active' : ''}`}>
                  <div className="stage-dot"></div>
                  <span>Processing</span>
                </div>
                <div className={`stage ${progress.progress >= 95 ? 'active' : ''}`}>
                  <div className="stage-dot"></div>
                  <span>Ready</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="chat-messages">
        {chatHistory.map((message, index) => {
          if (message.role === "assistant") {
            const { thinking, response } = parseThinking(message.content);
            const messageId = `history-${index}`;
            const isThinkingVisible = showThinking[messageId];

            return (
              <div key={index} className={`message ${message.role}`}>
                <div className="message-content">
                  <strong>Assistant:</strong>
                  <div className="response-section">
                    {response && <p>{response}</p>}

                    {thinking && (
                      <>
                        <div className="thinking-indicator">
                          <span className="thinking-badge">🧠 Thinking available</span>
                          <button
                            className="thinking-toggle"
                            onClick={() => toggleThinking(messageId)}
                          >
                            <span>{isThinkingVisible ? "Hide" : "Show"}</span>
                            <span className={`thinking-arrow ${isThinkingVisible ? "expanded" : ""}`}>▼</span>
                          </button>
                        </div>

                        {isThinkingVisible && (
                          <div className="thinking-content">
                            <div className="thinking-label">Model's Thought Process:</div>
                            <pre className="thinking-text">{thinking}</pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                <strong>{message.role === "user" ? "You" : "Assistant"}:</strong>
                <p>{message.content}</p>
              </div>
            </div>
          );
        })}

        {/* Current response (for streaming display) */}
        {currentResponse && (
          <div className="message assistant">
            <div className="message-content">
              <strong>Assistant:</strong>
              {(() => {
                const { thinking, response } = parseThinking(currentResponse);
                const messageId = "current";
                const isThinkingVisible = showThinking[messageId];

                return (
                  <div className="response-section">
                    {response && <p>{response}</p>}

                    {thinking && (
                      <>
                        <div className="thinking-indicator">
                          <span className="thinking-badge">🧠 Thinking available</span>
                          <button
                            className="thinking-toggle"
                            onClick={() => toggleThinking(messageId)}
                          >
                            <span>{isThinkingVisible ? "Hide" : "Show"}</span>
                            <span className={`thinking-arrow ${isThinkingVisible ? "expanded" : ""}`}>▼</span>
                          </button>
                        </div>

                        {isThinkingVisible && (
                          <div className="thinking-content">
                            <div className="thinking-label">Model's Thought Process:</div>
                            <pre className="thinking-text">{thinking}</pre>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="chat-input-form">
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isReady ? "Type your message..." : "Loading model..."}
            disabled={loading || !isReady}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !isReady}
            className="send-button"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>

      {/* Controls */}
      <div className="chat-controls">
        {!isReady && !loading && (
          <button
            onClick={handleInitialize}
            className="init-button"
          >
            Initialize Model
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={loading}
          className="reset-button"
        >
          Reset Chat
        </button>
        {!isReady && !loading && (
          <button
            onClick={() => window.location.reload()}
            className="reload-button"
          >
            Reload Page
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="instructions">
        <h3>Instructions:</h3>
        <ul>
          <li>Click "Initialize Model" to load the AI model (first time may take several minutes)</li>
          <li>Type your message and press Enter or click Send</li>
          <li>The model runs entirely in your browser using WebGPU</li>
          <li>No data is sent to external servers</li>
          <li>🧠 When you see "Thinking available", click to expand and see the model's reasoning process</li>
        </ul>
      </div>
    </div>
  );
}