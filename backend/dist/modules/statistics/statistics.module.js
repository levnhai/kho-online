"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const order_schema_1 = require("../orders/schemas/order.schema");
const product_schema_1 = require("../products/schemas/product.schema");
const user_schema_1 = require("../users/schemas/user.schema");
const statistics_service_1 = require("./statistics.service");
const statistics_controller_1 = require("./statistics.controller");
let StatisticsModule = class StatisticsModule {
};
exports.StatisticsModule = StatisticsModule;
exports.StatisticsModule = StatisticsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: order_schema_1.Order.name, schema: order_schema_1.OrderSchema },
                { name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema },
                { name: user_schema_1.User.name, schema: user_schema_1.UserSchema },
            ]),
        ],
        providers: [statistics_service_1.StatisticsService],
        controllers: [statistics_controller_1.StatisticsController],
    })
], StatisticsModule);
//# sourceMappingURL=statistics.module.js.map