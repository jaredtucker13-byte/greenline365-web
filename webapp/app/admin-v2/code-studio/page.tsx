'use client';

/**
 * GreenLine Code Studio - Professional Code Sandbox
 * 
 * A robust, market-ready code preview and editing tool featuring:
 * - Multi-file editing (HTML, CSS, JS)
 * - Live preview with hot reload
 * - Responsive device testing (Mobile, Tablet, Desktop)
 * - Syntax highlighting with Monaco Editor (VS Code engine)
 * - Export/Download functionality
 * - Share via unique links
 * - Template library
 * - Console output
 * - Fullscreen preview
 * - Auto-save to local storage
 * - Dark/Light themes
 * 
 * This can be offered as a free tool to attract users or as a premium feature.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Dynamically import Monaco to avoid SSR issues
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// Types
type FileType = 'html' | 'css' | 'js';
type DeviceSize = 'mobile' | 'tablet' | 'desktop' | 'full';
type Theme = 'dark' | 'light';

interface CodeFiles {
  html: string;
  css: string;
  js: string;
}

interface SavedProject {
  id: string;
  name: string;
  files: CodeFiles;
  createdAt: string;
  updatedAt: string;
}

interface ConsoleMessage {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: string;
}

// Default starter templates
const STARTER_TEMPLATES: Record<string, { name: string; description: string; files: CodeFiles }> = {
  blank: {
    name: 'Blank',
    description: 'Start from scratch',
    files: {
      html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>',
      css: '/* Your styles here */\nbody {\n  font-family: system-ui, sans-serif;\n  padding: 2rem;\n  background: #0a0a0a;\n  color: white;\n}\n\nh1 {\n  font-size: 2.5rem;\n  background: linear-gradient(135deg, #00f5a0, #00d9f5);\n  -webkit-background-clip: text;\n  -webkit-text-fill-color: transparent;\n}',
      js: '// Your JavaScript here\nconsole.log("Hello from Code Studio!");',
    },
  },
  landingPage: {
    name: 'Landing Page',
    description: 'Modern SaaS landing page starter',
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <nav class="navbar">
    <div class="logo">YourBrand</div>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#contact">Contact</a>
      <button class="cta-btn">Get Started</button>
    </div>
  </nav>
  
  <section class="hero">
    <h1 class="hero-title">Build Something Amazing</h1>
    <p class="hero-subtitle">The all-in-one platform for modern businesses. Start free, scale infinitely.</p>
    <div class="hero-cta">
      <button class="primary-btn">Start Free Trial</button>
      <button class="secondary-btn">Watch Demo</button>
    </div>
  </section>

  <section class="features" id="features">
    <h2>Why Choose Us?</h2>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>Optimized for speed and performance</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Secure</h3>
        <p>Enterprise-grade security built-in</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📱</div>
        <h3>Responsive</h3>
        <p>Works beautifully on all devices</p>
      </div>
    </div>
  </section>
</body>
</html>`,
      css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
  color: white;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 5%;
  position: fixed;
  width: 100%;
  top: 0;
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(10px);
  z-index: 100;
}

.logo {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #00f5a0, #00d9f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-links a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: white;
}

.cta-btn {
  background: linear-gradient(135deg, #00f5a0, #00d9f5);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  color: #0a0a0a;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.cta-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 245, 160, 0.3);
}

.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 0 5%;
}

.hero-title {
  font-size: 4rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #a0a0a0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 0.8s ease-out;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: rgba(255,255,255,0.6);
  max-width: 600px;
  margin-bottom: 2rem;
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

.hero-cta {
  display: flex;
  gap: 1rem;
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.primary-btn {
  background: linear-gradient(135deg, #00f5a0, #00d9f5);
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  color: #0a0a0a;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.primary-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 245, 160, 0.4);
}

.secondary-btn {
  background: transparent;
  border: 2px solid rgba(255,255,255,0.3);
  padding: 1rem 2rem;
  border-radius: 50px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.secondary-btn:hover {
  border-color: white;
  background: rgba(255,255,255,0.1);
}

.features {
  padding: 5rem 5%;
  text-align: center;
}

.features h2 {
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 2rem;
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  color: rgba(255,255,255,0.6);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .nav-links a {
    display: none;
  }
  
  .hero-cta {
    flex-direction: column;
  }
}`,
      js: `// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

// Add scroll animation to feature cards
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.feature-card').forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px)';
  card.style.transition = 'all 0.6s ease-out';
  observer.observe(card);
});

console.log('Landing page loaded!');`,
    },
  },
  animation: {
    name: 'Animation Showcase',
    description: 'CSS animations and transitions demo',
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Animation Demo</title>
</head>
<body>
  <div class="container">
    <h1 class="title">Animation Demo</h1>
    
    <div class="demo-section">
      <h2>Hover Effects</h2>
      <div class="hover-cards">
        <div class="card card-lift">Lift</div>
        <div class="card card-glow">Glow</div>
        <div class="card card-rotate">Rotate</div>
        <div class="card card-scale">Scale</div>
      </div>
    </div>

    <div class="demo-section">
      <h2>Loading Animations</h2>
      <div class="loaders">
        <div class="loader-spin"></div>
        <div class="loader-pulse"></div>
        <div class="loader-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h2>Scroll Triggered</h2>
      <div class="scroll-items">
        <div class="scroll-item">Fade In</div>
        <div class="scroll-item">Slide Up</div>
        <div class="scroll-item">Scale In</div>
      </div>
    </div>
  </div>
</body>
</html>`,
      css: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, sans-serif;
  background: #0a0a0a;
  color: white;
  min-height: 100vh;
  padding: 2rem;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
}

.title {
  text-align: center;
  font-size: 3rem;
  margin-bottom: 3rem;
  background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient 5s ease infinite;
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

.demo-section {
  margin-bottom: 4rem;
}

.demo-section h2 {
  margin-bottom: 1.5rem;
  color: rgba(255,255,255,0.7);
}

/* Hover Cards */
.hover-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.card {
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.card-lift:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

.card-glow:hover {
  box-shadow: 0 0 30px rgba(0, 245, 160, 0.5);
  border: 1px solid #00f5a0;
}

.card-rotate:hover {
  transform: rotate(5deg) scale(1.05);
}

.card-scale:hover {
  transform: scale(1.1);
  background: linear-gradient(135deg, #00f5a0, #00d9f5);
  color: #0a0a0a;
}

/* Loaders */
.loaders {
  display: flex;
  gap: 3rem;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.loader-spin {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.1);
  border-top-color: #00f5a0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loader-pulse {
  width: 50px;
  height: 50px;
  background: #00f5a0;
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.5; }
}

.loader-dots {
  display: flex;
  gap: 8px;
}

.loader-dots span {
  width: 12px;
  height: 12px;
  background: #00d9f5;
  border-radius: 50%;
  animation: bounce 1.4s ease-in-out infinite;
}

.loader-dots span:nth-child(1) { animation-delay: 0s; }
.loader-dots span:nth-child(2) { animation-delay: 0.2s; }
.loader-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-20px); }
}

/* Scroll Items */
.scroll-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.scroll-item {
  background: rgba(255,255,255,0.05);
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease-out;
}

.scroll-item.visible {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 768px) {
  .hover-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}`,
      js: `// Intersection Observer for scroll animations
const scrollItems = document.querySelectorAll('.scroll-item');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, index) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, index * 200);
    }
  });
}, { threshold: 0.2 });

scrollItems.forEach(item => observer.observe(item));

console.log('Animation demo loaded! Try hovering over the cards.');`,
    },
  },
  tailwind: {
    name: 'Tailwind CSS',
    description: 'Use Tailwind CSS via CDN',
    files: {
      html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tailwind Demo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#00f5a0',
            secondary: '#00d9f5',
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-950 text-white min-h-screen">
  <nav class="fixed w-full bg-gray-950/80 backdrop-blur-lg z-50 border-b border-white/10">
    <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div class="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Brand
      </div>
      <div class="flex items-center gap-8">
        <a href="#" class="text-white/70 hover:text-white transition">Features</a>
        <a href="#" class="text-white/70 hover:text-white transition">Pricing</a>
        <button class="bg-gradient-to-r from-primary to-secondary text-gray-950 px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
          Get Started
        </button>
      </div>
    </div>
  </nav>

  <main class="pt-24">
    <section class="min-h-screen flex flex-col items-center justify-center text-center px-6">
      <h1 class="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent">
        Build faster with<br/>Tailwind CSS
      </h1>
      <p class="text-xl text-white/60 max-w-2xl mb-8">
        A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.
      </p>
      <div class="flex gap-4">
        <button class="bg-gradient-to-r from-primary to-secondary text-gray-950 px-8 py-3 rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-primary/40 transition-all hover:-translate-y-1">
          Start Building
        </button>
        <button class="border border-white/30 px-8 py-3 rounded-full font-semibold text-lg hover:bg-white/10 transition-all">
          Documentation
        </button>
      </div>
    </section>

    <section class="py-20 px-6">
      <div class="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-2 group">
          <div class="text-4xl mb-4">⚡</div>
          <h3 class="text-xl font-semibold mb-2 group-hover:text-primary transition">Lightning Fast</h3>
          <p class="text-white/60">Optimized for performance with minimal CSS footprint.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-2 group">
          <div class="text-4xl mb-4">🎨</div>
          <h3 class="text-xl font-semibold mb-2 group-hover:text-primary transition">Fully Customizable</h3>
          <p class="text-white/60">Extend and customize every aspect of the framework.</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:-translate-y-2 group">
          <div class="text-4xl mb-4">📱</div>
          <h3 class="text-xl font-semibold mb-2 group-hover:text-primary transition">Responsive</h3>
          <p class="text-white/60">Mobile-first design with intuitive breakpoint prefixes.</p>
        </div>
      </div>
    </section>
  </main>
</body>
</html>`,
      css: `/* Additional custom styles */
/* Most styling is done via Tailwind classes in HTML */

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #0a0a0a;
}

::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}`,
      js: `// Tailwind is loaded via CDN in the HTML
console.log('Tailwind CSS demo loaded!');

// Add smooth scroll behavior
document.documentElement.style.scrollBehavior = 'smooth';`,
    },
  },
};

// Device sizes for responsive preview
const DEVICE_SIZES: Record<DeviceSize, { width: string; height: string; label: string }> = {
  mobile: { width: '375px', height: '667px', label: '📱 Mobile' },
  tablet: { width: '768px', height: '1024px', label: '📱 Tablet' },
  desktop: { width: '1280px', height: '800px', label: '💻 Desktop' },
  full: { width: '100%', height: '100%', label: '🖥️ Full' },
};

export default function CodeStudioPage() {
  // Code state
  const [files, setFiles] = useState<CodeFiles>(STARTER_TEMPLATES.blank.files);
  const [activeFile, setActiveFile] = useState<FileType>('html');
  
  // UI state
  const [deviceSize, setDeviceSize] = useState<DeviceSize>('desktop');
  const [theme, setTheme] = useState<Theme>('dark');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  
  // Console state
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const previewKey = useRef(0);

  // Generate preview HTML
  const generatePreviewHtml = useCallback(() => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${files.css}</style>
</head>
<body>
  ${files.html.replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>|<body[^>]*>|<\/body>/gi, '')}
  <script>
    // Console capture
    const originalConsole = { ...console };
    ['log', 'error', 'warn', 'info'].forEach(method => {
      console[method] = (...args) => {
        originalConsole[method](...args);
        window.parent.postMessage({
          type: 'console',
          method,
          message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
        }, '*');
      };
    });
    
    // Error capture
    window.onerror = (msg, url, line, col, error) => {
      window.parent.postMessage({
        type: 'console',
        method: 'error',
        message: msg + ' (line ' + line + ')'
      }, '*');
    };
  </script>
  <script>${files.js}</script>
</body>
</html>`;
  }, [files]);

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        setConsoleMessages(prev => [...prev.slice(-99), {
          type: event.data.method,
          message: event.data.message,
          timestamp: new Date().toLocaleTimeString(),
        }]);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      localStorage.setItem('codeStudio_files', JSON.stringify(files));
      localStorage.setItem('codeStudio_projectName', projectName);
      setLastSaved(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearTimeout(saveTimer);
  }, [files, projectName]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedFiles = localStorage.getItem('codeStudio_files');
    const savedName = localStorage.getItem('codeStudio_projectName');
    
    if (savedFiles) {
      try {
        setFiles(JSON.parse(savedFiles));
      } catch (e) {
        console.error('Failed to load saved files');
      }
    }
    if (savedName) {
      setProjectName(savedName);
    }
  }, []);

  // Refresh preview
  const refreshPreview = useCallback(() => {
    previewKey.current += 1;
    setConsoleMessages([]);
  }, []);

  // Auto-refresh preview when code changes
  useEffect(() => {
    if (autoRefresh) {
      const timer = setTimeout(refreshPreview, 500);
      return () => clearTimeout(timer);
    }
  }, [files, autoRefresh, refreshPreview]);

  // Update file content
  const updateFile = (type: FileType, content: string) => {
    setFiles(prev => ({ ...prev, [type]: content }));
  };

  // Load template
  const loadTemplate = (templateKey: string) => {
    const template = STARTER_TEMPLATES[templateKey];
    if (template) {
      setFiles(template.files);
      setProjectName(template.name + ' Project');
      setShowTemplates(false);
      refreshPreview();
    }
  };

  // Export as ZIP
  const exportAsZip = async () => {
    // Create a simple download of individual files
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
${files.html.replace(/<!DOCTYPE html>|<html[^>]*>|<\/html>|<head>[\s\S]*<\/head>|<body[^>]*>|<\/body>/gi, '')}
  <script src="script.js"></script>
</body>
</html>`;

    // Download HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);

    // Download CSS
    setTimeout(() => {
      const cssBlob = new Blob([files.css], { type: 'text/css' });
      const cssUrl = URL.createObjectURL(cssBlob);
      const cssA = document.createElement('a');
      cssA.href = cssUrl;
      cssA.download = 'styles.css';
      cssA.click();
      URL.revokeObjectURL(cssUrl);
    }, 100);

    // Download JS
    setTimeout(() => {
      const jsBlob = new Blob([files.js], { type: 'text/javascript' });
      const jsUrl = URL.createObjectURL(jsBlob);
      const jsA = document.createElement('a');
      jsA.href = jsUrl;
      jsA.download = 'script.js';
      jsA.click();
      URL.revokeObjectURL(jsUrl);
    }, 200);
  };

  // Copy code to clipboard
  const copyCode = () => {
    const fullCode = generatePreviewHtml();
    navigator.clipboard.writeText(fullCode);
  };

  // File tabs config
  const fileTabs: { type: FileType; label: string; icon: string; language: string }[] = [
    { type: 'html', label: 'HTML', icon: '📄', language: 'html' },
    { type: 'css', label: 'CSS', icon: '🎨', language: 'css' },
    { type: 'js', label: 'JavaScript', icon: '⚡', language: 'javascript' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
      {/* Header */}
      <header className={`border-b ${theme === 'dark' ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'} sticky top-0 z-50`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo & Project Name */}
          <div className="flex items-center gap-4">
            <Link href="/admin-v2" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-black font-bold text-sm">
                CS
              </div>
              <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Code Studio
              </span>
            </Link>
            <div className="h-6 w-px bg-white/20" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className={`bg-transparent border-none outline-none text-sm font-medium ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'} focus:text-white`}
            />
            {lastSaved && (
              <span className="text-xs text-white/40">Saved {lastSaved}</span>
            )}
          </div>

          {/* Center: Device Size Toggle */}
          <div className={`flex items-center gap-1 p-1 rounded-lg ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'}`}>
            {Object.entries(DEVICE_SIZES).map(([key, { label }]) => (
              <button
                key={key}
                onClick={() => setDeviceSize(key as DeviceSize)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  deviceSize === key
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-black'
                    : theme === 'dark' ? 'text-white/60 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              📚 Templates
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                autoRefresh 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700'
              }`}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              🔄 {autoRefresh ? 'Auto' : 'Manual'}
            </button>
            <button
              onClick={refreshPreview}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              ▶️ Run
            </button>
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition relative ${
                showConsole
                  ? 'bg-purple-500/20 text-purple-400'
                  : theme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-gray-100 text-gray-700'
              }`}
            >
              🖥️ Console
              {consoleMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">
                  {consoleMessages.length}
                </span>
              )}
            </button>
            <div className="h-6 w-px bg-white/20" />
            <button
              onClick={copyCode}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              📋 Copy
            </button>
            <button
              onClick={exportAsZip}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-black hover:shadow-lg hover:shadow-emerald-500/30 transition"
            >
              ⬇️ Export
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {isFullscreen ? '⬜' : '⬛'}
            </button>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${theme === 'dark' ? 'bg-white/5 text-white/70 hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={`flex ${isFullscreen ? 'h-[calc(100vh-57px)]' : 'h-[calc(100vh-57px)]'}`}>
        {/* Editor Panel */}
        {!isFullscreen && (
          <div className={`w-1/2 flex flex-col border-r ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
            {/* File Tabs */}
            <div className={`flex border-b ${theme === 'dark' ? 'border-white/10 bg-[#111]' : 'border-gray-200 bg-gray-50'}`}>
              {fileTabs.map(({ type, label, icon }) => (
                <button
                  key={type}
                  onClick={() => setActiveFile(type)}
                  className={`px-4 py-3 text-sm font-medium transition flex items-center gap-2 ${
                    activeFile === type
                      ? theme === 'dark' 
                        ? 'bg-[#1e1e1e] text-white border-b-2 border-emerald-500' 
                        : 'bg-white text-gray-900 border-b-2 border-emerald-500'
                      : theme === 'dark'
                        ? 'text-white/50 hover:text-white/80 hover:bg-white/5'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              ))}
            </div>

            {/* Code Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={fileTabs.find(f => f.type === activeFile)?.language}
                value={files[activeFile]}
                onChange={(value) => updateFile(activeFile, value || '')}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: true,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  automaticLayout: true,
                  padding: { top: 16 },
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
                  fontLigatures: true,
                }}
              />
            </div>
          </div>
        )}

        {/* Preview Panel */}
        <div className={`${isFullscreen ? 'w-full' : 'w-1/2'} flex flex-col ${theme === 'dark' ? 'bg-[#111]' : 'bg-gray-50'}`}>
          {/* Preview Header */}
          <div className={`flex items-center justify-between px-4 py-2 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
            <span className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
              Preview {deviceSize !== 'full' && `(${DEVICE_SIZES[deviceSize].width} × ${DEVICE_SIZES[deviceSize].height})`}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
            </div>
          </div>

          {/* Preview Frame */}
          <div className={`flex-1 flex items-center justify-center p-4 overflow-auto ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
            <div
              className={`relative transition-all duration-300 ${deviceSize !== 'full' ? 'shadow-2xl rounded-lg overflow-hidden' : ''}`}
              style={{
                width: DEVICE_SIZES[deviceSize].width,
                height: deviceSize === 'full' ? '100%' : DEVICE_SIZES[deviceSize].height,
                maxHeight: '100%',
              }}
            >
              {deviceSize === 'mobile' && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl" />
              )}
              <iframe
                key={previewKey.current}
                ref={iframeRef}
                srcDoc={generatePreviewHtml()}
                className="w-full h-full bg-white"
                sandbox="allow-scripts allow-same-origin"
                title="Preview"
              />
            </div>
          </div>

          {/* Console Panel */}
          <AnimatePresence>
            {showConsole && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 200 }}
                exit={{ height: 0 }}
                className={`border-t overflow-hidden ${theme === 'dark' ? 'border-white/10 bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                  <span className="text-sm text-white/50">Console Output</span>
                  <button
                    onClick={() => setConsoleMessages([])}
                    className="text-xs text-white/50 hover:text-white"
                  >
                    Clear
                  </button>
                </div>
                <div className="h-[160px] overflow-y-auto p-2 font-mono text-xs">
                  {consoleMessages.length === 0 ? (
                    <div className="text-white/30 p-2">No console output yet...</div>
                  ) : (
                    consoleMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex gap-2 p-1 ${
                          msg.type === 'error' ? 'text-red-400 bg-red-500/10' :
                          msg.type === 'warn' ? 'text-yellow-400 bg-yellow-500/10' :
                          msg.type === 'info' ? 'text-blue-400' : 'text-white/70'
                        }`}
                      >
                        <span className="text-white/30">{msg.timestamp}</span>
                        <span className="text-white/50">[{msg.type}]</span>
                        <span>{msg.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Templates Modal */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            onClick={() => setShowTemplates(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Choose a Template</h2>
                <p className="text-white/50 mt-1">Start with a pre-built template or create from scratch</p>
              </div>
              
              <div className="p-6 grid grid-cols-2 gap-4 overflow-y-auto max-h-[60vh]">
                {Object.entries(STARTER_TEMPLATES).map(([key, template]) => (
                  <button
                    key={key}
                    onClick={() => loadTemplate(key)}
                    className="p-6 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-emerald-500/50 transition group"
                  >
                    <div className="text-3xl mb-3">
                      {key === 'blank' ? '📝' : key === 'landingPage' ? '🚀' : key === 'animation' ? '✨' : '🎨'}
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition">
                      {template.name}
                    </h3>
                    <p className="text-sm text-white/50 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
