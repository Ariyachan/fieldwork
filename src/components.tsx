import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowUpRight, Folder, X } from 'lucide-react'
import { members, type Project } from './data'

export function Avatar({
  code,
  small = false,
}: {
  code: string
  small?: boolean
}) {
  return (
    <span
      className={`avatar ${small ? 'small' : ''}`}
      style={{ background: members[code]?.color || '#dedbd5' }}
      title={members[code]?.name || code}
    >
      {code}
    </span>
  )
}
export function Empty({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <Folder size={32} strokeWidth={1.2} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
export function Stage({ stage }: { stage: string }) {
  return (
    <span
      className={`stage ${stage === 'Completed' || stage === 'Approved' ? 'complete' : ''}`}
    >
      <span />
      {stage}
    </span>
  )
}
export function Geometry({
  color = '#abbac3',
  type = 'north',
}: {
  color?: string
  type?: string
}) {
  return (
    <svg
      viewBox="0 0 560 340"
      className="geometry"
      role="img"
      aria-label="Axonometric architectural study"
    >
      <rect width="560" height="340" fill={color} />
      <g transform={type === 'archive' ? 'translate(10 -5)' : ''}>
        <path
          d="M120 251L280 330L458 243L298 165Z"
          fill="#7d897d"
          opacity=".22"
        />
        <path d="M112 154L272 233L446 148L286 69Z" fill="#f1f0e9" />
        <path d="M112 154V237L272 316V233Z" fill="#c6c9bf" />
        <path d="M272 233V316L446 231V148Z" fill="#e1e1d6" />
        <path d="M153 153L273 212L405 148L285 89Z" fill={color} />
        <path d="M153 153V187L273 246V212Z" fill="#7f8d83" />
        <path d="M273 212V246L405 182V148Z" fill="#a2ac9f" />
        <path d="M190 156L272 196L365 151L283 111Z" fill="#dce1d5" />
        <path d="M190 156V174L272 214V196Z" fill="#b4beb0" />
        <path d="M272 196V214L365 169V151Z" fill="#c7d0c0" />
        <g fill="#798679">
          <path d="M290 254L310 244V282L290 292Z" />
          <path d="M323 238L343 228V266L323 276Z" />
          <path d="M356 222L376 212V250L356 260Z" />
          <path d="M389 206L409 196V234L389 244Z" />
        </g>
        <g stroke="#8a9388" opacity=".55">
          <path d="M146 172V238M180 189V255M214 205V272M247 221V289" />
        </g>
      </g>
      <text
        x="26"
        y="314"
        fontFamily="monospace"
        fontSize="10"
        fill="#37453b"
        letterSpacing="2"
      >
        VOLUME STUDY / 01
      </text>
    </svg>
  )
}
export function ProjectVisual({ project }: { project: Project }) {
  return project.image ? (
    <img
      src={`${import.meta.env.BASE_URL}images/${project.image}`}
      alt={`${project.name} architectural reference`}
      loading="lazy"
    />
  ) : (
    <Geometry color={project.color} type={project.id} />
  )
}
export function ProjectCard({
  project,
  percent,
  list = false,
}: {
  project: Project
  percent: number
  list?: boolean
}) {
  return (
    <a
      className={`project-card ${list ? 'list-card' : ''}`}
      href={`#/projects/${project.id}`}
    >
      <div className="project-image">
        <ProjectVisual project={project} />
        <span className="project-code">{project.code}</span>
        <span className="project-open">
          <ArrowUpRight size={19} />
        </span>
      </div>
      <div className="project-card-body">
        <span className="eyebrow">
          {project.kind} / {project.location.split(',')[0]}
        </span>
        <h3>{project.name}</h3>
        <div className="project-card-meta">
          <Stage stage={project.stage} />
          <div className="avatar-stack">
            {project.members.map((code) => (
              <Avatar code={code} key={code} small />
            ))}
          </div>
        </div>
        <div className="project-card-progress">
          <span className="progress-track">
            <span style={{ width: `${percent}%` }} />
          </span>
          <span>{percent}%</span>
        </div>
      </div>
    </a>
  )
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className = '',
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  children: ReactNode
  className?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={`modal ${className}`}>
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
