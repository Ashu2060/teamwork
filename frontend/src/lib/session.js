export const createSessionId = () => {
  const existingId = localStorage.getItem("mm_session_id");

  if (existingId) {
    return existingId;
  }

  const newId = crypto.randomUUID();
  localStorage.setItem("mm_session_id", newId);
  return newId;
};
