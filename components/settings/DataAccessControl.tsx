// データアクセス制御コンポーネント
// 設定ページで使用

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Eye, Save } from 'lucide-react';
import type { User } from '@/types';

interface MentorAccess {
  relationshipId: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  relationshipStatus: string;
  permissions: {
    id: string;
    allowGoals: boolean;
    allowTasks: boolean;
    allowLogs: boolean;
    allowReflections: boolean;
    allowAiReports: boolean;
    isActive: boolean;
  } | null;
}

interface DataAccessControlProps {
  user: User;
}

export function DataAccessControl({ user }: DataAccessControlProps) {
  const [mentorAccesses, setMentorAccesses] = useState<MentorAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [localPermissions, setLocalPermissions] = useState<{
    [key: string]: {
      allowGoals: boolean;
      allowTasks: boolean;
      allowLogs: boolean;
      allowReflections: boolean;
      allowAiReports: boolean;
    };
  }>({});

  useEffect(() => {
    fetchDataAccessSettings();
  }, []);

  const fetchDataAccessSettings = async () => {
    try {
      const response = await fetch('/api/client/data-access');
      if (!response.ok) {
        throw new Error('データアクセス設定の取得に失敗しました');
      }
      const { data } = await response.json();
      setMentorAccesses(data);

      // ローカル状態を初期化
      const initialPermissions: typeof localPermissions = {};
      data.forEach((access: MentorAccess) => {
        if (access.permissions) {
          initialPermissions[access.relationshipId] = {
            allowGoals: access.permissions.allowGoals,
            allowTasks: access.permissions.allowTasks,
            allowLogs: access.permissions.allowLogs,
            allowReflections: access.permissions.allowReflections,
            allowAiReports: access.permissions.allowAiReports,
          };
        }
      });
      setLocalPermissions(initialPermissions);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionToggle = (
    relationshipId: string,
    permissionKey: keyof typeof localPermissions[string]
  ) => {
    setLocalPermissions((prev) => ({
      ...prev,
      [relationshipId]: {
        ...prev[relationshipId],
        [permissionKey]: !prev[relationshipId]?.[permissionKey],
      },
    }));
  };

  const handleSavePermissions = async (relationshipId: string) => {
    setIsSaving(relationshipId);
    setError(null);

    try {
      const permissions = localPermissions[relationshipId];
      const response = await fetch('/api/client/data-access', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationshipId,
          ...permissions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'アクセス権限の更新に失敗しました');
      }

      // 設定を再取得して最新状態に更新
      await fetchDataAccessSettings();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>データアクセス制御</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (mentorAccesses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            データアクセス制御
          </CardTitle>
          <CardDescription>
            メンターに公開するデータの範囲を個別に設定できます
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            まだメンター関係がありません。メンターから招待を受け取ると、ここで設定できるようになります。
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          データアクセス制御
        </CardTitle>
        <CardDescription>
          メンターに公開するデータの範囲を個別に設定できます
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {mentorAccesses.map((access, index) => (
            <div key={access.relationshipId}>
              {index > 0 && <Separator className="my-4" />}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium">{access.mentorName}</h4>
                    <p className="text-xs text-muted-foreground">{access.mentorEmail}</p>
                  </div>
                  <Badge
                    variant={access.relationshipStatus === 'active' ? 'default' : 'secondary'}
                  >
                    {access.relationshipStatus === 'active' ? 'アクティブ' : '保留中'}
                  </Badge>
                </div>

                {access.permissions && localPermissions[access.relationshipId] && (
                  <div className="space-y-3 pl-4 border-l-2 border-muted">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${access.relationshipId}-goals`} className="text-sm">
                        目標
                      </Label>
                      <Switch
                        id={`${access.relationshipId}-goals`}
                        checked={localPermissions[access.relationshipId].allowGoals}
                        onCheckedChange={() =>
                          handlePermissionToggle(access.relationshipId, 'allowGoals')
                        }
                        disabled={access.relationshipStatus !== 'active'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${access.relationshipId}-tasks`} className="text-sm">
                        タスク
                      </Label>
                      <Switch
                        id={`${access.relationshipId}-tasks`}
                        checked={localPermissions[access.relationshipId].allowTasks}
                        onCheckedChange={() =>
                          handlePermissionToggle(access.relationshipId, 'allowTasks')
                        }
                        disabled={access.relationshipStatus !== 'active'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${access.relationshipId}-logs`} className="text-sm">
                        ログ
                      </Label>
                      <Switch
                        id={`${access.relationshipId}-logs`}
                        checked={localPermissions[access.relationshipId].allowLogs}
                        onCheckedChange={() =>
                          handlePermissionToggle(access.relationshipId, 'allowLogs')
                        }
                        disabled={access.relationshipStatus !== 'active'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${access.relationshipId}-reflections`} className="text-sm">
                        振り返り
                      </Label>
                      <Switch
                        id={`${access.relationshipId}-reflections`}
                        checked={localPermissions[access.relationshipId].allowReflections}
                        onCheckedChange={() =>
                          handlePermissionToggle(access.relationshipId, 'allowReflections')
                        }
                        disabled={access.relationshipStatus !== 'active'}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor={`${access.relationshipId}-ai-reports`} className="text-sm">
                        AI分析レポート
                      </Label>
                      <Switch
                        id={`${access.relationshipId}-ai-reports`}
                        checked={localPermissions[access.relationshipId].allowAiReports}
                        onCheckedChange={() =>
                          handlePermissionToggle(access.relationshipId, 'allowAiReports')
                        }
                        disabled={access.relationshipStatus !== 'active'}
                      />
                    </div>

                    <Button
                      onClick={() => handleSavePermissions(access.relationshipId)}
                      disabled={
                        isSaving === access.relationshipId || access.relationshipStatus !== 'active'
                      }
                      size="sm"
                      className="mt-2"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving === access.relationshipId ? '保存中...' : '設定を保存'}
                    </Button>
                  </div>
                )}

                {!access.permissions && (
                  <p className="text-xs text-muted-foreground pl-4">
                    アクセス権限が設定されていません
                  </p>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm mt-4">
              {error}
            </div>
          )}

          <div className="bg-muted/50 px-4 py-3 rounded-md text-xs text-muted-foreground mt-4">
            <Eye className="h-4 w-4 inline mr-2" />
            メンターがあなたのデータを閲覧すると、監査ログに記録されます。設定ページでいつでもアクセス権を変更できます。
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
