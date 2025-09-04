import { NotFoundException } from '@nestjs/common';

export class FileNotFoundException extends NotFoundException {
  public constructor(fileId: string) {
    super(`File with ID ${fileId} not found`);
  }
}
