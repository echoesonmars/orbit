import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="w-full relative z-10 flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md animate-fade-in-up">
                {/* We use a max-w wrapper so the BorderBeam card scales nicely */}
                <LoginForm />
            </div>
        </div>
    );
}
