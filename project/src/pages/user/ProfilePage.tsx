import React, { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../hooks/useStore";
import { User, Edit, Save, X, Camera } from "lucide-react";
import { userApi } from "../../services/api/userApi";

const ProfilePage: React.FC = observer(() => {
  const { user, app } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profileOptions, setProfileOptions] = useState<{
    tradingExperience: Array<{ value: string; label: string }>;
    riskTolerance: Array<{ value: string; label: string }>;
  } | null>(null);
  const [editForm, setEditForm] = useState({
    displayName: user.currentUser?.profile?.displayName || "",
    tradingExperience:
      user.currentUser?.profile?.tradingExperience || "beginner",
    riskTolerance: user.currentUser?.profile?.riskTolerance || "medium",
    email: user.currentUser?.email || "",
    avatar: user.currentUser?.avatar || "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 监听用户数据变化，自动更新表单
  useEffect(() => {
    if (user.currentUser) {
      setEditForm({
        displayName: user.currentUser.profile?.displayName || "",
        tradingExperience:
          user.currentUser.profile?.tradingExperience || "beginner",
        riskTolerance: user.currentUser.profile?.riskTolerance || "medium",
        email: user.currentUser.email || "",
        avatar: user.currentUser.avatar || "",
      });
      setAvatarPreview(user.currentUser.avatar || "");
    }
  }, [
    user.currentUser?.profile?.displayName,
    user.currentUser?.profile?.tradingExperience,
    user.currentUser?.profile?.riskTolerance,
    user.currentUser?.email,
    user.currentUser?.avatar,
  ]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  // 加载用户资料选项
  useEffect(() => {
    const loadProfileOptions = async () => {
      try {
        const response = await userApi.getProfileOptions();
        if (response.data) {
          setProfileOptions(response.data);
        }
      } catch (error) {
        console.error("加载用户资料选项失败:", error);
        app.showError("加载用户资料选项失败");
      }
    };

    loadProfileOptions();
  }, [app]);

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      displayName: user.currentUser?.profile?.displayName || "",
      tradingExperience:
        user.currentUser?.profile?.tradingExperience || "beginner",
      riskTolerance: user.currentUser?.profile?.riskTolerance || "medium",
      email: user.currentUser?.email || "",
      avatar: user.currentUser?.avatar || "",
    });
    setAvatarPreview(user.currentUser?.avatar || "");
  };

  const handleSave = async () => {
    try {
      console.log("保存前的表单数据:", editForm);
      console.log("保存前的用户数据:", user.currentUser);

      const result = await user.updateProfile(editForm);

      console.log("保存后的返回结果:", result);
      console.log("保存后的用户数据:", user.currentUser);

      setIsEditing(false);
      app.showSuccess("资料更新成功");
    } catch (error) {
      console.error("保存失败:", error);
      app.showError("更新失败，请重试");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // 压缩图片
  const compressImage = (file: File, maxWidth: number = 200, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制压缩后的图片
        ctx?.drawImage(img, 0, 0, width, height);

        // 转换为base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };

      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = URL.createObjectURL(file);
    });
  };

  // 处理头像上传
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      app.showError('请选择 JPEG、PNG、GIF 或 WebP 格式的图片');
      return;
    }

    // 检查文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      app.showError('图片文件过大，请选择小于5MB的图片');
      return;
    }

    try {
      // 压缩图片
      const compressedBase64 = await compressImage(file, 200, 0.8);
      setAvatarPreview(compressedBase64);
      setEditForm((prev) => ({ ...prev, avatar: compressedBase64 }));
    } catch (error) {
      console.error('图片压缩失败:', error);
      app.showError('图片处理失败，请重试');
    }
  };

  // 点击头像上传按钮
  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!user.currentUser) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-lg">请先登录</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            个人资料
          </h1>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-sm hover:shadow-glow"
          >
            <Edit className="h-4 w-4" />
            <span>编辑</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-300 shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>保存</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 bg-gray-500 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-all duration-300"
            >
              <X className="h-4 w-4" />
              <span>取消</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-start space-x-6">
          {/* 头像 */}
          <div className="relative">
            <img
              src={
                avatarPreview ||
                user.userAvatar ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=default"
              }
              alt="头像"
              className="w-24 h-24 rounded-full border-4 border-gray-300 dark:border-gray-600 object-cover cursor-pointer"
              onClick={handleAvatarClick}
            />
            {isEditing && (
              <>
                <button 
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 rounded-full transition-all duration-300 shadow-sm"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* 基本信息 */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm  font-medium text-gray-700 dark:text-gray-300 mb-2">
                  显示名称
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) =>
                      handleInputChange("displayName", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                ) : (
                  <div className="text-gray-900 dark:text-white">
                    {user.currentUser?.profile?.displayName || "未设置"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  用户名
                </label>
                <div className="text-gray-600 dark:text-gray-400">
                  {user.currentUser?.username}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮箱
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  />
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">
                    {user.currentUser?.email}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  交易经验
                </label>
                {isEditing ? (
                  <select
                    value={editForm.tradingExperience}
                    onChange={(e) =>
                      handleInputChange("tradingExperience", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    {profileOptions?.tradingExperience.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-white dark:bg-gray-700"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-900 dark:text-white">
                    {profileOptions?.tradingExperience.find(
                      (option) =>
                        option.value ===
                        user.currentUser?.profile?.tradingExperience
                    )?.label || "未设置"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  风险承受能力
                </label>
                {isEditing ? (
                  <select
                    value={editForm.riskTolerance}
                    onChange={(e) =>
                      handleInputChange("riskTolerance", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    {profileOptions?.riskTolerance.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="bg-white dark:bg-gray-700"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-gray-900 dark:text-white">
                    {profileOptions?.riskTolerance.find(
                      (option) =>
                        option.value ===
                        user.currentUser?.profile?.riskTolerance
                    )?.label || "未设置"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProfilePage;
