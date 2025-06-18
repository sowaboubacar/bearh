import React from "react";
import { UserHeaderSkeleton } from "./UserHeaderSkeleton";
import { SectionsGridSkeleton } from "./SectionGridSkeleton";

interface UserPageSkeletonProps {
  isEmployeeMonth?: boolean;
}

export const UserPageSkeleton: React.FC<
  UserPageSkeletonProps
> = ({ isEmployeeMonth = false }) => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Back Button Skeleton */}
      <div className="flex items-center mb-6 animate-pulse" aria-hidden="true">
        {/* Icon Placeholder */}
        <div className="h-6 w-6 mr-2 bg-gray-200 rounded-full"></div>
        {/* Text Placeholder */}
        <div className="h-6 w-24 bg-gray-200 rounded"></div>
      </div>

      {/* User Header Skeleton */}
      <UserHeaderSkeleton isEmployeeMonth={isEmployeeMonth} />

      {/* Sections Grid Skeleton */}
      <SectionsGridSkeleton count={6} />
    </div>
  );
};
