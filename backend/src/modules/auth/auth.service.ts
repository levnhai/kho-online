import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: any) {
    const name = (registerDto.name || '').trim();
    if (!name) {
      throw new BadRequestException('Vui lòng nhập họ và tên');
    }

    const phone = (registerDto.phone || '').trim().replace(/\s+/g, '');
    if (!phone) {
      throw new BadRequestException('Vui lòng nhập số điện thoại');
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(phone)) {
      throw new BadRequestException('Số điện thoại không hợp lệ (gồm 10 số, ví dụ 0912345678)');
    }

    const password = registerDto.password;
    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new BadRequestException('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
    }

    const existingPhone = await this.usersService.findByPhone(phone);
    if (existingPhone) {
      throw new BadRequestException('Số điện thoại này đã được đăng ký tài khoản');
    }

    let email = '';
    if (registerDto.email && registerDto.email.trim()) {
      email = registerDto.email.trim().toLowerCase();
      const existingEmail = await this.usersService.findByEmail(email);
      if (existingEmail) {
        throw new BadRequestException('Email này đã được sử dụng');
      }
    }

    const user = await this.usersService.create({
      name,
      phone,
      email,
      password,
    });

    const token = this.generateToken(user);
    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || '',
        phone: user.phone,
        role: user.role,
        address: user.address || '',
      },
      token,
    };
  }

  async login(loginDto: any) {
    const identifier = (loginDto.phone || loginDto.email || loginDto.identifier || '').trim();
    const user = await this.usersService.findByEmailOrPhone(identifier);
    if (!user) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
    }
    if (user.status === 'blocked') {
      throw new UnauthorizedException('Tài khoản của bạn đã bị khóa');
    }
    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Số điện thoại hoặc mật khẩu không chính xác');
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

  async verifyResetPassword(dto: { phone?: string }) {
    const phone = (dto.phone || '').trim().replace(/\s+/g, '');

    if (!phone) {
      throw new BadRequestException('Vui lòng nhập số điện thoại');
    }

    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('Không tìm thấy tài khoản với số điện thoại này');
    }

    if (user.status === 'blocked') {
      throw new BadRequestException('Tài khoản của bạn đang bị khóa, không thể đặt lại mật khẩu');
    }

    return {
      success: true,
      message: 'Xác thực tài khoản thành công',
      data: {
        name: user.name,
        phone: user.phone,
        email: user.email || '',
      },
    };
  }

  async resetPassword(dto: { phone?: string; newPassword?: string }) {
    const phone = (dto.phone || '').trim().replace(/\s+/g, '');
    const newPassword = dto.newPassword || '';

    if (!phone) {
      throw new BadRequestException('Thiếu số điện thoại tài khoản');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new BadRequestException('Không tìm thấy tài khoản');
    }

    if (user.status === 'blocked') {
      throw new BadRequestException('Tài khoản của bạn đang bị khóa');
    }

    await this.usersService.update(user._id.toString(), {
      password: newPassword,
    });

    return {
      success: true,
      message: 'Đặt lại mật khẩu mới thành công! Bạn có thể đăng nhập ngay.',
    };
  }

  private generateToken(user: any) {
    const payload = {
      sub: user._id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }
}

