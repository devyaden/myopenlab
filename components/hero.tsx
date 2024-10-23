import Link from "next/link";

export default function Header() {
  return (
    <header className="flex flex-col items-center gap-12 py-16 bg-gradient-to-r from-blue-50 to-white shadow-lg">
      <h1 className="text-5xl font-extrabold text-gray-800 text-center tracking-tight leading-snug">
        YADN - Your Advanced Diagramming Notation
      </h1>
      <p className="text-xl lg:text-2xl max-w-2xl text-center text-gray-600 leading-relaxed">
        YADN is an intuitive diagramming tool that allows you to create, save,
        and export diagrams seamlessly. Edit your diagrams as tables or directly
        on the canvas for ultimate flexibility and control.
      </p>
      <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-indigo-600 my-4"></div>
      <Link
        href="/sign-in"
        className="text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium py-3 px-8 rounded-full shadow-md"
      >
        Login
      </Link>
    </header>
  );
}
