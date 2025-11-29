"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, RefreshCw, FileText, Lightbulb, MessageSquare, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface IssueData {
  description: string | null;
  commentsCount: number;
}

export default function AIPage() {
  const params = useParams();
  const projectId = params.id as string;
  const issueId = params.issueId as string;
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [commentSummary, setCommentSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingCommentSummary, setLoadingCommentSummary] = useState(false);
  const [issueData, setIssueData] = useState<IssueData | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  // Fetch issue data for validation
  useEffect(() => {
    async function fetchIssueData() {
      try {
        const res = await fetch(`/api/issues/${issueId}/info`);
        if (res.ok) {
          const data = await res.json();
          setIssueData(data);
        }
      } catch (error) {
        console.error("Failed to fetch issue data:", error);
      }
    }
    fetchIssueData();
  }, [issueId]);

  const descriptionLength = issueData?.description?.replace(/<[^>]*>/g, '').length || 0;
  const canUseAI = descriptionLength > 10;
  const canUseCommentSummary = (issueData?.commentsCount || 0) >= 5;

  async function fetchAI(type: string) {
    const setLoading = type === "summary" ? setLoadingSummary 
      : type === "suggestions" ? setLoadingSuggestions 
      : setLoadingCommentSummary;
    const setResult = type === "summary" ? setSummary 
      : type === "suggestions" ? setSuggestions 
      : setCommentSummary;
    
    setLoading(true);
    try {
      const response = await fetch("/api/ai/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issueId, type }),
      });

      const data = await response.json();
      
      if (data.rateLimited) {
        toast.error(`Rate limited. Try again in ${data.resetIn} seconds.`);
      } else if (data.minLengthError) {
        toast.error(data.error);
      } else if (data.minCommentsError) {
        toast.error(data.error);
      } else if (data.error) {
        toast.error(data.error);
      } else {
        setResult(data.result);
        if (data.remaining !== undefined) {
          setRemaining(data.remaining);
        }
        if (data.cached) {
          toast.info("Using cached result");
        }
      }
    } catch {
      toast.error("Failed to fetch AI response");
    }
    setLoading(false);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/projects/${projectId}/issues/${issueId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold">AI Insights</h1>
          </div>
        </div>
        {remaining !== null && (
          <Badge variant="outline">
            {remaining} requests remaining
          </Badge>
        )}
      </div>

      {/* Warning if description too short */}
      {issueData && !canUseAI && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Description must be more than 10 characters to use AI Summary and Suggestions.
            Current length: {descriptionLength} characters.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <CardTitle>Summary</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAI("summary")}
              disabled={loadingSummary || !canUseAI}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingSummary ? "animate-spin" : ""}`} />
              {summary ? "Regenerate" : "Generate"}
            </Button>
          </div>
          <CardDescription>
            AI-generated summary of this issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSummary ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : summary ? (
            <p className="text-sm leading-relaxed">{summary}</p>
          ) : (
            <p className="text-muted-foreground text-sm">
              {canUseAI 
                ? "Click generate to create a summary"
                : "Add more description to enable AI summary"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Suggestions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <CardTitle>Suggestions</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAI("suggestions")}
              disabled={loadingSuggestions || !canUseAI}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingSuggestions ? "animate-spin" : ""}`} />
              {suggestions ? "Regenerate" : "Generate"}
            </Button>
          </div>
          <CardDescription>
            AI-powered suggestions for this issue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingSuggestions ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : suggestions ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{suggestions}</div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {canUseAI 
                ? "Click generate to get AI suggestions"
                : "Add more description to enable AI suggestions"}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Comment Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-500" />
              <CardTitle>Discussion Summary</CardTitle>
              {issueData && (
                <Badge variant="secondary">
                  {issueData.commentsCount} comments
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAI("comment_summary")}
              disabled={loadingCommentSummary || !canUseCommentSummary}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingCommentSummary ? "animate-spin" : ""}`} />
              {commentSummary ? "Regenerate" : "Generate"}
            </Button>
          </div>
          <CardDescription>
            AI-generated summary of the discussion
            {!canUseCommentSummary && " (requires at least 5 comments)"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingCommentSummary ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : commentSummary ? (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">{commentSummary}</div>
          ) : (
            <p className="text-muted-foreground text-sm">
              {canUseCommentSummary 
                ? "Click generate to summarize the discussion"
                : `Need ${5 - (issueData?.commentsCount || 0)} more comments to enable discussion summary`}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
