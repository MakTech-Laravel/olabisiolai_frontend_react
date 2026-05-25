import { MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type ReviewItem } from "./reviewData";

export function ReviewCard({
  review,
  activeReplyId,
  draft,
  onReplyClick,
  onDraftChange,
  onSubmitReply,
  onCancelReply,
}: {
  review: ReviewItem;
  activeReplyId: string | null;
  draft: string;
  onReplyClick: (id: string) => void;
  onDraftChange: (value: string) => void;
  onSubmitReply: (id: string) => void;
  onCancelReply: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {review.initials}
          </div>
          <div>
            <p className="font-semibold">{review.name}</p>
            <p className="text-xs text-muted-foreground">{review.date}</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-0.5 text-yellow-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn(
                "size-3.5",
                i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-slate-300",
              )}
            />
          ))}
        </div>

        <p className="max-w-4xl text-sm text-foreground">{review.comment}</p>

        {review.reply ? (
          <div className="max-w-4xl rounded-md border-l-2 border-l-sky-500 bg-sky-50 px-3 py-2">
            <p className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
              <MessageSquare className="size-3.5" />
              Your Response
            </p>
            <p className="mt-1 text-sm text-sky-900">{review.reply}</p>
          </div>
        ) : activeReplyId === review.id ? (
          <div className="space-y-2 rounded-md border p-3">
            <Textarea
              value={draft}
              onChange={(e) => onDraftChange(e.target.value)}
              placeholder="Write your response..."
              className="min-h-[90px]"
            />
            <div className="flex items-center gap-2">
              <Button className="bg-black" size="sm" onClick={() => onSubmitReply(review.id)}>
                Send Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelReply}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onReplyClick(review.id)}>
            Reply
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
