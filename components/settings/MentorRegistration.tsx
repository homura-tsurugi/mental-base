// メンター登録コンポーネント
// 設定ページで使用

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Edit2, Check, X } from 'lucide-react';
import type { User } from '@/types';

interface MentorRegistrationProps {
  user: User;
  onUpdate: () => void;
}

export function MentorRegistration({ user, onUpdate }: MentorRegistrationProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bio, setBio] = useState(user.bio || '');
  const [expertiseInput, setExpertiseInput] = useState(
    user.expertise?.join(', ') || ''
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const expertise = expertiseInput
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      const response = await fetch('/api/user/mentor-registration', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio,
          expertise,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'メンター登録に失敗しました');
      }

      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              メンター登録
              {user.isMentor && (
                <Badge variant="default" className="ml-2">
                  登録済み
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              メンターとして登録し、クライアントの成長をサポートしましょう
            </CardDescription>
          </div>
          {user.isMentor && !isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              編集
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!user.isMentor && !isEditing ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              メンターとして登録すると、クライアントを招待して目標達成をサポートできます。
            </p>
            <Button onClick={() => setIsEditing(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              メンターとして登録する
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                placeholder="メンターとしての経験や専門分野などを入力してください"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise">専門分野（カンマ区切り）</Label>
              <Input
                id="expertise"
                placeholder="例: キャリア相談, 時間管理, ストレス管理"
                value={expertiseInput}
                onChange={(e) => setExpertiseInput(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                複数の専門分野をカンマで区切って入力してください
              </p>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                <Check className="h-4 w-4 mr-2" />
                {isLoading ? '保存中...' : user.isMentor ? '更新' : '登録'}
              </Button>
              {isEditing && user.isMentor && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setBio(user.bio || '');
                    setExpertiseInput(user.expertise?.join(', ') || '');
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  キャンセル
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
