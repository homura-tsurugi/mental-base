// メンターダッシュボード用カスタムフック

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MentorDashboardService } from '@/lib/services/MentorDashboardService';
import type { MentorDashboardData, MentorClientRelationship } from '@/types';

/**
 * メンターダッシュボードデータ取得フック
 */
export function useMentorDashboard() {
  return useQuery<MentorDashboardData>({
    queryKey: ['mentor', 'dashboard'],
    queryFn: () => MentorDashboardService.getDashboardData(),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 2,
  });
}

/**
 * メンター-クライアント関係一覧取得フック
 */
export function useMentorRelationships() {
  return useQuery<MentorClientRelationship[]>({
    queryKey: ['mentor', 'relationships'],
    queryFn: () => MentorDashboardService.getRelationships(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * クライアント招待フック
 */
export function useInviteClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clientEmail,
      message,
    }: {
      clientEmail: string;
      message?: string;
    }) => MentorDashboardService.inviteClient(clientEmail, message),
    onSuccess: () => {
      // ダッシュボードと関係一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['mentor', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mentor', 'relationships'] });
    },
  });
}

/**
 * 関係終了フック
 */
export function useTerminateRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      relationshipId,
      reason,
    }: {
      relationshipId: string;
      reason?: string;
    }) => MentorDashboardService.terminateRelationship(relationshipId, reason),
    onSuccess: () => {
      // ダッシュボードと関係一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['mentor', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['mentor', 'relationships'] });
    },
  });
}

/**
 * 招待承認フック（クライアント側）
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ relationshipId }: { relationshipId: string }) =>
      MentorDashboardService.acceptInvitation(relationshipId),
    onSuccess: () => {
      // 関係一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['mentor', 'relationships'] });
    },
  });
}
