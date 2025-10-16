'use client';

import { useEffect, useState } from 'react';

interface Video {
  id: number;
  title: string;
  description: string;
  status: string;
}

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('checking...');

  useEffect(() => {
    async function fetchData() {
      try {
        // Check API health
        const healthResponse = await fetch('http://localhost:8000/api/health');
        const healthData = await healthResponse.json();
        setApiStatus(healthData.status || 'unknown');

        // Fetch videos
        const videosResponse = await fetch('http://localhost:8000/api/videos');
        const videosData = await videosResponse.json();
        setVideos(videosData.videos || []);
        setLoading(false);
      } catch {
        setError('Failed to connect to backend API. Make sure the FastAPI server is running on port 8000.');
        setApiStatus('disconnected');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-sans">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">YouTube Assistant</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          Helper for planning and making YouTube videos for the ActionaQA channel
        </p>

        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-sm">
            <span className="font-semibold">Backend API Status:</span>{' '}
            <span className={apiStatus === 'healthy' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {apiStatus}
            </span>
          </p>
        </div>

        <h2 className="text-2xl font-bold mb-4">Video Ideas</h2>

        {loading && <p>Loading videos...</p>}
        
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900 rounded-lg mb-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <p className="text-sm mt-2">
              Start the backend with: <code className="bg-black/[.05] dark:bg-white/[.06] px-2 py-1 rounded">cd backend && uvicorn app.main:app --reload</code>
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="grid gap-4">
            {videos.map((video) => (
              <div key={video.id} className="p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-2">{video.description}</p>
                <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                  video.status === 'planned' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {video.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
