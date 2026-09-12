"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_service_1 = require("../users/users.service");
const bcrypt = require("bcryptjs");
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async register(registerDto) {
        const existing = await this.usersService.findByEmail(registerDto.email);
        if (existing) {
            throw new common_1.BadRequestException('Email này đã được sử dụng');
        }
        const user = await this.usersService.create(registerDto);
        const token = this.generateToken(user);
        return {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                address: user.address,
            },
            token,
        };
    }
    async login(loginDto) {
        const identifier = (loginDto.email || loginDto.identifier || '').trim();
        const user = await this.usersService.findByEmailOrPhone(identifier);
        if (!user) {
            throw new common_1.UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
        }
        if (user.status === 'blocked') {
            throw new common_1.UnauthorizedException('Tài khoản của bạn đã bị khóa');
        }
        const isMatch = await bcrypt.compare(loginDto.password, user.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
        }
        const token = this.generateToken(user);
        return {
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                address: user.address,
            },
            token,
        };
    }
    generateToken(user) {
        const payload = {
            sub: user._id,
            email: user.email,
            role: user.role,
        };
        return this.jwtService.sign(payload);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map