import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { BulkCreateUserDto } from './dto/bulk-create-user.dto';
import { BulkUpdateUserDto } from './dto/bulk-update-user.dto';
import { BulkDeleteUserDto } from './dto/bulk-delete-user.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../common/constants';
import { DatabaseLoggerService } from '../common/services/database-logger.service';
import { CORRELATION_ID_KEY } from '../common/middleware/correlation-id.middleware';

@Controller('api/users')
export class UserController {
  public constructor(
    private readonly userService: UserService,
    private readonly dbLogger: DatabaseLoggerService,
  ) {}

  @Get()
  public async findAll(
    @Query(ValidationPipe) pagination: PaginationDto,
  ): Promise<{ users: User[]; pagination: Record<string, number> }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE } = pagination;
    const skip = (page - 1) * limit;

    const users = await this.userService.findMany();
    const totalUsers = users.length;
    const paginatedUsers = users.slice(skip, skip + limit);

    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
      },
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  public async bulkCreate(
    @Body(ValidationPipe) bulkCreateUserDto: BulkCreateUserDto,
  ): Promise<User[]> {
    return this.userService.bulkCreate(bulkCreateUserDto.users);
  }

  @Patch('bulk')
  public async bulkUpdate(
    @Body(ValidationPipe) bulkUpdateUserDto: BulkUpdateUserDto,
  ): Promise<User[]> {
    return this.userService.bulkUpdate(bulkUpdateUserDto.updates);
  }

  @Delete('bulk')
  public async bulkDelete(
    @Body(ValidationPipe) bulkDeleteUserDto: BulkDeleteUserDto,
    @Req() req: Request,
  ): Promise<{ deleted: number }> {
    const correlationId = (req[CORRELATION_ID_KEY] as string) || 'unknown';

    await this.dbLogger.logDebug(
      correlationId,
      `Starting bulk delete operation for ${bulkDeleteUserDto.ids.length} users`,
      { userIds: bulkDeleteUserDto.ids.join(', '), operation: 'bulkDelete' },
    );

    const result = await this.userService.bulkDelete(
      bulkDeleteUserDto.ids,
      correlationId,
    );

    await this.dbLogger.logInfo(
      correlationId,
      `Bulk delete completed: ${result.deleted} of ${bulkDeleteUserDto.ids.length} users deleted`,
      {
        requestedCount: bulkDeleteUserDto.ids.length,
        deletedCount: result.deleted,
        operation: 'bulkDelete',
      },
    );

    return result;
  }

  @Get(':id')
  public async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async create(
    @Body(ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request,
  ): Promise<void> {
    const correlationId = (req[CORRELATION_ID_KEY] as string) || 'unknown';

    await this.dbLogger.logDebug(
      correlationId,
      `Starting delete operation for user ${id}`,
      { userId: id, operation: 'delete' },
    );

    await this.userService.delete(id, correlationId);

    await this.dbLogger.logInfo(
      correlationId,
      `User ${id} deleted successfully`,
      { userId: id, operation: 'delete' },
    );
  }
}
