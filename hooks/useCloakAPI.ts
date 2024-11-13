import { useState, useCallback } from 'react';
import {
  CloakAPIManagerConstructor,
  ProfileCreationOptions,
  ProfileData,
  PaginatedProfilesData,
  BrowserConnection,
  ProxyData,
} from 'cloak-stealth';

const CloakManager = window.electron as CloakAPIManagerConstructor & {
  ipcRenderer: {
    startApp: (profileId: string) => Promise<void>;
    closeBrowser: (profileId: string) => Promise<void>;
    getAllProfiles: (page: number, limit: number) => Promise<void>;
  };
};

const useCloakAPI = () => {
  const [loadingCount, setLoadingCount] = useState<number>(0);
  const [profileLoadingStates, setProfileLoadingStates] = useState<
    Record<string, boolean>
  >({});
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [paginationData, setPaginationData] = useState<
    Omit<PaginatedProfilesData, 'profiles'>
  >({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  const incrementLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  const decrementLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
  }, []);

  const getAllProfiles = useCallback(
    async (page: number = 1, limit: number = 50) => {
      incrementLoading();
      try {
        const data = await CloakManager.ipcRenderer.getAllProfiles(page, limit);
        console.log('Received profiles data:', data);
        if (data && Array.isArray(data.profiles)) {
          setProfiles(data.profiles);
          setPaginationData({
            total: data.total,
            page: data.page,
            limit: data.limit,
            totalPages: data.totalPages,
          });
        } else {
          setProfiles([]);
        }
        return data;
      } catch (error) {
        console.error('Error retrieving profiles:', error);
        setProfiles([]);
        return [];
      } finally {
        decrementLoading();
      }
    },
    [incrementLoading, decrementLoading],
  );

  const createProfile = useCallback(
    async (options: ProfileCreationOptions) => {
      incrementLoading();
      try {
        const profileId = await CloakManager.create(options);
        await getAllProfiles();
        return profileId;
      } catch (error) {
        console.error('Error creating profile:', error);
      } finally {
        decrementLoading();
      }
    },
    [getAllProfiles, incrementLoading, decrementLoading],
  );

  const deleteAllProfiles = useCallback(
    async (profileIds: string[]) => {
      incrementLoading();
      try {
        console.log('Deleting profiles:', profileIds);
        const results = await CloakManager.deleteAllProfiles(profileIds);
        console.log('Deletion results:', results);
        await getAllProfiles(); // Refresh the profiles list
        return results;
      } catch (error) {
        console.error('Error deleting profiles:', error);
        throw error; // Re-throw the error so it can be handled by the component
      } finally {
        decrementLoading();
      }
    },
    [getAllProfiles, incrementLoading, decrementLoading],
  );

  const deleteProfile = useCallback(
    async (profileId: string) => {
      incrementLoading();
      try {
        const result = await CloakManager.delete(profileId);
        await getAllProfiles();
        return result;
      } catch (error) {
        console.error('Error deleting profile:', error);
      } finally {
        decrementLoading();
      }
    },
    [getAllProfiles, incrementLoading, decrementLoading],
  );

  const updateProfile = useCallback(
    async (profileId: string, options: Partial<ProfileData>) => {
      incrementLoading();
      try {
        const updatedProfile = await CloakManager.updateProfile(
          profileId,
          options,
        );
        await getAllProfiles();
        return updatedProfile;
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        decrementLoading();
      }
    },
    [getAllProfiles, incrementLoading, decrementLoading],
  );

  const changeProfileProxy = useCallback(
    async (profileId: string, proxyData: ProxyData) => {
      incrementLoading();
      try {
        await CloakManager.changeProfileProxy(profileId, proxyData);
        await getAllProfiles();
      } catch (error) {
        console.error('Error changing profile proxy:', error);
      } finally {
        decrementLoading();
      }
    },
    [getAllProfiles, incrementLoading, decrementLoading],
  );

  const start = useCallback(
    async (profileId: string): Promise<BrowserConnection | void> => {
      setProfileLoadingStates((prev) => ({ ...prev, [profileId]: true }));
      try {
        await CloakManager.ipcRenderer.startApp(profileId);
      } catch (error) {
        console.error('Error starting profile:', error);
      } finally {
        setProfileLoadingStates((prev) => ({ ...prev, [profileId]: false }));
      }
    },
    [incrementLoading, decrementLoading],
  );

  const closeBrowser = useCallback(
    async (profileId: string) => {
      setProfileLoadingStates((prev) => ({ ...prev, [profileId]: true }));
      incrementLoading();
      try {
        console.log('closeBrowser', profileId);
        
        await CloakManager.ipcRenderer.closeBrowser(profileId);
      } catch (error) {
        console.error('Error closing browser:', error);
      } finally {
        setProfileLoadingStates((prev) => ({ ...prev, [profileId]: false }));
        decrementLoading();
      }
    },
    [incrementLoading, decrementLoading],
  );

  return {
    deleteAllProfiles,
    getAllProfiles,
    start,
    createProfile,
    deleteProfile,
    updateProfile,
    changeProfileProxy,
    closeBrowser,
    loading: loadingCount > 0,
    profiles,
    paginationData,
    profileLoadingStates,
  };
};

export default useCloakAPI;
