import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Copy, Check, Trash2, Upload as UploadIcon, 
  FileText, Send, Loader2, Search, MessageSquare, Sparkles,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';

const Dashboard = () => {
  const [docs, setDocs] = useState([]);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const chatEndRef = useRef(null);

  // Suggested prompts
  const suggestedPrompts = [
    { label: "Summarize", text: "Can you provide a comprehensive summary of this document?" },
    { label: "Key Points", text: "What are the key points and main takeaways?" },
    { label: "Simplify", text: "Explain this in simple terms suitable for a beginner." },
    { label: "Action Items", text: "Identify any action items or next steps mentioned." },
    { label: "Analysis", text: "Analyze the tone and intent of this document." },
    { label: "Critique", text: "Provide a critical review of the arguments presented." }
  ];

  useEffect(() => {
    fetchDocs();
    // Force dark mode
    document.documentElement.classList.add('dark');
    
    // Load chat history
    const savedChat = localStorage.getItem('chatHistory');
    if (savedChat) {
      setChatHistory(JSON.parse(savedChat));
    }

    // Load API key
    const savedKey = localStorage.getItem('groqApiKey');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    // Save chat history
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  }, [chatHistory]);



  // ... (rest of the file)



  const fetchDocs = async () => {
    try {
      const res = await api.get('/docs');
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/docs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFile(null);
      fetchDocs();
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await api.delete(`/docs/${id}`);
      fetchDocs();
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async (e, customQuery = null) => {
    e?.preventDefault();
    const questionText = customQuery || query;
    if (!questionText.trim()) return;

    if (!apiKey) {
      alert("Please configure your API Key in Profile Settings first.");
      return;
    }

    const userMsg = { role: 'user', text: questionText };
    setChatHistory([...chatHistory, userMsg]);
    setQuery('');
    setLoadingChat(true);

    try {
      const res = await api.post('/chat', 
        { query: questionText },
        { headers: { 'x-groq-api-key': apiKey } }
      );
      const botMsg = { 
        role: 'assistant', 
        text: res.data.answer, 
        sources: res.data.sources 
      };
      setChatHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Error getting answer. Please check your API key.';
      setChatHistory(prev => [...prev, { role: 'assistant', text: errorMsg }]);
      setChatHistory(prev => [...prev, { role: 'assistant', text: errorMsg }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    if (confirm('Clear all chat history?')) {
      setChatHistory([]);
      localStorage.removeItem('chatHistory');
    }
  };

  const filteredChat = chatHistory.filter(msg => 
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-100px)] flex gap-6 relative">
      {/* Sidebar Toggle Button (Mobile/Desktop) */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className={`absolute top-4 z-20 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 border border-gray-700 shadow-md transition-all duration-300 ${isSidebarOpen ? 'left-[330px]' : 'left-0'}`}
        title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
      >
        {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
      </button>

      {/* Left Panel: Documents */}
      <div 
        className={`bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex flex-col h-full transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-80 p-6 opacity-100 translate-x-0' : 'w-0 p-0 opacity-0 -translate-x-10 border-0'
        }`}
      >
        <div className="min-w-[270px]"> {/* Prevent content squishing during transition */}
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <FileText size={24} className="text-indigo-400" />
            Your Documents
          </h2>
          
          <form onSubmit={handleUpload} className="mb-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-300">
                Upload PDF
              </label>
              <input 
                type="file" 
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="block w-full text-sm text-gray-300
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-900 file:text-indigo-200
                  hover:file:bg-indigo-800 transition-all cursor-pointer bg-gray-700 rounded-lg"
              />
              <button 
                type="submit" 
                disabled={!file || uploading}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all font-medium shadow-md"
              >
                {uploading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadIcon size={18} />
                    Upload
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2 custom-scrollbar">
            {docs.map(doc => (
              <div 
                key={doc._id} 
                className="bg-gray-700 border-gray-600 border p-4 rounded-lg hover:bg-gray-650 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition-colors truncate max-w-[180px]">
                      {doc.title}
                    </h3>
                    <p className="text-xs mt-1 text-gray-400">
                      {new Date(doc.uploadedAt).toLocaleDateString()} • 
                      <span className={`ml-1 px-2 py-0.5 rounded ${doc.status === 'ready' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-yellow-900/50 text-yellow-300 border border-yellow-800'}`}>
                        {doc.status}
                      </span>
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDelete(doc._id)}
                    className="text-gray-400 hover:text-red-400 p-1 hover:bg-gray-600 rounded transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {docs.length === 0 && (
              <p className="text-center py-8 text-gray-400 bg-gray-700/30 rounded-lg border border-dashed border-gray-600">
                No documents yet. Upload your first PDF!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Chat */}
      <div className="flex-1 bg-gray-800 rounded-xl shadow-lg flex flex-col h-full border border-gray-700 transition-all duration-300">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <MessageSquare size={24} className="text-indigo-400" />
                Chat
              </h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search chat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 rounded-lg text-sm bg-gray-700 text-white border-gray-600 border focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
                  />
                </div>

                <button
                  onClick={clearChat}
                  className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all border border-gray-600"
                >
                  Clear
                </button>
              </div>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900 custom-scrollbar">
              {filteredChat.length === 0 && chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="bg-gray-800 p-6 rounded-full mb-6 shadow-xl shadow-indigo-900/20">
                    <Sparkles size={48} className="text-indigo-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    Start a conversation
                  </h3>
                  <p className="text-sm mb-8 text-gray-400 text-center max-w-md">
                    Ask questions about your uploaded documents. I can summarize content, explain concepts, and find specific details.
                    {!apiKey && (
                       <span className="block mt-2 text-yellow-500">
                           ⚠️ API Key missing. Please go to <Link to="/profile" className="underline hover:text-yellow-400">Profile</Link> to configure it.
                       </span>
                    )}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-4xl">
                    {suggestedPrompts.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => handleChat(e, item.text)}
                        className="p-4 rounded-xl text-left bg-gray-800 hover:bg-gray-750 hover:border-indigo-500/50 text-gray-200 border border-gray-700 transition-all shadow-sm hover:shadow-md group h-full flex flex-col justify-center"
                      >
                        <span className="block font-bold text-indigo-400 mb-1 group-hover:text-indigo-300">{item.label}</span>
                        <span className="block text-xs text-gray-400 group-hover:text-gray-300 line-clamp-2">{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredChat.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-600 text-white shadow-indigo-900/30' : 'bg-gray-800 border border-gray-700 text-gray-100'} rounded-2xl shadow-md overflow-hidden`}>
                    <div className="p-4">
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert max-w-none prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({inline, className, children, ...props}) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={oneDark}
                                    language={match[1]}
                                    PreTag="div"
                                    customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-gray-700 px-1.5 py-0.5 rounded text-indigo-200 font-mono text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                      
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-700/50">
                          <p className="text-xs font-semibold mb-2 text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <FileText size={12} /> Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {msg.sources.map(s => (
                              <span 
                                key={s.id} 
                                className="text-xs px-2.5 py-1 rounded-full bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:border-gray-500 transition-colors cursor-default"
                              >
                                {s.title}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {msg.role === 'assistant' && (
                      <div className="px-4 pb-3 flex justify-end bg-gray-800/50">
                        <button
                          onClick={() => copyToClipboard(msg.text, idx)}
                          className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check size={14} className="text-green-400" />
                              <span className="text-green-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <Loader2 size={20} className="animate-spin text-indigo-400" />
                      <span className="text-sm text-gray-300 font-medium">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChat} className="p-4 border-t border-gray-700 bg-gray-800 rounded-b-xl">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="flex-1 p-3.5 rounded-xl bg-gray-700 text-white border-gray-600 border focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!query.trim() || loadingChat}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20 font-medium"
                >
                  <Send size={18} />
                  Send
                </button>
              </div>
            </form>
      </div>


    </div>
  );
};

export default Dashboard;
