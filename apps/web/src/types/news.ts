export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  url: string;
  imageUrl: string | null;
  category: string;
  publishedAt: string;
  createdAt: string;
}
