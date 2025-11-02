'use client';

// MentorNotesTab - メンターノートタブ
// M-002: クライアント詳細

import { useEffect, useState } from 'react';
import { MentorNote, MentorNoteForm, NOTE_TYPE_DISPLAY_MAP } from '@/types';
import { MentorNoteFormComponent } from '../MentorNoteFormComponent';

interface MentorNotesTabProps {
  clientId: string;
  mentorId: string;
}

export function MentorNotesTab({ clientId, mentorId }: MentorNotesTabProps) {
  const [notes, setNotes] = useState<MentorNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<MentorNote | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [clientId]);

  async function fetchNotes() {
    // @MOCK_TO_API
    try {
      const response = await fetch(`/api/mentor/client/${clientId}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data.notes);
      }
    } catch (error) {
      console.error('メンターノートの取得に失敗しました:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateNote(formData: MentorNoteForm) {
    // @MOCK_TO_API
    try {
      const response = await fetch(`/api/mentor/client/${clientId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchNotes();
        setShowForm(false);
      }
    } catch (error) {
      console.error('ノート作成に失敗しました:', error);
    }
  }

  async function handleUpdateNote(noteId: string, formData: MentorNoteForm) {
    // @MOCK_TO_API
    try {
      const response = await fetch(
        `/api/mentor/client/${clientId}/notes/${noteId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        await fetchNotes();
        setEditingNote(null);
      }
    } catch (error) {
      console.error('ノート更新に失敗しました:', error);
    }
  }

  async function handleDeleteNote(noteId: string) {
    // @MOCK_TO_API
    if (!confirm('このノートを削除してもよろしいですか?')) return;

    try {
      const response = await fetch(
        `/api/mentor/client/${clientId}/notes/${noteId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        await fetchNotes();
      }
    } catch (error) {
      console.error('ノート削除に失敗しました:', error);
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-gray-100 rounded-lg p-4 animate-pulse h-32"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">メンターノート</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="material-icons text-base">add</span>
          新規ノート作成
        </button>
      </div>

      {/* ノート作成フォーム */}
      {showForm && (
        <MentorNoteFormComponent
          onSubmit={handleCreateNote}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* ノート一覧 */}
      {notes.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-sm text-gray-600">
            まだノートがありません。新規ノートを作成してクライアントの観察記録を残しましょう。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const isEditing = editingNote?.id === note.id;
            const typeDisplay = NOTE_TYPE_DISPLAY_MAP[note.noteType];

            return (
              <div key={note.id}>
                {isEditing ? (
                  <MentorNoteFormComponent
                    initialData={{
                      title: note.title,
                      content: note.content,
                      noteType: note.noteType,
                      isSharedWithClient: note.isSharedWithClient,
                      tags: note.tags,
                      linkedDataType: note.linkedDataType,
                      linkedDataId: note.linkedDataId,
                    }}
                    onSubmit={(formData) => handleUpdateNote(note.id, formData)}
                    onCancel={() => setEditingNote(null)}
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-base font-medium text-gray-900 mb-1">
                          {note.title}
                        </h4>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: typeDisplay.badgeColor,
                            color: typeDisplay.textColor,
                          }}
                        >
                          {typeDisplay.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingNote(note)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          <span className="material-icons text-base">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <span className="material-icons text-base">delete</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-900 mb-3 whitespace-pre-line">
                      {note.content}
                    </p>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div>
                        <span>作成日: {formatDate(note.createdAt)}</span>
                        {note.tags.length > 0 && (
                          <span className="ml-3">
                            タグ: {note.tags.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-icons text-sm">
                          {note.isSharedWithClient ? 'public' : 'lock'}
                        </span>
                        {note.isSharedWithClient ? '公開' : '非公開'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
