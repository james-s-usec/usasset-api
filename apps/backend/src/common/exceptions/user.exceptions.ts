import { NotFoundException } from '@nestjs/common';

/**
 * Thrown when a user with the specified ID is not found
 * Following NestJS exception patterns
 */
export class UserNotFoundException extends NotFoundException {
  public constructor(id: string) {
    super(`User with ID ${id} not found`);
  }
}
