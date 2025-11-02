'use client';

import React from 'react';
import { Activity } from '@/types';
import { ActivityItem } from './ActivityItem';

interface RecentActivitiesProps {
  activities: Activity[];
}

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities }) => {
  return (
    <section className="px-6 py-6">
      <h2 className="text-lg font-bold mb-4 text-[var(--text-primary)]" data-testid="recent-activities-title">
        最近のアクティビティ
      </h2>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)]" data-testid="empty-activities-message">
          アクティビティはありません
        </div>
      ) : (
        <div>
          {activities.map((activity, index) => (
            <ActivityItem key={activity.id} activity={activity} index={index} />
          ))}
        </div>
      )}
    </section>
  );
};
