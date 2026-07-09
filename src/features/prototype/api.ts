import { apiRequest } from "../../shared/api/client";

export type PrototypeStatus = "draft" | "building" | "ready";
export type PrototypeVisibility = "public" | "private";

export type CatalogPrototype = {
  id: string;
  categoryId: string;
  title: string;
  repoUrl: string;
  demoUrl: string | null;
  figmaUrl: string | null;
  summary: string;
  status: PrototypeStatus;
  visibility: PrototypeVisibility;
  tags: string[];
  checklist: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  images: string[];
};

export type CatalogCategory = {
  id: string;
  workspaceId: string | null;
  userId: string;
  title: string;
  summary: string;
  group: string;
  iconKey: string;
  tags: string[];
  checklist: string[];
  orderIdx: number;
  createdAt: string;
  updatedAt: string;
  prototypes: CatalogPrototype[];
};

export function getCategories(token: string): Promise<CatalogCategory[]> {
  return apiRequest<CatalogCategory[]>("/catalog/categories", {
    token,
    errorMessage: "카탈로그를 불러오지 못했습니다.",
  });
}

export type Review = {
  id: string;
  prototypeId: string;
  userId: string;
  userName: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  isMine: boolean;
};

export type ReviewStats = {
  avgRating: number;
  count: number;
  distribution: Record<number, number>;
};

export type ReviewListResponse = {
  items: Review[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  stats: ReviewStats;
};

export type MyReview = {
  id: string;
  prototypeId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
} | null;

export function getReviews(
  token: string,
  prototypeId: string,
): Promise<ReviewListResponse> {
  return apiRequest<ReviewListResponse>(`/prototypes/${prototypeId}/reviews`, {
    token,
    errorMessage: "리뷰를 불러오지 못했습니다.",
  });
}

export function getMyReview(
  token: string,
  prototypeId: string,
): Promise<MyReview> {
  return apiRequest<MyReview>(`/prototypes/${prototypeId}/reviews/me`, {
    token,
    errorMessage: "내 리뷰를 불러오지 못했습니다.",
  });
}

export function createReview(
  token: string,
  prototypeId: string,
  body: { rating: number; content: string },
): Promise<MyReview> {
  return apiRequest<MyReview>(`/prototypes/${prototypeId}/reviews`, {
    method: "POST",
    body,
    token,
    errorMessage: "리뷰를 등록하지 못했습니다.",
  });
}

export function updateMyReview(
  token: string,
  prototypeId: string,
  body: { rating?: number; content?: string },
): Promise<MyReview> {
  return apiRequest<MyReview>(`/prototypes/${prototypeId}/reviews/me`, {
    method: "PATCH",
    body,
    token,
    errorMessage: "리뷰를 수정하지 못했습니다.",
  });
}

export function deleteMyReview(
  token: string,
  prototypeId: string,
): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(
    `/prototypes/${prototypeId}/reviews/me`,
    {
      method: "DELETE",
      token,
      errorMessage: "리뷰를 삭제하지 못했습니다.",
    },
  );
}
