export interface GuidedTourState {
  tour_completed?: boolean;
  checklist_dismissed?: boolean;
  catalog_visited?: boolean;
}

export type ChecklistItemKey =
  | 'complete_profile'
  | 'first_community_post'
  | 'analyze_resume'
  | 'explore_catalog';

export interface ChecklistItemStatus {
  key: ChecklistItemKey;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}
