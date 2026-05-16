"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { DogProfile, DogFormData } from "@/lib/nutrition/types";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = typeof body.error === "string"
      ? body.error
      : JSON.stringify(body.error) ?? "Request failed";
    throw new Error(msg);
  }
  return res.json();
}

export function useDogs() {
  return useQuery<DogProfile[]>({
    queryKey: ["dogs"],
    queryFn: () => apiFetch("/api/dogs"),
  });
}

export function useDog(dogId: string) {
  return useQuery<DogProfile>({
    queryKey: ["dogs", dogId],
    queryFn: () => apiFetch(`/api/dogs/${dogId}`),
    enabled: !!dogId,
  });
}

export function useCreateDog() {
  const queryClient = useQueryClient();
  return useMutation<DogProfile, Error, DogFormData>({
    mutationFn: (data) =>
      apiFetch("/api/dogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
    },
  });
}

export function useUpdateDog(dogId: string) {
  const queryClient = useQueryClient();
  return useMutation<DogProfile, Error, Partial<DogFormData>>({
    mutationFn: (data) =>
      apiFetch(`/api/dogs/${dogId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(["dogs", dogId], updated);
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
    },
  });
}

export function useDeleteDog() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (dogId) => {
      const res = await fetch(`/api/dogs/${dogId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete dog");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dogs"] });
    },
  });
}
