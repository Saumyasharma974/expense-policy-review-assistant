import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ReviewActionPayload } from 'shared';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useClaims() {
  return useQuery({
    queryKey: ['claims'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/claims`);
      if (!res.ok) throw new Error('Failed to fetch claims');
      return res.json();
    }
  });
}

export function useClaim(id: string | undefined) {
  return useQuery({
    queryKey: ['claims', id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/claims/${id}`);
      if (!res.ok) throw new Error('Failed to fetch claim');
      return res.json();
    },
    enabled: !!id
  });
}

export function useAnalyzeClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/claims/${id}/analyze`, { method: 'POST' });
      if (!res.ok) throw new Error('AI analysis failed');
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['claims', id] });
    }
  });
}

export function useReviewClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string, payload: ReviewActionPayload }) => {
      const res = await fetch(`${API_BASE}/claims/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Review action failed');
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['claims', id] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    }
  });
}
