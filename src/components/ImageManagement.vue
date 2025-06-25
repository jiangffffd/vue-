<template>
  <div class="image-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>镜像管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showUploadModal = true">
          <el-icon><Upload /></el-icon>上传镜像
        </el-button>
        <el-button type="success" @click="showCreateModal = true">
          <el-icon><Plus /></el-icon>新建镜像仓库
        </el-button>
        <el-button type="warning" @click="pullImage">
          <el-icon><Download /></el-icon>拉取镜像
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total-icon">
              <el-icon><Picture /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalImages }}</div>
              <div class="stats-label">总镜像数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon repo-icon">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalRepos }}</div>
              <div class="stats-label">仓库数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon size-icon">
              <el-icon><DataAnalysis /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalSize }}</div>
              <div class="stats-label">总大小</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon framework-icon">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ totalFrameworks }}</div>
              <div class="stats-label">计算框架</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 搜索和筛选 -->
    <div class="filter-section">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索镜像名称..."
        style="width: 300px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-select v-model="selectedFramework" placeholder="选择计算框架" style="width: 200px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option label="TensorFlow" value="tensorflow" />
        <el-option label="PyTorch" value="pytorch" />
        <el-option label="MXNet" value="mxnet" />
        <el-option label="Caffe" value="caffe" />
        <el-option label="其他" value="other" />
      </el-select>
      
      <el-select v-model="selectedRepo" placeholder="选择仓库" style="width: 200px; margin-left: 10px">
        <el-option label="全部" value="" />
        <el-option
          v-for="repo in repositories"
          :key="repo.id"
          :label="repo.name"
          :value="repo.name"
        />
      </el-select>
    </div>

    <!-- 镜像列表 -->
    <el-card class="image-list-card">
      <template #header>
        <div class="card-header">
          <span>镜像列表</span>
          <el-button type="primary" size="small" @click="refreshImages">
            <el-icon><Refresh /></el-icon>刷新
          </el-button>
        </div>
      </template>
      
      <el-table :data="filteredImages" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="镜像信息" min-width="300">
          <template #default="scope">
            <div class="image-info">
              <el-icon class="image-icon">
                <Picture />
              </el-icon>
              <div class="image-details">
                <div class="image-name">{{ scope.row.name }}</div>
                <div class="image-tag">{{ scope.row.tag }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="repository" label="仓库" width="150" />
        <el-table-column prop="framework" label="计算框架" width="120">
          <template #default="scope">
            <el-tag :type="getFrameworkType(scope.row.framework)">
              {{ scope.row.framework }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="size" label="大小" width="120">
          <template #default="scope">
            {{ formatImageSize(scope.row.size) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'ready' ? 'success' : 'warning'">
              {{ scope.row.status === 'ready' ? '就绪' : '构建中' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="viewImageDetails(scope.row)">详情</el-button>
            <el-button size="small" type="primary" @click="pushImage(scope.row)">推送</el-button>
            <el-button size="small" type="warning" @click="editImage(scope.row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteImage(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 上传镜像模态框 -->
    <el-dialog v-model="showUploadModal" title="上传镜像" width="600px">
      <el-tabs v-model="uploadTab">
        <el-tab-pane label="导入镜像文件" name="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="uploadFileList"
            accept=".tar,.tar.gz,.img"
            drag
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              将镜像文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 .tar、.tar.gz、.img 格式的镜像文件
              </div>
            </template>
          </el-upload>
        </el-tab-pane>
        
        <el-tab-pane label="从Docker Hub拉取" name="dockerhub">
          <el-form :model="pullForm" :rules="pullRules" ref="pullFormRef" label-width="100px">
            <el-form-item label="镜像名称" prop="name">
              <el-input v-model="pullForm.name" placeholder="例如: nginx:latest" />
            </el-form-item>
            <el-form-item label="仓库" prop="repository">
              <el-select v-model="pullForm.repository" placeholder="选择目标仓库">
                <el-option
                  v-for="repo in repositories"
                  :key="repo.id"
                  :label="repo.name"
                  :value="repo.name"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <el-button @click="showUploadModal = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload" :loading="uploading">
          {{ uploading ? '上传中...' : '确定' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建镜像仓库模态框 -->
    <el-dialog v-model="showCreateModal" title="新建镜像仓库" width="500px">
      <el-form :model="repoForm" :rules="repoRules" ref="repoFormRef" label-width="100px">
        <el-form-item label="仓库名称" prop="name">
          <el-input v-model="repoForm.name" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="repoForm.description" type="textarea" placeholder="请输入仓库描述" />
        </el-form-item>
        <el-form-item label="访问权限" prop="visibility">
          <el-radio-group v-model="repoForm.visibility">
            <el-radio label="public">公开</el-radio>
            <el-radio label="private">私有</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="createRepository">确定</el-button>
      </template>
    </el-dialog>

    <!-- 镜像详情模态框 -->
    <el-dialog v-model="showDetailModal" title="镜像详情" width="700px">
      <div v-if="selectedImage" class="image-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="镜像名称">{{ selectedImage.name }}</el-descriptions-item>
          <el-descriptions-item label="标签">{{ selectedImage.tag }}</el-descriptions-item>
          <el-descriptions-item label="仓库">{{ selectedImage.repository }}</el-descriptions-item>
          <el-descriptions-item label="计算框架">{{ selectedImage.framework }}</el-descriptions-item>
          <el-descriptions-item label="大小">{{ formatImageSize(selectedImage.size) }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedImage.createdTime }}</el-descriptions-item>
          <el-descriptions-item label="镜像地址" :span="2">{{ selectedImage.address }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ selectedImage.description || '暂无描述' }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-actions">
          <el-button type="primary" @click="pullImage(selectedImage)">拉取镜像</el-button>
          <el-button type="success" @click="pushImage(selectedImage)">推送镜像</el-button>
          <el-button type="warning" @click="editImage(selectedImage)">编辑信息</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'ImageManagement',
  data() {
    return {
      searchKeyword: '',
      selectedFramework: '',
      selectedRepo: '',
      showUploadModal: false,
      showCreateModal: false,
      showDetailModal: false,
      uploadTab: 'file',
      uploading: false,
      selectedImage: null,
      uploadFileList: [],
      
      // 镜像数据
      images: [
        {
          id: 1,
          name: 'tensorflow',
          tag: '2.8.0-gpu',
          repository: 'harbor.example.com',
          framework: 'TensorFlow',
          size: 2147483648,
          createdTime: '2024-01-15 10:30:00',
          status: 'ready',
          address: 'harbor.example.com/tensorflow:2.8.0-gpu',
          description: 'TensorFlow 2.8.0 GPU版本镜像'
        },
        {
          id: 2,
          name: 'pytorch',
          tag: '1.12.1-cuda11.3',
          repository: 'harbor.example.com',
          framework: 'PyTorch',
          size: 3221225472,
          createdTime: '2024-01-14 15:20:00',
          status: 'ready',
          address: 'harbor.example.com/pytorch:1.12.1-cuda11.3',
          description: 'PyTorch 1.12.1 CUDA 11.3版本镜像'
        },
        {
          id: 3,
          name: 'mxnet',
          tag: '1.9.1-gpu',
          repository: 'harbor.example.com',
          framework: 'MXNet',
          size: 1610612736,
          createdTime: '2024-01-13 09:15:00',
          status: 'ready',
          address: 'harbor.example.com/mxnet:1.9.1-gpu',
          description: 'MXNet 1.9.1 GPU版本镜像'
        },
        {
          id: 4,
          name: 'caffe',
          tag: '1.0-gpu',
          repository: 'harbor.example.com',
          framework: 'Caffe',
          size: 1073741824,
          createdTime: '2024-01-12 14:45:00',
          status: 'ready',
          address: 'harbor.example.com/caffe:1.0-gpu',
          description: 'Caffe 1.0 GPU版本镜像'
        },
        {
          id: 5,
          name: 'nginx',
          tag: 'latest',
          repository: 'harbor.example.com',
          framework: '其他',
          size: 134217728,
          createdTime: '2024-01-11 11:30:00',
          status: 'ready',
          address: 'harbor.example.com/nginx:latest',
          description: 'Nginx最新版本镜像'
        }
      ],
      
      // 仓库数据
      repositories: [
        { id: 1, name: 'harbor.example.com', description: '主仓库', visibility: 'public' },
        { id: 2, name: 'registry.example.com', description: '测试仓库', visibility: 'private' }
      ],
      
      // 表单数据
      pullForm: {
        name: '',
        repository: ''
      },
      
      repoForm: {
        name: '',
        description: '',
        visibility: 'public'
      },
      
      // 表单验证规则
      pullRules: {
        name: [
          { required: true, message: '请输入镜像名称', trigger: 'blur' }
        ],
        repository: [
          { required: true, message: '请选择仓库', trigger: 'change' }
        ]
      },
      
      repoRules: {
        name: [
          { required: true, message: '请输入仓库名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        description: [
          { required: true, message: '请输入仓库描述', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    filteredImages() {
      let result = this.images
      
      if (this.searchKeyword) {
        result = result.filter(image => 
          image.name.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          image.tag.toLowerCase().includes(this.searchKeyword.toLowerCase())
        )
      }
      
      if (this.selectedFramework) {
        result = result.filter(image => 
          image.framework.toLowerCase() === this.selectedFramework.toLowerCase()
        )
      }
      
      if (this.selectedRepo) {
        result = result.filter(image => 
          image.repository === this.selectedRepo
        )
      }
      
      return result
    },
    
    totalImages() {
      return this.images.length
    },
    
    totalRepos() {
      return this.repositories.length
    },
    
    totalSize() {
      const totalBytes = this.images.reduce((sum, image) => sum + image.size, 0)
      return this.formatImageSize(totalBytes)
    },
    
    totalFrameworks() {
      const frameworks = new Set(this.images.map(image => image.framework))
      return frameworks.size
    }
  },
  methods: {
    // 框架类型映射
    getFrameworkType(framework) {
      const typeMap = {
        'TensorFlow': 'success',
        'PyTorch': 'warning',
        'MXNet': 'info',
        'Caffe': 'danger',
        '其他': ''
      }
      return typeMap[framework] || ''
    },
    
    // 镜像操作
    viewImageDetails(image) {
      this.selectedImage = image
      this.showDetailModal = true
    },
    
    editImage(image) {
      this.$message.info(`编辑镜像: ${image.name}`)
    },
    
    deleteImage(image) {
      this.$confirm(`确定要删除镜像 "${image.name}:${image.tag}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.images = this.images.filter(img => img.id !== image.id)
        this.$message.success('镜像删除成功')
      }).catch(() => {})
    },
    
    pushImage(image) {
      this.$message.success(`开始推送镜像: ${image.name}:${image.tag}`)
    },
    
    pullImage(image) {
      if (image) {
        this.$message.success(`开始拉取镜像: ${image.name}:${image.tag}`)
      } else {
        this.$message.info('请先选择要拉取的镜像')
      }
    },
    
    refreshImages() {
      this.$message.success('镜像列表已刷新')
    },
    
    // 上传相关
    handleFileChange(file, fileList) {
      this.uploadFileList = fileList
    },
    
    confirmUpload() {
      if (this.uploadTab === 'file') {
        this.uploadImageFile()
      } else {
        this.pullFromDockerHub()
      }
    },
    
    uploadImageFile() {
      if (this.uploadFileList.length === 0) {
        this.$message.warning('请选择要上传的镜像文件')
        return
      }
      
      this.uploading = true
      
      // 模拟上传过程
      setTimeout(() => {
        this.uploadFileList.forEach(file => {
          const newImage = {
            id: Date.now() + Math.random(),
            name: file.name.split('.')[0],
            tag: 'latest',
            repository: 'harbor.example.com',
            framework: '其他',
            size: file.size || 1073741824,
            createdTime: new Date().toLocaleString(),
            status: 'ready',
            address: `harbor.example.com/${file.name.split('.')[0]}:latest`,
            description: `从文件 ${file.name} 导入的镜像`
          }
          this.images.push(newImage)
        })
        
        this.uploading = false
        this.showUploadModal = false
        this.uploadFileList = []
        this.$message.success('镜像上传成功')
      }, 3000)
    },
    
    pullFromDockerHub() {
      this.$refs.pullFormRef.validate((valid) => {
        if (valid) {
          this.uploading = true
          
          // 模拟拉取过程
          setTimeout(() => {
            const [name, tag] = this.pullForm.name.split(':')
            const newImage = {
              id: Date.now() + Math.random(),
              name: name,
              tag: tag || 'latest',
              repository: this.pullForm.repository,
              framework: '其他',
              size: 1073741824,
              createdTime: new Date().toLocaleString(),
              status: 'ready',
              address: `${this.pullForm.repository}/${this.pullForm.name}`,
              description: `从Docker Hub拉取的镜像`
            }
            this.images.push(newImage)
            
            this.uploading = false
            this.showUploadModal = false
            this.pullForm = { name: '', repository: '' }
            this.$message.success('镜像拉取成功')
          }, 2000)
        }
      })
    },
    
    // 仓库操作
    createRepository() {
      this.$refs.repoFormRef.validate((valid) => {
        if (valid) {
          const newRepo = {
            id: this.repositories.length + 1,
            ...this.repoForm
          }
          this.repositories.push(newRepo)
          this.showCreateModal = false
          this.repoForm = { name: '', description: '', visibility: 'public' }
          this.$message.success('仓库创建成功')
        }
      })
    },
    
    // 工具方法
    formatImageSize(bytes) {
      if (bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
  }
}
</script>

<style scoped>
.image-management {
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

.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.repo-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.size-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.framework-icon {
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

.filter-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.image-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.image-info {
  display: flex;
  align-items: center;
}

.image-icon {
  margin-right: 10px;
  font-size: 20px;
  color: #409EFF;
}

.image-details {
  flex: 1;
}

.image-name {
  font-weight: bold;
  margin-bottom: 2px;
}

.image-tag {
  font-size: 12px;
  color: #666;
}

.detail-actions {
  margin-top: 20px;
  text-align: center;
}

.detail-actions .el-button {
  margin: 0 10px;
}
</style> 