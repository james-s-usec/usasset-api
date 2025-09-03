import { NotFoundException } from '@nestjs/common';

export class AssetNotFoundException extends NotFoundException {
  public constructor(id: string) {
    super(`Asset with ID ${id} not found`);
  }
}
