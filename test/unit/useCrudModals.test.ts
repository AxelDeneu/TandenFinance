import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

vi.stubGlobal('ref', ref)

const { useCrudModals } = await import('~/composables/useCrudModals')

describe('useCrudModals', () => {
  it('initializes with all modals closed', () => {
    const { editModalOpen, deleteModalOpen, addModalOpen } = useCrudModals({
      onRefresh: vi.fn()
    })
    expect(editModalOpen.value).toBe(false)
    expect(deleteModalOpen.value).toBe(false)
    expect(addModalOpen.value).toBe(false)
  })

  it('openEditModal sets entry and opens modal', () => {
    const { editingEntry, editModalOpen, openEditModal } = useCrudModals<{ id: number }>({
      onRefresh: vi.fn()
    })
    openEditModal({ id: 42 })
    expect(editingEntry.value).toEqual({ id: 42 })
    expect(editModalOpen.value).toBe(true)
  })

  it('openDeleteModal sets entry and opens modal', () => {
    const { deletingEntry, deleteModalOpen, openDeleteModal } = useCrudModals<{ id: number }>({
      onRefresh: vi.fn()
    })
    openDeleteModal({ id: 7 })
    expect(deletingEntry.value).toEqual({ id: 7 })
    expect(deleteModalOpen.value).toBe(true)
  })

  it('onSaved calls onRefresh and onNotify', () => {
    const onRefresh = vi.fn()
    const onNotify = vi.fn()
    const { onSaved } = useCrudModals({ onRefresh, onNotify })
    onSaved()
    expect(onRefresh).toHaveBeenCalledOnce()
    expect(onNotify).toHaveBeenCalledOnce()
  })

  it('onDeleted calls onRefresh and onNotify', () => {
    const onRefresh = vi.fn()
    const onNotify = vi.fn()
    const { onDeleted } = useCrudModals({ onRefresh, onNotify })
    onDeleted()
    expect(onRefresh).toHaveBeenCalledOnce()
    expect(onNotify).toHaveBeenCalledOnce()
  })

  it('onSaved works without onNotify', () => {
    const onRefresh = vi.fn()
    const { onSaved } = useCrudModals({ onRefresh })
    onSaved()
    expect(onRefresh).toHaveBeenCalledOnce()
  })
})
