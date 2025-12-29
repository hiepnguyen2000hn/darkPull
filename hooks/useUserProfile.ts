import { useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { getUserProfile } from '@/lib/services';
import {
  userProfileAtom,
  profileLoadingAtom,
  profileErrorAtom,
  updateProfileAtom,
  setProfileLoadingAtom,
  setProfileErrorAtom,
  clearProfileAtom,
} from '@/store/profile';

/**
 * Custom hook to fetch and manage user profile
 *
 * Automatically updates profile store when fetching from API
 *
 * @example
 * const { profile, loading, error, fetchProfile, clearProfile } = useUserProfile();
 *
 * // Fetch profile
 * await fetchProfile('clp5abc123');
 *
 * // Access profile data
 * console.log(profile?.available_balances);
 */
export function useUserProfile() {
  const profile = useAtomValue(userProfileAtom);
  const loading = useAtomValue(profileLoadingAtom);
  const error = useAtomValue(profileErrorAtom);

  const updateProfile = useSetAtom(updateProfileAtom);
  const setLoading = useSetAtom(setProfileLoadingAtom);
  const setError = useSetAtom(setProfileErrorAtom);
  const clearProfile = useSetAtom(clearProfileAtom);

  /**
   * Fetch user profile from API and update store
   * @param walletId - Privy user ID (without "did:privy:" prefix)
   */
  const fetchProfile = useCallback(async (walletId: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching user profile from API...');
      const profileData = await getUserProfile(walletId);

      console.log('✅ Profile fetched, updating store...');
      updateProfile(profileData);

      return profileData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch profile';
      console.error('❌ Error fetching profile:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateProfile, setLoading, setError]);

  /**
   * Refetch current profile (useful after order/transfer)
   * @param walletId - Privy user ID (without "did:privy:" prefix)
   */
  const refetchProfile = useCallback(async (walletId: string) => {
    console.log('🔄 Refetching profile to get latest state...');
    return await fetchProfile(walletId);
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    refetchProfile,
    clearProfile,
  };
}