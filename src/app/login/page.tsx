import { signInWithGoogle } from "@/app/actions/auth-actions";
import { LogoMark } from "@/components/portal/logo-mark";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/90 p-10 shadow-sheet backdrop-blur">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <LogoMark size={64} className="border-slate-200/80" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-portal-ink">
            A#100005 Portal
          </h1>
        </div>

        <form action={signInWithGoogle} className="mt-10">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-portal-ink bg-portal-ink px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </main>
  );
}
