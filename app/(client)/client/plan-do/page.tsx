'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { GoalCard } from '@/components/plan-do/GoalCard';
import { TaskItem } from '@/components/plan-do/TaskItem';
import { LogForm } from '@/components/plan-do/LogForm';
import { GoalModal } from '@/components/plan-do/GoalModal';
import { TaskModal } from '@/components/plan-do/TaskModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePlanDoData } from '@/hooks/usePlanDoData';
import { GoalWithProgress, GoalForm, TaskForm, LogForm as LogFormType } from '@/types';

const PlanDoPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    activeTab,
    setActiveTab,
    createGoal,
    updateGoal,
    deleteGoal,
    createTask,
    toggleTaskCompletion,
    createLog,
  } = usePlanDoData('plan');

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithProgress | null>(null);

  // Loading state
  if (loading) {
    return (
      <MainLayout>
        <div data-testid="loading-state" className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-[var(--text-secondary)]">読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayout>
        <div className="p-4">
          <Card data-testid="error-message" className="p-4 bg-[var(--error-light)] border-[var(--error)]">
            <p className="text-[var(--error)] font-medium">エラーが発生しました: {error.message}</p>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="p-4">
          <p className="text-[var(--text-secondary)]">データがありません</p>
        </div>
      </MainLayout>
    );
  }

  // Handlers
  const handleCreateGoal = async (form: GoalForm) => {
    await createGoal(form);
  };

  const handleEditGoal = (goal: GoalWithProgress) => {
    setEditingGoal(goal);
    setIsGoalModalOpen(true);
  };

  const handleUpdateGoal = async (form: GoalForm) => {
    if (editingGoal) {
      await updateGoal(editingGoal.id, form);
      setEditingGoal(null);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm('この目標を削除してもよろしいですか?')) {
      await deleteGoal(id);
    }
  };

  const handleCreateTask = async (form: TaskForm) => {
    await createTask(form);
  };

  const handleToggleTask = async (id: string) => {
    await toggleTaskCompletion(id);
  };

  const handleCreateLog = async (content: string, emotion?: string) => {
    const logForm: LogFormType = {
      content,
      emotion: emotion as any,
    };
    await createLog(logForm);
  };

  const handleCloseGoalModal = () => {
    setIsGoalModalOpen(false);
    setEditingGoal(null);
  };

  return (
    <MainLayout>
      <div className="p-4">
        {/* Page Title */}
        <h1 data-testid="page-title" className="text-2xl font-bold text-[var(--text-primary)] mb-6">計画・実行</h1>

        {/* Tab Switcher */}
        <div data-testid="tab-switcher" className="bg-[var(--bg-primary)] rounded-lg p-1 mb-6 shadow-sm flex gap-1">
          <button
            data-testid="tab-plan"
            data-active={activeTab === 'plan'}
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'plan'
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <span className="material-icons text-lg">assignment</span>
            Plan(計画)
          </button>
          <button
            data-testid="tab-do"
            data-active={activeTab === 'do'}
            onClick={() => setActiveTab('do')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'do'
                ? 'bg-[var(--success)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <span className="material-icons text-lg">check_circle</span>
            Do(実行)
          </button>
        </div>

        {/* Plan Tab Content */}
        {activeTab === 'plan' && (
          <div data-testid="plan-content">
            {/* Goal List */}
            {data.goals.length > 0 ? (
              <div data-testid="goal-list">
                {data.goals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                  />
                ))}
              </div>
            ) : (
              <Card data-testid="empty-goals-message" className="p-8 text-center mb-4">
                <span className="material-icons text-5xl text-[var(--text-tertiary)] mb-3">flag</span>
                <p className="text-[var(--text-secondary)] mb-2">まだ目標がありません</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  新しい目標を作成して、計画を始めましょう
                </p>
              </Card>
            )}

            {/* Create Goal Button */}
            <Button data-testid="btn-create-goal" onClick={() => setIsGoalModalOpen(true)} className="w-full">
              <span className="material-icons mr-2">add</span>
              新規目標を作成
            </Button>
          </div>
        )}

        {/* Do Tab Content */}
        {activeTab === 'do' && (
          <div data-testid="do-content">
            {/* Today's Tasks */}
            <Card data-testid="today-tasks-section" className="p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-[var(--primary)]">checklist</span>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">今日のタスク</h3>
              </div>

              {data.todayTasks.length > 0 ? (
                <div data-testid="task-list">
                  {data.todayTasks.map((task) => (
                    <TaskItem key={task.id} task={task} onToggle={handleToggleTask} />
                  ))}
                </div>
              ) : (
                <div data-testid="empty-tasks-message" className="text-center py-8">
                  <span className="material-icons text-4xl text-[var(--text-tertiary)] mb-2">
                    task_alt
                  </span>
                  <p className="text-sm text-[var(--text-secondary)]">今日のタスクはありません</p>
                </div>
              )}
            </Card>

            {/* Daily Log Form */}
            <LogForm emotionOptions={data.emotionOptions} onSubmit={handleCreateLog} />

            {/* Create Task Button */}
            <Button data-testid="btn-create-task" onClick={() => setIsTaskModalOpen(true)} className="w-full">
              <span className="material-icons mr-2">add</span>
              新規タスクを作成
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <GoalModal
        data-testid="modal-goal"
        isOpen={isGoalModalOpen}
        onClose={handleCloseGoalModal}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        editingGoal={editingGoal}
      />

      <TaskModal
        data-testid="modal-task"
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateTask}
        goals={data.goals}
      />
    </MainLayout>
  );
};

export default PlanDoPage;
