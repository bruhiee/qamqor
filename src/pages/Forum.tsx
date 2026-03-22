import { useState, useEffect, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Plus,
  Eye,
  Clock,
  User,
  AlertTriangle,
  Shield,
  Send,
  X,
  Trash,
  Sparkles,
  Loader2,
  ImagePlus,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DisclaimerBanner } from "@/components/layout/DisclaimerBanner";
import { useLanguage } from "@/contexts/useLanguage";
import { useAuth } from "@/contexts/useAuth";
import { useUserRoles } from "@/hooks/useUserRoles";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ForumPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  symptom_description?: string;
  symptom_duration?: string | null;
  additional_details?: string | null;
  problem_category?: string | null;
  age_group?: string | null;
  symptom_tags?: string[];
  photo_data_url?: string | null;
  tags: string[];
  is_urgent: boolean;
  status: string;
  views_count: number;
  created_at: string;
  replies_count?: number;
}

interface ForumReply {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_anonymous: boolean;
  is_doctor_reply: boolean;
  created_at: string;
}

const TAGS = ["itching", "fever", "cough", "headache", "nausea", "pain", "rash", "fatigue", "swelling", "dizziness"];
const PROBLEM_CATEGORIES = ["skin", "allergy", "cold", "stomach", "pain", "other"];
const AGE_GROUPS = ["0-12", "13-17", "18-25", "26-40", "41-60", "61+"];

export default function Forum() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { isAdmin, isModerator } = useUserRoles();
  const { toast } = useToast();
  const canReplyAsDoctor = Boolean(user && (user.doctor_verified || user.roles.includes("admin")));

  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ForumReply[]>([]);
  const [newPostOpen, setNewPostOpen] = useState(false);

  // New post form
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [symptomDuration, setSymptomDuration] = useState("");
  const [problemCategory, setProblemCategory] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPostingQuestion, setIsPostingQuestion] = useState(false);
  const [improvingQuestion, setImprovingQuestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    title: string;
    content: string;
  } | null>(null);

  // Reply form
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymously, setReplyAnonymously] = useState(false);

  const canManagePost = (post: ForumPost) =>
    Boolean(user && (isAdmin() || isModerator() || user.id === post.user_id));

  const canManageReply = (reply: ForumReply) =>
    Boolean(user && (isAdmin() || isModerator() || user.id === reply.user_id));

  const handleDeletePost = async () => {
    if (!selectedPost) return;
    try {
      await apiFetch(`/forum/posts/${selectedPost.id}`, {
        method: "DELETE",
      });
      toast({
        title: t.success,
        description: "Post removed",
      });
      setSelectedPost(null);
      setReplies([]);
      fetchPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({ title: t.error, variant: "destructive" });
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await apiFetch(`/forum/replies/${replyId}`, {
        method: "DELETE",
      });
      toast({ title: t.success, description: "Reply removed" });
      setReplies((prev) => prev.filter((reply) => reply.id !== replyId));
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast({ title: t.error, variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
    const { data } = await apiFetch<{ data: ForumPost[] }>("/forum/posts");
    setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = async (postId: string) => {
    try {
    const { data } = await apiFetch<{ data: ForumReply[] }>(`/forum/posts/${postId}/replies`);
    setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSelectPost = async (post: ForumPost) => {
    setSelectedPost(post);
    await fetchReplies(post.id);
    
    // Increment view count
    await apiFetch(`/forum/posts/${post.id}/views`, {
      method: "POST",
    });
  };

  const handleCreatePost = async () => {
    if (!user || !newTitle.trim() || !newContent.trim() || !problemCategory || !ageGroup || isPostingQuestion) return;

    setIsPostingQuestion(true);
    try {
      await apiFetch("/forum/posts", {
        method: "POST",
        body: {
          title: newTitle,
          content: newContent,
          problem_category: problemCategory,
          symptom_duration: symptomDuration,
          age_group: ageGroup,
          photo_data_url: photoDataUrl,
          tags: newTags,
          is_urgent: isUrgent,
        },
      });

      toast({ title: t.success, description: "Question posted successfully" });
      setNewPostOpen(false);
      setNewTitle("");
      setNewContent("");
      setSymptomDuration("");
      setProblemCategory("");
      setAgeGroup("");
      setPhotoDataUrl(null);
      setPhotoFileName("");
      setNewTags([]);
      setIsUrgent(false);
      setAiSuggestion(null);
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : t.error,
        variant: "destructive",
      });
    } finally {
      setIsPostingQuestion(false);
    }
  };

  const handleImproveQuestion = async () => {
    if (!newContent.trim()) {
      toast({
        title: t.error,
        description: "Write your question details first.",
        variant: "destructive",
      });
      return;
    }
    setImprovingQuestion(true);
    try {
      const { data } = await apiFetch<{ data: { title: string; content: string } }>("/forum/question-improve", {
        method: "POST",
        body: {
          title: newTitle,
          content: newContent,
          problem_category: problemCategory,
          symptom_duration: symptomDuration,
          age_group: ageGroup,
          language,
        },
      });
      if (data) {
        setAiSuggestion({
          title: data.title || newTitle,
          content: data.content || newContent,
        });
      }
      toast({ title: t.success, description: "AI prepared an improved draft. Review and apply if needed." });
    } catch (error) {
      console.error("Question improvement failed:", error);
      toast({ title: t.error, variant: "destructive" });
    } finally {
      setImprovingQuestion(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setNewTitle(aiSuggestion.title);
    setNewContent(aiSuggestion.content);
    setAiSuggestion(null);
    toast({ title: t.success, description: "Improved draft applied. You can still edit it." });
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoDataUrl(null);
      setPhotoFileName("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: t.error, description: "Only image files are allowed.", variant: "destructive" });
      return;
    }
    if (file.size > 900 * 1024) {
      toast({ title: t.error, description: "Image is too large. Max 900KB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoDataUrl(typeof reader.result === "string" ? reader.result : null);
      setPhotoFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleReply = async () => {
    if (!user || !selectedPost || !replyContent.trim()) return;

    try {
      await apiFetch(`/forum/posts/${selectedPost.id}/replies`, {
        method: "POST",
        body: {
          content: replyContent,
          is_anonymous: replyAnonymously,
        },
      });

      toast({ title: t.success });
      setReplyContent("");
      setReplyAnonymously(false);
      fetchReplies(selectedPost.id);
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: t.error,
        description: error instanceof Error ? error.message : t.error,
        variant: "destructive",
      });
    }
  };

  const toggleTag = (tag: string) => {
    setNewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-success/20 text-success';
      case 'flagged': return 'bg-destructive/20 text-destructive';
      default: return 'bg-primary/20 text-primary';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "answered") return t.answered;
    if (status === "flagged") {
      return language === "ru" ? "На модерации" : language === "kk" ? "Модерацияда" : "Flagged";
    }
    return t.open;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1 pt-24 pb-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-3xl font-bold">{t.forumTitle}</h1>
                <p className="text-muted-foreground">{t.askCommunity}</p>
              </div>
            </div>

            {user && (
              <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    {t.newQuestion}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{t.postQuestion}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label>{t.questionTitle}</Label>
                      <Input
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder={t.questionTitle}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Problem Category</Label>
                        <Select value={problemCategory} onValueChange={setProblemCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROBLEM_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Age Group</Label>
                        <Select value={ageGroup} onValueChange={setAgeGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                          <SelectContent>
                            {AGE_GROUPS.map((group) => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>Symptom Duration</Label>
                      <Input
                        value={symptomDuration}
                        onChange={(e) => setSymptomDuration(e.target.value)}
                        placeholder="e.g. 3 days, 2 weeks"
                      />
                    </div>
                    <div>
                      <Label>Upload Photo (optional)</Label>
                      <Input type="file" accept="image/*" onChange={handlePhotoChange} />
                      {photoFileName && (
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                          <ImagePlus className="w-3 h-3" />
                          {photoFileName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label>{t.questionDetails} (Final message)</Label>
                      <Textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="Final structured question text shown in forum..."
                        rows={4}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={handleImproveQuestion}
                      disabled={improvingQuestion}
                    >
                      {improvingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Improve with AI
                    </Button>
                    {aiSuggestion && (
                      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                        <p className="text-sm font-medium">AI improved draft is ready</p>
                        <p className="text-xs text-muted-foreground line-clamp-4">{aiSuggestion.content}</p>
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={applyAiSuggestion}>
                            Accept improved version
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setAiSuggestion(null)}
                          >
                            Keep original
                          </Button>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label>{t.selectTags}</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {TAGS.map(tag => (
                          <Badge
                            key={tag}
                            variant={newTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={isUrgent}
                        onCheckedChange={setIsUrgent}
                      />
                      <Label className="text-destructive flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        {t.markAsUrgent}
                      </Label>
                    </div>
                    <Button onClick={handleCreatePost} className="w-full" disabled={!newTitle.trim() || !newContent.trim() || !problemCategory || !ageGroup || isPostingQuestion}>
                      {isPostingQuestion ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {t.postQuestion}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <DisclaimerBanner />

          {/* Search */}
          <div className="relative max-w-md mb-6 mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Posts List */}
            <div className="lg:col-span-1 space-y-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">{t.loading}</div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{t.noResults}</div>
              ) : (
                filteredPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleSelectPost(post)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPost?.id === post.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium line-clamp-2">{post.title}</h3>
                      {post.is_urgent && (
                        <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                      )}
                    </div>
                    {post.problem_category && (
                      <Badge variant="outline" className="mb-2 capitalize">{post.problem_category}</Badge>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {post.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <Badge className={getStatusColor(post.status)}>
                        {getStatusLabel(post.status)}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Post Detail */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {selectedPost ? (
                  <motion.div
                    key={selectedPost.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {selectedPost.is_urgent && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Urgent
                            </Badge>
                          )}
                          <Badge className={getStatusColor(selectedPost.status)}>
                            {getStatusLabel(selectedPost.status)}
                          </Badge>
                        </div>
                        <h2 className="text-xl font-display font-bold">{selectedPost.title}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {canManagePost(selectedPost) && (
                          <Button variant="ghost" size="icon" onClick={handleDeletePost}>
                            <Trash className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedPost(null)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-muted-foreground mb-4">{selectedPost.content}</p>
                    {selectedPost.symptom_description && (
                      <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                        {selectedPost.problem_category && (
                          <p><span className="font-medium">Category:</span> <span className="capitalize">{selectedPost.problem_category}</span></p>
                        )}
                        {selectedPost.age_group && (
                          <p><span className="font-medium">Age group:</span> {selectedPost.age_group}</p>
                        )}
                        <p><span className="font-medium">Symptoms:</span> {selectedPost.symptom_description}</p>
                        {selectedPost.symptom_duration && (
                          <p><span className="font-medium">Duration:</span> {selectedPost.symptom_duration}</p>
                        )}
                        {selectedPost.symptom_tags?.length ? (
                          <p><span className="font-medium">Symptom tags:</span> {selectedPost.symptom_tags.join(", ")}</p>
                        ) : null}
                        {selectedPost.additional_details && (
                          <p><span className="font-medium">Details:</span> {selectedPost.additional_details}</p>
                        )}
                      </div>
                    )}
                    {selectedPost.photo_data_url && (
                      <div className="mb-4">
                        <img
                          src={selectedPost.photo_data_url}
                          alt="Uploaded symptom reference"
                          className="max-h-64 w-full rounded-lg border border-border object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-6">
                      {selectedPost.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>

                    {selectedPost.is_urgent && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
                        <p className="text-sm text-destructive flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {t.seekProfessionalHelp}
                        </p>
                      </div>
                    )}

                    {/* Replies */}
                    <div className="border-t border-border pt-6">
                      <h3 className="font-medium mb-4">{t.replies} ({replies.length})</h3>
                      
                      <div className="space-y-4 mb-6">
                        {replies.map((reply) => (
                          <div
                            key={reply.id}
                            className={`p-4 rounded-lg ${
                              reply.is_doctor_reply
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-muted'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                {reply.is_doctor_reply ? (
                                  <Badge className="gap-1 bg-primary">
                                    <Shield className="w-3 h-3" />
                                    {t.doctorAnswer}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <User className="w-3 h-3 mr-1" />
                                    {reply.is_anonymous ? 'Anonymous' : 'User'}
                                  </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {canManageReply(reply) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteReply(reply.id)}
                                >
                                  <Trash className="w-3 h-3 text-destructive" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Reply Form */}
                      {user && (
                        <div className="space-y-3">
                          <p className="text-xs text-muted-foreground">
                            Only verified doctors can publish answers.
                          </p>
                          <Textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={t.writeReply}
                            rows={3}
                            disabled={!canReplyAsDoctor}
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={replyAnonymously}
                                onCheckedChange={setReplyAnonymously}
                                disabled={!canReplyAsDoctor}
                              />
                              <Label className="text-sm">{t.replyAnonymously}</Label>
                            </div>
                            <Button onClick={handleReply} className="gap-2" disabled={!canReplyAsDoctor}>
                              <Send className="w-4 h-4" />
                              {t.reply}
                            </Button>
                          </div>
                          {!canReplyAsDoctor && (
                            <p className="text-xs text-destructive">
                              Doctor verification required to answer in forum.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Select a question to view details
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

