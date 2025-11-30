import { useEffect, useState } from 'react';
import { Heart, X, MapPin, Briefcase, Sparkles, Calendar } from 'lucide-react';
import api from '../services/api';
import type { MatchDisplay } from '../types';

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchDisplay[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const data = await api.getDailyMatches();
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInterest = async (interested: boolean) => {
    if (isProcessing || currentIndex >= matches.length) return;

    setIsProcessing(true);

    try {
      const match = matches[currentIndex];
      const result = await api.expressInterest(match.match.id, interested);

      if (result.isMutualMatch) {
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          setCurrentIndex((prev) => prev + 1);
          setIsProcessing(false);
        }, 3000);
      } else {
        setCurrentIndex((prev) => prev + 1);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Failed to express interest:', error);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Heart className="w-12 h-12 text-primary-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading your matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Matches Today</h2>
          <p className="text-gray-600 mb-4">
            Check back tomorrow for fresh matches!
          </p>
          <p className="text-sm text-gray-500">
            We curate 2-3 quality matches for you every day.
          </p>
        </div>
      </div>
    );
  }

  if (currentIndex >= matches.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-12">
          <Heart className="w-20 h-20 text-primary-500 mx-auto mb-4" fill="currentColor" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All Done for Today!</h2>
          <p className="text-gray-600 mb-4">
            You've reviewed all your matches. Come back tomorrow for more!
          </p>
          <p className="text-sm text-gray-500">
            In the meantime, check your mutual matches to start planning dates.
          </p>
        </div>
      </div>
    );
  }

  const match = matches[currentIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Celebration Modal */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-slide-up">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-12 h-12 text-white" fill="white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">It's a Match! 🎉</h2>
            <p className="text-lg text-gray-600 mb-4">
              You and {match.profile.name} both want to meet!
            </p>
            <p className="text-gray-600">
              Check your mutual matches to start planning your date.
            </p>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-600">
            Match {currentIndex + 1} of {matches.length}
          </span>
          <span className="text-sm text-gray-500">Today's Matches</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-primary h-2 rounded-full transition-all"
            style={{ width: `${((currentIndex + 1) / matches.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Match Card */}
      <div className="card">
        {/* Profile Section */}
        <div className="mb-6">
          <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-xl mb-4 flex items-center justify-center">
            <Heart className="w-32 h-32 text-primary-300" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {match.profile.name}, {match.profile.age}
          </h1>

          <div className="flex flex-wrap gap-3 text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{match.profile.location}</span>
            </div>
            {match.profile.occupation && (
              <div className="flex items-center space-x-1">
                <Briefcase className="w-4 h-4" />
                <span>{match.profile.occupation}</span>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-bold text-gray-900">AI Insights</h2>
          </div>

          {/* Why You Should Meet */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Why You Should Meet {match.profile.name}
            </h3>
            <ul className="space-y-2">
              {match.aiInsights.whyMeet.map((reason, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Heart className="w-4 h-4 text-white" fill="white" />
                  </div>
                  <p className="text-gray-700">{reason}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Date Ideas */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              <span>What You Could Do Together</span>
            </h3>
            <div className="space-y-3">
              {match.aiInsights.dateIdeas.map((idea, idx) => (
                <div key={idx} className="bg-white rounded-lg p-4 border border-primary-100">
                  <p className="font-medium text-gray-900 mb-1">{idea.activity}</p>
                  {idea.location && (
                    <p className="text-sm text-gray-600">📍 {idea.location}</p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Shared Activities */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            🎯 {match.sharedActivities.length} Shared {match.sharedActivities.length === 1 ? 'Activity' : 'Activities'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {match.sharedActivities.map((sa, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-medium text-gray-900 mb-2">{sa.activity_name}</p>
                {sa.user_a_details?.venue && (
                  <p className="text-sm text-gray-600">Your preference: {sa.user_a_details.venue}</p>
                )}
                {sa.user_b_details?.venue && (
                  <p className="text-sm text-gray-600">Their preference: {sa.user_b_details.venue}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Full Profile */}
        <div className="space-y-4 mb-6">
          {match.profile.interests && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Interests</h3>
              <p className="text-gray-700">{match.profile.interests}</p>
            </div>
          )}

          {match.profile.values && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Values</h3>
              <p className="text-gray-700">{match.profile.values}</p>
            </div>
          )}

          {match.profile.lifestyle && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Lifestyle</h3>
              <p className="text-gray-700">{match.profile.lifestyle}</p>
            </div>
          )}

          {match.profile.relationship_goals && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Looking For</h3>
              <p className="text-gray-700">{match.profile.relationship_goals}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => handleInterest(false)}
            disabled={isProcessing}
            className="btn btn-outline flex-1 flex items-center justify-center space-x-2"
          >
            <X className="w-5 h-5" />
            <span>Pass</span>
          </button>
          <button
            onClick={() => handleInterest(true)}
            disabled={isProcessing}
            className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            <Heart className="w-5 h-5" />
            <span>{isProcessing ? 'Processing...' : "Let's Meet!"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
