"use client"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, MessageCircle, MoreVertical, Reply, Pin, Edit, Trash2, Send, Paperclip, X } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Message {
  _id: string
  content: string
  sender: {
    _id: string
    name: string
    email: string
    avatar?: string
  }
  project: {
    _id: string
    name: string
  }
  parentMessage?: string
  attachments?: Array<{
    filename: string
    url: string
    type: string
  }>
  likes: string[]
  isPinned: boolean
  createdAt: string
  updatedAt: string
  replies?: Message[]
}

interface MessageCardProps {
  message: Message
  currentUserId: string
  onReply?: (messageId: string) => void
  onLike?: (messageId: string) => void
  onPin?: (messageId: string) => void
  onEdit?: (message: Message) => void
  onDelete?: (messageId: string) => void
  isReply?: boolean
}

export function MessageCard({
  message,
  currentUserId,
  onReply,
  onLike,
  onPin,
  onEdit,
  onDelete,
  isReply = false,
}: MessageCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  const isLiked = message.likes.includes(currentUserId)
  const isOwner = message.sender._id === currentUserId

  const handleReplySubmit = () => {
    if (replyContent.trim() && onReply) {
      onReply(message._id)
      setReplyContent("")
      setShowReplyForm(false)
    }
  }

  const handleEditSubmit = () => {
    if (editContent.trim() && onEdit) {
      onEdit({ ...message, content: editContent })
      setIsEditing(false)
    }
  }

  const handleEditCancel = () => {
    setEditContent(message.content)
    setIsEditing(false)
  }

  return (
    <div className={`space-y-3 ${isReply ? "ml-12 border-l-2 border-muted pl-4" : ""}`}>
      <Card className={`${message.isPinned ? "border-primary/50 bg-primary/5" : ""}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={message.sender.avatar || "/placeholder.svg"} />
              <AvatarFallback>{getUserInitials(message.sender.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{message.sender.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  </span>
                  {message.isPinned && (
                    <Badge variant="secondary" className="text-xs">
                      <Pin className="h-3 w-3 mr-1" />
                      Pinned
                    </Badge>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onReply && (
                      <DropdownMenuItem onClick={() => setShowReplyForm(true)}>
                        <Reply className="mr-2 h-4 w-4" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    {onPin && (
                      <DropdownMenuItem onClick={() => onPin(message._id)}>
                        <Pin className="mr-2 h-4 w-4" />
                        {message.isPinned ? "Unpin" : "Pin"}
                      </DropdownMenuItem>
                    )}
                    {isOwner && onEdit && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {isOwner && onDelete && (
                      <DropdownMenuItem onClick={() => onDelete(message._id)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60px]"
                  />
                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={handleEditSubmit}>
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleEditCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap">{message.content}</div>
              )}

              {message.attachments && message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{attachment.filename}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-4 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike?.(message._id)}
                  className={`h-8 px-2 ${isLiked ? "text-red-600" : "text-muted-foreground"}`}
                >
                  <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
                  {message.likes.length > 0 && <span className="text-xs">{message.likes.length}</span>}
                </Button>

                {onReply && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(true)}
                    className="h-8 px-2 text-muted-foreground"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    {message.replies && message.replies.length > 0 && (
                      <span className="text-xs">{message.replies.length}</span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showReplyForm && (
        <Card className="ml-12">
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setShowReplyForm(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleReplySubmit} disabled={!replyContent.trim()}>
                  <Send className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {message.replies && message.replies.length > 0 && (
        <div className="space-y-3">
          {message.replies.map((reply) => (
            <MessageCard
              key={reply._id}
              message={reply}
              currentUserId={currentUserId}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
