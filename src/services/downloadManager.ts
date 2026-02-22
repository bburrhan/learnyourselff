import { nativeFileSystem, nativeStorage } from '../lib/nativeBridge'
import { isNative } from '../utils/platform'
import logger from '../utils/logger'

interface DownloadedItem {
  contentId: string
  courseId: string
  filePath: string
  fileName: string
  fileSize: number
  contentType: string
  downloadedAt: string
}

const DOWNLOADS_KEY = 'downloaded_content'

class DownloadManager {
  private async getDownloads(): Promise<DownloadedItem[]> {
    const raw = await nativeStorage.get(DOWNLOADS_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as DownloadedItem[]
    } catch {
      return []
    }
  }

  private async saveDownloads(items: DownloadedItem[]): Promise<void> {
    await nativeStorage.set(DOWNLOADS_KEY, JSON.stringify(items))
  }

  async downloadContent(
    contentId: string,
    courseId: string,
    url: string,
    fileName: string,
    fileSize: number,
    contentType: string
  ): Promise<boolean> {
    if (!isNative()) return false

    try {
      const filePath = `courses/${courseId}/${contentId}_${fileName}`
      logger.info('Downloading content', { contentId, filePath })

      const savedPath = await nativeFileSystem.downloadFile(url, filePath)
      if (!savedPath) {
        logger.error('Download failed - no path returned', { contentId })
        return false
      }

      const downloads = await this.getDownloads()
      const existing = downloads.findIndex((d) => d.contentId === contentId)
      const item: DownloadedItem = {
        contentId,
        courseId,
        filePath,
        fileName,
        fileSize,
        contentType,
        downloadedAt: new Date().toISOString(),
      }

      if (existing >= 0) {
        downloads[existing] = item
      } else {
        downloads.push(item)
      }

      await this.saveDownloads(downloads)
      logger.info('Content downloaded successfully', { contentId, filePath })
      return true
    } catch (err) {
      logger.error('Download failed', { contentId, err }, err as Error)
      return false
    }
  }

  async isDownloaded(contentId: string): Promise<boolean> {
    if (!isNative()) return false
    const downloads = await this.getDownloads()
    const item = downloads.find((d) => d.contentId === contentId)
    if (!item) return false
    return nativeFileSystem.fileExists(item.filePath)
  }

  async getLocalUri(contentId: string): Promise<string | null> {
    if (!isNative()) return null
    const downloads = await this.getDownloads()
    const item = downloads.find((d) => d.contentId === contentId)
    if (!item) return null
    return nativeFileSystem.getFileUri(item.filePath)
  }

  async deleteDownload(contentId: string): Promise<void> {
    const downloads = await this.getDownloads()
    const item = downloads.find((d) => d.contentId === contentId)
    if (item) {
      await nativeFileSystem.deleteFile(item.filePath)
      const filtered = downloads.filter((d) => d.contentId !== contentId)
      await this.saveDownloads(filtered)
      logger.info('Downloaded content deleted', { contentId })
    }
  }

  async deleteCourseDownloads(courseId: string): Promise<void> {
    const downloads = await this.getDownloads()
    const courseItems = downloads.filter((d) => d.courseId === courseId)
    for (const item of courseItems) {
      await nativeFileSystem.deleteFile(item.filePath)
    }
    const remaining = downloads.filter((d) => d.courseId !== courseId)
    await this.saveDownloads(remaining)
    logger.info('Course downloads deleted', { courseId, count: courseItems.length })
  }

  async getCourseDownloads(courseId: string): Promise<DownloadedItem[]> {
    const downloads = await this.getDownloads()
    return downloads.filter((d) => d.courseId === courseId)
  }

  async getTotalDownloadSize(): Promise<number> {
    const downloads = await this.getDownloads()
    return downloads.reduce((total, d) => total + d.fileSize, 0)
  }

  async getAllDownloads(): Promise<DownloadedItem[]> {
    return this.getDownloads()
  }
}

export const downloadManager = new DownloadManager()
