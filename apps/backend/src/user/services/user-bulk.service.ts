import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserCommandService } from './user-command.service';
import { DatabaseLoggerService } from '../../common/services/database-logger.service';
import { CreateUserRequest, UpdateUserRequest } from '../dto/user.dto';

@Injectable()
export class UserBulkService {
  public constructor(
    private readonly commandService: UserCommandService,
    private readonly dbLogger: DatabaseLoggerService,
  ) {}

  public async bulkCreate(users: CreateUserRequest[]): Promise<User[]> {
    const results: User[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < users.length; i++) {
      try {
        const user = await this.commandService.create(users[i]);
        results.push(user);
      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new ConflictException({
        message: 'All bulk create operations failed',
        errors,
      });
    }

    return results;
  }

  public async bulkUpdate(
    updates: Array<{ id: string } & UpdateUserRequest>,
  ): Promise<User[]> {
    const results: User[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    for (const updateItem of updates) {
      const { id, ...data } = updateItem;
      try {
        const user = await this.commandService.update(id, data);
        results.push(user);
      } catch (error) {
        errors.push({
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw new NotFoundException({
        message: 'All bulk update operations failed',
        errors,
      });
    }

    return results;
  }

  public async bulkDelete(
    ids: string[],
    correlationId?: string,
  ): Promise<{ deleted: number }> {
    const cid = correlationId || 'unknown';
    const errors: Array<{ id: string; error: string }> = [];

    await this.logBulkDeleteStart(cid, ids);
    const deleted = await this.processBulkDeletes(ids, cid, errors);
    await this.logBulkDeleteResult(cid, deleted, errors);

    if (errors.length > 0 && deleted === 0) {
      throw new NotFoundException({
        message: 'All bulk delete operations failed',
        errors,
      });
    }

    return { deleted };
  }

  private async processBulkDeletes(
    ids: string[],
    cid: string,
    errors: Array<{ id: string; error: string }>,
  ): Promise<number> {
    let deleted = 0;

    for (const id of ids) {
      const result = await this.processSingleDelete(
        id,
        cid,
        deleted + 1,
        ids.length,
      );
      if (result.success) {
        deleted++;
      } else {
        errors.push({ id, error: result.error });
      }
    }

    return deleted;
  }

  private async processSingleDelete(
    id: string,
    cid: string,
    index: number,
    total: number,
  ): Promise<{ success: boolean; error: string }> {
    try {
      await this.logDeleteProcessing(cid, id, index, total);
      await this.commandService.delete(id, cid);
      await this.logDeleteSuccess(cid, id, index);
      return { success: true, error: '' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.logDeleteError(cid, id, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  private async logDeleteProcessing(
    cid: string,
    id: string,
    index: number,
    total: number,
  ): Promise<void> {
    await this.dbLogger.logDebug(
      cid,
      `Processing delete for user ${id} (${index}/${total})`,
      {
        userId: id,
        progress: `${index}/${total}`,
        operation: 'bulkDelete.processing',
      },
    );
  }

  private async logDeleteSuccess(
    cid: string,
    id: string,
    index: number,
  ): Promise<void> {
    await this.dbLogger.logDebug(cid, `Successfully deleted user ${id}`, {
      userId: id,
      deletedCount: index,
      operation: 'bulkDelete.success',
    });
  }

  private async logDeleteError(
    cid: string,
    id: string,
    errorMessage: string,
  ): Promise<void> {
    await this.dbLogger.logError(
      cid,
      `Failed to delete user ${id}: ${errorMessage}`,
      { userId: id, error: errorMessage, operation: 'bulkDelete.error' },
    );
  }

  private async logBulkDeleteStart(cid: string, ids: string[]): Promise<void> {
    await this.dbLogger.logDebug(
      cid,
      `Starting bulk delete for ${ids.length} users`,
      { userIds: ids.join(', '), operation: 'bulkDelete.start' },
    );
  }

  private async logBulkDeleteResult(
    cid: string,
    deleted: number,
    errors: Array<{ id: string; error: string }>,
  ): Promise<void> {
    if (errors.length > 0) {
      await this.dbLogger.logWarn(
        cid,
        `Bulk delete completed with errors: ${deleted} succeeded, ${errors.length} failed`,
        {
          deletedCount: deleted,
          errorCount: errors.length,
          errors: JSON.stringify(errors),
          operation: 'bulkDelete.partialSuccess',
        },
      );
    } else {
      await this.dbLogger.logDebug(
        cid,
        `Bulk delete completed successfully: all ${deleted} users deleted`,
        { deletedCount: deleted, operation: 'bulkDelete.complete' },
      );
    }
  }
}
