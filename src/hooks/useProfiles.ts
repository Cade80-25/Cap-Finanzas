import { useCallback, useMemo } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useLicense } from "./useLicense";

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  photoUrl?: string | null;
  createdAt: string;
}

interface ProfilesData {
  activeProfileId: string;
  profiles: Profile[];
}

const PROFILES_KEY = "cap-finanzas-profiles";
const DEFAULT_PROFILE_ID = "profile-default";

const PROFILE_AVATARS = ["👤", "👩", "👨", "👧", "👦", "🧑", "👵", "👴", "🧑‍💼", "🧑‍🎓"];

const defaultProfilesData: ProfilesData = {
  activeProfileId: DEFAULT_PROFILE_ID,
  profiles: [
    {
      id: DEFAULT_PROFILE_ID,
      name: "Yo",
      avatar: "👤",
      createdAt: new Date().toISOString(),
    },
  ],
};

export function useProfiles() {
  const [data, setData] = useLocalStorage<ProfilesData>(PROFILES_KEY, defaultProfilesData);
  const { maxProfiles } = useLicense();

  const activeProfile = useMemo(
    () => data.profiles.find((p) => p.id === data.activeProfileId) ?? data.profiles[0],
    [data]
  );

  const canAddProfile = data.profiles.length < maxProfiles;

  const setActiveProfile = useCallback(
    (profileId: string) => {
      setData((prev) => ({ ...prev, activeProfileId: profileId }));
    },
    [setData]
  );

  const addProfile = useCallback(
    (name: string, avatar?: string): { success: boolean; message: string } => {
      if (data.profiles.length >= maxProfiles) {
        return {
          success: false,
          message: maxProfiles <= 1
            ? "Tu licencia permite solo 1 perfil. La Licencia Completa ($12) permite hasta 3 perfiles."
            : `Has alcanzado el límite de ${maxProfiles} perfiles.`,
        };
      }

      const newProfile: Profile = {
        id: `profile-${Date.now()}`,
        name: name.trim() || `Perfil ${data.profiles.length + 1}`,
        avatar: avatar || PROFILE_AVATARS[data.profiles.length % PROFILE_AVATARS.length],
        createdAt: new Date().toISOString(),
      };

      setData((prev) => ({
        ...prev,
        profiles: [...prev.profiles, newProfile],
        activeProfileId: newProfile.id,
      }));

      return { success: true, message: `Perfil "${newProfile.name}" creado` };
    },
    [data.profiles.length, maxProfiles, setData]
  );

  const renameProfile = useCallback(
    (profileId: string, name: string, avatar?: string) => {
      setData((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === profileId
            ? { ...p, name: name.trim() || p.name, ...(avatar ? { avatar } : {}) }
            : p
        ),
      }));
    },
    [setData]
  );

  const setProfilePhoto = useCallback(
    (profileId: string, photoUrl: string | null) => {
      setData((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === profileId ? { ...p, photoUrl } : p
        ),
      }));
    },
    [setData]
  );

  const deleteProfile = useCallback(
    (profileId: string): { success: boolean; message: string } => {
      if (profileId === DEFAULT_PROFILE_ID) {
        return { success: false, message: "No puedes eliminar el perfil principal" };
      }
      if (data.profiles.length <= 1) {
        return { success: false, message: "Debes tener al menos un perfil" };
      }

      // Clean up profile's wallet data from localStorage
      const walletsKey = `cap-finanzas-wallets-${profileId}`;
      const walletsRaw = localStorage.getItem(walletsKey);
      if (walletsRaw) {
        try {
          const walletsData = JSON.parse(walletsRaw);
          if (walletsData.wallets) {
            walletsData.wallets.forEach((w: { id: string }) => {
              localStorage.removeItem(`cap-finanzas-journal-${profileId}-${w.id}`);
            });
          }
        } catch {}
        localStorage.removeItem(walletsKey);
      }

      setData((prev) => {
        const newProfiles = prev.profiles.filter((p) => p.id !== profileId);
        return {
          ...prev,
          profiles: newProfiles,
          activeProfileId:
            prev.activeProfileId === profileId ? newProfiles[0].id : prev.activeProfileId,
        };
      });

      return { success: true, message: "Perfil eliminado" };
    },
    [data.profiles.length, setData]
  );

  return {
    profiles: data.profiles,
    activeProfile,
    activeProfileId: data.activeProfileId,
    maxProfiles,
    canAddProfile,
    setActiveProfile,
    addProfile,
    renameProfile,
    deleteProfile,
    setProfilePhoto,
    profileAvatars: PROFILE_AVATARS,
  };
}
