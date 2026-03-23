const sessionStore = new Map();
const preferenceStore = new Map();

const createDefaultPreference = (sessionId) => ({
  sessionId,
  selectedMode: "therapist",
  autoModeEnabled: true,
  theme: "dark",
  voiceEnabled: true
});

const createDefaultSession = (sessionId, preference) => ({
  sessionId,
  selectedMode: preference.selectedMode,
  autoModeEnabled: preference.autoModeEnabled,
  messages: []
});

export const ensureMemoryState = (sessionId) => {
  let preference = preferenceStore.get(sessionId);

  if (!preference) {
    preference = createDefaultPreference(sessionId);
    preferenceStore.set(sessionId, preference);
  }

  let session = sessionStore.get(sessionId);

  if (!session) {
    session = createDefaultSession(sessionId, preference);
    sessionStore.set(sessionId, session);
  }

  return { session, preference };
};

export const saveMemoryState = ({ session, preference }) => {
  sessionStore.set(session.sessionId, session);
  preferenceStore.set(preference.sessionId, preference);
};
