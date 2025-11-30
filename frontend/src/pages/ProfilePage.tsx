import { useEffect, useState } from 'react';
import { User, MapPin, Briefcase, Heart, Edit, X, Plus, CheckCircle } from 'lucide-react';
import api from '../services/api';
import type { UserProfile, Activity } from '../types';
import clsx from 'clsx';

const CATEGORY_INFO = {
  coffee_casual: { label: 'Coffee & Casual', icon: '☕', color: 'bg-amber-100 text-amber-800' },
  outdoor_active: { label: 'Outdoor & Active', icon: '🌳', color: 'bg-green-100 text-green-800' },
  food_dining: { label: 'Food & Dining', icon: '🍽️', color: 'bg-red-100 text-red-800' },
  arts_culture: { label: 'Arts & Culture', icon: '🎨', color: 'bg-purple-100 text-purple-800' },
  fun_games: { label: 'Fun & Games', icon: '🎯', color: 'bg-blue-100 text-blue-800' },
  entertainment: { label: 'Entertainment', icon: '🎭', color: 'bg-pink-100 text-pink-800' },
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [availableActivities, setAvailableActivities] = useState<Record<string, Activity[]>>({});
  const [selectedActivitiesToAdd, setSelectedActivitiesToAdd] = useState<Set<number>>(new Set());
  const [isAddingActivities, setIsAddingActivities] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [activityLoadError, setActivityLoadError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    occupation: '',
    interests: '',
    values: '',
    lifestyle: '',
    relationship_goals: '',
    deal_breakers: '',
    personality: '',
    age_preference_min: 18,
    age_preference_max: 100,
    location_preference: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      // Initialize form data with current profile values
      setFormData({
        occupation: data.occupation || '',
        interests: data.interests || '',
        values: data.values || '',
        lifestyle: data.lifestyle || '',
        relationship_goals: data.relationship_goals || '',
        deal_breakers: data.deal_breakers || '',
        personality: data.personality || '',
        age_preference_min: data.age_preference_min || 18,
        age_preference_max: data.age_preference_max || 100,
        location_preference: data.location_preference || '',
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.updateProfile(formData);
      await loadProfile();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to current profile values
    if (profile) {
      setFormData({
        occupation: profile.occupation || '',
        interests: profile.interests || '',
        values: profile.values || '',
        lifestyle: profile.lifestyle || '',
        relationship_goals: profile.relationship_goals || '',
        deal_breakers: profile.deal_breakers || '',
        personality: profile.personality || '',
        age_preference_min: profile.age_preference_min || 18,
        age_preference_max: profile.age_preference_max || 100,
        location_preference: profile.location_preference || '',
      });
    }
    setIsEditing(false);
  };

  const handleRemoveActivity = async (userActivityId: number) => {
    if (!confirm('Remove this activity?')) return;

    try {
      await api.removeActivity(userActivityId);
      await loadProfile();
    } catch (error) {
      console.error('Failed to remove activity:', error);
      alert('Failed to remove activity. Please try again.');
    }
  };

  const handleOpenActivityModal = async () => {
    setShowActivityModal(true);
    setIsLoadingActivities(true);
    setActivityLoadError(null);
    try {
      const country = profile?.location === 'Singapore' ? 'singapore' : 'indonesia';
      console.log('Fetching activities for country:', country);
      const data = await api.getActivitiesByCategory(country);
      console.log('Activities fetched:', data);
      console.log('Number of categories:', Object.keys(data).length);
      setAvailableActivities(data);
    } catch (error: any) {
      console.error('Failed to load activities:', error);
      setActivityLoadError(error?.message || 'Failed to load activities. Please try again.');
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const toggleActivitySelection = (activityId: number) => {
    setSelectedActivitiesToAdd((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleAddActivities = async () => {
    if (selectedActivitiesToAdd.size === 0) {
      alert('Please select at least one activity');
      return;
    }

    setIsAddingActivities(true);
    try {
      for (const activityId of selectedActivitiesToAdd) {
        await api.addActivity(activityId, {});
      }
      await loadProfile();
      setShowActivityModal(false);
      setSelectedActivitiesToAdd(new Set());
    } catch (error) {
      console.error('Failed to add activities:', error);
      alert('Failed to add activities. Please try again.');
    } finally {
      setIsAddingActivities(false);
    }
  };

  const handleCloseActivityModal = () => {
    setShowActivityModal(false);
    setSelectedActivitiesToAdd(new Set());
    setActivityLoadError(null);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center py-12">Failed to load profile</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-gray-900">Your Profile</h1>
        {isEditing ? (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCancelEdit}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <X className="w-5 h-5" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="btn btn-primary flex items-center space-x-2"
            >
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Edit className="w-5 h-5" />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Basic Info */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {profile.name}, {profile.age}
              </h2>
              <div className="flex flex-col space-y-1 text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
                {profile.occupation && (
                  <div className="flex items-center space-x-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {profile.profile_completed ? (
            <span className="badge badge-success">✓ Complete</span>
          ) : (
            <span className="badge badge-warning">Incomplete</span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <p className="text-gray-700">{profile.email}</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Occupation</h3>
            {isEditing ? (
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Software Engineer, Teacher, etc."
              />
            ) : (
              <p className="text-gray-700">{profile.occupation || 'Not specified'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Interests</h3>
            {isEditing ? (
              <textarea
                value={formData.interests}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Hiking, photography, cooking, reading sci-fi..."
              />
            ) : (
              <p className="text-gray-700">{profile.interests || 'Not specified'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Values</h3>
            {isEditing ? (
              <textarea
                value={formData.values}
                onChange={(e) => setFormData({ ...formData, values: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Honesty, family, adventure, personal growth..."
              />
            ) : (
              <p className="text-gray-700">{profile.values || 'Not specified'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Lifestyle</h3>
            {isEditing ? (
              <textarea
                value={formData.lifestyle}
                onChange={(e) => setFormData({ ...formData, lifestyle: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Active and social, quiet evenings at home, traveling often..."
              />
            ) : (
              <p className="text-gray-700">{profile.lifestyle || 'Not specified'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Relationship Goals</h3>
            {isEditing ? (
              <textarea
                value={formData.relationship_goals}
                onChange={(e) => setFormData({ ...formData, relationship_goals: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Looking for long-term partnership, casual dating, marriage..."
              />
            ) : (
              <p className="text-gray-700">{profile.relationship_goals || 'Not specified'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Deal-Breakers</h3>
            {isEditing ? (
              <textarea
                value={formData.deal_breakers}
                onChange={(e) => setFormData({ ...formData, deal_breakers: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Smoking, no pets, long distance..."
              />
            ) : (
              <p className="text-gray-700">{profile.deal_breakers || 'Not specified'}</p>
            )}
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Personality</h3>
            {isEditing ? (
              <textarea
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Outgoing and spontaneous, thoughtful and introspective..."
              />
            ) : (
              <p className="text-gray-700">{profile.personality || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Match Preferences</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Age Range</p>
            {isEditing ? (
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Min Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age_preference_min}
                    onChange={(e) => setFormData({ ...formData, age_preference_min: parseInt(e.target.value) || 18 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <span className="text-gray-500">-</span>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">Max Age</label>
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={formData.age_preference_max}
                    onChange={(e) => setFormData({ ...formData, age_preference_max: parseInt(e.target.value) || 100 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-900">
                {profile.age_preference_min} - {profile.age_preference_max} years old
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Location Preference</p>
            {isEditing ? (
              <input
                type="text"
                value={formData.location_preference}
                onChange={(e) => setFormData({ ...formData, location_preference: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="e.g., Within 10 miles, Same city, Willing to relocate..."
              />
            ) : (
              <p className="text-gray-900">{profile.location_preference || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Activities */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <Heart className="w-6 h-6 text-primary-600" />
            <span>Your Activities ({profile.activities?.length || 0})</span>
          </h3>
          <button
            onClick={handleOpenActivityModal}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Activities</span>
          </button>
        </div>

        {!profile.activities || profile.activities.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No activities selected yet</p>
            <p className="text-sm text-gray-500">
              Add activities you'd love to do on dates!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {profile.activities.map((ua) => (
              <div
                key={ua.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{ua.activity.icon}</span>
                    <h4 className="font-semibold text-gray-900">
                      {ua.activity.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleRemoveActivity(ua.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-1 text-sm text-gray-600">
                  {ua.specific_venue && (
                    <p>📍 {ua.specific_venue}</p>
                  )}
                  {ua.location_area && (
                    <p>🗺️ {ua.location_area}</p>
                  )}
                  {ua.preferred_time && (
                    <p>🕐 {ua.preferred_time}</p>
                  )}
                  {ua.notes && (
                    <p className="italic">💭 {ua.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="card bg-gradient-to-br from-primary-50 to-secondary-50">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Profile Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>✅ Select at least 3-5 activities for better matches</li>
          <li>✅ Add specific details to your activities (venues, times, notes)</li>
          <li>✅ Keep your profile info authentic and detailed</li>
          <li>✅ Update your preferences as they change</li>
        </ul>
      </div>

      {/* Activity Selection Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Add Activities</h2>
              <button
                onClick={handleCloseActivityModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {isLoadingActivities ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading activities...</p>
                </div>
              ) : activityLoadError ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-red-600 mb-4">{activityLoadError}</p>
                  <button
                    onClick={handleOpenActivityModal}
                    className="btn btn-primary"
                  >
                    Try Again
                  </button>
                </div>
              ) : Object.keys(availableActivities).length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-yellow-600" />
                  </div>
                  <p className="text-gray-600 mb-2">No activities available</p>
                  <p className="text-sm text-gray-500">Please contact support if this persists.</p>
                </div>
              ) : (
                <>
                  {Object.entries(availableActivities).map(([category, items]) => {
                    const categoryInfo = CATEGORY_INFO[category as keyof typeof CATEGORY_INFO];
                    // Filter out activities that the user already has
                    const existingActivityIds = new Set(profile?.activities?.map(ua => ua.activity.id) || []);
                    const availableItems = items.filter(activity => !existingActivityIds.has(activity.id));

                    if (availableItems.length === 0) return null;

                    return (
                      <div key={category}>
                        <div className="flex items-center space-x-2 mb-3">
                          <span className="text-2xl">{categoryInfo.icon}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{categoryInfo.label}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {availableItems.map((activity) => (
                            <button
                              key={activity.id}
                              type="button"
                              onClick={() => toggleActivitySelection(activity.id)}
                              className={clsx(
                                'p-4 rounded-lg border-2 text-left transition-all',
                                selectedActivitiesToAdd.has(activity.id)
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
                                {selectedActivitiesToAdd.has(activity.id) && (
                                  <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(availableActivities).length > 0 &&
                   Object.values(availableActivities).every(items => {
                    const existingActivityIds = new Set(profile?.activities?.map(ua => ua.activity.id) || []);
                    return items.every(activity => existingActivityIds.has(activity.id));
                  }) && (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">You've already added all available activities!</p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-semibold">{selectedActivitiesToAdd.size}</span> activities
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCloseActivityModal}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddActivities}
                  disabled={selectedActivitiesToAdd.size === 0 || isAddingActivities}
                  className="btn btn-primary"
                >
                  {isAddingActivities ? 'Adding...' : `Add ${selectedActivitiesToAdd.size > 0 ? selectedActivitiesToAdd.size : ''} Activities`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
