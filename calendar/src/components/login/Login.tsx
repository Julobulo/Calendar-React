import { useAuth } from "../../AuthProvider";
import { GoogleLoginButton } from "./GoogleLoginButton";

export default function LoginButton() {
    const { user, userLoading } = useAuth();

    if (userLoading) return null; // show nothing while checking session
    if (user) return null;        // hide button if logged in

    return (
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login</h2>
            <span id="signup" className="inline-block shadow transition">
                <GoogleLoginButton />
            </span>
        </div>
    );
}
