export default function SignInPage({ searchParams }: { searchParams: { reason?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      {searchParams.reason === "deactivated" && (
        <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Your account is deactivated. Please contact an administrator.
        </div>
      )}
    </div>
  );
}
