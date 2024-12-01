
const Login = () => {
    const handleGoogleLogin = () => {
        // window.location.href = `http://localhost:8787/oauth/google`;
        window.location.href = "https://api.racing.kennan.tech/oauth/google";
    };
    const handleGuestLogin = () => {
        // window.location.href = `http://localhost:8787/oauth/guest`;
        window.location.href = "https://api.racing.kennan.tech/oauth/guest";
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">Login</h2>
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <button
                    onClick={handleGuestLogin}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow hover:bg-blue-500 flex items-center justify-center transition-colors duration-300"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                        className="w-5 h-5 mr-2"
                    >
                        <path
                            fill="white"
                            d="M 24 4 C 18.494917 4 14 8.494921 14 14 C 14 19.505079 18.494917 24 24 24 C 29.505083 24 34 19.505079 34 14 C 34 8.494921 29.505083 4 24 4 z M 24 7 C 27.883764 7 31 10.116238 31 14 C 31 17.883762 27.883764 21 24 21 C 20.116236 21 17 17.883762 17 14 C 17 10.116238 20.116236 7 24 7 z M 11.978516 28 C 9.7987044 28 8 29.798705 8 31.978516 L 8 33.5 C 8 37.104167 10.27927 39.892227 13.306641 41.5625 C 16.334011 43.232773 20.168103 44 24 44 C 27.831897 44 31.665989 43.232773 34.693359 41.5625 C 37.274641 40.138345 39.217335 37.862616 39.761719 35 L 40.001953 35 L 40.001953 31.978516 C 40.001953 29.798705 38.201295 28 36.021484 28 L 11.978516 28 z M 11.978516 31 L 36.021484 31 C 36.579674 31 37.001953 31.420326 37.001953 31.978516 L 37.001953 32 L 37 32 L 37 33.5 C 37 35.895833 35.65427 37.607773 33.244141 38.9375 C 30.834011 40.267227 27.418103 41 24 41 C 20.581897 41 17.165989 40.267227 14.755859 38.9375 C 12.34573 37.607773 11 35.895833 11 33.5 L 11 31.978516 C 11 31.420326 11.420326 31 11.978516 31 z"
                        ></path>
                    </svg>
                    <span>Play now as a guest!</span>
                </button>
                <div className="flex items-center my-4">
                    <hr className="flex-grow border-t border-gray-300" />
                    <span className="px-2 text-gray-500">or</span>
                    <hr className="flex-grow border-t border-gray-300" />
                </div>
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-blue-700 text-white py-2 px-4 rounded-md shadow hover:bg-blue-600 flex items-center justify-center transition-colors duration-300"
                >
                    <svg
                        className="w-5 h-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 48 48"
                    >
                        <path
                            fill="#4285F4"
                            d="M24 9.5c3.27 0 5.97 1.17 8.22 3.07l6.14-6.14C34.79 3.36 29.73 1 24 1 14.56 1 6.67 6.58 3.34 14.28l7.28 5.64C12.6 14.09 17.88 9.5 24 9.5z"
                        />
                        <path
                            fill="#34A853"
                            d="M46.55 24.27c0-1.38-.12-2.74-.33-4.05H24v8.28h12.78c-.55 2.95-2.12 5.45-4.48 7.14l6.93 5.37c4.07-3.76 6.32-9.29 6.32-15.74z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M10.44 29.12a15.56 15.56 0 01-.87-5.13c0-1.78.31-3.5.87-5.13l-7.28-5.64A23.912 23.912 0 001 24c0 3.83.89 7.45 2.46 10.65l7.28-5.53z"
                        />
                        <path
                            fill="#EA4335"
                            d="M24 46c5.73 0 10.55-1.9 14.07-5.15l-6.93-5.37c-1.95 1.31-4.4 2.09-7.14 2.09-6.13 0-11.34-4.14-13.19-9.67l-7.28 5.53C6.67 41.42 14.56 46 24 46z"
                        />
                        <path fill="none" d="M1 1h46v46H1z" />
                    </svg>
                    <span>Continue with Google</span>
                </button>
            </div>
        </div>
    );
};

export default Login;
