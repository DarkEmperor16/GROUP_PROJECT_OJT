import { useQuery } from "@tanstack/react-query";
import { qaQueryKeys, qaService } from "../services";
import type { QaListParams } from "../types";

export function useQaHistoryQuery(params: QaListParams) {
  return useQuery({
    queryKey: qaQueryKeys.list(params),
    queryFn: () => qaService.list(params),
    placeholderData: (previous) => previous,
  });
}
