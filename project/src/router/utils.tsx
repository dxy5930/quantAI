import React from 'react';
import { RouteObject } from 'react-router-dom';
import { RouteGuard } from './RouteGuard';
import { PAGE_METADATA } from '../constants/routes';

/**
 * 创建受保护的路由配置
 * @param path 路由路径
 * @param element 路由组件
 * @param children 子路由
 * @returns 路由配置对象
 */
export const createProtectedRoute = (
  path: string,
  element: React.ReactElement,
  children?: RouteObject[]
): RouteObject => {
  const metadata = Object.values(PAGE_METADATA).find(meta => 
    meta.path === path || (meta.path.includes(':') && 
      new RegExp('^' + meta.path.replace(/:[^/]+/g, '[^/]+') + '$').test(path))
  );

  const requiresAuth = metadata?.requiresAuth || false;

  return {
    path,
    element: requiresAuth ? <RouteGuard>{element}</RouteGuard> : element,
    children
  };
};

/**
 * 创建布局路由配置
 * @param path 路由路径
 * @param layout 布局组件
 * @param children 子路由
 * @returns 路由配置对象
 */
export const createLayoutRoute = (
  path: string,
  layout: React.ReactElement,
  children: RouteObject[]
): RouteObject => {
  return {
    path,
    element: <RouteGuard>{layout}</RouteGuard>,
    children
  };
};

/**
 * 批量创建路由配置
 * @param routes 路由配置数组
 * @returns 路由配置对象数组
 */
export const createRoutes = (routes: Array<{
  path: string;
  element: React.ReactElement;
  children?: RouteObject[];
}>): RouteObject[] => {
  return routes.map(({ path, element, children }) => 
    createProtectedRoute(path, element, children)
  );
};