import React, { useState, useEffect } from 'react';
import { checkHasApiKey, openApiKeySelection } from './services/gemini';
import { Layout } from './components/Layout';
import { ThumbnailEditor } from './components/ThumbnailEditor';
import { Loader2, Lock, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const checkAuth = async () => {
    setIsCheckingAuth(true);
    try {
      const hasKey = await checkHasApiKey();
      setIsAuthenticated(hasKey);
    } catch (error) {
      console.error("Auth check failed", error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await openApiKeySelection();
      // Assume success and re-check, or optimistic update
      await checkAuth();
    } catch (e) {
      console.error("Login failed", e);
      // In case of error (like "Requested entity was not found"), we retry
      await openApiKeySelection(); 
      await checkAuth();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <Layout>
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full">
            <div className="bg-brand/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-brand" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-white">Access Required</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
              To use the Gemini Nano Banana model for thumbnail editing, please connect your Google account and select a valid API Key project.
            </p>
            <button
              onClick={handleLogin}
              className="w-full py-3 px-6 bg-brand hover:bg-brand-hover text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <ShieldCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Connect Google Account
            </button>
            <p className="mt-6 text-xs text-gray-500">
              Powered by Google Gemini API. Your key remains secure in your session.
            </p>
          </div>
        </div>
      ) : (
        <ThumbnailEditor />
      )}
    </Layout>
  );
};

export default App;