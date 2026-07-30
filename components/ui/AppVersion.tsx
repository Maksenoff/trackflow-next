export function AppVersion() {
  return (
    <span className="text-xs text-muted-foreground">v{process.env.NEXT_PUBLIC_APP_VERSION}</span>
  )
}
