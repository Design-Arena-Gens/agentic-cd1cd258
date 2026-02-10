'use client'

import { useState, useEffect, useMemo } from 'react'
import styles from './page.module.css'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [currentTags, setCurrentTags] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('notes')
    if (stored) {
      setNotes(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('notes', JSON.stringify(notes))
    }
  }, [notes])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)))
    return Array.from(tagSet).sort()
  }, [notes])

  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const matchesSearch = searchQuery === '' ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTag = selectedTag === null || note.tags.includes(selectedTag)

      return matchesSearch && matchesTag
    }).sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes, searchQuery, selectedTag])

  const startNewNote = () => {
    setIsEditing(true)
    setCurrentNote(null)
    setTitle('')
    setContent('')
    setCurrentTags([])
    setTagInput('')
  }

  const editNote = (note: Note) => {
    setIsEditing(true)
    setCurrentNote(note)
    setTitle(note.title)
    setContent(note.content)
    setCurrentTags([...note.tags])
    setTagInput('')
  }

  const saveNote = () => {
    if (!title.trim() && !content.trim()) return

    const now = Date.now()

    if (currentNote) {
      setNotes(notes.map(n =>
        n.id === currentNote.id
          ? { ...n, title, content, tags: currentTags, updatedAt: now }
          : n
      ))
    } else {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title,
        content,
        tags: currentTags,
        createdAt: now,
        updatedAt: now
      }
      setNotes([newNote, ...notes])
    }

    cancelEdit()
  }

  const deleteNote = (id: string) => {
    if (confirm('Delete this note?')) {
      setNotes(notes.filter(n => n.id !== id))
    }
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setCurrentNote(null)
    setTitle('')
    setContent('')
    setCurrentTags([])
    setTagInput('')
  }

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase()
    if (tag && !currentTags.includes(tag)) {
      setCurrentTags([...currentTags, tag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setCurrentTags(currentTags.filter(t => t !== tagToRemove))
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  if (isEditing) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={cancelEdit} className={styles.backButton}>
            ← Back
          </button>
          <button onClick={saveNote} className={styles.saveButton}>
            Save
          </button>
        </header>

        <div className={styles.editor}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.titleInput}
            autoFocus
          />

          <textarea
            placeholder="Write your note..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={styles.contentInput}
          />

          <div className={styles.tagSection}>
            <div className={styles.tagInputContainer}>
              <input
                type="text"
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                className={styles.tagInput}
              />
              <button onClick={addTag} className={styles.addTagButton}>
                Add
              </button>
            </div>

            {currentTags.length > 0 && (
              <div className={styles.tagList}>
                {currentTags.map(tag => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button onClick={() => removeTag(tag)} className={styles.removeTag}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Notes</h1>
        <button onClick={startNewNote} className={styles.newButton}>
          + New
        </button>
      </header>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {allTags.length > 0 && (
        <div className={styles.filterTags}>
          <button
            onClick={() => setSelectedTag(null)}
            className={`${styles.filterTag} ${selectedTag === null ? styles.filterTagActive : ''}`}
          >
            All
          </button>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`${styles.filterTag} ${selectedTag === tag ? styles.filterTagActive : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className={styles.notesList}>
        {filteredNotes.length === 0 ? (
          <div className={styles.emptyState}>
            <p>{searchQuery || selectedTag ? 'No notes found' : 'No notes yet'}</p>
            {!searchQuery && !selectedTag && (
              <button onClick={startNewNote} className={styles.emptyButton}>
                Create your first note
              </button>
            )}
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className={styles.noteCard}>
              <div onClick={() => editNote(note)} className={styles.noteContent}>
                <h3 className={styles.noteTitle}>
                  {note.title || 'Untitled'}
                </h3>
                {note.content && (
                  <p className={styles.notePreview}>
                    {note.content}
                  </p>
                )}
                {note.tags.length > 0 && (
                  <div className={styles.noteTags}>
                    {note.tags.map(tag => (
                      <span key={tag} className={styles.noteTag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <span className={styles.noteDate}>
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNote(note.id)
                }}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
