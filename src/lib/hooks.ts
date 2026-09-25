import { useState } from "react";

export function useDate() {
  const [date, setDate] = useState(new Date());
  return { date, setDate };
}
