"use client";

import { useState, useEffect } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getInitials, getPriorityColor, getTypeIcon, formatDate } from "@/lib/utils";
import { moveIssue } from "./issues/actions";
import { toast } from "sonner";
import Link from "next/link";
import { CalendarDays, CheckSquare } from "lucide-react";
import type { IssueStatus, Issue, User, Subtask, IssueLabel, Label } from "@prisma/client";

type IssueWithRelations = Issue & {
  assignee: User | null;
  reporter: User;
  subtasks?: Subtask[];
  labels?: (IssueLabel & { label: Label })[];
};

interface KanbanBoardProps {
  projectId: string;
  projectKey: string;
  statuses: (IssueStatus & {
    issues: IssueWithRelations[];
  })[];
  isArchived?: boolean;
}

export function KanbanBoard({ projectId, projectKey, statuses, isArchived = false }: KanbanBoardProps) {
  const [columns, setColumns] = useState(statuses);

  // Sync columns when statuses prop changes (e.g., after creating new issue)
  useEffect(() => {
    setColumns(statuses);
  }, [statuses]);

  const onDragEnd = async (result: DropResult) => {
    // Disable drag when project is archived
    if (isArchived) return;

    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find source and destination columns
    const sourceColumn = columns.find((col) => col.id === source.droppableId);
    const destColumn = columns.find((col) => col.id === destination.droppableId);

    if (!sourceColumn || !destColumn) return;

    // Find the issue being dragged
    const issue = sourceColumn.issues.find((i) => i.id === draggableId);
    if (!issue) return;

    // Optimistically update the UI
    const newColumns = columns.map((col) => {
      if (col.id === source.droppableId) {
        return {
          ...col,
          issues: col.issues.filter((i) => i.id !== draggableId),
        };
      }
      if (col.id === destination.droppableId) {
        const newIssues = [...col.issues];
        newIssues.splice(destination.index, 0, { ...issue, statusId: col.id });
        return {
          ...col,
          issues: newIssues,
        };
      }
      return col;
    });

    setColumns(newColumns);

    // Update the server
    const result2 = await moveIssue({
      issueId: draggableId,
      statusId: destination.droppableId,
    });

    if (result2?.error) {
      // Revert on error
      setColumns(columns);
      toast.error(result2.error);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 min-w-max">
            {columns.map((column) => (
              <div
                key={column.id}
                className="w-80 flex-shrink-0 flex flex-col bg-muted/30 rounded-lg"
              >
                {/* Column Header */}
                <div 
                  className={`p-3 flex items-center justify-between ${
                    column.wipLimit && column.issues.length > column.wipLimit
                      ? "bg-red-500/10 border-b-2 border-red-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: column.color }}
                    />
                    <span className="font-medium">{column.name}</span>
                    <span 
                      className={`text-sm ${
                        column.wipLimit && column.issues.length > column.wipLimit
                          ? "text-red-500 font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {column.issues.length}
                      {column.wipLimit && `/${column.wipLimit}`}
                    </span>
                    {column.wipLimit && column.issues.length > column.wipLimit && (
                      <Badge variant="destructive" className="text-xs">
                        Over limit!
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Column Content */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 min-h-[200px] transition-colors ${
                        snapshot.isDraggingOver ? "bg-muted/50" : ""
                      }`}
                    >
                      <div className="space-y-2">
                        {column.issues.map((issue, index) => (
                          <Draggable
                            key={issue.id}
                            draggableId={issue.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <Link href={`/projects/${projectId}/issues/${issue.id}`}>
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? "shadow-lg rotate-2" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">
                                      {getTypeIcon(issue.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-muted-foreground">
                                        {projectKey}-{issue.number}
                                      </p>
                                      <p className="font-medium text-sm line-clamp-2 mt-0.5">
                                        {issue.title}
                                      </p>
                                      
                                      {/* Labels */}
                                      {issue.labels && issue.labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {issue.labels.slice(0, 3).map((il) => (
                                            <span
                                              key={il.id}
                                              className="px-1.5 py-0.5 text-[10px] rounded-sm text-white"
                                              style={{ backgroundColor: il.label.color }}
                                            >
                                              {il.label.name}
                                            </span>
                                          ))}
                                          {issue.labels.length > 3 && (
                                            <span className="text-[10px] text-muted-foreground">
                                              +{issue.labels.length - 3}
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      {/* Meta row: Priority, Due Date, Subtasks, Assignee */}
                                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <Badge
                                          variant="secondary"
                                          className={`text-xs ${getPriorityColor(
                                            issue.priority
                                          )}`}
                                        >
                                          {issue.priority}
                                        </Badge>
                                        
                                        {/* Due Date */}
                                        {issue.dueDate && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className={`flex items-center gap-1 text-xs ${
                                                  new Date(issue.dueDate) < new Date() 
                                                    ? "text-red-500" 
                                                    : new Date(issue.dueDate) < new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                                                    ? "text-orange-500"
                                                    : "text-muted-foreground"
                                                }`}>
                                                  <CalendarDays className="w-3 h-3" />
                                                  {formatDate(issue.dueDate)}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Due: {formatDate(issue.dueDate)}</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        
                                        {/* Subtask Progress */}
                                        {issue.subtasks && issue.subtasks.length > 0 && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                  <CheckSquare className="w-3 h-3" />
                                                  {issue.subtasks.filter(s => s.completed).length}/{issue.subtasks.length}
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>{issue.subtasks.filter(s => s.completed).length} of {issue.subtasks.length} subtasks completed</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                        
                                        <div className="flex-1" />
                                        
                                        {issue.assignee && (
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage
                                              src={issue.assignee.avatarUrl || undefined}
                                            />
                                            <AvatarFallback className="text-xs">
                                              {getInitials(issue.assignee.name)}
                                            </AvatarFallback>
                                          </Avatar>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              </Link>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

