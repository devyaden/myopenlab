"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "./login-form";
import { SignupForm } from "./signup-form";

export default function AuthForms() {
  return (
    <div className=" bg-white  w-full h-full shadow-lg p-8 ">
      <Tabs defaultValue="signin" className="w-full">
        <div className="mb-6">
          <h1 className="text-[#333333] text-2xl font-bold mb-6">
            <TabsContent value="signin">LOGIN</TabsContent>
            <TabsContent value="signup">CREATE AN ACCOUNT</TabsContent>
          </h1>
          <TabsList className="w-full grid grid-cols-2 p-0 h-auto bg-transparent gap-0">
            <TabsTrigger
              value="signin"
              className="data-[state=active]:bg-yadn-pink-light data-[state=active]:text-yadn-pink bg-transparent h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-yadn-pink"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger
              value="signup"
              className="data-[state=active]:bg-yadn-pink-light data-[state=active]:text-yadn-pink bg-transparent h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-yadn-pink"
            >
              Create Account
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="signin">
          <LoginForm />
        </TabsContent>

        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>
      <div className="text-center text-sm text-gray-500 mt-8">
        By Sign In In Tp Yadn You Agree To Our{" "}
        <a href="#" className="text-yadn-pink hover:underline">
          Term Of Services
        </a>{" "}
        And{" "}
        <a href="#" className="text-yadn-pink hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
