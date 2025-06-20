"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Admin = Admin;
const common_1 = require("@nestjs/common");
const enums_1 = require("../enums");
const roles_decorator_1 = require("./roles.decorator");
function Admin() {
    return (0, common_1.applyDecorators)((0, roles_decorator_1.Roles)(enums_1.RoleType.ADMIN));
}
//# sourceMappingURL=admin.decorator.js.map