import { useRef, useState, type FormEvent } from 'react'
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleCheck,
} from 'lucide-react'
import { Avatar, Modal, Stage } from './components'
import { type Project, type Review, type Workspace } from './data'
import Plan from './Plan'

export default function DrawingReview({
  review,
  project,
  update,
  onClose,
  notify,
}: {
  review: Review
  project: Project
  update: (transform: (current: Workspace) => Workspace) => void
  onClose: () => void
  notify: (text: string) => void
}) {
  const [noteText, setNoteText] = useState(''),
    [pin, setPin] = useState({ x: 50, y: 50 })
  const input = useRef<HTMLTextAreaElement>(null),
    drawing = useRef<HTMLDivElement>(null)
  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!noteText.trim()) return
    const note = {
      id: crypto.randomUUID(),
      text: noteText.trim(),
      resolved: false,
      ...pin,
    }
    update((current) => ({
      ...current,
      reviews: current.reviews.map((item) =>
        item.id === review.id
          ? { ...item, notes: [...item.notes, note], status: 'In review' }
          : item,
      ),
    }))
    setNoteText('')
    notify('Comment added to drawing')
  }
  function resolveNote(id: string) {
    update((current) => ({
      ...current,
      reviews: current.reviews.map((item) =>
        item.id === review.id
          ? {
              ...item,
              status: item.notes.find((note) => note.id === id)?.resolved
                ? 'In review'
                : item.status,
              notes: item.notes.map((note) =>
                note.id === id ? { ...note, resolved: !note.resolved } : note,
              ),
            }
          : item,
      ),
    }))
  }
  function approveDrawing() {
    if (review.notes.some((note) => !note.resolved)) return
    update((current) => ({
      ...current,
      reviews: current.reviews.map((item) =>
        item.id === review.id ? { ...item, status: 'Approved' } : item,
      ),
    }))
    notify('Drawing approved')
  }
  function downloadPlan() {
    const svg = drawing.current?.querySelector('svg')?.outerHTML
    if (!svg) return
    const url = URL.createObjectURL(
        new Blob(
          [svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')],
          { type: 'image/svg+xml' },
        ),
      ),
      anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${review.version.split(' / ')[0]}.svg`
    anchor.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={review.name}
      description={`${project.name} / ${review.version}`}
      className="drawing-modal"
    >
      <div className="drawing-toolbar">
        <Stage stage={review.status} />
        <span className="muted-small">
          {review.notes.filter((note) => !note.resolved).length} open comments
        </span>
        <button className="button secondary" onClick={downloadPlan}>
          <ArrowDownToLine size={14} />
          Download drawing
        </button>
      </div>
      <div className="drawing-workspace">
        <div className="drawing-view">
          <div
            ref={drawing}
            className="drawing-canvas"
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect()
              setPin({
                x: Math.round(((event.clientX - box.left) / box.width) * 100),
                y: Math.round(((event.clientY - box.top) / box.height) * 100),
              })
              input.current?.focus()
            }}
          >
            <Plan variant={review.projectId} />
            {review.notes.map((note, index) => (
              <button
                className={`drawing-pin ${note.resolved ? 'resolved' : ''}`}
                style={{ left: `${note.x}%`, top: `${note.y}%` }}
                aria-label={`Comment ${index + 1}: ${note.text}`}
                key={note.id}
                onClick={(event) => {
                  event.stopPropagation()
                  document
                    .getElementById(`note-${note.id}`)
                    ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                }}
              >
                {note.resolved ? <Check size={12} /> : index + 1}
              </button>
            ))}
          </div>
          <span className="drawing-help">
            Click the drawing to position your next comment.
          </span>
        </div>
        <aside className="comments-panel">
          <div className="comments-heading">
            <h3>Conversation</h3>
            <span>{review.notes.length}</span>
          </div>
          <div className="comments-list">
            {review.notes.map((note, index) => (
              <article
                className={`comment ${note.resolved ? 'comment-resolved' : ''}`}
                id={`note-${note.id}`}
                key={note.id}
              >
                <div>
                  <Avatar code={index % 2 ? 'JL' : 'AM'} small />
                  <strong>{index % 2 ? 'Jamie Lee' : 'Alex Morgan'}</strong>
                  <span className="comment-number">{index + 1}</span>
                </div>
                <p>{note.text}</p>
                <button onClick={() => resolveNote(note.id)}>
                  {note.resolved ? (
                    <CheckCheck size={13} />
                  ) : (
                    <CircleCheck size={13} />
                  )}{' '}
                  {note.resolved ? 'Resolved · Reopen' : 'Resolve comment'}
                </button>
              </article>
            ))}
            {!review.notes.length && (
              <p className="muted-small">
                No feedback yet. Leave the first comment.
              </p>
            )}
          </div>
          <form className="comment-form" onSubmit={addNote}>
            <label htmlFor="drawing-comment">
              Leave a comment{' '}
              <span>
                PIN {pin.x}, {pin.y}
              </span>
            </label>
            <textarea
              id="drawing-comment"
              ref={input}
              value={noteText}
              onChange={(event) => setNoteText(event.target.value)}
              placeholder="What could be better?"
              required
              maxLength={1000}
            />
            <button
              className="button primary"
              type="submit"
              disabled={!noteText.trim()}
            >
              Add comment
              <ArrowUpRight size={15} />
            </button>
          </form>
        </aside>
      </div>
      <div className="drawing-modal-footer">
        <span>
          {review.notes.some((note) => !note.resolved)
            ? 'Resolve all open comments before approving.'
            : review.status === 'Approved'
              ? 'This drawing set is approved.'
              : 'All feedback resolved. Ready to approve.'}
        </span>
        <button
          className="button primary"
          disabled={
            review.notes.some((note) => !note.resolved) ||
            review.status === 'Approved'
          }
          onClick={approveDrawing}
        >
          <Check size={15} />
          {review.status === 'Approved' ? 'Approved' : 'Approve drawing'}
        </button>
      </div>
    </Modal>
  )
}
