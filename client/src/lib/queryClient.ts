import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        // Handle array query keys by joining them with proper URL params
        let url = queryKey[0] as string;
        const params = queryKey[1] as Record<string, string>;
        
        if (params) {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value) searchParams.append(key, value);
          });
          url = `${url}?${searchParams.toString()}`;
        }

        console.log('Fetching:', url); // Debug log

        const res = await fetch(url, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          }
        });

        if (!res.ok) {
          console.error('Fetch error:', {
            status: res.status,
            statusText: res.statusText,
            url
          });

          if (res.status >= 500) {
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          }

          const errorText = await res.text();
          console.error('Error response:', errorText);
          throw new Error(`${res.status}: ${errorText}`);
        }

        const data = await res.json();
        console.log('Fetch success:', { url, data }); // Debug log
        return data;
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});
