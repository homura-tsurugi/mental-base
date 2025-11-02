// クライアント詳細用カスタムフック

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientDetailService } from '@/lib/services/ClientDetailService';
import type {
  ClientDetailData,
  MentorNote,
  ClientProgressReport,
} from '@/types';

/**
 * クライアント詳細データ取得フック
 */
export function useClientDetail(clientId: string) {
  return useQuery<ClientDetailData>({
    queryKey: ['mentor', 'client', clientId],
    queryFn: () => ClientDetailService.getClientDetail(clientId),
    staleTime: 3 * 60 * 1000, // 3分間キャッシュ
    retry: 2,
    enabled: !!clientId, // clientIdが存在する場合のみ実行
  });
}

/**
 * メンターノート一覧取得フック
 */
export function useMentorNotes(clientId: string) {
  return useQuery<MentorNote[]>({
    queryKey: ['mentor', 'notes', clientId],
    queryFn: () => ClientDetailService.getNotes(clientId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!clientId,
  });
}

/**
 * メンターノート作成フック
 */
export function useCreateMentorNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (note: {
      clientId: string;
      title: string;
      content: string;
      noteType?: string;
      isSharedWithClient?: boolean;
      tags?: string[];
      linkedDataType?: string | null;
      linkedDataId?: string | null;
    }) => ClientDetailService.createNote(note),
    onSuccess: (_, variables) => {
      // ノート一覧を再取得
      queryClient.invalidateQueries({
        queryKey: ['mentor', 'notes', variables.clientId],
      });
    },
  });
}

/**
 * メンターノート更新フック
 */
export function useUpdateMentorNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      clientId,
      updates,
    }: {
      noteId: string;
      clientId: string;
      updates: {
        title?: string;
        content?: string;
        noteType?: string;
        isSharedWithClient?: boolean;
        tags?: string[];
        linkedDataType?: string | null;
        linkedDataId?: string | null;
      };
    }) => ClientDetailService.updateNote(noteId, updates),
    onSuccess: (_, variables) => {
      // ノート一覧を再取得
      queryClient.invalidateQueries({
        queryKey: ['mentor', 'notes', variables.clientId],
      });
    },
  });
}

/**
 * メンターノート削除フック
 */
export function useDeleteMentorNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      noteId,
      clientId,
    }: {
      noteId: string;
      clientId: string;
    }) => ClientDetailService.deleteNote(noteId),
    onSuccess: (_, variables) => {
      // ノート一覧を再取得
      queryClient.invalidateQueries({
        queryKey: ['mentor', 'notes', variables.clientId],
      });
    },
  });
}

/**
 * 進捗レポート一覧取得フック
 */
export function useProgressReports(clientId: string) {
  return useQuery<ClientProgressReport[]>({
    queryKey: ['mentor', 'reports', clientId],
    queryFn: () => ClientDetailService.getReports(clientId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    enabled: !!clientId,
  });
}

/**
 * 進捗レポート更新フック
 */
export function useUpdateProgressReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      clientId,
      updates,
    }: {
      reportId: string;
      clientId: string;
      updates: {
        mentorComments?: string;
        areasOfImprovement?: string[];
        strengths?: string[];
        nextSteps?: string;
        mentorRating?: number;
        overallProgress?: number;
      };
    }) => ClientDetailService.updateReport(reportId, updates),
    onSuccess: (_, variables) => {
      // レポート一覧を再取得
      queryClient.invalidateQueries({
        queryKey: ['mentor', 'reports', variables.clientId],
      });
    },
  });
}

/**
 * 進捗レポート共有フック
 */
export function useShareProgressReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      clientId,
    }: {
      reportId: string;
      clientId: string;
    }) => ClientDetailService.shareReport(reportId),
    onSuccess: (_, variables) => {
      // レポート一覧を再取得
      queryClient.invalidateQueries({
        queryKey: ['mentor', 'reports', variables.clientId],
      });
    },
  });
}
