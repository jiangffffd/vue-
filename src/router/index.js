import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import UserManagement from '@/components/UserManagement.vue'
import FileManagement from '@/components/FileManagement.vue'
import ImageManagement from '@/components/ImageManagement.vue'
import UserLogin from '@/components/UserLogin.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: UserLogin
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/user-management',
    children: [
      {
        path: '/user-management',
        name: 'UserManagement',
        component: UserManagement,
        meta: { title: '用户管理' }
      },
      {
        path: '/file-management',
        name: 'FileManagement',
        component: FileManagement,
        meta: { title: '文件管理' }
      },
      {
        path: '/image-management',
        name: 'ImageManagement',
        component: ImageManagement,
        meta: { title: '镜像管理' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated')
  
  if (to.path !== '/login' && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router 