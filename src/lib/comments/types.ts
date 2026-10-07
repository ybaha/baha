export type PublicCommentUser = {
  name: string | null;
  image: string | null;
};

export type PublicComment = {
  id: string;
  text: string;
  createdAt: Date;
  user: PublicCommentUser;
  score: number;
  currentUserVote: -1 | 0 | 1;
};

export type CommentsPageResult = {
  comments: PublicComment[];
  nextCursor: string | undefined;
};
