"use client";

import useSWR, { type SWRResponse } from "swr";
import * as dataApi from "./data";
import type { ApiError } from "./errors";

/**
 * Current user profile as a shared SWR resource (key `/data/user`). Every screen
 * reads the same cache; `mutate()` revalidates it everywhere at once — call it
 * after `updateUser`. Returns the raw SWR response (`data/error/isLoading/mutate`).
 */
export function useUser(): SWRResponse<dataApi.ApiUser, ApiError> {
  return useSWR<dataApi.ApiUser, ApiError>("/data/user", () =>
    dataApi.getUser(),
  );
}
