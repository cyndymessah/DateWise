import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronRight, Sparkles } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import type { Activity, UserProfile } from '../types';
import clsx from 'clsx';

const CATEGORY_INFO = {
  coffee_casual: { label: 'Coffee & Casual', icon: '☕', color: 'bg-amber-100 text-amber-800' },
  outdoor_active: { label: 'Outdoor & Active', icon: '🌳', color: 'bg-green-100 text-green-800' },
  food_dining: { label: 'Food & Dining', icon: '🍽️', color: 'bg-red-100 text-red-800' },
  arts_culture: { label: 'Arts & Culture', icon: '🎨', color: 'bg-purple-100 text-purple-800' },
  fun_games: { label: 'Fun & Games', icon: '🎯', color: 'bg-blue-100 text-blue-800' },
  entertainment: { label: 'Entertainment', icon: '🎭', color: 'bg-pink-100 text-pink-800' },
};

interface Step {
  title: string;
  description: string;
  component: React.ComponentType<any>;
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, fetchCurrentUser } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (user?.profile_completed) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleComplete = async () => {
    await fetchCurrentUser();
    navigate('/dashboard');
  };

  const steps: Step[] = [
    {
      title: 'Tell Us About You',
      description: 'Help us understand what you\'re looking for',
      component: ProfileInfoStep,
    },
    {
      title: 'Pick Your Activities',
      description: 'Select activities you\'d love to do on dates',
      component: ActivitySelectionStep,
    },
    {
      title: 'Customize Your Picks',
      description: 'Add details to your chosen activities',
      component: ActivityDetailsStep,
    },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {steps.map((_step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all',
                    index <= currentStep
                      ? 'bg-gradient-primary text-white'
                      : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={clsx(
                      'flex-1 h-1 mx-2 rounded transition-all',
                      index < currentStep ? 'bg-primary-500' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 px-2">
            {steps.map((step, index) => (
              <span key={index} className={clsx(index === currentStep && 'font-semibold')}>
                {step.title}
              </span>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="card animate-fade-in">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600">{steps[currentStep].description}</p>
          </div>

          <CurrentStepComponent
            onNext={() => setCurrentStep((prev) => prev + 1)}
            onComplete={handleComplete}
            isLastStep={currentStep === steps.length - 1}
          />
        </div>
      </div>
    </div>
  );
}

// Step 1: Profile Info
function ProfileInfoStep({ onNext }: { onNext: () => void }) {
  const [formData, setFormData] = useState({
    occupation: '',
    interests: '',
    values: '',
    lifestyle: '',
    relationship_goals: '',
    deal_breakers: '',
    personality: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updateProfile(formData);
      onNext();
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="label">Occupation</label>
        <input
          type="text"
          className="input"
          placeholder="e.g., Software Engineer, Teacher, Entrepreneur"
          value={formData.occupation}
          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Interests & Hobbies *</label>
        <textarea
          required
          rows={3}
          className="textarea"
          placeholder="What do you love to do? (e.g., hiking, reading, cooking, photography)"
          value={formData.interests}
          onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Core Values *</label>
        <textarea
          required
          rows={3}
          className="textarea"
          placeholder="What matters most to you? (e.g., family, adventure, personal growth)"
          value={formData.values}
          onChange={(e) => setFormData({ ...formData, values: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Lifestyle *</label>
        <textarea
          required
          rows={3}
          className="textarea"
          placeholder="Describe your typical week (e.g., active, social, balanced work-life)"
          value={formData.lifestyle}
          onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Relationship Goals *</label>
        <textarea
          required
          rows={3}
          className="textarea"
          placeholder="What are you looking for? (e.g., serious relationship, casual dating, see where it goes)"
          value={formData.relationship_goals}
          onChange={(e) => setFormData({ ...formData, relationship_goals: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Deal-Breakers (Optional)</label>
        <textarea
          rows={2}
          className="textarea"
          placeholder="What are absolute no-gos for you?"
          value={formData.deal_breakers}
          onChange={(e) => setFormData({ ...formData, deal_breakers: e.target.value })}
        />
      </div>

      <div>
        <label className="label">Personality (Optional)</label>
        <textarea
          rows={2}
          className="textarea"
          placeholder="How would you describe yourself?"
          value={formData.personality}
          onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full flex items-center justify-center"
      >
        {isLoading ? 'Saving...' : 'Continue to Activities'}
        <ChevronRight className="w-5 h-5 ml-2" />
      </button>
    </form>
  );
}

// Step 2: Activity Selection
function ActivitySelectionStep({ onNext }: { onNext: () => void }) {
  const { user } = useAuthStore();
  const [activities, setActivities] = useState<Record<string, Activity[]>>({});
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const country = user?.location === 'Singapore' ? 'singapore' : 'indonesia';
      const data = await api.getActivitiesByCategory(country);
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActivity = (activityId: number) => {
    setSelectedActivities((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleContinue = async () => {
    if (selectedActivities.size === 0) {
      alert('Please select at least one activity');
      return;
    }

    // Add activities without details first
    try {
      for (const activityId of selectedActivities) {
        await api.addActivity(activityId, {});
      }
      onNext();
    } catch (error) {
      console.error('Failed to save activities:', error);
      alert('Failed to save activities. Please try again.');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading activities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-secondary rounded-lg p-4 text-white">
        <Sparkles className="w-6 h-6 mb-2" />
        <h3 className="font-semibold mb-1">This is the magic! ✨</h3>
        <p className="text-sm">
          Select activities you actually want to do. When you match, you'll already know what to do together!
        </p>
      </div>

      <div className="space-y-6">
        {Object.entries(activities).map(([category, items]) => {
          const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
          return (
            <div key={category}>
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-2xl">{categoryInfo.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900">{categoryInfo.label}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => toggleActivity(activity.id)}
                    className={clsx(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      selectedActivities.has(activity.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-2xl mr-2">{activity.icon}</span>
                        <span className="font-medium text-gray-900">{activity.name}</span>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        )}
                      </div>
                      {selectedActivities.has(activity.id) && (
                        <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 bg-white pt-4 border-t">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            Selected: <span className="font-semibold">{selectedActivities.size}</span> activities
          </p>
        </div>
        <button
          onClick={handleContinue}
          disabled={selectedActivities.size === 0}
          className="btn btn-primary w-full flex items-center justify-center"
        >
          Continue
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}

// Step 3: Activity Details
function ActivityDetailsStep({ onComplete }: { onComplete: () => void; isLastStep?: boolean }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [details, setDetails] = useState<Record<number, any>>({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndNext = async () => {
    if (!profile?.activities) return;

    const activity = profile.activities[currentActivityIndex];
    const activityDetails = details[activity.id] || {};

    try {
      if (Object.keys(activityDetails).length > 0) {
        await api.updateActivity(activity.id, activityDetails);
      }

      if (currentActivityIndex < profile.activities.length - 1) {
        setCurrentActivityIndex((prev) => prev + 1);
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to save activity details:', error);
      alert('Failed to save. Please try again.');
    }
  };

  const handleSkip = () => {
    if (!profile?.activities) return;

    if (currentActivityIndex < profile.activities.length - 1) {
      setCurrentActivityIndex((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!profile?.activities || profile.activities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No activities selected</p>
        <button onClick={onComplete} className="btn btn-primary">
          Complete Setup
        </button>
      </div>
    );
  }

  const activity = profile.activities[currentActivityIndex];

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm text-gray-600 mb-1">
          Activity {currentActivityIndex + 1} of {profile.activities.length}
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-3xl">{activity.activity.icon}</span>
          <h3 className="text-xl font-semibold">{activity.activity.name}</h3>
        </div>
      </div>

      <p className="text-gray-600">
        Add specific details to make this activity even better! (Optional)
      </p>

      <div className="space-y-4">
        <div>
          <label className="label">Specific Venue or Location</label>
          <input
            type="text"
            className="input"
            placeholder='e.g., "Common Man Coffee Roasters" or "My favorite café in Tiong Bahru"'
            value={details[activity.id]?.specific_venue || ''}
            onChange={(e) =>
              setDetails({
                ...details,
                [activity.id]: { ...details[activity.id], specific_venue: e.target.value },
              })
            }
          />
        </div>

        <div>
          <label className="label">Preferred Area</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., CBD, Orchard, East Coast"
            value={details[activity.id]?.location_area || ''}
            onChange={(e) =>
              setDetails({
                ...details,
                [activity.id]: { ...details[activity.id], location_area: e.target.value },
              })
            }
          />
        </div>

        <div>
          <label className="label">Preferred Time</label>
          <input
            type="text"
            className="input"
            placeholder="e.g., Weekend afternoons, Weekday evenings"
            value={details[activity.id]?.preferred_time || ''}
            onChange={(e) =>
              setDetails({
                ...details,
                [activity.id]: { ...details[activity.id], preferred_time: e.target.value },
              })
            }
          />
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            rows={2}
            className="textarea"
            placeholder="Any other preferences or notes"
            value={details[activity.id]?.notes || ''}
            onChange={(e) =>
              setDetails({
                ...details,
                [activity.id]: { ...details[activity.id], notes: e.target.value },
              })
            }
          />
        </div>
      </div>

      <div className="flex space-x-3">
        <button onClick={handleSkip} className="btn btn-outline flex-1">
          Skip
        </button>
        <button onClick={handleSaveAndNext} className="btn btn-primary flex-1 flex items-center justify-center">
          {currentActivityIndex < profile.activities.length - 1 ? 'Next Activity' : 'Complete Setup'}
          <ChevronRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
