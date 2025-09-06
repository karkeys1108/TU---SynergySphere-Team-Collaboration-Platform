import { RegisterForm } from "@/components/auth/RegisterForm"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <CheckCircle className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold"> SynergySphere</span>
          </Link>
        </div>

        <RegisterForm />

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
