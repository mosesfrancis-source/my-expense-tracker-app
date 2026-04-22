export interface Budget {
  id?: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  limit: number;
}
