import { applyDecorators } from '@nestjs/common';
import { RoleType } from '../enums';
import { Roles } from './roles.decorator';

export function Admin() {
  return applyDecorators(
    Roles(RoleType.ADMIN),
    // Guards будут добавлены позже
  );
}
