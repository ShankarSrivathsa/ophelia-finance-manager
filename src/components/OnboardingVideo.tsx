import React, { useState, useEffect } from 'react';
import { Play, X, Volume2, VolumeX, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { tavusService } from '../services/tavusService';

interface OnboardingVideoProps {
  onComplete: () => void;
}

export const OnboardingVideo: React.FC<OnboardingVideoProps> = ({ onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    generateVideo();
  }, []);

  const generateVideo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const video = await tavusService.generateOnboardingVideo();
      setVideoData(video);
      
      console.log('Tavus video data:', video);
    } catch (err) {
      console.error('Error generating video:', err);
      setError('Video generation failed. Using demo mode.');
      // Set fallback data
      setVideoData({
        video_id: 'f0fb453cbe',
        status: 'completed',
        video_url: 'https://tavus.video/f0fb453cbe',
        duration: 120
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setShowVideo(false);
    onComplete();
  };

  const handleVideoEnd = () => {
    setTimeout(() => {
      setShowVideo(false);
      onComplete();
    }, 1000);
  };

  const handlePlayVideo = () => {
    setIsPlaying(true);
  };

  const handleWatchExternal = () => {
    if (videoData?.video_url) {
      window.open(videoData.video_url, '_blank');
    }
  };

  const handleIframeError = () => {
    setEmbedError(true);
  };

  if (!showVideo) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#1F1F1F] backdrop-blur-sm rounded-xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden border border-[#2C2C2E]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2C2C2E]">
          <h2 className="text-xl font-semibold text-white">
            Why Managing Your Expenses Matters
          </h2>
          <button
            onClick={handleSkip}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Content */}
        <div className="relative bg-gray-900 aspect-video">
          {loading ? (
            // Loading State
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 text-white">
              <div className="text-center">
                <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Preparing Your AI Video</h3>
                <p className="text-sm opacity-90">Loading personalized content...</p>
              </div>
            </div>
          ) : !isPlaying ? (
            // Video Thumbnail with Play Button
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
              <div className="text-center text-white">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm cursor-pointer hover:bg-white/30 transition-colors group"
                     onClick={handlePlayVideo}>
                  <Play className="w-8 h-8 ml-1 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className="text-2xl font-bold mb-2">The Power of Financial Control</h3>
                <p className="text-lg opacity-90 max-w-md mx-auto mb-6">
                  Discover the life-changing difference between those who track their expenses and those who don't
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handlePlayVideo}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    Watch Video (2 min)
                  </button>
                  <button
                    onClick={handleWatchExternal}
                    className="bg-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors shadow-lg flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </button>
                </div>
                
                {/* Tavus Powered Notice */}
                <div className="mt-4 flex items-center justify-center gap-2 text-sm opacity-75">
                  <AlertCircle className="w-4 h-4" />
                  <span>Powered by Tavus AI Video Generation</span>
                </div>
              </div>
            </div>
          ) : embedError ? (
            // Embed Error Fallback
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-white">
              <div className="text-center max-w-md px-8">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-4">Video Embed Restricted</h3>
                <p className="text-gray-300 mb-6">
                  This video cannot be embedded due to platform restrictions. You can watch it directly on Tavus.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleWatchExternal}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Watch on Tavus
                  </button>
                  <button
                    onClick={handleVideoEnd}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Continue to App
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // Tavus Video Player with Error Handling
            <div className="absolute inset-0">
              <iframe
                src={tavusService.getEmbedUrl(videoData.video_id)}
                className="w-full h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                onLoad={() => console.log('Tavus video loaded successfully')}
                onError={handleIframeError}
                title="Financial Management Video"
              />
              
              {/* Video controls overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-sm bg-black/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    AI-Generated Financial Story
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleWatchExternal}
                    className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open External
                  </button>
                  <button
                    onClick={handleVideoEnd}
                    className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                  >
                    Continue to App
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#2C2C2E] flex items-center justify-between">
          <div className="text-sm text-gray-300">
            <p className="font-medium">What you'll learn:</p>
            <ul className="mt-1 space-y-1">
              <li>• How expense tracking leads to financial freedom</li>
              <li>• Real stories of transformation</li>
              <li>• Why starting today makes all the difference</li>
            </ul>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={handleVideoEnd}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
            >
              Continue to App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};