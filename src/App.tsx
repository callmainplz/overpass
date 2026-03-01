import { useState, useEffect } from 'react';
import { Copy, Check, Loader2, AlertCircle, Settings, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');

  // Load API key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('groq_api_key');
    if (storedKey) setCustomApiKey(storedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    setCustomApiKey(key);
    if (key.trim()) {
      localStorage.setItem('groq_api_key', key.trim());
    } else {
      localStorage.removeItem('groq_api_key');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError('');
    setQuery('');
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          apiKey: customApiKey || undefined // Send custom key if present
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate query');
      }
      
      setQuery(data.query);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate query. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!query) return;
    navigator.clipboard.writeText(query);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl space-y-8 relative">
        
        {/* Settings Toggle */}
        <div className="absolute top-0 right-0 -mt-12 md:-mr-12 md:mt-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-full transition-colors ${showSettings ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            title="API Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Overpass QL Generator</h1>
          <p className="text-zinc-500 text-sm">Convert natural language to OpenStreetMap queries.</p>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  <Key className="w-4 h-4" />
                  <span>Custom Groq API Key</span>
                </div>
                <p className="text-xs text-zinc-500">
                  Enter your own Groq API key to bypass server limits. 
                  Key is stored locally in your browser.
                </p>
                <input
                  type="password"
                  value={customApiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="e.g., house with number 1948 in Louisville"
              className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all placeholder:text-zinc-400 text-zinc-900"
              disabled={loading}
            />
            <div className="absolute right-2 top-2">
              <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="px-4 py-1.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm px-1">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Output */}
        <AnimatePresence>
          {query && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="relative group"
            >
              <div className="absolute right-3 top-3 z-10">
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white/90 backdrop-blur-sm border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <pre className="w-full p-6 bg-zinc-50 border border-zinc-200 rounded-xl overflow-x-auto text-sm font-mono text-zinc-800 leading-relaxed shadow-sm">
                <code>{query}</code>
              </pre>
              
              <div className="mt-2 text-right">
                <a 
                  href={`https://overpass-turbo.eu/?Q=${encodeURIComponent(query)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-400 hover:text-zinc-600 hover:underline transition-colors"
                >
                  Open in Overpass Turbo &rarr;
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
