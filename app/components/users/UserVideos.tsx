import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import type { ICollaboratorVideo } from '~/core/entities/collaboratorVideo.entity.server'

interface UserVideosProps {
  videos: ICollaboratorVideo[]
}

export function UserVideos({ videos }: UserVideosProps) {

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold">
          Vidéos de formation
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {videos && videos.map((video) => (
            <Card key={video.id} className="shadow-sm">
              <CardContent className="p-4 sm:p-6">
                <video
                  src={video.url}
                  poster={video.thumbnail}
                  controls
                  className="w-full aspect-video mb-4 rounded-lg"
                >
                  <track
                    kind="captions"
                    srcLang="fr"
                    src={video.captionsUrl}
                    label="French captions"
                    default
                  />
                  Votre navigateur ne supporte pas la lecture de vidéos.
                </video>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  {video.title}
                </h3>
                <p className="text-base text-muted-foreground mb-3">
                  {video.description}
                </p>
                <p className="text-base font-medium">
                  Durée: {video.duration} minutes
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )  
}

