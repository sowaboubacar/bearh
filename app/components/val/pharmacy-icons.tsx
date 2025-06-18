import React, { useState, useEffect } from "react";

export const PharmacyIcons = ({className = ''}: {className?: string}) => {
  const icons = [
    <svg
      key="pill"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#047857"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
      <path d="m8.5 8.5 7 7" />
    </svg>,
    <svg
      key="stethoscope"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#047857"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>,
    <svg
      key="thermometer"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#047857"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
      <path d="M12 9a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0v-4a1 1 0 0 1 1-1Z" />
    </svg>,
    <svg
      key="syringe"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#047857"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m14.5 4.5-10 10" />
      <path d="m18.5 6.5-6 6" />
      <path d="m19.5 3.5-3 3" />
      <path d="m21.5 1.5-3 3" />
      <path d="M9.5 2.5v3" />
      <path d="M4.5 7.5h3" />
    </svg>,
    <svg
      key="firstAid"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#047857"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 8H4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h4" />
      <path d="M16 8h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-4" />
      <path d="M12 13V4a2 2 0 0 0-2-2H8" />
      <path d="M12 13v9" />
      <path d="M12 13h4" />
      <path d="M12 13h-4" />
    </svg>,
  ];

  const [positions, setPositions] = useState<{ top: string; left: string; transform: string; opacity: number; }[]>([]);

  useEffect(() => {
    const newPositions = icons.map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      transform: `rotate(${Math.random() * 360}deg) scale(2)`, // Augmentation de la taille
      opacity: 0.001 + Math.random() * 0.1, // Augmentation de l'opacité
    }));
    setPositions(newPositions);
  }, []);

  return (
    <div className={`fixed inset-0 pointer-events-none z-20 ${className}`}>
      {icons.map((icon, index) => (
        <div
          key={index}
          className="absolute text-gray-300 w-12 h-12"
          style={positions[index]}
        >
          {React.cloneElement(icon, { width: "100%", height: "100%" })}
        </div>
      ))}
    </div>
  );
};