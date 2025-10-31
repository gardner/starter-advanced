import { LlmChat } from './components/LlmChat'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Web-LLM Chat Application</h1>
        <p>AI-powered chat running entirely in your browser</p>
      </header>
      <main className="app-main">
        <LlmChat />
      </main>
    </div>
  )
}

export default App
