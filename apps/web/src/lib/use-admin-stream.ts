import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function useAdminStream() {
  const [payload, setPayload] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    const source = new EventSource(`${API_URL}/admin/stream`);
    source.onmessage = (event) => {
      setPayload(JSON.parse(event.data) as Record<string, number>);
    };

    return () => source.close();
  }, []);

  return payload;
}
