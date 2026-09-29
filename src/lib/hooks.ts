import { useEffect, useState } from "react";

/** Current time, re-rendering every minute (keeps "now" highlights live). */
export function useDate() {
  const [date, setDate] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setDate(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  return { date };
}
