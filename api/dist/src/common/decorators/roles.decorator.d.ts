import { RoleType } from '../enums';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: RoleType[]) => import("@nestjs/common").CustomDecorator<string>;
