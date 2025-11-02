'use client';

import React from 'react';
import { Activity } from '@/types';

interface ActivityItemProps {
  activity: Activity;
  index: number;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity, index }) => {
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) {
      return `${minutes}分前`;
    } else if (hours < 24) {
      return `${hours}時間前`;
    } else if (days === 1) {
      return '昨日';
    } else {
      return `${days}日前`;
    }
  };

  return (
    <div className="flex gap-4 p-4 bg-[var(--bg-primary)] rounded-[var(--radius-md)] mb-2 shadow-[var(--shadow-sm)]" data-testid={`activity-item-${index}`}>
      {/* Activity Icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: activity.backgroundColor }}
        data-testid="activity-icon"
        data-activity-type={activity.type}
      >
        <span className="material-icons" style={{ color: activity.iconColor }}>
          {activity.icon}
        </span>
      </div>

      {/* Activity Content */}
      <div className="flex-1">
        <div
          className="text-sm text-[var(--text-primary)] mb-1"
          dangerouslySetInnerHTML={{ __html: activity.description }}
          data-testid="activity-description"
        />
        <div className="text-xs text-[var(--text-tertiary)]" data-testid="activity-timestamp">
          {formatTimestamp(activity.timestamp)}
        </div>
      </div>
    </div>
  );
};
