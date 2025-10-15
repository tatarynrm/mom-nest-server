// dto/pagination-query.dto.ts
import { IsOptional, IsInt, Min } from 'class-validator';


export class PaginationQueryDto {
  @IsOptional()

  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()

  @IsInt()
  @Min(1)
  limit?: number = 10;
}
