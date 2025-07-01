import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const AnalysisSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Performance Score Card */}
      <Card className="border-blue-200 bg-white">
        <CardHeader className="bg-blue-50 px-6 py-4">
          <div className="space-y-2">
            <Skeleton className="h-6 w-64 bg-blue-100" />
            <Skeleton className="h-4 w-80 bg-blue-50" />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image placeholder */}
            <div className="aspect-square border-2 border-dashed border-gray-200 rounded-lg">
              <Skeleton className="h-full w-full bg-gray-50" />
            </div>
            {/* Radial chart skeleton */}
            <div className="flex items-center justify-center max-h-[200px]">
              <div className="relative">
                <Skeleton className="h-48 w-48 rounded-full bg-blue-50" />
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-1">
                  <Skeleton className="h-12 w-16 bg-blue-100" />
                  <Skeleton className="h-4 w-12 bg-blue-50" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown Card */}
      <Card className="border-blue-200 bg-white">
        <CardHeader className="px-6 py-4">
          <Skeleton className="h-6 w-48 bg-blue-100" />
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Progress items */}
          {[1, 2, 3].map((item) => (
            <div key={item} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded bg-blue-100" />
                  <Skeleton className="h-4 w-32 bg-blue-50" />
                </div>
                <Skeleton className="h-4 w-8 bg-blue-100" />
              </div>
              <Skeleton className="h-2 w-full bg-blue-50 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Recommendations Card */}
      <Card className="border-blue-200 bg-white">
        <CardHeader className="px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 bg-blue-100" />
            <Skeleton className="h-8 w-20 bg-blue-50 rounded" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Skeleton className="h-5 w-5 rounded-full bg-blue-100 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full bg-blue-100" />
                  <Skeleton className="h-4 w-3/4 bg-blue-50" />
                </div>
                <Skeleton className="h-6 w-6 bg-blue-100 rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
