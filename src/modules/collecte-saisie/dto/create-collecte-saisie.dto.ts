import { IsInt, IsNumber, IsNotEmpty, Min } from 'class-validator';


export class CreateCollecteSaisieDto {
  @IsInt() collecteId: number;
  @IsInt() magasinId: number;
  @IsInt() produitId: number;
  @IsInt() centreId: number;

  @IsNumber()
  @Min(0.01)
  poids: number;
}
