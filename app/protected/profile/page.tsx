import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Lock, Mail, User } from "lucide-react";

export default function Profile() {
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 lg:p-12  w-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col ">
          <h1 className="text-3xl font-bold mb-2">الإعدادات</h1>
          <div className="flex items-center my-8">
            <Avatar className="w-12 h-12">
              <AvatarImage src="/placeholder-avatar.jpg" alt="Y" />
              <AvatarFallback className="bg-black text-white">Y</AvatarFallback>
            </Avatar>
            <div className="text-right mr-4">
              <p className="font-semibold text-lg">يمان رضا</p>
              <p className="text-sm text-gray-600">yaman.reda@gmail.com</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 ">
          <Card className="bg-black bg-opacity-25">
            <CardHeader>
              <CardTitle>المعلومات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="username"
                  placeholder="اسم المستخدم"
                  icon={<User className="h-4 w-4 text-white" />}
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="email"
                  placeholder="البريد الإلكتروني"
                  type="email"
                  icon={<Mail className="h-4 w-4 text-white" />}
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="password"
                  placeholder="كلمة المرور"
                  type="password"
                  icon={<Lock className="h-4 w-4 text-white" />}
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="confirm-password"
                  placeholder="تأكيد كلمة المرور"
                  type="password"
                  icon={<Lock className="h-4 w-4 text-white" />}
                />
              </div>
            </CardContent>
          </Card>

          <Card className=" bg-black bg-opacity-25">
            <CardHeader>
              <CardTitle>معلومات الشركة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="company-name"
                  placeholder="اسم الشركة"
                  className=" bg-dark_background text-white placeholder:text-white"
                />
              </div>
              <div className="space-y-2">
                <Input
                  id="company-email"
                  placeholder="البريد الإلكتروني للشركة"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <Input id="company-sector" placeholder="قطاع الشركة" />
              </div>
              <div className="space-y-2">
                <Input id="company-position" placeholder="منصبك بالشركة" />
              </div>
              <div className="space-y-2">
                <Input id="team-size" placeholder="حجم الفريق" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
