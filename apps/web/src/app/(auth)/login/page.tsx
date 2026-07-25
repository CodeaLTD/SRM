import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <main>
      <h1>Codea SRM</h1>
      <form
        action={async () => {
          "use server";
          await signIn("google");
        }}
      >
        <button type="submit">Sign in with Google Workspace</button>
      </form>
    </main>
  );
}
