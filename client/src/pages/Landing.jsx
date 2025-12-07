import { Link } from 'react-router-dom';
import { Brain, Zap, Shield, Search, ArrowRight, Github, BookOpen } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              SecondBrain
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-gray-400 hover:text-white transition-colors font-medium">
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-medium transition-all transform hover:scale-105 shadow-lg shadow-indigo-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl mix-blend-screen animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl mix-blend-screen animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700 mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-sm text-gray-300 font-medium">AI-Powered Knowledge Base</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400 animate-fade-in-up animation-delay-100">
            Remember Everything.<br />
            <span className="text-indigo-400">Effortlessly.</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up animation-delay-200">
            Store your links, notes, and documents. Chat with your personal AI knowledge assistant to retrieve anything instantly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-300">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 group"
            >
              Start for Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-4 bg-gray-800 text-white rounded-full font-bold text-lg border border-gray-700 hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-800/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Supercharge Your Memory</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built for developers, researchers, and anyone who needs to manage information overload.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: <Search className="w-8 h-8 text-cyan-400" />,
                title: "Semantic Search",
                desc: "Forget keywords. Search by meaning. Ask natural questions and get precise answers from your data."
              },
              {
                icon: <Zap className="w-8 h-8 text-violet-400" />,
                title: "Instant Capture",
                desc: "Save articles, PDFs, and notes with one click. We automatically process and index everything."
              },
              {
                icon: <Shield className="w-8 h-8 text-emerald-400" />,
                title: "Private & Secure",
                desc: "Your data is yours. Hosted securely with enterprise-grade encryption and privacy controls."
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-8 rounded-2xl bg-gray-800 border border-gray-700 hover:border-indigo-500/50 transition-all hover:bg-gray-800/80 group">
                <div className="mb-6 p-4 rounded-xl bg-gray-900 w-fit group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Preview */}
      <section className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">Chat with your Brain</h2>
              <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                It's like ChatGPT, but it actually knows your stuff. Ask questions about that article you read last week or the meeting notes from last month.
              </p>
              <ul className="space-y-4">
                {[
                  "Summarize long documents instantly",
                  "Extract key insights from multiple sources",
                  "Generate content based on your knowledge base"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl blur opacity-30"></div>
               <div className="relative rounded-xl bg-gray-900 border border-gray-700 p-6 shadow-2xl">
                 {/* Mock Chat Interface */}
                 <div className="space-y-4">
                   <div className="flex gap-4">
                     <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0"></div>
                     <div className="bg-gray-800 p-4 rounded-lg rounded-tl-none max-w-[80%]">
                       <p className="text-sm text-gray-300">What were the key takeaways from the React 19 article?</p>
                     </div>
                   </div>
                   <div className="flex gap-4 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-lg rounded-tr-none max-w-[90%]">
                      <p className="text-sm text-gray-200">
                        Based on your saved article, React 19 introduces the new Compiler, Actions API for form handling, and Server Components by default. It significantly reduces the need for useMemo and useCallback.
                      </p>
                    </div>
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 pt-16 pb-8">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
             <Brain className="w-8 h-8 text-indigo-500" />
             <span className="text-2xl font-bold text-white">SecondBrain</span>
          </div>
          <div className="flex justify-center gap-8 mb-12">
            <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">Twitter</a>
            <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">GitHub</a>
            <a href="#" className="text-gray-500 hover:text-indigo-400 transition-colors">Discord</a>
          </div>
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} SecondBrain. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
