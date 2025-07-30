import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../shared/entities/user.entity";
import { Strategy } from "../../shared/entities/strategy.entity";
import { BacktestHistory } from "../../shared/entities/backtest-history.entity";

@Injectable()
export class SystemService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Strategy)
    private strategyRepository: Repository<Strategy>,
    @InjectRepository(BacktestHistory)
    private backtestHistoryRepository: Repository<BacktestHistory>,
  ) {}

  async getSystemStats() {
    try {
      // 获取策略统计
      const [totalStrategies, publicStrategies] = await Promise.all([
        this.strategyRepository.count(),
        this.strategyRepository.count({ where: { isPublic: true } }),
      ]);

      // 获取用户统计
      const [totalUsers, activeUsers] = await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({
          where: {
            lastLoginAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30天内活跃
          },
        }),
      ]);

      // 获取回测统计
      const [totalBacktests, successfulBacktests] = await Promise.all([
        this.backtestHistoryRepository.count(),
        this.backtestHistoryRepository.count({ where: { status: "completed" } }),
      ]);

      // 计算平均评分
      const avgRatingResult = await this.strategyRepository
        .createQueryBuilder("strategy")
        .select("AVG(strategy.rating)", "avgRating")
        .where("strategy.rating > 0")
        .getRawOne();

      const avgRating = avgRatingResult?.avgRating || 0;

      // 获取热门策略
      const popularStrategies = await this.strategyRepository.find({
        where: { isPublic: true },
        order: { popularity: "DESC" },
        take: 10,
        relations: ["author"],
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          strategyType: true,
          difficulty: true,
          popularity: true,
          likes: true,
          rating: true,
          createdAt: true,
          author: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      });

      // 获取最新策略
      const recentStrategies = await this.strategyRepository.find({
        where: { isPublic: true },
        order: { createdAt: "DESC" },
        take: 10,
        relations: ["author"],
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          strategyType: true,
          difficulty: true,
          popularity: true,
          likes: true,
          rating: true,
          createdAt: true,
          author: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      });

      // 计算系统运行时间
      const uptimeHours = Math.floor(process.uptime() / 3600);
      const uptimeText = uptimeHours > 24 ? `${Math.floor(uptimeHours / 24)}天` : `${uptimeHours}小时`;

      return {
        success: true,
        data: {
          // 系统统计概览
          overview: {
            totalStrategies,
            publicStrategies,
            totalUsers,
            activeUsers, // 真实活跃用户数
            totalBacktests,
            successfulBacktests,
            avgRating: Number(avgRating).toFixed(1),
            uptime: uptimeText,
          },
          // 首页统计卡片数据
          stats: [
            {
              label: "总策略数",
              value: totalStrategies.toString(),
              icon: "TrendingUp",
              trend: "+12%",
              trendUp: true,
            },
            {
              label: "活跃用户",
              value: totalUsers, 
              icon: "Users",
              trend: "+8%",
              trendUp: true,
            },
            {
              label: "平均评分",
              value: Number(avgRating).toFixed(1),
              icon: "Star",
              trend: "+0.2",
              trendUp: true,
            },
            {
              label: "运行时间",
              value: "24/7",
              icon: "Clock",
              trend: "稳定",
              trendUp: true,
            },
          ],
          // 热门策略
          popularStrategies,
          // 最新策略
          recentStrategies,
        },
        message: "获取系统统计数据成功",
      };
    } catch (error) {
      return {
        success: false,
        message: "获取系统统计数据失败",
        error: error.message,
      };
    }
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }
} 