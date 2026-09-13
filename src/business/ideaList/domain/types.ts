import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { ideaLists, ideaItems } from '../server/schema';

export type IdeaList = InferSelectModel<typeof ideaLists>;
export type IdeaItem = InferSelectModel<typeof ideaItems>;
export type NewIdeaList = InferInsertModel<typeof ideaLists>;
export type NewIdeaItem = InferInsertModel<typeof ideaItems>;

export interface IdeaListFormData {
  name: string;
  description?: string;
  color: string;
}

export interface IdeaItemFormData {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
}

export interface IdeaListWithItems extends IdeaList {
  items: IdeaItem[];
  itemCount: number;
  completedCount: number;
}

export interface IdeaListResponse {
  success: boolean;
  data?: IdeaList;
  message?: string;
}

export interface IdeaListsResponse {
  success: boolean;
  data?: IdeaListWithItems[];
  message?: string;
}

export interface IdeaItemResponse {
  success: boolean;
  data?: IdeaItem;
  message?: string;
}

export interface IdeaItemsResponse {
  success: boolean;
  data?: IdeaItem[];
  message?: string;
}

export interface UseIdeaListsState {
  ideaLists: IdeaListWithItems[];
  loading: boolean;
  error: string | null;
  refreshLists: () => Promise<void>;
  createList: (data: IdeaListFormData) => Promise<{ success: boolean; newListId?: number }>;
  updateList: (id: number, data: Partial<IdeaListFormData>) => Promise<boolean>;
  deleteList: (id: number) => Promise<boolean>;
  reorderLists: (orderedIds: number[]) => Promise<boolean>;
  updateListStats: (listId: number, itemCountChange: number, completedCountChange: number) => void;
}

export interface UseIdeaItemsState {
  items: IdeaItem[];
  loading: boolean;
  error: string | null;
  refreshItems: (showLoading?: boolean) => Promise<void>;
  createItem: (listId: number, data: IdeaItemFormData) => Promise<boolean>;
  updateItem: (id: number, data: Partial<IdeaItemFormData>) => Promise<boolean>;
  deleteItem: (id: number) => Promise<boolean>;
  toggleComplete: (id: number) => Promise<boolean>;
  reorderItems: (listId: number, orderedIds: number[]) => Promise<boolean>;
}

export type ColorTheme =
  | 'blue'
  | 'green'
  | 'purple'
  | 'red'
  | 'yellow'
  | 'pink'
  | 'indigo'
  | 'gray';

export type ConvertToListInput = {
  name: string;
  description?: string;
  color?: string;
  deleteOriginal: boolean;
};
