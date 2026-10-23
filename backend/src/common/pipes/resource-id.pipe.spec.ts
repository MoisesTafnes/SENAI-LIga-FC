import { NotFoundException } from '@nestjs/common';
import { ResourceIdPipe } from './resource-id.pipe';

describe('ResourceIdPipe', () => {
  const pipe = new ResourceIdPipe();

  it('converts a positive integer ID', () => {
    expect(pipe.transform('42')).toBe(42);
  });

  it.each(['abc', '1.2', '0', '-1', '9007199254740992'])(
    'returns 404 for invalid route ID %s',
    (value) => {
      expect(() => pipe.transform(value)).toThrow(NotFoundException);
    },
  );
});
