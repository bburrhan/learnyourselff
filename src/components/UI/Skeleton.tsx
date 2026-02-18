import React from 'react'

interface SkeletonProps {
  className?: string
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  )
}

export const CourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex flex-row h-full">
        <div className="flex-shrink-0 w-28 sm:w-40 md:w-44">
          <Skeleton className="w-full h-full min-h-[160px] rounded-none" />
        </div>
        <div className="flex-1 p-3 sm:p-5 flex flex-col">
          <Skeleton className="h-6 w-16 rounded-md mb-2" />
          <Skeleton className="h-4 w-20 rounded-full mb-2" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-3" />
          <div className="mt-auto pt-2">
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export const HomeCourseCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col">
      <Skeleton className="aspect-[4/3] sm:aspect-[3/4] w-full rounded-none" />
      <div className="p-5 flex flex-col flex-1">
        <Skeleton className="h-6 w-16 rounded-full mb-3" />
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-5" />
        <div className="mt-auto">
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export const BlogCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-6">
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  )
}

export default Skeleton
