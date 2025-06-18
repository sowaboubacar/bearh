
import React from "react";
import { Skeleton } from "~/components/ui/skeleton"; // Adjust the import path based on your project structure

interface UserHeaderSkeletonProps {
  isEmployeeMonth?: boolean;
}

export const UserHeaderSkeleton: React.FC<UserHeaderSkeletonProps> = ({
  isEmployeeMonth = false,
}) => {
  return (
    <div
      className={`bg-gradient-to-r from-primary to-primary text-white p-4 sm:p-6 rounded-md ${
        isEmployeeMonth ? "border-4 border-yellow-400" : ""
      } animate-pulse`}
      aria-hidden="true"
    >
      {/* Badges Skeleton */}
      <div className="flex flex-col items-start mb-4 space-y-2">
        {isEmployeeMonth && (
          <>
            {/* Reward Points Badge */}
            <div className="w-24 h-5 bg-yellow-400 rounded-full"></div>
            {/* Achievement Badge */}
            <div className="w-32 h-5 bg-yellow-400 rounded-full"></div>
          </>
        )}
      </div>

      {/* User Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Avatar Skeleton */}
        <div className="relative">
          <Skeleton className="h-24 w-24 sm:h-20 sm:w-20 rounded-full border-2 border-white" />
          {/* Award Icon Skeleton Overlay */}
          {isEmployeeMonth && (
            <div className="absolute -top-2 -right-2">
              <Skeleton className="h-5 w-5 rounded-full bg-yellow-400" />
            </div>
          )}
        </div>

        {/* User Information Skeleton */}
        <div className="text-center sm:text-left space-y-2">
          {/* User Name Skeleton */}
          <Skeleton className="h-6 w-48 sm:w-64 rounded" />
          {/* Position Badge Skeleton */}
          <div className="w-32 h-5 bg-white/20 rounded-full mx-auto sm:mx-0"></div>
        </div>
      </div>

      {/* Card Content Skeleton */}
      <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Email Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-5 w-full sm:w-3/4 rounded" />
        </div>
        {/* Status Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-5 w-24 sm:w-40 rounded" />
        </div>
        {/* Supervisors Skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-5 w-full sm:w-3/4 rounded" />
          <Skeleton className="h-5 w-full sm:w-3/4 rounded" />
        </div>
      </div>
    </div>
  );
};
