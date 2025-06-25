<template>
  <div class="user-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>用户管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddUserModal = true">
          <el-icon><Plus /></el-icon>添加用户
        </el-button>
        <el-button type="success" @click="showAddOrgModal = true">
          <el-icon><OfficeBuilding /></el-icon>创建组织
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon user-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalUsers }}</div>
              <div class="stats-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon org-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalOrgs }}</div>
              <div class="stats-label">组织数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon active-icon">
              <el-icon><Check /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ activeUsers }}</div>
              <div class="stats-label">活跃用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon resource-icon">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalResources }}</div>
              <div class="stats-label">资源配额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" class="management-tabs">
      <el-tab-pane label="用户列表" name="users">
        <!-- 用户列表 -->
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用户列表</span>
              <el-input
                v-model="userSearchKeyword"
                placeholder="搜索用户..."
                style="width: 200px"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </template>
          
          <el-table :data="filteredUsers" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column prop="phone" label="电话" width="150" />
            <el-table-column prop="organization" label="所属组织" width="150" />
            <el-table-column prop="role" label="角色" width="100">
              <template #default="scope">
                <el-tag :type="getRoleType(scope.row.role)">{{ scope.row.role }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'active' ? 'success' : 'danger'">
                  {{ scope.row.status === 'active' ? '活跃' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button size="small" @click="editUser(scope.row)">编辑</el-button>
                <el-button size="small" type="primary" @click="manageResources(scope.row)">资源配额</el-button>
                <el-button size="small" type="danger" @click="deleteUser(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="组织管理" name="organizations">
        <!-- 组织列表 -->
        <el-card>
          <template #header>
            <div class="card-header">
              <span>组织管理</span>
            </div>
          </template>
          
          <el-table :data="organizations" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="name" label="组织名称" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="userCount" label="用户数量" width="100" />
            <el-table-column prop="resourceQuota" label="资源配额" width="150">
              <template #default="scope">
                <el-button size="small" @click="viewResourceQuota(scope.row)">查看配额</el-button>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="scope">
                <el-button size="small" @click="editOrganization(scope.row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteOrganization(scope.row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑用户模态框 -->
    <el-dialog
      v-model="showAddUserModal"
      :title="editingUser ? '编辑用户' : '添加用户'"
      width="600px"
    >
      <el-form :model="userForm" :rules="userRules" ref="userFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userForm.phone" />
        </el-form-item>
        <el-form-item label="所属组织" prop="organization">
          <el-select v-model="userForm.organization" placeholder="选择组织">
            <el-option
              v-for="org in organizations"
              :key="org.id"
              :label="org.name"
              :value="org.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="userForm.role" placeholder="选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
            <el-option label="开发者" value="developer" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="userForm.status">
            <el-radio label="active">活跃</el-radio>
            <el-radio label="inactive">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddUserModal = false">取消</el-button>
        <el-button type="primary" @click="saveUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑组织模态框 -->
    <el-dialog
      v-model="showAddOrgModal"
      :title="editingOrg ? '编辑组织' : '创建组织'"
      width="500px"
    >
      <el-form :model="orgForm" :rules="orgRules" ref="orgFormRef" label-width="100px">
        <el-form-item label="组织名称" prop="name">
          <el-input v-model="orgForm.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="orgForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddOrgModal = false">取消</el-button>
        <el-button type="primary" @click="saveOrganization">确定</el-button>
      </template>
    </el-dialog>

    <!-- 资源配额管理模态框 -->
    <el-dialog v-model="showResourceModal" title="资源配额管理" width="700px">
      <el-form :model="resourceForm" label-width="120px">
        <el-form-item label="CPU 请求">
          <el-input-number v-model="resourceForm.cpuRequest" :min="0" :max="100" />
          <span style="margin-left: 10px">核</span>
        </el-form-item>
        <el-form-item label="CPU 限制">
          <el-input-number v-model="resourceForm.cpuLimit" :min="0" :max="100" />
          <span style="margin-left: 10px">核</span>
        </el-form-item>
        <el-form-item label="内存请求">
          <el-input-number v-model="resourceForm.memoryRequest" :min="0" :max="1000" />
          <span style="margin-left: 10px">GB</span>
        </el-form-item>
        <el-form-item label="内存限制">
          <el-input-number v-model="resourceForm.memoryLimit" :min="0" :max="1000" />
          <span style="margin-left: 10px">GB</span>
        </el-form-item>
        <el-form-item label="GPU 数量">
          <el-input-number v-model="resourceForm.gpuCount" :min="0" :max="10" />
          <span style="margin-left: 10px">个</span>
        </el-form-item>
        <el-form-item label="存储空间">
          <el-input-number v-model="resourceForm.storage" :min="0" :max="10000" />
          <span style="margin-left: 10px">GB</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResourceModal = false">取消</el-button>
        <el-button type="primary" @click="saveResourceQuota">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'UserManagement',
  data() {
    return {
      activeTab: 'users',
      userSearchKeyword: '',
      showAddUserModal: false,
      showAddOrgModal: false,
      showResourceModal: false,
      editingUser: null,
      editingOrg: null,
      
      // 用户数据
      users: [
        { id: 1, name: '张三', email: 'zhangsan@example.com', phone: '13800138001', organization: '研发部', role: 'admin', status: 'active' },
        { id: 2, name: '李四', email: 'lisi@example.com', phone: '13800138002', organization: '测试部', role: 'user', status: 'active' },
        { id: 3, name: '王五', email: 'wangwu@example.com', phone: '13800138003', organization: '运维部', role: 'developer', status: 'inactive' },
        { id: 4, name: '赵六', email: 'zhaoliu@example.com', phone: '13800138004', organization: '研发部', role: 'user', status: 'active' }
      ],
      
      // 组织数据
      organizations: [
        { id: 1, name: '研发部', description: '负责产品研发', userCount: 2, resourceQuota: {} },
        { id: 2, name: '测试部', description: '负责产品测试', userCount: 1, resourceQuota: {} },
        { id: 3, name: '运维部', description: '负责系统运维', userCount: 1, resourceQuota: {} }
      ],
      
      // 表单数据
      userForm: {
        name: '',
        email: '',
        phone: '',
        organization: '',
        role: 'user',
        status: 'active'
      },
      
      orgForm: {
        name: '',
        description: ''
      },
      
      resourceForm: {
        cpuRequest: 1,
        cpuLimit: 2,
        memoryRequest: 2,
        memoryLimit: 4,
        gpuCount: 0,
        storage: 100
      },
      
      // 表单验证规则
      userRules: {
        name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ],
        phone: [{ required: true, message: '请输入电话', trigger: 'blur' }],
        organization: [{ required: true, message: '请选择组织', trigger: 'change' }],
        role: [{ required: true, message: '请选择角色', trigger: 'change' }]
      },
      
      orgRules: {
        name: [{ required: true, message: '请输入组织名称', trigger: 'blur' }],
        description: [{ required: true, message: '请输入组织描述', trigger: 'blur' }]
      }
    }
  },
  computed: {
    filteredUsers() {
      if (!this.userSearchKeyword) return this.users
      return this.users.filter(user => 
        user.name.includes(this.userSearchKeyword) ||
        user.email.includes(this.userSearchKeyword) ||
        user.organization.includes(this.userSearchKeyword)
      )
    },
    totalUsers() {
      return this.users.length
    },
    totalOrgs() {
      return this.organizations.length
    },
    activeUsers() {
      return this.users.filter(user => user.status === 'active').length
    },
    totalResources() {
      return this.organizations.length
    }
  },
  methods: {
    getRoleType(role) {
      const types = {
        admin: 'danger',
        user: 'info',
        developer: 'warning'
      }
      return types[role] || 'info'
    },
    
    editUser(user) {
      this.editingUser = user
      this.userForm = { ...user }
      this.showAddUserModal = true
    },
    
    saveUser() {
      this.$refs.userFormRef.validate((valid) => {
        if (valid) {
          if (this.editingUser) {
            // 更新用户
            const index = this.users.findIndex(u => u.id === this.editingUser.id)
            if (index !== -1) {
              this.users[index] = { ...this.editingUser, ...this.userForm }
            }
            this.$message.success('用户更新成功')
          } else {
            // 添加用户
            const newUser = {
              id: this.users.length + 1,
              ...this.userForm
            }
            this.users.push(newUser)
            this.$message.success('用户添加成功')
          }
          this.showAddUserModal = false
          this.resetUserForm()
        }
      })
    },
    
    deleteUser(userId) {
      this.$confirm('确定要删除这个用户吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.users = this.users.filter(user => user.id !== userId)
        this.$message.success('用户删除成功')
      }).catch(() => {})
    },
    
    editOrganization(org) {
      this.editingOrg = org
      this.orgForm = { ...org }
      this.showAddOrgModal = true
    },
    
    saveOrganization() {
      this.$refs.orgFormRef.validate((valid) => {
        if (valid) {
          if (this.editingOrg) {
            // 更新组织
            const index = this.organizations.findIndex(o => o.id === this.editingOrg.id)
            if (index !== -1) {
              this.organizations[index] = { ...this.editingOrg, ...this.orgForm }
            }
            this.$message.success('组织更新成功')
          } else {
            // 添加组织
            const newOrg = {
              id: this.organizations.length + 1,
              userCount: 0,
              resourceQuota: {},
              ...this.orgForm
            }
            this.organizations.push(newOrg)
            this.$message.success('组织创建成功')
          }
          this.showAddOrgModal = false
          this.resetOrgForm()
        }
      })
    },
    
    deleteOrganization(orgId) {
      this.$confirm('确定要删除这个组织吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.organizations = this.organizations.filter(org => org.id !== orgId)
        this.$message.success('组织删除成功')
      }).catch(() => {})
    },
    
    manageResources(user) {
      this.currentUser = user
      this.resourceForm = {
        cpuRequest: 1,
        cpuLimit: 2,
        memoryRequest: 2,
        memoryLimit: 4,
        gpuCount: 0,
        storage: 100
      }
      this.showResourceModal = true
    },
    
    viewResourceQuota(org) {
      this.$message.info(`查看组织 ${org.name} 的资源配额`)
    },
    
    saveResourceQuota() {
      this.$message.success('资源配额设置成功')
      this.showResourceModal = false
    },
    
    resetUserForm() {
      this.userForm = {
        name: '',
        email: '',
        phone: '',
        organization: '',
        role: 'user',
        status: 'active'
      }
      this.editingUser = null
    },
    
    resetOrgForm() {
      this.orgForm = {
        name: '',
        description: ''
      }
      this.editingOrg = null
    }
  }
}
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
}

.stats-content {
  display: flex;
  align-items: center;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.user-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.org-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.active-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.resource-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-info {
  flex: 1;
}

.stats-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.stats-label {
  color: #666;
  font-size: 14px;
}

.management-tabs {
  margin-top: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 