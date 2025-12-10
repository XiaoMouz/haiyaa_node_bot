import type { NCWebsocket } from 'node-napcat-ts'
import { useStorage } from './useStorage'

/**
 * 群成员信息 self
 */
export interface GroupMember {
  user_id: number
  nickname: string
  card?: string
  role?: 'owner' | 'admin' | 'member'
}

/**
 * 群成员缓存数据结构
 */
interface GroupMembersData {
  group_id: number
  members: GroupMember[]
  last_updated: string
}

/**
 * 群成员缓存管理器
 * 每个群的成员缓存保存为独立的 JSON 文件
 */
class GroupMembersCache {
  private bot: NCWebsocket | null = null
  private storageCache = new Map<
    number,
    ReturnType<typeof useStorage<GroupMembersData>>
  >()

  /**
   * 设置 Bot 实例
   */
  setBot(bot: NCWebsocket) {
    this.bot = bot
  }

  /**
   * 获取指定群的存储实例
   */
  private getStorage(groupId: number) {
    if (!this.storageCache.has(groupId)) {
      const storage = useStorage<GroupMembersData>(
        `./Data/group-members/${groupId}.json`
      )
      this.storageCache.set(groupId, storage)
    }
    return this.storageCache.get(groupId)!
  }

  /**
   * 初始化指定群的成员缓存
   */
  async initGroupCache(groupId: number): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot instance not set')
    }

    try {
      const members = await this.bot.get_group_member_list({
        group_id: groupId,
      })

      const groupMembers: GroupMember[] = members.map((member) => ({
        user_id: member.user_id,
        nickname: member.nickname,
        card: member.card,
        role: member.role,
      }))

      const storage = this.getStorage(groupId)

      // 清空现有数据并写入新数据
      const existingData = await storage.load()
      if (existingData.length > 0) {
        await storage.save([])
      }

      await storage.append({
        group_id: groupId,
        members: groupMembers,
        last_updated: new Date().toISOString(),
      })

      console.log(
        `[GroupMembersCache] Initialized cache for group ${groupId}: ${groupMembers.length} members`
      )
    } catch (error) {
      console.error(
        `[GroupMembersCache] Failed to init cache for group ${groupId}:`,
        error
      )
      throw error
    }
  }

  /**
   * 初始化所有群的成员缓存
   */
  async initAllGroups(): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot instance not set')
    }

    try {
      const groupList = await this.bot.get_group_list()
      console.log(
        `[GroupMembersCache] Initializing cache for ${groupList.length} groups...`
      )

      // 并发初始化所有群
      const results = await Promise.allSettled(
        groupList.map((group) => this.initGroupCache(group.group_id))
      )

      const successCount = results.filter(
        (r) => r.status === 'fulfilled'
      ).length
      console.log(
        `[GroupMembersCache] Cache initialized for ${successCount}/${groupList.length} groups`
      )
    } catch (error) {
      console.error('[GroupMembersCache] Failed to init all groups:', error)
      throw error
    }
  }

  /**
   * 获取群成员列表（从文件缓存读取）
   */
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    const storage = this.getStorage(groupId)
    const data = await storage.load()

    // 如果缓存存在，直接返回
    if (data.length > 0 && data[0].members) {
      return data[0].members
    }

    // 缓存不存在，初始化缓存
    console.log(
      `[GroupMembersCache] Cache miss for group ${groupId}, initializing...`
    )
    await this.initGroupCache(groupId)

    const newData = await storage.load()
    return newData[0]?.members || []
  }

  /**
   * 获取群成员 ID 列表
   */
  async getGroupMemberIds(groupId: number): Promise<number[]> {
    const members = await this.getGroupMembers(groupId)
    return members.map((m) => m.user_id)
  }

  /**
   * 获取单个群成员信息
   */
  async getGroupMember(
    groupId: number,
    userId: number
  ): Promise<GroupMember | undefined> {
    const members = await this.getGroupMembers(groupId)
    return members.find((m) => m.user_id === userId)
  }

  /**
   * 添加群成员到缓存
   */
  async addGroupMember(groupId: number, userId: number): Promise<void> {
    if (!this.bot) {
      throw new Error('Bot instance not set')
    }

    try {
      // 获取群成员信息
      const memberInfo = await this.bot.get_group_member_info({
        group_id: groupId,
        user_id: userId,
      })

      const newMember: GroupMember = {
        user_id: memberInfo.user_id,
        nickname: memberInfo.nickname,
        card: memberInfo.card,
        role: memberInfo.role,
      }

      const storage = this.getStorage(groupId)
      const data = await storage.load()

      if (data.length > 0) {
        // 更新现有数据
        const groupData = data[0]
        const existingIndex = groupData.members.findIndex(
          (m: GroupMember) => m.user_id === userId
        )

        if (existingIndex === -1) {
          // 成员不存在，添加
          groupData.members.push(newMember)
        } else {
          // 成员已存在，更新
          groupData.members[existingIndex] = newMember
        }

        groupData.last_updated = new Date().toISOString()

        await storage.upsert(groupData, (d) => d.group_id === groupId)
      } else {
        // 初始化数据
        await storage.append({
          group_id: groupId,
          members: [newMember],
          last_updated: new Date().toISOString(),
        })
      }

      console.log(
        `[GroupMembersCache] Added member ${userId} to group ${groupId}`
      )
    } catch (error) {
      console.error(
        `[GroupMembersCache] Failed to add member ${userId} to group ${groupId}:`,
        error
      )
    }
  }

  /**
   * 从缓存中移除群成员
   */
  async removeGroupMember(groupId: number, userId: number): Promise<void> {
    try {
      const storage = this.getStorage(groupId)
      const data = await storage.load()

      if (data.length > 0) {
        const groupData = data[0]
        groupData.members = groupData.members.filter(
          (m: GroupMember) => m.user_id !== userId
        )
        groupData.last_updated = new Date().toISOString()

        await storage.upsert(groupData, (d) => d.group_id === groupId)

        console.log(
          `[GroupMembersCache] Removed member ${userId} from group ${groupId}`
        )
      }
    } catch (error) {
      console.error(
        `[GroupMembersCache] Failed to remove member ${userId} from group ${groupId}:`,
        error
      )
    }
  }

  /**
   * 清除指定群的缓存
   */
  async clearGroupCache(groupId: number): Promise<void> {
    try {
      const storage = this.getStorage(groupId)
      await storage.save([])
      this.storageCache.delete(groupId)
      console.log(`[GroupMembersCache] Cleared cache for group ${groupId}`)
    } catch (error) {
      console.error(
        `[GroupMembersCache] Failed to clear cache for group ${groupId}:`,
        error
      )
    }
  }

  /**
   * 清除所有缓存
   */
  async clearAllCache(): Promise<void> {
    try {
      const groupIds = Array.from(this.storageCache.keys())
      await Promise.all(
        groupIds.map((groupId) => this.clearGroupCache(groupId))
      )
      console.log('[GroupMembersCache] Cleared all cache')
    } catch (error) {
      console.error('[GroupMembersCache] Failed to clear all cache:', error)
    }
  }

  /**
   * 获取缓存统计信息
   */
  async getStats() {
    const stats = {
      totalGroups: 0,
      totalMembers: 0,
      groupDetails: [] as {
        groupId: number
        memberCount: number
        lastUpdated: string
      }[],
    }

    const groupIds = Array.from(this.storageCache.keys())
    for (const groupId of groupIds) {
      const storage = this.getStorage(groupId)
      const data = await storage.load()

      if (data.length > 0) {
        const groupData = data[0]
        stats.totalGroups++
        stats.totalMembers += groupData.members.length
        stats.groupDetails.push({
          groupId: groupData.group_id,
          memberCount: groupData.members.length,
          lastUpdated: groupData.last_updated,
        })
      }
    }

    return stats
  }
}

// 单例实例
const groupMembersCache = new GroupMembersCache()

/**
 * useGroupMembers - 群成员缓存管理 composable
 */
export function useGroupMembers() {
  return {
    setBot: (bot: NCWebsocket) => groupMembersCache.setBot(bot),
    initAllGroups: () => groupMembersCache.initAllGroups(),
    initGroupCache: (groupId: number) =>
      groupMembersCache.initGroupCache(groupId),
    getGroupMembers: (groupId: number) =>
      groupMembersCache.getGroupMembers(groupId),
    getGroupMemberIds: (groupId: number) =>
      groupMembersCache.getGroupMemberIds(groupId),
    getGroupMember: (groupId: number, userId: number) =>
      groupMembersCache.getGroupMember(groupId, userId),
    addGroupMember: (groupId: number, userId: number) =>
      groupMembersCache.addGroupMember(groupId, userId),
    removeGroupMember: (groupId: number, userId: number) =>
      groupMembersCache.removeGroupMember(groupId, userId),
    clearGroupCache: (groupId: number) =>
      groupMembersCache.clearGroupCache(groupId),
    clearAllCache: () => groupMembersCache.clearAllCache(),
    getStats: () => groupMembersCache.getStats(),
  }
}
