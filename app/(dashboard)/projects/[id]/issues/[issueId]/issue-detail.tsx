"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TiptapEditor } from "@/components/editor/tiptap-editor";
import { updateIssue, deleteIssue, createComment, deleteComment, updateComment } from "../actions";
import {
  ArrowLeft,
  Loader2,
  Trash2,
  MessageSquare,
  Activity,
  Sparkles,
  Pencil,
  X,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { formatRelativeTime, getInitials, getPriorityColor, getTypeIcon } from "@/lib/utils";
import { SubtaskList } from "./subtask-list";
import { IssueLabelSelector } from "./issue-label-selector";
import type { Issue, IssueStatus, IssueComment, IssueActivity, User, Subtask, IssueLabel, Label } from "@prisma/client";

interface IssueDetailProps {
  issue: Issue & {
    status: IssueStatus;
    assignee: User | null;
    reporter: User;
    comments: (IssueComment & { author: User })[];
    activities: (IssueActivity & { user: User })[];
    subtasks: Subtask[];
    labels: (IssueLabel & { label: Label })[];
  };
  statuses: IssueStatus[];
  teamMembers: User[];
  currentUserId: string;
  projectKey: string;
  projectLabels: Label[];
  isArchived?: boolean;
}

const issueTypes = [
  { value: "TASK", label: "Task" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
  { value: "STORY", label: "Story" },
  { value: "EPIC", label: "Epic" },
];

const priorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

export function IssueDetail({
  issue,
  statuses,
  teamMembers,
  currentUserId,
  projectKey,
  projectLabels,
  isArchived = false,
}: IssueDetailProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description || "");
  const [commentContent, setCommentContent] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  async function handleFieldChange(field: string, value: string | null) {
    setIsLoading(true);
    const formData = new FormData();
    formData.append(field, value || "");
    
    const result = await updateIssue(issue.id, formData);
    if (result?.error) {
      toast.error(result.error);
    }
    setIsLoading(false);
  }

  async function handleTitleSave() {
    if (title === issue.title) return;
    await handleFieldChange("title", title);
  }

  async function handleDescriptionSave() {
    if (description === (issue.description || "")) return;
    await handleFieldChange("description", description);
  }

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteIssue(issue.id);
    if (result?.error) {
      toast.error(result.error);
      setIsDeleting(false);
    } else {
      toast.success("Issue deleted");
      router.push(`/projects/${issue.projectId}`);
    }
  }

  async function handleAddComment() {
    if (!commentContent.trim()) return;
    
    setIsSubmittingComment(true);
    const formData = new FormData();
    formData.append("content", commentContent);
    formData.append("issueId", issue.id);
    
    const result = await createComment(formData);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setCommentContent("");
      toast.success("Comment added");
    }
    setIsSubmittingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    const result = await deleteComment(commentId);
    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Comment deleted");
    }
  }

  async function handleEditComment(commentId: string) {
    if (!editingCommentContent.trim()) return;
    
    setIsSubmittingComment(true);
    const result = await updateComment(commentId, editingCommentContent);
    if (result?.error) {
      toast.error(result.error);
    } else {
      setEditingCommentId(null);
      setEditingCommentContent("");
      toast.success("Comment updated");
      router.refresh();
    }
    setIsSubmittingComment(false);
  }

  function startEditingComment(comment: IssueComment & { author: User }) {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content);
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditingCommentContent("");
  }

  return (
    <div className="h-full flex flex-col">
      {/* Archived Banner */}
      {isArchived && (
        <div className="bg-yellow-100 dark:bg-yellow-900/30 border-b border-yellow-200 dark:border-yellow-800 px-6 py-2">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
            ⚠️ This project is archived. All content is read-only.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${issue.projectId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getTypeIcon(issue.type)}</span>
              <span className="text-muted-foreground font-medium">
                {projectKey}-{issue.number}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${issue.projectId}/issues/${issue.id}/ai`}>
                <Sparkles className="w-4 h-4 mr-2" />
                AI Summary
              </Link>
            </Button>
            {!isArchived && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Issue</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this issue? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <Input
              value={title}
              onChange={(e) => !isArchived && setTitle(e.target.value)}
              onBlur={handleTitleSave}
              className="text-2xl font-bold h-auto py-2 border-0 px-0 focus-visible:ring-0 shadow-none"
              disabled={isArchived}
            />

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              {isArchived ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none p-3 rounded-md bg-muted/50"
                  dangerouslySetInnerHTML={{ __html: description || "<p class='text-muted-foreground'>No description</p>" }}
                />
              ) : (
                <>
                  <TiptapEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Add a description..."
                  />
                  {description !== (issue.description || "") && (
                    <Button size="sm" onClick={handleDescriptionSave} disabled={isLoading}>
                      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Save
                    </Button>
                  )}
                </>
              )}
            </div>

            {/* Subtasks */}
            <SubtaskList issueId={issue.id} subtasks={issue.subtasks} isArchived={isArchived} />

            {/* Tabs for Comments and Activity */}
            <Tabs defaultValue="comments">
              <TabsList>
                <TabsTrigger value="comments" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments ({issue.comments.length})
                </TabsTrigger>
                <TabsTrigger value="activity" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Activity
                </TabsTrigger>
              </TabsList>

              <TabsContent value="comments" className="space-y-4 mt-4">
                {/* Add Comment - only show if not archived */}
                {!isArchived && (
                  <Card>
                    <CardContent className="pt-4">
                      <TiptapEditor
                        content={commentContent}
                        onChange={setCommentContent}
                        placeholder="Write a comment..."
                      />
                      <Button
                        className="mt-3"
                        onClick={handleAddComment}
                        disabled={isSubmittingComment || !commentContent.trim()}
                      >
                        {isSubmittingComment && (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Add Comment
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Comments List */}
                {issue.comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatarUrl || undefined} />
                          <AvatarFallback>
                            {getInitials(comment.author.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {comment.author.name || comment.author.email}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            {(comment.authorId === currentUserId) && !isArchived && (
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => startEditingComment(comment)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleDeleteComment(comment.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <TiptapEditor
                                content={editingCommentContent}
                                onChange={setEditingCommentContent}
                                placeholder="Edit your comment..."
                              />
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditComment(comment.id)}
                                  disabled={isSubmittingComment || !editingCommentContent.trim()}
                                >
                                  {isSubmittingComment && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                  <Check className="w-4 h-4 mr-1" />
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditingComment}
                                  disabled={isSubmittingComment}
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="mt-2 prose prose-sm dark:prose-invert max-w-none"
                              dangerouslySetInnerHTML={{ __html: comment.content }}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {issue.comments.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </TabsContent>

              <TabsContent value="activity" className="mt-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      {issue.activities.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={activity.user.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(activity.user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm">
                              <span className="font-medium">
                                {activity.user.name || activity.user.email}
                              </span>{" "}
                              {activity.action === "created" && "created this issue"}
                              {activity.action === "updated" && activity.field && (
                                <>
                                  changed {activity.field}
                                  {activity.oldValue && activity.newValue && (
                                    <>
                                      {" "}from <span className="font-medium">{activity.oldValue}</span> to{" "}
                                      <span className="font-medium">{activity.newValue}</span>
                                    </>
                                  )}
                                </>
                              )}
                              {activity.action === "commented" && "added a comment"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatRelativeTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Status</label>
                  <Select
                    value={issue.statusId}
                    onValueChange={(value) => handleFieldChange("statusId", value)}
                    disabled={isLoading || isArchived}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />
                            {status.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Priority</label>
                  <Select
                    value={issue.priority}
                    onValueChange={(value) => handleFieldChange("priority", value)}
                    disabled={isLoading || isArchived}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <Badge
                            variant="secondary"
                            className={getPriorityColor(priority.value)}
                          >
                            {priority.label}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Type</label>
                  <Select
                    value={issue.type}
                    onValueChange={(value) => handleFieldChange("type", value)}
                    disabled={isLoading || isArchived}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {issueTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {getTypeIcon(type.value)} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Assignee</label>
                  <Select
                    value={issue.assigneeId || "unassigned"}
                    onValueChange={(value) =>
                      handleFieldChange("assigneeId", value === "unassigned" ? null : value)
                    }
                    disabled={isLoading || isArchived}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={member.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            {member.name || member.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reporter */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Reporter</label>
                  <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={issue.reporter.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(issue.reporter.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">
                      {issue.reporter.name || issue.reporter.email}
                    </span>
                  </div>
                </div>

                {/* Labels */}
                <IssueLabelSelector
                  issueId={issue.id}
                  currentLabels={issue.labels}
                  projectLabels={projectLabels}
                  isArchived={isArchived}
                />
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatRelativeTime(issue.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated</span>
                  <span>{formatRelativeTime(issue.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

