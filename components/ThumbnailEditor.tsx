import React, { useState } from 'react';
import { Search, Wand2, Download, RefreshCw, Image as ImageIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { extractYoutubeId, fetchImageAsBase64 } from '../utils/helpers';
import { editThumbnail } from '../services/gemini';

export const ThumbnailEditor: React.FC = () => {
  // Input States
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  
  // Data States
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  
  // UI States
  const [status, setStatus] = useState<'idle' | 'fetching' | 'generating' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setGeneratedImage(null); // Reset previous generation
    
    const videoId = extractYoutubeId(url);
    if (!videoId) {
      setErrorMessage('Invalid YouTube URL. Please double-check the link.');
      return;
    }

    setStatus('fetching');
    try {
      // Try max res first, fallback happens naturally if we had more complex logic, 
      // but for now we assume maxresdefault exists for most active videos
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const base64 = await fetchImageAsBase64(thumbnailUrl);
      setOriginalImage(base64);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setErrorMessage('Could not fetch thumbnail. The video might not have a high-res thumbnail or is restricted.');
      setStatus('error');
    }
  };

  const handleGenerate = async () => {
    if (!originalImage || !prompt.trim()) return;

    setStatus('generating');
    setErrorMessage('');
    
    try {
      const resultBase64 = await editThumbnail(originalImage, prompt);
      setGeneratedImage(resultBase64);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setErrorMessage('Failed to edit image. Please try a different prompt or check the console.');
      setStatus('error');
    }
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${generatedImage}`;
    link.download = 'edited-thumbnail.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Top Section: URL Input */}
      <section className="w-full max-w-3xl mx-auto">
        <div className="bg-gray-900 rounded-2xl p-1 border border-gray-800 shadow-xl flex items-center">
          <div className="pl-4 text-gray-500">
            <Search className="w-5 h-5" />
          </div>
          <form onSubmit={handleFetch} className="flex-grow flex">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL here..."
              className="w-full bg-transparent border-none text-white px-4 py-4 focus:ring-0 placeholder-gray-600"
            />
            <button
              type="submit"
              disabled={status === 'fetching'}
              className="bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-2 rounded-xl m-2 transition-colors disabled:opacity-50"
            >
              {status === 'fetching' ? 'Fetching...' : 'Fetch'}
            </button>
          </form>
        </div>
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            {errorMessage}
          </div>
        )}
      </section>

      {/* Main Editor Area */}
      {originalImage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Left Column: Source & Controls */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-gray-800 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand" />
                <h3 className="font-medium text-sm text-gray-300">Original Thumbnail</h3>
              </div>
              <div className="aspect-video w-full bg-gray-950 flex items-center justify-center relative group">
                <img 
                  src={`data:image/jpeg;base64,${originalImage}`} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-lg">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                How should Gemini edit this?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Add a neon glow around the subject, make the background cyberpunk city, add 'REVIEW' text in red..."
                className="w-full bg-gray-950 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-brand focus:border-transparent min-h-[120px] resize-none"
              />
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || status === 'generating'}
                  className="bg-brand hover:bg-brand-hover text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand/20"
                >
                  {status === 'generating' ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Generate Edit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="flex flex-col gap-6">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden shadow-lg h-full flex flex-col">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-brand-accent" />
                  <h3 className="font-medium text-sm text-gray-300">AI Result</h3>
                </div>
                {generatedImage && (
                  <button 
                    onClick={downloadImage}
                    className="text-xs flex items-center gap-1 text-brand hover:text-brand-hover font-medium"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                )}
              </div>
              
              <div className="flex-grow aspect-video w-full bg-gray-950 flex items-center justify-center relative p-4">
                {status === 'generating' ? (
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 animate-pulse">Dreaming up pixels...</p>
                  </div>
                ) : generatedImage ? (
                  <img 
                    src={`data:image/jpeg;base64,${generatedImage}`} 
                    alt="AI Generated" 
                    className="w-full h-full object-contain rounded-lg shadow-2xl"
                  />
                ) : (
                  <div className="text-center text-gray-600 p-8 border-2 border-dashed border-gray-800 rounded-xl">
                    <ArrowRight className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                    <p>Enter a prompt and hit Generate to see magic happen</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};