import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from "~/components/ui/button";

interface CheckLocationButtonProps {
  onLocationObtained: (latitude: number, longitude: number) => void;
}

export function CheckLocationButton({ onLocationObtained }: CheckLocationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onLocationObtained(latitude, longitude);
          setIsLoading(false);
        },
        (error) => {
          alert('Error obtaining location: ' + error.message);
          setIsLoading(false);
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <Button
        onClick={handleCheckLocation}
        disabled={isLoading}
        className="relative overflow-hidden transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg"
      >
        <span className="flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <MapPin className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Vérification...' : 'Vérifier ma position'}
        </span>
        <span className="absolute inset-0 h-full w-full scale-0 rounded-full bg-white/30 transition-all duration-300 ease-out group-hover:scale-100" />
      </Button>
    </div>
  );
}

