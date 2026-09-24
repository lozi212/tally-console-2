import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Rendered instead of the children once something below has thrown. */
  fallback: (error: Error, reset: () => void) => ReactNode
  /** Called by `reset` before re-rendering, e.g. to clear failed queries. */
  onReset?: () => void
}

interface State {
  error: Error | null
}

/**
 * React has no hook equivalent, so this stays a class. `reset` clears the
 * captured error and lets the subtree mount again, which is what the Retry
 * buttons call.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) console.error('Caught by ErrorBoundary:', error, info.componentStack)
  }

  reset = () => {
    this.props.onReset?.()
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    return error ? this.props.fallback(error, this.reset) : this.props.children
  }
}
