import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return <SignIn path="/sign-in" afterSignInUrl="/after-sign-in" />;
}
