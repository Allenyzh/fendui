type AnalyticsWindow = Window & {
  gtag?: (
    command: "event",
    name: string,
    params?: Record<string, number>,
  ) => void;
};

export function trackEvent(name: string, params?: Record<string, number>) {
  (window as AnalyticsWindow).gtag?.("event", name, params);
}
