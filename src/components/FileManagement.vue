<template>
  <div class="file-management">
    <!-- 页面标题和操作按钮 -->
    <div class="page-header">
      <h2>文件管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showUploadModal = true">
          <el-icon><Upload /></el-icon>上传文件
        </el-button>
        <el-button type="success" @click="createFolder">
          <el-icon><FolderAdd /></el-icon>新建文件夹
        </el-button>
        <el-button type="warning" @click="compressFiles" :disabled="selectedFiles.length === 0">
          <el-icon><Files /></el-icon>压缩文件
        </el-button>
        <el-button type="info" @click="extractFiles" :disabled="selectedFiles.length === 0">
          <el-icon><FolderOpened /></el-icon>解压文件
        </el-button>
        <el-button type="danger" @click="deleteFiles" :disabled="selectedFiles.length === 0">
          <el-icon><Delete /></el-icon>删除文件
        </el-button>
      </div>
    </div>

    <!-- 面包屑导航 -->
    <el-breadcrumb separator="/" class="breadcrumb">
      <el-breadcrumb-item 
        v-for="(item, index) in breadcrumb" 
        :key="index"
        @click="navigateToFolder(index)"
        :class="{ 'clickable': index < breadcrumb.length - 1 }"
      >
        {{ item.name }}
      </el-breadcrumb-item>
    </el-breadcrumb>

    <!-- 视图切换 -->
    <div class="view-controls">
      <el-radio-group v-model="viewMode" size="small">
        <el-radio-button label="list">
          <el-icon><List /></el-icon>列表视图
        </el-radio-button>
        <el-radio-button label="grid">
          <el-icon><Grid /></el-icon>网格视图
        </el-radio-button>
      </el-radio-group>
      
      <el-input
        v-model="searchKeyword"
        placeholder="搜索文件..."
        style="width: 200px; margin-left: 10px"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 文件列表 -->
    <div class="file-content">
      <!-- 列表视图 -->
      <div v-if="viewMode === 'list'" class="file-list">
        <el-table
          :data="filteredFiles"
          @selection-change="handleSelectionChange"
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column label="文件名" min-width="300">
            <template #default="scope">
              <div class="file-item" @click="handleFileClick(scope.row)">
                <el-icon class="file-icon" :class="getFileIconClass(scope.row)">
                  <component :is="getFileIcon(scope.row)" />
                </el-icon>
                <span class="file-name">{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="size" label="大小" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="modifiedTime" label="修改时间" width="180" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" @click="downloadFile(scope.row)">下载</el-button>
              <el-button size="small" @click="renameFile(scope.row)">重命名</el-button>
              <el-button size="small" type="danger" @click="deleteFile(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 网格视图 -->
      <div v-else class="file-grid">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-card"
          :class="{ 'selected': selectedFiles.includes(file) }"
          @click="toggleFileSelection(file)"
        >
          <div class="file-card-content">
            <el-icon class="file-icon-large" :class="getFileIconClass(file)">
              <component :is="getFileIcon(file)" />
            </el-icon>
            <div class="file-info">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-size">{{ formatFileSize(file.size) }}</div>
              <div class="file-time">{{ file.modifiedTime }}</div>
            </div>
          </div>
          <div class="file-actions">
            <el-button size="small" @click.stop="downloadFile(file)">下载</el-button>
            <el-button size="small" @click.stop="renameFile(file)">重命名</el-button>
            <el-button size="small" type="danger" @click.stop="deleteFile(file)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 上传文件模态框 -->
    <el-dialog v-model="showUploadModal" title="上传文件" width="500px">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="uploadFileList"
        multiple
        drag
      >
        <el-icon class="el-icon--upload"><Upload /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持大文件上传，支持断点续传
          </div>
        </template>
      </el-upload>
      
      <template #footer>
        <el-button @click="showUploadModal = false">取消</el-button>
        <el-button type="primary" @click="uploadFiles" :loading="uploading">
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建文件夹模态框 -->
    <el-dialog v-model="showFolderModal" title="新建文件夹" width="400px">
      <el-form :model="folderForm" :rules="folderRules" ref="folderFormRef" label-width="80px">
        <el-form-item label="文件夹名" prop="name">
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFolderModal = false">取消</el-button>
        <el-button type="primary" @click="createFolderConfirm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重命名模态框 -->
    <el-dialog v-model="showRenameModal" title="重命名" width="400px">
      <el-form :model="renameForm" :rules="renameRules" ref="renameFormRef" label-width="80px">
        <el-form-item label="新名称" prop="name">
          <el-input v-model="renameForm.name" placeholder="请输入新名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenameModal = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'FileManagement',
  data() {
    return {
      viewMode: 'list',
      searchKeyword: '',
      showUploadModal: false,
      showFolderModal: false,
      showRenameModal: false,
      uploading: false,
      selectedFiles: [],
      uploadFileList: [],
      currentPath: '/',
      
      // 面包屑导航
      breadcrumb: [{ name: '根目录', path: '/' }],
      
      // 文件数据
      files: [
        {
          id: 1,
          name: '项目文档',
          type: 'folder',
          size: 0,
          modifiedTime: '2024-01-15 10:30:00',
          path: '/项目文档'
        },
        {
          id: 2,
          name: '技术报告.pdf',
          type: 'pdf',
          size: 2048576,
          modifiedTime: '2024-01-14 15:20:00',
          path: '/技术报告.pdf'
        },
        {
          id: 3,
          name: '代码压缩包.zip',
          type: 'zip',
          size: 10485760,
          modifiedTime: '2024-01-13 09:15:00',
          path: '/代码压缩包.zip'
        },
        {
          id: 4,
          name: '图片素材',
          type: 'folder',
          size: 0,
          modifiedTime: '2024-01-12 14:45:00',
          path: '/图片素材'
        },
        {
          id: 5,
          name: 'logo.png',
          type: 'image',
          size: 512000,
          modifiedTime: '2024-01-11 11:30:00',
          path: '/logo.png'
        }
      ],
      
      // 表单数据
      folderForm: {
        name: ''
      },
      
      renameForm: {
        name: '',
        file: null
      },
      
      // 表单验证规则
      folderRules: {
        name: [
          { required: true, message: '请输入文件夹名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ]
      },
      
      renameRules: {
        name: [
          { required: true, message: '请输入文件名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    filteredFiles() {
      if (!this.searchKeyword) return this.files
      return this.files.filter(file => 
        file.name.toLowerCase().includes(this.searchKeyword.toLowerCase())
      )
    }
  },
  methods: {
    // 文件图标相关
    getFileIcon(file) {
      if (file.type === 'folder') return 'Folder'
      const iconMap = {
        pdf: 'Document',
        zip: 'Files',
        rar: 'Files',
        image: 'Picture',
        txt: 'Document',
        doc: 'Document',
        xls: 'Document',
        ppt: 'Document'
      }
      return iconMap[file.type] || 'Document'
    },
    
    getFileIconClass(file) {
      if (file.type === 'folder') return 'folder-icon'
      const classMap = {
        pdf: 'pdf-icon',
        zip: 'archive-icon',
        rar: 'archive-icon',
        image: 'image-icon',
        txt: 'text-icon',
        doc: 'doc-icon',
        xls: 'excel-icon',
        ppt: 'ppt-icon'
      }
      return classMap[file.type] || 'file-icon'
    },
    
    // 文件操作
    handleFileClick(file) {
      if (file.type === 'folder') {
        this.navigateToFolder(file)
      } else {
        this.downloadFile(file)
      }
    },
    
    navigateToFolder(folder) {
      if (typeof folder === 'number') {
        // 面包屑导航
        this.breadcrumb = this.breadcrumb.slice(0, folder + 1)
      } else {
        // 文件夹导航
        this.breadcrumb.push({ name: folder.name, path: folder.path })
      }
      this.currentPath = this.breadcrumb[this.breadcrumb.length - 1].path
      // 这里应该根据路径加载对应的文件列表
      this.$message.info(`导航到: ${this.currentPath}`)
    },
    
    downloadFile(file) {
      this.$message.success(`开始下载文件: ${file.name}`)
      // 这里实现文件下载逻辑
    },
    
    renameFile(file) {
      this.renameForm.name = file.name
      this.renameForm.file = file
      this.showRenameModal = true
    },
    
    confirmRename() {
      this.$refs.renameFormRef.validate((valid) => {
        if (valid) {
          const index = this.files.findIndex(f => f.id === this.renameForm.file.id)
          if (index !== -1) {
            this.files[index].name = this.renameForm.name
            this.$message.success('重命名成功')
          }
          this.showRenameModal = false
        }
      })
    },
    
    deleteFile(file) {
      this.$confirm(`确定要删除文件 "${file.name}" 吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.files = this.files.filter(f => f.id !== file.id)
        this.$message.success('删除成功')
      }).catch(() => {})
    },
    
    // 批量操作
    handleSelectionChange(selection) {
      this.selectedFiles = selection
    },
    
    toggleFileSelection(file) {
      const index = this.selectedFiles.findIndex(f => f.id === file.id)
      if (index === -1) {
        this.selectedFiles.push(file)
      } else {
        this.selectedFiles.splice(index, 1)
      }
    },
    
    deleteFiles() {
      if (this.selectedFiles.length === 0) return
      
      this.$confirm(`确定要删除选中的 ${this.selectedFiles.length} 个文件吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        const ids = this.selectedFiles.map(f => f.id)
        this.files = this.files.filter(f => !ids.includes(f.id))
        this.selectedFiles = []
        this.$message.success('批量删除成功')
      }).catch(() => {})
    },
    
    compressFiles() {
      if (this.selectedFiles.length === 0) return
      this.$message.success(`开始压缩 ${this.selectedFiles.length} 个文件`)
    },
    
    extractFiles() {
      if (this.selectedFiles.length === 0) return
      this.$message.success(`开始解压 ${this.selectedFiles.length} 个文件`)
    },
    
    // 上传相关
    handleFileChange(file, fileList) {
      this.uploadFileList = fileList
    },
    
    uploadFiles() {
      if (this.uploadFileList.length === 0) {
        this.$message.warning('请选择要上传的文件')
        return
      }
      
      this.uploading = true
      
      // 模拟上传过程
      setTimeout(() => {
        this.uploadFileList.forEach(file => {
          const newFile = {
            id: Date.now() + Math.random(),
            name: file.name,
            type: this.getFileType(file.name),
            size: file.size || 0,
            modifiedTime: new Date().toLocaleString(),
            path: `/${file.name}`
          }
          this.files.push(newFile)
        })
        
        this.uploading = false
        this.showUploadModal = false
        this.uploadFileList = []
        this.$message.success('文件上传成功')
      }, 2000)
    },
    
    getFileType(filename) {
      const ext = filename.split('.').pop().toLowerCase()
      const typeMap = {
        pdf: 'pdf',
        zip: 'zip',
        rar: 'rar',
        png: 'image',
        jpg: 'image',
        jpeg: 'image',
        gif: 'image',
        txt: 'txt',
        doc: 'doc',
        docx: 'doc',
        xls: 'xls',
        xlsx: 'xls',
        ppt: 'ppt',
        pptx: 'ppt'
      }
      return typeMap[ext] || 'file'
    },
    
    // 文件夹操作
    createFolder() {
      this.showFolderModal = true
    },
    
    createFolderConfirm() {
      this.$refs.folderFormRef.validate((valid) => {
        if (valid) {
          const newFolder = {
            id: Date.now(),
            name: this.folderForm.name,
            type: 'folder',
            size: 0,
            modifiedTime: new Date().toLocaleString(),
            path: `/${this.folderForm.name}`
          }
          this.files.push(newFolder)
          this.showFolderModal = false
          this.folderForm.name = ''
          this.$message.success('文件夹创建成功')
        }
      })
    },
    
    // 工具方法
    formatFileSize(bytes) {
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
.file-management {
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

.breadcrumb {
  margin-bottom: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
}

.clickable {
  cursor: pointer;
  color: #409EFF;
}

.clickable:hover {
  text-decoration: underline;
}

.view-controls {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.file-content {
  min-height: 400px;
}

.file-list {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.file-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px 0;
}

.file-icon {
  margin-right: 10px;
  font-size: 18px;
}

.file-name {
  flex: 1;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.file-card {
  background: white;
  border: 2px solid transparent;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.file-card:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.file-card.selected {
  border-color: #409EFF;
  background-color: #f0f9ff;
}

.file-card-content {
  text-align: center;
  margin-bottom: 10px;
}

.file-icon-large {
  font-size: 48px;
  margin-bottom: 10px;
}

.file-info {
  text-align: center;
}

.file-name {
  font-weight: bold;
  margin-bottom: 5px;
  word-break: break-all;
}

.file-size,
.file-time {
  font-size: 12px;
  color: #666;
  margin-bottom: 2px;
}

.file-actions {
  display: flex;
  gap: 5px;
  justify-content: center;
}

/* 文件类型图标样式 */
.folder-icon {
  color: #ffa500;
}

.pdf-icon {
  color: #ff4444;
}

.archive-icon {
  color: #ff8800;
}

.image-icon {
  color: #4caf50;
}

.text-icon {
  color: #2196f3;
}

.doc-icon {
  color: #2196f3;
}

.excel-icon {
  color: #4caf50;
}

.ppt-icon {
  color: #ff9800;
}

.file-icon {
  color: #666;
}
</style> 