import { Mail } from "lucide-react";

export function Login() {
  const api = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
  return (
    <div className="min-h-screen bg-[#fbfcfb] grid place-items-center">
      <div className="w-[390px] bg-white border border-gray-200 rounded-xl shadow-sm p-8">
        <div className="mx-auto h-10 w-10 rounded-lg bg-green-500 text-white grid place-items-center font-bold">ON</div>
        <h1 className="mt-5 text-center text-xl font-semibold">Login</h1>
        <p className="text-center text-xs text-gray-400 mt-1">Sign in to manage your email campaigns</p>
        <a href={`${api}/auth/google`} className="mt-7 flex items-center justify-center gap-2 rounded-md bg-[#edf8f0] text-[#14853b] py-2.5 text-sm font-medium hover:bg-[#e2f4e7]">
          <span className="font-bold">G</span> Login with Google
        </a>
        <div className="mt-6 flex items-center gap-3 text-[10px] text-gray-300"><span className="h-px flex-1 bg-gray-100"/><Mail size={13}/><span className="h-px flex-1 bg-gray-100"/></div>
        <p className="mt-5 text-center text-[11px] text-gray-400">Google OAuth is required for this assignment. No mock account is used.</p>
      </div>
    </div>
  );
}
