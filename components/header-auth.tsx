import Image from "next/image";

interface AuthHeaderProps {
  title: string;
  subTitle?: string;
}

const AuthHeader = ({ title, subTitle }: AuthHeaderProps) => {
  return (
    <div className="mb-4 flex items-center justify-between w-full max-w-2xl  pl-8">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <h1 className="text-xl">{subTitle}</h1>
      </div>
      <Image
        src="/twitter-image.png"
        alt="Company Logo"
        width={50}
        height={50}
        className="mr-4"
      />
    </div>
  );
};

export default AuthHeader;
