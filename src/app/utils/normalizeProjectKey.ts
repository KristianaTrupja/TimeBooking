export const normalizeProjectKey = (key: string) => {
  if (typeof key === "string" && key.startsWith("PID-")) {
    return "project-" + key.split("-")[1];
  }
  return key;
};
