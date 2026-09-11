"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: false,
        transform: true,
    }));
    const port = process.env.PORT || 5000;
    await app.listen(port);
    console.log(`🚀 KHO Backend Server is running on: http://localhost:${port}/api`);
}
bootstrap();
//# sourceMappingURL=main.js.map