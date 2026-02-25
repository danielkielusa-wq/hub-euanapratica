export interface GuidedTourState {
  tour_completed?: boolean;
  checklist_dismissed?: boolean;
  confetti_shown?: boolean;
  catalog_visited?: boolean;
  step_complete_profile?: boolean;
  step_first_community_post?: boolean;
  step_analyze_resume?: boolean;
  step_explore_catalog?: boolean;
  step_view_report?: boolean;
}

export type ChecklistItemKey =
  | 'complete_profile'
  | 'first_community_post'
  | 'analyze_resume'
  | 'explore_catalog'
  | 'view_report';

export interface ChecklistItemStatus {
  key: ChecklistItemKey;
  label: string;
  description: string;
  href: string;
  completed: boolean;
}
