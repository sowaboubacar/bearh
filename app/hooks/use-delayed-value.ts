import { useEffect, useState } from "react";

export function useDelayedValue<T>(value: T, threshold = 100) {
  const [delayedValue, setDelayedValue] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDelayedValue(value);
    }, threshold);
    return () => clearTimeout(id);
  }, [value, threshold]);

  return delayedValue;
}