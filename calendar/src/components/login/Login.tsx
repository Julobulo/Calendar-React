import { GoogleLoginButton } from "./GoogleLoginButton";

const Login = () => {

    return (
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login</h2>
            <span id="signup" className="inline-block shadow transition">
                <GoogleLoginButton />
            </span>
        </div>
    );
};

export default Login;
