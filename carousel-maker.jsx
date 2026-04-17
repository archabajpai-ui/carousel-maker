import React, { useState, useRef } from 'react';
import { Download, Sparkles, Palette, Loader2 } from 'lucide-react';

export default function CarouselMaker() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [colorScheme, setColorScheme] = useState('sunset');
  const slideRefs = useRef([]);

  const colorSchemes = {
    sunset: {
      name: 'Sunset',
      bg: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      text: '#ffffff',
      accent: '#ee5a6f'
    },
    ocean: {
      name: 'Ocean',
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      accent: '#9d84b7'
    },
    forest: {
      name: 'Forest',
      bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      text: '#ffffff',
      accent: '#48bb78'
    },
    midnight: {
      name: 'Midnight',
      bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      text: '#ffffff',
      accent: '#4fd1c5'
    },
    minimal: {
      name: 'Minimal',
      bg: '#f7fafc',
      text: '#1a202c',
      accent: '#2d3748'
    }
  };

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual & Fun' },
    { value: 'educational', label: 'Educational' },
    { value: 'motivational', label: 'Motivational' }
  ];

  const generateCarousel = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Create an Instagram carousel about "${topic}" in a ${tone} tone.

Return ONLY a JSON array with exactly 10 slides. Each slide should have:
- title: Short, punchy headline (max 6 words)
- content: 2-3 bullet points or short sentences (max 150 chars total)

Make slide 1 the hook/intro and slide 10 the CTA/conclusion.

Format: [{"title": "...", "content": "..."}, ...]

No markdown, no explanation, ONLY the JSON array.`
          }]
        })
      });

      const data = await response.json();
      const text = data.content.find(c => c.type === 'text')?.text || '';
      
      // Parse JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsedSlides = JSON.parse(jsonMatch[0]);
        setSlides(parsedSlides);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate carousel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadSlide = async (index) => {
    const slideElement = slideRefs.current[index];
    if (!slideElement) return;

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scale = 2;
      
      canvas.width = 1080 * scale;
      canvas.height = 1080 * scale;
      
      const scheme = colorSchemes[colorScheme];
      
      // Draw background
      if (scheme.bg.startsWith('linear-gradient')) {
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        if (colorScheme === 'sunset') {
          gradient.addColorStop(0, '#ff6b6b');
          gradient.addColorStop(1, '#feca57');
        } else if (colorScheme === 'ocean') {
          gradient.addColorStop(0, '#667eea');
          gradient.addColorStop(1, '#764ba2');
        } else if (colorScheme === 'forest') {
          gradient.addColorStop(0, '#134e5e');
          gradient.addColorStop(1, '#71b280');
        } else if (colorScheme === 'midnight') {
          gradient.addColorStop(0, '#0f2027');
          gradient.addColorStop(0.5, '#203a43');
          gradient.addColorStop(1, '#2c5364');
        }
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = scheme.bg;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw content
      ctx.fillStyle = scheme.text;
      ctx.textAlign = 'center';
      
      // Title
      ctx.font = `bold ${100 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const titleLines = wrapText(ctx, slides[index].title, canvas.width - 200 * scale);
      titleLines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 350 * scale + i * 110 * scale);
      });
      
      // Content
      ctx.font = `${36 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      const contentLines = wrapText(ctx, slides[index].content, canvas.width - 300 * scale);
      contentLines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, 600 * scale + i * 50 * scale);
      });
      
      // Slide number
      ctx.font = `${28 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillText(`${index + 1}/10`, canvas.width / 2, canvas.height - 80 * scale);
      
      // Download
      const link = document.createElement('a');
      link.download = `slide-${index + 1}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download slide. Please try again.');
    }
  };

  const wrapText = (ctx, text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const downloadAll = async () => {
    for (let i = 0; i < slides.length; i++) {
      await downloadSlide(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #0f172a, #1e293b)',
      color: '#f1f5f9',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '2rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: '800',
          margin: 0,
          background: 'linear-gradient(to right, #fbbf24, #f59e0b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Sparkles size={32} style={{ color: '#fbbf24' }} />
          Carousel Generator
        </h1>
        <p style={{ 
          margin: '0.5rem 0 0 0',
          color: '#94a3b8',
          fontSize: '1.1rem'
        }}>
          Create stunning Instagram carousels in seconds
        </p>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: slides.length > 0 ? '350px 1fr' : '1fr',
        gap: '2rem'
      }}>
        {/* Input Panel */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)',
          height: 'fit-content',
          position: slides.length > 0 ? 'sticky' : 'relative',
          top: '2rem'
        }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#e2e8f0'
          }}>
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., 5 productivity hacks for students"
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#f1f5f9',
              fontSize: '1rem',
              marginBottom: '1.5rem',
              outline: 'none'
            }}
            onKeyPress={(e) => e.key === 'Enter' && generateCarousel()}
          />

          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            fontWeight: '600',
            color: '#e2e8f0'
          }}>
            Tone
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {tones.map(t => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                style={{
                  padding: '0.75rem',
                  background: tone === t.value ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                  border: tone === t.value ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: tone === t.value ? '#fbbf24' : '#cbd5e1',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={generateCarousel}
            disabled={loading || !topic.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading || !topic.trim() ? '#475569' : 'linear-gradient(to right, #fbbf24, #f59e0b)',
              border: 'none',
              borderRadius: '8px',
              color: '#0f172a',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'transform 0.2s',
              transform: loading ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Carousel
              </>
            )}
          </button>

          {slides.length > 0 && (
            <>
              <div style={{
                margin: '2rem 0 1rem 0',
                padding: '1rem 0',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <Palette size={20} style={{ color: '#fbbf24' }} />
                  <label style={{
                    fontWeight: '600',
                    color: '#e2e8f0'
                  }}>
                    Color Scheme
                  </label>
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  {Object.entries(colorSchemes).map(([key, scheme]) => (
                    <button
                      key={key}
                      onClick={() => setColorScheme(key)}
                      style={{
                        padding: '0.75rem',
                        background: colorScheme === key ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.05)',
                        border: colorScheme === key ? '2px solid #fbbf24' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: scheme.bg,
                        border: '2px solid rgba(255,255,255,0.2)'
                      }} />
                      <span style={{
                        color: colorScheme === key ? '#fbbf24' : '#cbd5e1',
                        fontWeight: '500'
                      }}>
                        {scheme.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={downloadAll}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'rgba(34,197,94,0.2)',
                  border: '2px solid #22c55e',
                  borderRadius: '8px',
                  color: '#22c55e',
                  fontSize: '1rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginTop: '1rem',
                  transition: 'all 0.2s'
                }}
              >
                <Download size={20} />
                Download All (10 slides)
              </button>
            </>
          )}
        </div>

        {/* Slides Preview */}
        {slides.length > 0 && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {slides.map((slide, index) => (
                <div key={index} style={{ position: 'relative' }}>
                  <div
                    ref={el => slideRefs.current[index] = el}
                    style={{
                      aspectRatio: '1/1',
                      background: colorSchemes[colorScheme].bg,
                      borderRadius: '12px',
                      padding: '3rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      textAlign: 'center',
                      position: 'relative',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <h2 style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      color: colorSchemes[colorScheme].text,
                      margin: '0 0 1.5rem 0',
                      lineHeight: '1.2'
                    }}>
                      {slide.title}
                    </h2>
                    <p style={{
                      fontSize: '1.1rem',
                      color: colorSchemes[colorScheme].text,
                      margin: 0,
                      opacity: 0.9,
                      lineHeight: '1.6'
                    }}>
                      {slide.content}
                    </p>
                    <div style={{
                      position: 'absolute',
                      bottom: '1.5rem',
                      fontSize: '0.9rem',
                      color: colorSchemes[colorScheme].text,
                      opacity: 0.7,
                      fontWeight: '600'
                    }}>
                      {index + 1}/10
                    </div>
                  </div>
                  <button
                    onClick={() => downloadSlide(index)}
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      right: '0.75rem',
                      padding: '0.5rem',
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input::placeholder {
          color: rgba(203, 213, 225, 0.5);
        }
        
        button:hover:not(:disabled) {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}