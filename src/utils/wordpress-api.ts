import axios, { AxiosInstance, AxiosError } from "axios";
import FormData from "form-data";
import * as fs from "fs";
import * as path from "path";
import type {
  WPPost,
  WPPostCreate,
  WPPostUpdate,
  WPMedia,
  WPCategory,
  WPTag,
  WPCategoryCreate,
  WPTagCreate,
  WPError,
  WPTaxonomy,
  WPTerm,
  WPTermCreate,
} from "../types/wordpress.js";

export class WordPressAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public wpError?: WPError
  ) {
    super(message);
    this.name = "WordPressAPIError";
  }
}

export class WordPressAPI {
  private client: AxiosInstance;
  private baseURL: string;
  private postType: string;

  constructor(
    baseURL: string,
    username: string,
    appPassword: string,
    postType: string = "posts"
  ) {
    this.baseURL = baseURL.replace(/\/$/, "");
    this.postType = postType;

    const credentials = Buffer.from(`${username}:${appPassword}`).toString(
      "base64"
    );

    this.client = axios.create({
      baseURL: `${this.baseURL}/wp-json/wp/v2`,
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });
  }

  // 投稿タイプのエンドポイントを取得
  private getPostEndpoint(): string {
    return `/${this.postType}`;
  }

  private handleError(error: unknown): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<WPError>;
      const status = axiosError.response?.status;
      const wpError = axiosError.response?.data;

      if (status === 401) {
        throw new WordPressAPIError(
          "Authentication failed. Please check your username and application password.",
          status,
          wpError
        );
      }
      if (status === 403) {
        throw new WordPressAPIError(
          "Permission denied. Your user may not have sufficient privileges.",
          status,
          wpError
        );
      }
      if (status === 404) {
        throw new WordPressAPIError(
          "Resource not found. Please check if the REST API is enabled.",
          status,
          wpError
        );
      }

      throw new WordPressAPIError(
        wpError?.message || axiosError.message || "WordPress API request failed",
        status,
        wpError
      );
    }

    throw new WordPressAPIError(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }

  // ========== 投稿 (Posts) ==========

  async getPosts(options?: {
    page?: number;
    perPage?: number;
    status?: string;
    search?: string;
    categories?: number[];
    tags?: number[];
  }): Promise<WPPost[]> {
    try {
      const response = await this.client.get<WPPost[]>(this.getPostEndpoint(), {
        params: {
          page: options?.page || 1,
          per_page: options?.perPage || 10,
          status: options?.status || "any",
          search: options?.search,
          categories: options?.categories?.join(","),
          tags: options?.tags?.join(","),
          context: "edit",
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getPost(postId: number): Promise<WPPost> {
    try {
      const response = await this.client.get<WPPost>(
        `${this.getPostEndpoint()}/${postId}`,
        {
          params: { context: "edit" },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createPost(data: WPPostCreate): Promise<WPPost> {
    try {
      const response = await this.client.post<WPPost>(this.getPostEndpoint(), {
        title: data.title,
        content: data.content,
        status: data.status || "draft",
        excerpt: data.excerpt,
        categories: data.categories,
        tags: data.tags,
        featured_media: data.featured_media,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePost(postId: number, data: WPPostUpdate): Promise<WPPost> {
    try {
      const response = await this.client.post<WPPost>(
        `${this.getPostEndpoint()}/${postId}`,
        data
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deletePost(
    postId: number,
    force: boolean = false
  ): Promise<{ deleted: boolean; previous: WPPost }> {
    try {
      const response = await this.client.delete(
        `${this.getPostEndpoint()}/${postId}`,
        {
          params: { force },
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ========== メディア (Media) ==========

  async uploadMedia(
    filePath: string,
    options?: {
      title?: string;
      altText?: string;
      caption?: string;
    }
  ): Promise<WPMedia> {
    try {
      const absolutePath = path.resolve(filePath);

      if (!fs.existsSync(absolutePath)) {
        throw new WordPressAPIError(`File not found: ${absolutePath}`);
      }

      const filename = path.basename(absolutePath);
      const fileBuffer = fs.readFileSync(absolutePath);
      const mimeType = this.getMimeType(filename);

      const formData = new FormData();
      formData.append("file", fileBuffer, {
        filename,
        contentType: mimeType,
      });

      if (options?.title) {
        formData.append("title", options.title);
      }
      if (options?.altText) {
        formData.append("alt_text", options.altText);
      }
      if (options?.caption) {
        formData.append("caption", options.caption);
      }

      const response = await this.client.post<WPMedia>("/media", formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });

      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getMedia(mediaId: number): Promise<WPMedia> {
    try {
      const response = await this.client.get<WPMedia>(`/media/${mediaId}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async deleteMedia(
    mediaId: number,
    force: boolean = true
  ): Promise<{ deleted: boolean; previous: WPMedia }> {
    try {
      const response = await this.client.delete(`/media/${mediaId}`, {
        params: { force },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  // ========== カテゴリ (Categories) ==========

  async getCategories(options?: {
    page?: number;
    perPage?: number;
    search?: string;
  }): Promise<WPCategory[]> {
    try {
      const response = await this.client.get<WPCategory[]>("/categories", {
        params: {
          page: options?.page || 1,
          per_page: options?.perPage || 100,
          search: options?.search,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createCategory(data: WPCategoryCreate): Promise<WPCategory> {
    try {
      const response = await this.client.post<WPCategory>("/categories", {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parent: data.parent,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ========== タグ (Tags) ==========

  async getTags(options?: {
    page?: number;
    perPage?: number;
    search?: string;
  }): Promise<WPTag[]> {
    try {
      const response = await this.client.get<WPTag[]>("/tags", {
        params: {
          page: options?.page || 1,
          per_page: options?.perPage || 100,
          search: options?.search,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTag(data: WPTagCreate): Promise<WPTag> {
    try {
      const response = await this.client.post<WPTag>("/tags", {
        name: data.name,
        slug: data.slug,
        description: data.description,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ========== カスタムタクソノミー (Custom Taxonomies) ==========

  async getTaxonomies(): Promise<Record<string, WPTaxonomy>> {
    try {
      const response = await this.client.get<Record<string, WPTaxonomy>>("/taxonomies");
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async getTaxonomyTerms(
    taxonomy: string,
    options?: {
      page?: number;
      perPage?: number;
      search?: string;
      parent?: number;
      hide_empty?: boolean;
    }
  ): Promise<WPTerm[]> {
    try {
      const response = await this.client.get<WPTerm[]>(`/${taxonomy}`, {
        params: {
          page: options?.page || 1,
          per_page: options?.perPage || 100,
          search: options?.search,
          parent: options?.parent,
          hide_empty: options?.hide_empty ?? false,
        },
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async createTaxonomyTerm(
    taxonomy: string,
    data: WPTermCreate
  ): Promise<WPTerm> {
    try {
      const response = await this.client.post<WPTerm>(`/${taxonomy}`, {
        name: data.name,
        slug: data.slug,
        description: data.description,
        parent: data.parent,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  async updatePostTaxonomyTerms(
    postId: number,
    taxonomy: string,
    termIds: number[]
  ): Promise<WPPost> {
    try {
      const response = await this.client.post<WPPost>(
        `${this.getPostEndpoint()}/${postId}`,
        {
          [taxonomy]: termIds,
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  // ========== ユーティリティ ==========

  getAdminPostUrl(postId: number): string {
    return `${this.baseURL}/wp-admin/post.php?post=${postId}&action=edit`;
  }

  getPostPreviewUrl(postId: number): string {
    return `${this.baseURL}/?p=${postId}&preview=true`;
  }
}
