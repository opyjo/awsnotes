"use client";

import { useState } from "react";
import { useExamCountdown } from "@/hooks/useExamCountdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export const ExamCountdownWidget = () => {
  const {
    examDate,
    setExamDate,
    daysRemaining,
    todos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
  } = useExamCountdown();

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newTodoText, setNewTodoText] = useState("");
  const [todosExpanded, setTodosExpanded] = useState(false);

  const handleSetExamDate = (date: string) => {
    setExamDate(date);
    setIsEditingDate(false);
  };

  const handleClearExamDate = () => {
    setExamDate(null);
    setIsEditingDate(false);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim()) {
      addTodo(newTodoText.trim());
      setNewTodoText("");
    }
  };

  const getCountdownColor = () => {
    if (daysRemaining === null) return "text-muted-foreground";
    if (daysRemaining < 0) return "text-destructive";
    if (daysRemaining <= 7) return "text-orange-500";
    if (daysRemaining <= 30) return "text-yellow-500";
    return "text-green-500";
  };

  const getCountdownBg = () => {
    if (daysRemaining === null) return "from-muted/50 to-muted/30";
    if (daysRemaining < 0) return "from-destructive/10 to-destructive/5";
    if (daysRemaining <= 7) return "from-orange-500/10 to-orange-500/5";
    if (daysRemaining <= 30) return "from-yellow-500/10 to-yellow-500/5";
    return "from-green-500/10 to-green-500/5";
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const progress = todos.length > 0 ? (completedCount / todos.length) * 100 : 0;

  return (
    <div className="mb-6">
      {/* Compact horizontal banner */}
      <div className="rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Left: Exam Countdown */}
          <div className={cn(
            "flex items-center gap-4 px-5 py-4 bg-gradient-to-r border-b md:border-b-0 md:border-r border-border/40",
            getCountdownBg()
          )}>
            {!examDate || isEditingDate ? (
              <div className="flex items-center gap-3 min-w-0">
                <svg
                  className="w-5 h-5 text-primary shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <Input
                  type="date"
                  defaultValue={examDate || ""}
                  onChange={(e) => handleSetExamDate(e.target.value)}
                  className="text-sm h-9 w-44"
                  autoFocus
                />
                {examDate && (
                  <div className="flex gap-1.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingDate(false)}
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearExamDate}
                      className="h-8 text-xs text-destructive hover:text-destructive"
                    >
                      Clear
                    </Button>
                  </div>
                )}
                {!examDate && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Set your exam date</span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn("text-3xl font-bold leading-none", getCountdownColor())}>
                    {daysRemaining !== null && daysRemaining >= 0 ? daysRemaining : "—"}
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold leading-tight", getCountdownColor())}>
                      {daysRemaining === 0
                        ? "Exam today!"
                        : daysRemaining === 1
                        ? "day left"
                        : daysRemaining !== null && daysRemaining < 0
                        ? "Passed"
                        : "days left"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(examDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingDate(true)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Right: Today's Goals */}
          <div className="flex-1 px-5 py-4 min-w-0">
            <div className="flex items-center gap-3">
              {/* Goals header + progress */}
              <div className="flex items-center gap-2 shrink-0">
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="text-sm font-semibold whitespace-nowrap">Today's Goals</span>
                {todos.length > 0 && (
                  <span className="text-xs text-muted-foreground font-medium tabular-nums">
                    {completedCount}/{todos.length}
                  </span>
                )}
                {todos.length > 0 && (
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Inline add form */}
              <form onSubmit={handleAddTodo} className="flex-1 flex gap-2 min-w-0">
                <Input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Add a goal..."
                  className="text-sm h-9"
                />
                <Button type="submit" size="sm" className="h-9 px-3 shrink-0" disabled={!newTodoText.trim()}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </Button>
              </form>

              {/* Expand/collapse toggle */}
              {todos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setTodosExpanded(!todosExpanded)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
                >
                  <svg
                    className={cn("w-4 h-4 transition-transform duration-200", todosExpanded && "rotate-180")}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded todo list */}
        {todosExpanded && todos.length > 0 && (
          <div className="border-t border-border/40 px-5 py-3 bg-muted/20">
            <div className="flex flex-wrap gap-2">
              {todos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition-all duration-200",
                    todo.completed
                      ? "bg-muted/60 border-border/50 text-muted-foreground"
                      : "bg-background border-border hover:border-blue-500/40"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      "w-4 h-4 rounded-full border-2 shrink-0 transition-all duration-200 flex items-center justify-center",
                      todo.completed
                        ? "bg-blue-500 border-blue-500"
                        : "border-muted-foreground/40 hover:border-blue-500"
                    )}
                  >
                    {todo.completed && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <span className={cn(todo.completed && "line-through")}>{todo.text}</span>
                  <button
                    type="button"
                    onClick={() => deleteTodo(todo.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  Clear done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
