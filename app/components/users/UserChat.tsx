import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { ScrollArea } from '~/components/ui/scroll-area'

// 
interface IChat {
  id: string
  sender: {
    name: string
    avatar: string
  }
  message: string
  timestamp: number
}

interface UserChatProps {
  chats?: IChat[]
}

export function UserChat({ chats }: UserChatProps) {
  // Sample data to overide the props
  chats = [
    {
      id: '1',
      sender: {
        name: 'John Doe',
        avatar: '/images/avatars/avatar-1.jpg',
      },
      message: 'Salut, comment vas-tu ?',
      timestamp: Date.now(),
    },
    {
      id: '2',
      sender: {
        name: 'Jane Doe',
        avatar: '/images/avatars/avatar-2.jpg',
      },
      message: 'Salut, je vais bien et toi ?',
      timestamp: Date.now(),
    },
    {
      id: '3',
      sender: {
        name: 'John Doe',
        avatar: '/images/avatars/avatar-1.jpg',
      },
      message: 'Je vais bien aussi, merci !',
      timestamp: Date.now(),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversations récentes</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {chats && chats?.map((chat) => (
            <div key={chat.id} className="flex items-start space-x-4 mb-4">
              <Avatar>
                <AvatarImage src={chat.sender.avatar} alt={chat.sender.name} />
                <AvatarFallback>{chat.sender.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold">{chat.sender.name}</h3>
                  <span className="text-sm text-muted-foreground">
                    {new Date(chat.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm mt-1">{chat.message}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

