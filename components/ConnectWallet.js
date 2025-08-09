import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function ConnectWallet() {
  return (
    <div className="flex flex-col items-center gap-4">
      <ConnectButton />
      <p className="text-xs text-gray-400">Powered by RainbowKit</p>
    </div>
  );
}
