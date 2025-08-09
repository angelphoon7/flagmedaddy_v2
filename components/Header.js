import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import ConnectWallet from "./ConnectWallet"; // ✅ RainbowKit Connect Button

export default function Header() {
  const { isConnected } = useAccount();
  return (
    <header className="w-full bg-gray-900 text-white shadow-lg px-6 py-4">
      <div className="grid grid-cols-3 items-center w-full">
        <div>
          <Link href="/" className="text-xl font-bold hover:opacity-80">
            FlagMeDaddy
          </Link>
        </div>
        <div className="text-center">
          {isConnected && (
            <Link href="/home" className="text-xl font-bold hover:opacity-80">
              Home
            </Link>
          )}
        </div>
        <div className="justify-self-end">
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
