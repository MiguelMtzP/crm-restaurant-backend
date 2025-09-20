import { IsString } from 'class-validator';

export class AddChefToDishDto {
  @IsString()
  chefId: string;
}
