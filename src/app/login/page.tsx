import { AuthForm } from "@/components/auth-form";
import { logIn } from "../auth-actions";

export const metadata = { title: "Log in · Hive" };

export default function LogInPage() {
  return (
    <AuthForm
      action={logIn}
      title="Log in"
      submitLabel="Log in"
      passwordAutoComplete="current-password"
      switchText="New here?"
      switchHref="/signup"
      switchLabel="Create an account"
    />
  );
}
