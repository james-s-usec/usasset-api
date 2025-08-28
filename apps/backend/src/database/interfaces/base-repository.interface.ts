export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

export interface FindManyOptions<
  TWhere = Record<string, string | number | boolean>,
> {
  skip?: number;
  take?: number;
  where?: TWhere;
  orderBy?: Record<string, 'asc' | 'desc'>;
}

export interface BaseRepository<
  TEntity extends BaseEntity,
  TCreateData,
  TUpdateData,
> {
  findById(id: string): Promise<TEntity | null>;
  findMany<TWhere = Record<string, string | number | boolean>>(
    options?: FindManyOptions<TWhere>,
  ): Promise<TEntity[]>;
  create(data: TCreateData): Promise<TEntity>;
  update(id: string, data: TUpdateData): Promise<TEntity>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
  count<TWhere = Record<string, string | number | boolean>>(
    where?: TWhere,
  ): Promise<number>;
}
