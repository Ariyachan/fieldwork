import {
  Fragment,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { ArrowRight, ArrowUpRight, Check, LoaderCircle } from 'lucide-react'
import { apiEnabled, apiRequest } from './api'
import { AccountContext, type AccountUser } from './account'
import './Auth.css'

type Session = { user: AccountUser } | null

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(null)
  const [checking, setChecking] = useState(apiEnabled)
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const refresh = useCallback(async () => {
    try {
      setSession(await apiRequest<Session>('/auth/get-session'))
    } catch {
      setError(
        'We couldn’t connect to your workspace. Check your connection and try again.',
      )
    } finally {
      setChecking(false)
    }
  }, [])
  useEffect(() => {
    // Fetch completion synchronizes the session; refresh has no synchronous state update.
    // oxlint-disable-next-line react/set-state-in-effect
    if (apiEnabled) void refresh()
  }, [refresh])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await apiRequest(`/auth/${mode}/email`, {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(mode === 'sign-up' ? { name: name.trim() } : {}),
        }),
      })
      const result = await apiRequest<Session>('/auth/get-session')
      if (!result) throw new Error('Please sign in to continue.')
      setPassword('')
      setSession(result)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'We couldn’t sign you in. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    await apiRequest('/auth/sign-out', { method: 'POST', body: '{}' })
    setPassword('')
    setSession(null)
    location.hash = '#/overview'
  }

  if (!apiEnabled) return children
  if (checking)
    return (
      <div className="connection-screen" role="status">
        <LoaderCircle className="loading-spin" size={24} />
        <span>Opening your studio…</span>
      </div>
    )
  if (session)
    return (
      <AccountContext.Provider value={{ user: session.user, signOut }}>
        <Fragment key={session.user.id}>{children}</Fragment>
      </AccountContext.Provider>
    )

  return (
    <main className="auth-layout">
      <section className="auth-story" aria-label="About FIELDWORK">
        <a href={import.meta.env.BASE_URL} className="auth-wordmark">
          FIELDWORK<span>®</span>
        </a>
        <div className="auth-story-copy">
          <span className="auth-kicker">A PLACE FOR THE WORK</span>
          <h1>
            Good work.
            <br />{' '}
            Room to breathe.
          </h1>
          <p>
            A considered workspace for the projects, drawings and conversations
            that shape your studio.
          </p>
        </div>
        <img
          className="auth-architecture"
          src={`${import.meta.env.BASE_URL}images/courtyard.jpg`}
          alt="A warm courtyard with planted edges and a timber-framed opening"
        />
        <div className="auth-story-footer">
          <span>Projects / People / Perspective</span>
          <span>01 — THE STUDIO</span>
        </div>
      </section>
      <section className="auth-form-panel">
        <a
          className="auth-case-link"
          href={`${import.meta.env.BASE_URL}case-study.html`}
        >
          Explore the project <ArrowUpRight size={15} />
        </a>
        <div className="auth-form-wrap">
          <span className="auth-kicker">YOUR STUDIO, IN ONE PLACE</span>
          <h2>
            {mode === 'sign-in'
              ? 'Welcome back.'
              : 'Make room for what’s next.'}
          </h2>
          <p>
            {mode === 'sign-in'
              ? 'Sign in to pick up where you left off.'
              : 'Create your own workspace, with a small example studio to explore.'}
          </p>
          <form onSubmit={submit}>
            {mode === 'sign-up' && (
              <label>
                Your name
                <input
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={busy}
                />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                autoComplete={
                  mode === 'sign-up' ? 'new-password' : 'current-password'
                }
                required
                minLength={mode === 'sign-up' ? 12 : 8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
              {mode === 'sign-up' && <small>Use at least 12 characters.</small>}
            </label>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
            <button className="auth-submit" disabled={busy} type="submit">
              {busy ? (
                <>
                  <LoaderCircle className="loading-spin" size={18} /> One
                  moment…
                </>
              ) : (
                <>
                  {mode === 'sign-in'
                    ? 'Sign in to your studio'
                    : 'Create workspace'}{' '}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <div className="auth-switch">
            {mode === 'sign-in'
              ? 'New to FIELDWORK?'
              : 'Already have a workspace?'}{' '}
            <button
              disabled={busy}
              onClick={() => {
                setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
                setError('')
                setPassword('')
              }}
            >
              {mode === 'sign-in' ? 'Create an account' : 'Sign in'}
            </button>
          </div>
          {error.includes('connect') && (
            <button
              className="auth-retry"
              onClick={() => {
                setChecking(true)
                setError('')
                void refresh()
              }}
            >
              Try connection again
            </button>
          )}
          <div className="auth-assurance">
            <Check size={14} />
            <span>Your projects stay in your own workspace.</span>
          </div>
        </div>
        <footer className="auth-legal">
          An independent product project by Kai Zhang.
        </footer>
      </section>
    </main>
  )
}
