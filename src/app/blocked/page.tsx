export default function BlockedPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Account blocked</h1>
      <p className="mt-2 text-muted-foreground">
        Your account has been blocked by an administrator. If you think this is
        a mistake, contact support.
      </p>
    </div>
  );
}
