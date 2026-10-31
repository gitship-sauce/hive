import { AuthForm } from "@/components/auth-form";
import { signUp } from "../auth-actions";

export const metadata = { title: "Sign up · Hive" };

export default function SignUpPage() {
  return (
    <AuthForm
      action={signUp}
      title="Create your account"
      submitLabel="Sign up"
      passwordAutoComplete="new-password"
      switchText="Already have an account?"
      switchHref="/login"
      switchLabel="Log in"
    />
  );
}
