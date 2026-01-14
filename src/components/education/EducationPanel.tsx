import { useState, useEffect } from "react";
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  ChevronRight,
  Loader2,
  TrendingUp,
  BarChart3,
  Shield,
  DollarSign,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEducation, EDUCATIONAL_TOPICS, SkillLevel, EducationContext } from "@/hooks/useEducation";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface EducationPanelProps {
  context?: EducationContext;
  className?: string;
  onClose?: () => void;
  defaultTopic?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  Indicators: <BarChart3 className="w-4 h-4" />,
  Patterns: <TrendingUp className="w-4 h-4" />,
  Valuation: <DollarSign className="w-4 h-4" />,
  Risk: <Shield className="w-4 h-4" />,
};

const levelColors: Record<SkillLevel, string> = {
  beginner: "bg-green-500/10 text-green-400 border-green-500/30",
  intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  advanced: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

export function EducationPanel({ context, className, onClose, defaultTopic }: EducationPanelProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(defaultTopic || null);
  const [selectedLevel, setSelectedLevel] = useState<SkillLevel>("beginner");
  const [content, setContent] = useState<string | null>(null);
  const { fetchExplanation, isLoading, topics } = useEducation();

  const categories = [...new Set(topics.map(t => t.category))];

  useEffect(() => {
    if (defaultTopic) {
      handleTopicSelect(defaultTopic);
    }
  }, [defaultTopic]);

  const handleTopicSelect = async (topicId: string) => {
    setSelectedTopic(topicId);
    setContent(null);
    
    const result = await fetchExplanation(topicId, context, selectedLevel);
    if (result) {
      setContent(result.content);
    }
  };

  const handleLevelChange = async (level: SkillLevel) => {
    setSelectedLevel(level);
    if (selectedTopic) {
      const result = await fetchExplanation(selectedTopic, context, level);
      if (result) {
        setContent(result.content);
      }
    }
  };

  const selectedTopicData = topics.find(t => t.id === selectedTopic);

  return (
    <div className={cn("glass-panel rounded-xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Trading Education</h3>
            <p className="text-xs text-muted-foreground">
              {context?.symbol ? `Learning in context of ${context.symbol}` : "Select a topic to learn"}
            </p>
          </div>
        </div>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex h-[500px]">
        {/* Topics sidebar */}
        <div className="w-64 border-r border-border/50 flex flex-col">
          <div className="p-3 border-b border-border/50">
            <div className="flex gap-1">
              {(["beginner", "intermediate", "advanced"] as SkillLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => handleLevelChange(level)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-xs rounded-md capitalize transition-all",
                    selectedLevel === level
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-4">
              {categories.map((category) => (
                <div key={category}>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {categoryIcons[category]}
                    {category}
                  </div>
                  <div className="space-y-1">
                    {topics
                      .filter(t => t.category === category)
                      .map((topic) => (
                        <button
                          key={topic.id}
                          onClick={() => handleTopicSelect(topic.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-all",
                            selectedTopic === topic.id
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <span className="text-base">{topic.icon}</span>
                          <span className="flex-1 truncate">{topic.title}</span>
                          <ChevronRight className={cn(
                            "w-4 h-4 transition-transform",
                            selectedTopic === topic.id && "text-primary"
                          )} />
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col">
          {selectedTopic ? (
            <>
              <div className="p-4 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedTopicData?.icon}</span>
                    <div>
                      <h4 className="font-semibold">{selectedTopicData?.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={levelColors[selectedLevel]}>
                          {selectedLevel}
                        </Badge>
                        {context?.symbol && (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                            {context.symbol}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">
                      Generating personalized explanation...
                    </p>
                  </div>
                ) : content ? (
                  <div className="prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h2 className="text-lg font-semibold mt-4 mb-3">{children}</h2>,
                        h2: ({ children }) => <h3 className="text-base font-semibold mt-4 mb-2">{children}</h3>,
                        h3: ({ children }) => <h4 className="text-sm font-semibold mt-3 mb-2">{children}</h4>,
                        p: ({ children }) => <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{children}</p>,
                        ul: ({ children }) => <ul className="text-sm space-y-2 mb-3 list-disc pl-5">{children}</ul>,
                        ol: ({ children }) => <ol className="text-sm space-y-2 mb-3 list-decimal pl-5">{children}</ol>,
                        li: ({ children }) => <li className="text-muted-foreground leading-relaxed">{children}</li>,
                        strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                        em: ({ children }) => <em className="text-primary not-italic font-medium">{children}</em>,
                        code: ({ children }) => (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                            {children}
                          </blockquote>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">
                    Unable to load content. Please try again.
                  </p>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Select a Topic</h4>
              <p className="text-sm text-muted-foreground max-w-xs">
                Choose a topic from the sidebar to get AI-powered explanations tailored to your skill level
                {context?.symbol && ` and ${context.symbol}'s current situation`}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
