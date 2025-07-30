import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ThrottlerGuard } from "@nestjs/throttler";

import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { LoginDto, RegisterDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from "./dto";

@ApiTags("auth")
@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "用户登录" })
  @ApiResponse({ status: 200, description: "登录成功" })
  @ApiResponse({ status: 401, description: "用户名或密码错误" })
  async login(@Body() loginDto: LoginDto) {
    try {
      const authResponse = await this.authService.login(loginDto);
      return {
        success: true,
        data: authResponse,
        message: "登录成功",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "登录失败",
      };
    }
  }

  @Post("register")
  @ApiOperation({ summary: "用户注册" })
  @ApiResponse({ status: 201, description: "注册成功" })
  @ApiResponse({ status: 409, description: "用户名或邮箱已存在" })
  async register(@Body() registerDto: RegisterDto) {
    try {
      const authResponse = await this.authService.register(registerDto);
      return {
        success: true,
        data: authResponse,
        message: "注册成功",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "注册失败",
      };
    }
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "刷新访问令牌" })
  @ApiResponse({ status: 200, description: "刷新成功" })
  @ApiResponse({ status: 401, description: "刷新令牌无效" })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const authResponse = await this.authService.refreshToken(refreshTokenDto.refreshToken);
      return {
        success: true,
        data: authResponse,
        message: "刷新成功",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "刷新失败",
      };
    }
  }

  @Post("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "获取当前用户信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  async getCurrentUser(@Request() req) {
    try {
      const user = await this.authService.getCurrentUser(req.user.id);
      return {
        success: true,
        data: user,
        message: "获取成功",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "获取用户信息失败",
      };
    }
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "用户登出" })
  @ApiResponse({ status: 200, description: "登出成功" })
  @ApiResponse({ status: 401, description: "未授权" })
  async logout(@Request() req) {
    try {
      await this.authService.logout(req.user.id);
      return {
        success: true,
        message: "登出成功",
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "登出失败",
      };
    }
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "忘记密码" })
  @ApiResponse({ status: 200, description: "重置链接已发送" })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      const result = await this.authService.forgotPassword(forgotPasswordDto);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "请求失败",
      };
    }
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "重置密码" })
  @ApiResponse({ status: 200, description: "密码重置成功" })
  @ApiResponse({ status: 400, description: "令牌无效或已过期" })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      return {
        success: true,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "重置失败",
      };
    }
  }
}
