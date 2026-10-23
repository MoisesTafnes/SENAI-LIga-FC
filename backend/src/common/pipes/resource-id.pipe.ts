import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';

@Injectable()
export class ResourceIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    if (!/^\d+$/.test(value)) {
      throw new NotFoundException('Recurso não encontrado.');
    }

    const id = Number(value);
    if (!Number.isSafeInteger(id) || id < 1) {
      throw new NotFoundException('Recurso não encontrado.');
    }

    return id;
  }
}
