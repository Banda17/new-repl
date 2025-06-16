import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { InsertUser } from "@db/schema";

type RequestResult = {
  ok: true;
  user?: Express.User;
} | {
  ok: false;
  message: string;
};

async function handleRequest(
  url: string,
  method: string,
  body?: InsertUser
): Promise<RequestResult> {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include"
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, message: data.message || response.statusText };
    }

    return { ok: true, user: data.user };
  } catch (e: any) {
    return { ok: false, message: e.toString() };
  }
}

async function fetchUser(): Promise<Express.User | null> {
  try {
    const response = await fetch('/api/user', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        return null;
      }
      throw new Error(`${response.status}: ${await response.text()}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function useUser() {
  const queryClient = useQueryClient();

  const { data: user, error, isLoading } = useQuery<Express.User | null, Error>({
    queryKey: ['user'],
    queryFn: fetchUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });

  const loginMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const result = await handleRequest('/api/login', 'POST', userData);
      if (!result.ok) {
        throw new Error(result.message);
      }
      if (result.user) {
        queryClient.setQueryData(['user'], result.user);
      }
      return result;
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const result = await handleRequest('/api/logout', 'POST');
      if (!result.ok) {
        throw new Error(result.message);
      }
      queryClient.setQueryData(['user'], null);
      return result;
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      const result = await handleRequest('/api/register', 'POST', userData);
      if (!result.ok) {
        throw new Error(result.message);
      }
      return result;
    }
  });

  return {
    user,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    register: registerMutation.mutateAsync,
  };
}