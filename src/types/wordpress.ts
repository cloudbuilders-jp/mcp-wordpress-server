// WordPress REST API 型定義

export interface WPPost {
  id: number;
  date: string;
  date_gmt: string;
  modified: string;
  modified_gmt: string;
  slug: string;
  status: "publish" | "future" | "draft" | "pending" | "private";
  type: string;
  link: string;
  title: {
    rendered: string;
    raw?: string;
  };
  content: {
    rendered: string;
    raw?: string;
    protected: boolean;
  };
  excerpt: {
    rendered: string;
    raw?: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  categories: number[];
  tags: number[];
}

export interface WPPostCreate {
  title: string;
  content: string;
  status?: "publish" | "draft" | "pending" | "private";
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
}

export interface WPPostUpdate {
  title?: string;
  content?: string;
  status?: "publish" | "draft" | "pending" | "private";
  excerpt?: string;
  categories?: number[];
  tags?: number[];
  featured_media?: number;
}

export interface WPMedia {
  id: number;
  date: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
    raw?: string;
  };
  author: number;
  alt_text: string;
  media_type: string;
  mime_type: string;
  source_url: string;
  media_details: {
    width: number;
    height: number;
    file: string;
    sizes?: Record<
      string,
      {
        file: string;
        width: number;
        height: number;
        mime_type: string;
        source_url: string;
      }
    >;
  };
}

export interface WPCategory {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  parent: number;
}

export interface WPTag {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
}

export interface WPError {
  code: string;
  message: string;
  data?: {
    status: number;
  };
}
