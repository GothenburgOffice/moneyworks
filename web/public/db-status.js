(async () => {
  const element = document.querySelector("[data-db-status]");
  if (!element) return;

  const endpoint = document.currentScript?.dataset.healthUrl || "/api/health";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Database check failed");
    const result = await response.json();
    element.textContent =
      result.status === "ok" ? element.dataset.connected : element.dataset.unavailable;
    element.dataset.state = result.status === "ok" ? "connected" : "unavailable";
  } catch {
    element.textContent = element.dataset.unavailable;
    element.dataset.state = "unavailable";
  } finally {
    clearTimeout(timeout);
  }
})();
