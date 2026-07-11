import { prisma } from "@/lib/db";
import type { FeedbackKind } from "@prisma/client";

export type FeedbackInput = {
  name: string;
  email: string;
  kind: FeedbackKind;
  message: string;
  page?: string;
};

const KINDS: FeedbackKind[] = [
  "product_idea",
  "missing_feature",
  "product_issue",
  "complaint",
  "other",
];

export function isFeedbackKind(v: string): v is FeedbackKind {
  return KINDS.includes(v as FeedbackKind);
}

export async function createFeedback(input: FeedbackInput) {
  return prisma.feedback.create({
    data: {
      name: input.name.slice(0, 120),
      email: input.email.slice(0, 160).toLowerCase(),
      kind: input.kind,
      message: input.message.slice(0, 2000),
      page: input.page?.slice(0, 200) || null,
    },
  });
}

export async function listFeedback(limit = 200) {
  return prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
