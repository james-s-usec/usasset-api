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
} from '@nestjs/common';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { BulkCreateUserDto } from './dto/bulk-create-user.dto';
import { BulkUpdateUserDto } from './dto/bulk-update-user.dto';
import { BulkDeleteUserDto } from './dto/bulk-delete-user.dto';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../common/constants';

@Controller('api/users')
export class UserController {
  public constructor(private readonly userService: UserService) {}

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
  ): Promise<{ deleted: number }> {
    return this.userService.bulkDelete(bulkDeleteUserDto.ids);
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
  public async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.userService.delete(id);
  }
}
