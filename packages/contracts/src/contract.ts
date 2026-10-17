import { apiProcedure } from "./errors.js";
import {
  commentsCreateInputSchema,
  commentsCreateOutputSchema,
  commentsListInputSchema,
  commentsListOutputSchema,
  visitsNotifyInputSchema,
  visitsNotifyOutputSchema,
  viewsGetInputSchema,
  viewsGetOutputSchema,
  viewsIncrementInputSchema,
  viewsIncrementOutputSchema,
  votesToggleInputSchema,
  votesToggleOutputSchema,
} from "./schemas.js";

export const commentsListContract = apiProcedure
  .input(commentsListInputSchema)
  .output(commentsListOutputSchema);

export const commentsCreateContract = apiProcedure
  .input(commentsCreateInputSchema)
  .output(commentsCreateOutputSchema);

export const votesToggleContract = apiProcedure
  .input(votesToggleInputSchema)
  .output(votesToggleOutputSchema);

export const viewsGetContract = apiProcedure
  .input(viewsGetInputSchema)
  .output(viewsGetOutputSchema);

export const viewsIncrementContract = apiProcedure
  .input(viewsIncrementInputSchema)
  .output(viewsIncrementOutputSchema);

export const visitsNotifyContract = apiProcedure
  .input(visitsNotifyInputSchema)
  .output(visitsNotifyOutputSchema);

export const contract = {
  comments: {
    list: commentsListContract,
    create: commentsCreateContract,
  },
  votes: {
    toggle: votesToggleContract,
  },
  views: {
    get: viewsGetContract,
    increment: viewsIncrementContract,
  },
  visits: {
    notify: visitsNotifyContract,
  },
};
