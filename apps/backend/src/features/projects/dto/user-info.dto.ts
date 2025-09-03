import { Expose } from 'class-transformer';

export class UserInfoDto {
  @Expose()
  public id!: string;

  @Expose()
  public email!: string;

  @Expose()
  public name!: string | null;
}