import React, { useState, useEffect } from "react";
import { Tv, Monitor, Laptop, Smartphone, Check, Loader2, Cast } from "lucide-react";

interface Device {
  id: string;
  name: string;
  type: "hub" | "tv" | "speaker";
  active: boolean;
}

const DEFAULT_DEVICES: Device[] = [
  { id: "nest-hub", name: "Living Room Nest Hub Max", type: "hub", active: false },
  { id: "apple-tv", name: "Master Bedroom Apple TV 4K", type: "tv", active: false },
  { id: "sonos", name: "Dining Room Sonos Era 300", type: "speaker", active: false },
];

export const CastingSimulator: React.FC<{
  onClose: () => void;
  activeDeviceId: string | null;
  onConnectDevice: (id: string | null, name: string | null) => void;
}> = ({ onClose, activeDeviceId, onConnectDevice }) => {
  const [devices, setDevices] = useState<Device[]>(DEFAULT_DEVICES);
  const [scanning, setScanning] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScanning(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = (device: Device) => {
    if (activeDeviceId === device.id) {
      // Disconnect
      onConnectDevice(null, null);
      return;
    }

    setConnectingId(device.id);
    setTimeout(() => {
      onConnectDevice(device.id, device.name);
      setConnectingId(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/70 backdrop-blur-md p-4">
      <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3.5 mb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <Cast className="w-4 h-4 animate-pulse" />
            <h3 className="font-bold text-sm text-gray-100">Cast to Device (Simulator)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-mono uppercase bg-gray-800 hover:bg-gray-700 text-gray-450 px-2 py-0.5 rounded"
          >
            Close
          </button>
        </div>

        {scanning ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-xs font-mono text-gray-400 animate-pulse">Scanning local Wi-Fi networks...</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <p className="text-[11px] text-gray-400">
              Select an available AirPlay, Sonos, or Google Cast target to seamlessly mirror high-definition audio.
            </p>

            <div className="space-y-2">
              {devices.map((device) => {
                const isConnected = activeDeviceId === device.id;
                const isConnecting = connectingId === device.id;

                return (
                  <button
                    key={device.id}
                    disabled={connectingId !== null}
                    onClick={() => handleConnect(device)}
                    className={`w-full p-3 rounded-xl border flex items-center justify-between transition ${
                      isConnected
                        ? "bg-emerald-400/10 border-emerald-400 text-emerald-400"
                        : "bg-gray-950/50 border-gray-800 text-gray-300 hover:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {device.type === "hub" && <Laptop className="w-4 h-4" />}
                      {device.type === "tv" && <Tv className="w-4 h-4" />}
                      {device.type === "speaker" && <Monitor className="w-4 h-4" />}
                      
                      <div className="text-left">
                        <p className="font-bold text-xs">{device.name}</p>
                        <p className="text-[10px] text-gray-500">
                          {isConnected ? "Connected & Synchronized" : "Ready to Cast"}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isConnecting ? (
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                      ) : isConnected ? (
                        <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      ) : (
                        <span className="text-[10px] uppercase font-mono tracking-tight text-gray-500">
                          Cast
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {activeDeviceId && (
              <div className="mt-2 text-center">
                <button
                  onClick={() => onConnectDevice(null, null)}
                  className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                >
                  Disconnect Casting Session
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
