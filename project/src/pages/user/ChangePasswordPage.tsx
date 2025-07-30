import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../hooks/useStore";
import { ArrowLeft, Lock, Eye, EyeOff, Shield } from "lucide-react";
import { ROUTES } from "../../constants/routes";
import { userApi } from "../../services/api/userApi";

const ChangePasswordPage: React.FC = observer(() => {
  const { app, user } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      app.showError("请输入当前密码");
      return false;
    }

    if (!formData.newPassword) {
      app.showError("请输入新密码");
      return false;
    }

    if (formData.newPassword.length < 8) {
      app.showError("新密码长度至少为8位");
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      app.showError("两次输入的新密码不一致");
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      app.showError("新密码不能与当前密码相同");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await userApi.changePassword(formData);

      if (response.success) {
        app.showSuccess(response.data?.message || "密码修改成功");
        // 清空表单
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        navigate(ROUTES.SETTINGS);
      } else {
        app.showError(response.message || "密码修改失败");
      }
    } catch (error: any) {
      console.error("修改密码失败:", error);

      // 处理不同类型的错误
      if (error.response?.data?.message) {
        app.showError(error.response.data.message);
      } else if (error.message) {
        app.showError(error.message);
      } else {
        app.showError("密码修改失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(ROUTES.SETTINGS);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* 页面标题 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </button>
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-2 rounded-lg">
          <Lock className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          修改密码
        </h1>
      </div>

      {/* 安全提示 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-blue-800 dark:text-blue-200 font-medium">
              安全提示
            </h3>
            <p className="text-blue-600 dark:text-blue-300 text-sm mt-1">
              为了您的账户安全，请设置一个强密码，包含字母、数字和特殊字符，长度至少8位。
            </p>
          </div>
        </div>
      </div>

      {/* 修改密码表单 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 当前密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              当前密码
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={formData.currentPassword}
                onChange={(e) =>
                  handleInputChange("currentPassword", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="请输入当前密码"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword.current ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              新密码
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  handleInputChange("newPassword", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="请输入新密码"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword.new ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* 确认新密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              确认新密码
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleInputChange("confirmPassword", e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="请再次输入新密码"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex items-center space-x-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-sm hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? "修改中..." : "确认修改"}
            </button>
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default ChangePasswordPage;
