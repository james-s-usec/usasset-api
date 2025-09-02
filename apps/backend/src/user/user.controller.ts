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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserQueryService } from './services/user-query.service';
import { UserCommandService } from './services/user-command.service';
import { UserBulkService } from './services/user-bulk.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { BulkCreateUserDto } from './dto/bulk-create-user.dto';
import { BulkUpdateUserDto } from './dto/bulk-update-user.dto';
import { BulkDeleteUserDto } from './dto/bulk-delete-user.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../common/constants';
import { DatabaseLoggerService } from '../common/services/database-logger.service';
import { CORRELATION_ID_KEY } from '../common/middleware/correlation-id.middleware';
import { SanitizationPipe } from '../common/pipes/sanitization.pipe';
import { UserNotFoundException } from '../common/exceptions/user.exceptions';
import { SafeUserDto } from './dto/safe-user.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('users')
@Controller('api/users')
export class UserController {
  public constructor(
    private readonly userQueryService: UserQueryService,
    private readonly userCommandService: UserCommandService,
    private readonly userBulkService: UserBulkService,
    private readonly dbLogger: DatabaseLoggerService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  public async findAll(
    @Query(ValidationPipe) pagination: PaginationDto,
  ): Promise<{ users: SafeUserDto[]; pagination: Record<string, number> }> {
    const { page = DEFAULT_PAGE, limit = DEFAULT_PAGE_SIZE } = pagination;

    const { users, total } = await this.userQueryService.findManyPaginated(
      page,
      limit,
    );

    const safeUsers = plainToInstance(SafeUserDto, users, {
      excludeExtraneousValues: true,
    });

    return {
      users: safeUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  public async bulkCreate(
    @Body(SanitizationPipe, ValidationPipe)
    bulkCreateUserDto: BulkCreateUserDto,
  ): Promise<SafeUserDto[]> {
    const users = await this.userBulkService.bulkCreate(
      bulkCreateUserDto.users,
    );
    return plainToInstance(SafeUserDto, users, {
      excludeExtraneousValues: true,
    });
  }

  @Patch('bulk')
  public async bulkUpdate(
    @Body(SanitizationPipe, ValidationPipe)
    bulkUpdateUserDto: BulkUpdateUserDto,
  ): Promise<SafeUserDto[]> {
    const users = await this.userBulkService.bulkUpdate(
      bulkUpdateUserDto.updates,
    );
    return plainToInstance(SafeUserDto, users, {
      excludeExtraneousValues: true,
    });
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

    const result = await this.userBulkService.bulkDelete(
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
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  public async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SafeUserDto> {
    const user = await this.userQueryService.findById(id);
    if (!user) {
      throw new UserNotFoundException(id);
    }
    return plainToInstance(SafeUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiBody({ type: CreateUserDto })
  public async create(
    @Body(SanitizationPipe, ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<SafeUserDto> {
    const user = await this.userCommandService.create(createUserDto);
    return plainToInstance(SafeUserDto, user, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  public async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(SanitizationPipe, ValidationPipe) updateUserDto: UpdateUserDto,
  ): Promise<SafeUserDto> {
    const user = await this.userCommandService.update(id, updateUserDto);
    return plainToInstance(SafeUserDto, user, {
      excludeExtraneousValues: true,
    });
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

    await this.userCommandService.delete(id, correlationId);

    await this.dbLogger.logInfo(
      correlationId,
      `User ${id} deleted successfully`,
      { userId: id, operation: 'delete' },
    );
  }
}
