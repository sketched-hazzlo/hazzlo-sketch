import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Moderator } from "@shared/schema";

export function useModerator() {
  const queryClient = useQueryClient();

  const {
    data: moderator,
    error,
    isLoading,
  } = useQuery<Moderator | null>({
    queryKey: ["/api/moderator/me"],
    queryFn: async () => {
      try {
        const response = await apiRequest("/api/moderator/me");
        return response;
      } catch {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/moderator/logout", {
        method: "POST"
      });
      return response;
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/moderator/me"], null);
      queryClient.clear();
    },
  });

  return {
    moderator: moderator || null,
    isLoading,
    error,
    isAuthenticated: !!moderator,
    logoutMutation,
  };
}