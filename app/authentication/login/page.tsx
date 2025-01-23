"use client";

import { InputWithIcon } from "@/components/input-with-icon";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="mt-0 space-y-4 max-w-sm">
      <div className="space-y-1">
        <label className="text-sm text-gray-600">Email</label>
        <InputWithIcon
          type="email"
          placeholder="Enter your email"
          className="h-12 border-gray-200"
        />
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <label className="text-sm text-gray-600">Password</label>
          <a href="#" className="text-sm text-gray-600 hover:text-[#E91E63]">
            Forgot Password?
          </a>
        </div>
        <div className="relative">
          <InputWithIcon
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            className="h-12 border-gray-200 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Eye className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      <Button className="w-full h-12 bg-[#E91E63] hover:bg-[#D81B60] text-white font-medium">
        Login To Dashboard
      </Button>

      <div className="text-center text-sm text-gray-500 my-4">
        Or Login With Your Email
      </div>

      <Button
        variant="outline"
        className="w-full h-12 border-gray-200 hover:bg-gray-50"
      >
        <Image
          src="/placeholder.svg"
          alt="Google"
          width={20}
          height={20}
          className="mr-2"
        />
        Login with Google
      </Button>
    </div>
  );
};

export default Login;
