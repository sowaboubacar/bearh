
import React from "react";
import { Skeleton } from "~/components/ui/skeleton"; // Adjust the import path based on your project structure

interface SectionsGridSkeletonProps {
  count?: number;
}

export const SectionsGridSkeleton: React.FC<SectionsGridSkeletonProps> = ({
  count = 6,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col space-y-4 bg-white p-6 rounded-md shadow-sm animate-pulse"
          aria-hidden="true"
        >
          {/* Icon Skeleton */}
          <div className="flex items-center justify-center mb-4">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
          </div>
          {/* Title Skeleton */}
          <Skeleton className="h-6 w-32 mb-2 rounded" />
          {/* Description Skeleton */}
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-full rounded mt-2" />
        </div>
      ))}
    </div>
  );
};
