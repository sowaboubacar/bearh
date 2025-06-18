import { Card, CardContent, CardFooter, CardHeader } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"

interface LoadingSkeletonProps {
  view: 'grid' | 'list' | 'timeline' | 'pills';
  itemCount?: number;
}

export default function LoadingSkeleton({ view, itemCount = 6 }: LoadingSkeletonProps) {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: itemCount }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (view === 'list') {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-16" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
            <TableHead><Skeleton className="h-4 w-20" /></TableHead>
            <TableHead><Skeleton className="h-4 w-24" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: itemCount }).map((_, index) => (
            <TableRow key={index}>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-6 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  if (view === 'pills') {
    return (
      <div className="space-y-8">
        {/* Todo group */}
        <div className="space-y-4">
          <Skeleton className="h-7 w-24 ml-4" />
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 px-4">
              {Array.from({ length: Math.ceil(itemCount/2) }).map((_, index) => (
                <div key={index} className="w-[300px] sm:w-[400px] flex-shrink-0">
                  <div className="relative flex items-center gap-2 p-4 rounded-full bg-card border">
                    <Skeleton className="h-5 w-5 rounded-sm flex-shrink-0" />
                    <Skeleton className="h-5 flex-1" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
  
        {/* Completed group */}
        <div className="space-y-4">
          <Skeleton className="h-7 w-24 ml-4" />
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 px-4">
              {Array.from({ length: Math.ceil(itemCount/2) }).map((_, index) => (
                <div key={index} className="w-[300px] sm:w-[400px] flex-shrink-0">
                  <div className="relative flex items-center gap-2 p-4 rounded-full bg-card border">
                    <Skeleton className="h-5 w-5 rounded-sm flex-shrink-0" />
                    <Skeleton className="h-5 flex-1" />
                    <div className="flex items-center gap-1">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                    <div className="absolute -top-2 -right-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Timeline view (default)
  return (
    <div className="relative">
      <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200"></div>
      <div className="space-y-12">
        {Array.from({ length: itemCount }).map((_, index) => (
          <div key={index} className={`relative ${index % 2 === 0 ? 'md:ml-auto md:pl-8' : 'md:mr-auto md:pr-8'} md:w-1/2`}>
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gray-300 rounded-full"></div>
            <Card className={`w-full ${index % 2 === 0 ? 'md:ml-4' : 'md:mr-4'}`}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}