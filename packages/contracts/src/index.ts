export { contract } from "./contract.js";
export {
  commentsCreateContract,
  commentsListContract,
  visitsNotifyContract,
  visitsPublicKeyContract,
  visitsEncryptedContract,
  viewsGetContract,
  viewsIncrementContract,
  votesToggleContract,
} from "./contract.js";
export {
  apiProcedure,
  apiErrorDataSchema,
  API_ERROR_HTTP_STATUS,
} from "./errors.js";
export type { ApiErrorCode } from "./errors.js";
export * from "./policy.js";
export * from "./schemas.js";

import type {
  ContractRouterClient,
  InferContractRouterInputs,
  InferContractRouterOutputs,
} from "@orpc/contract";

import type { contract } from "./contract.js";
import type {
  commentsCreateOutputSchema,
  commentsListOutputSchema,
  publicCommentSchema,
  visitsNotifyInputSchema,
  visitsNotifyOutputSchema,
  visitsPublicKeyOutputSchema,
  visitsEncryptedInputSchema,
  viewsGetOutputSchema,
  viewsIncrementOutputSchema,
  votesToggleOutputSchema,
} from "./schemas.js";
import type { z } from "zod";

export type AppContract = typeof contract;
export type AppClient = ContractRouterClient<AppContract>;
export type AppContractInputs = InferContractRouterInputs<AppContract>;
export type AppContractOutputs = InferContractRouterOutputs<AppContract>;

export type PublicCommentDto = z.infer<typeof publicCommentSchema>;
export type CommentsListResultDto = z.infer<typeof commentsListOutputSchema>;
export type CommentsCreateResultDto = z.infer<typeof commentsCreateOutputSchema>;
export type VoteToggleResultDto = z.infer<typeof votesToggleOutputSchema>;
export type ViewsMapDto = z.infer<typeof viewsGetOutputSchema>;
export type ViewIncrementResultDto = z.infer<typeof viewsIncrementOutputSchema>;
export type VisitNotifyInputDto = z.infer<typeof visitsNotifyInputSchema>;
export type VisitNotifyResultDto = z.infer<typeof visitsNotifyOutputSchema>;
export type VisitPublicKeyDto = z.infer<typeof visitsPublicKeyOutputSchema>;
export type EncryptedVisitDto = z.infer<typeof visitsEncryptedInputSchema>;
