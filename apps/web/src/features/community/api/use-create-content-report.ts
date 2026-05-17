import type {
  CreateContentReportDtoReasonEnum,
  CreateContentReportDtoTargetTypeEnum,
} from '@steam-achievement/client-sdk';
import { useMutation } from '@tanstack/react-query';

import { reportsApi } from '@/lib/api/client';

export function useCreateContentReport() {
  return useMutation({
    mutationFn: (input: {
      targetType: CreateContentReportDtoTargetTypeEnum;
      targetId: string;
      reason: CreateContentReportDtoReasonEnum;
      details?: string | null;
    }) =>
      reportsApi.createContentReport({
        createContentReportDto: input,
      }),
  });
}
