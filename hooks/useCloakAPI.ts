import { useCallback, useState } from 'react';

import {
  CloakAPIManagerConstructor,
  ProfileCreationOptions,
} from 'cloak-stealth';

const CloakManager = window.electron as CloakAPIManagerConstructor;

const useCloakAPI = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const getAllProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const profileIds = await CloakManager.getAllProfiles();
      return profileIds;
    } catch (error) {
      console.error('Error retrieving profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(async (profileId: string) => {
    setLoading(true);
    try {
      console.log('start', profileId);
      await CloakManager.start({ profileId });
    } catch (error) {
      console.error('Error starting profile:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProfile = useCallback(async () => {
    const profileOptions: ProfileCreationOptions = {
      name: 'Test Profile',
      os: 'win',
      canvas: { mode: 'noise', noise: 0.5 },
    };

    setLoading(true);
    try {
      const profileId = await CloakManager.create(profileOptions);
      console.log('profileId', profileId);
      await start(profileId);
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setLoading(false);
    }
  }, [start]);

  return { getAllProfiles, start, createProfile, loading };
};

export default useCloakAPI;
