import { FaApple, FaGooglePlay } from "react-icons/fa";
import AdBanner from "./AdBanner";

export default function Footer() {
  return (
    <footer className="w-full fixed bottom-0 left-0 z-30 bg-white border-t border-gray-200 px-4 py-3 shadow-md">
      {/* Promo or Ad Section 
      <div className="text-center mb-2 text-sm text-gray-600">
        <AdBanner />
      </div>
      */}

      {/* App Download Links */}
      <div className="flex justify-center gap-6 text-sm text-gray-700">
        <div className="flex items-center gap-1">
          <FaApple className="text-xl" />
          <span>iOS Coming Soon</span>
        </div>
        <div className="flex items-center gap-1">
          <FaGooglePlay className="text-xl" />
          <span>Android Coming Soon</span>
        </div>
      </div>
    </footer>
  );
}
