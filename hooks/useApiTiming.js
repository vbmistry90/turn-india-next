import { useState, useEffect } from "react";
import { subscribeApiTiming, getApiTiming } from "@/lib/apiTimingStore";

/** Subscribes to the live API timing store. Re-renders on every API call. */
export default function useApiTiming() {
  const [state, setState] = useState(getApiTiming());

  useEffect(() => {
    return subscribeApiTiming((current, history) => setState({ current, history }));
  }, []);

  return state; // { current, history }
}
