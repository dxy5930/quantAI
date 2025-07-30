import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { UpdateUserProfileDto } from "./dto/update-user-profile.dto";
import { UpdateUserLevelDto, BatchUpdateUserLevelDto } from "./dto/update-user-level.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post("profile")
  @ApiOperation({ summary: "获取当前用户资料" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Post("profile/options")
  @ApiOperation({ summary: "获取用户资料选项" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getProfileOptions() {
    return this.usersService.getProfileOptions();
  }

  @Put("profile")
  @ApiOperation({ summary: "更新用户资料" })
  @ApiResponse({ status: 200, description: "更新成功" })
  async updateProfile(
    @Request() req,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, updateUserProfileDto);
  }

  @Post("stats")
  @ApiOperation({ summary: "获取用户统计信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Post("permissions")
  @ApiOperation({ summary: "获取当前用户权限信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async getUserPermissions(@Request() req) {
    return this.usersService.getUserLevelPermissions(req.user.id);
  }

  @Post("strategy-limit")
  @ApiOperation({ summary: "检查用户策略数量限制" })
  @ApiResponse({ status: 200, description: "获取成功" })
  async checkStrategyLimit(@Request() req) {
    return this.usersService.checkStrategyLimit(req.user.id);
  }

  @Put("change-password")
  @ApiOperation({ summary: "修改用户密码" })
  @ApiResponse({ status: 200, description: "密码修改成功或失败" })
  @ApiResponse({ status: 400, description: "请求参数错误" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.id, changePasswordDto);
  }

  // ================== 管理员专用API ==================

  @Put("admin/level/:userId")
  @ApiOperation({ summary: "更新用户等级（管理员专用）" })
  @ApiParam({ name: "userId", description: "目标用户ID" })
  @ApiResponse({ status: 200, description: "更新成功" })
  @ApiResponse({ status: 403, description: "权限不足" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async updateUserLevel(
    @Request() req,
    @Param("userId") userId: string,
    @Body() updateUserLevelDto: UpdateUserLevelDto,
  ) {
    return this.usersService.updateUserLevel(req.user.id, userId, updateUserLevelDto);
  }

  @Post("admin/level/batch")
  @ApiOperation({ summary: "批量更新用户等级（管理员专用）" })
  @ApiResponse({ status: 200, description: "批量更新完成" })
  @ApiResponse({ status: 403, description: "权限不足" })
  async batchUpdateUserLevel(
    @Request() req,
    @Body() batchUpdateUserLevelDto: BatchUpdateUserLevelDto,
  ) {
    return this.usersService.batchUpdateUserLevel(req.user.id, batchUpdateUserLevelDto);
  }

  @Post("admin/level-stats")
  @ApiOperation({ summary: "获取用户等级统计信息（管理员专用）" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 403, description: "权限不足" })
  async getUserLevelStats(@Request() req) {
    return this.usersService.getUserLevelStats(req.user.id);
  }

  @Post(":id")
  @ApiOperation({ summary: "根据ID获取用户信息" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async getUserById(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Get(":id/permissions")
  @ApiOperation({ summary: "获取指定用户的权限信息" })
  @ApiParam({ name: "id", description: "用户ID" })
  @ApiResponse({ status: 200, description: "获取成功" })
  @ApiResponse({ status: 404, description: "用户不存在" })
  async getUserPermissionsById(@Param("id") id: string) {
    return this.usersService.getUserLevelPermissions(id);
  }
}
