import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Send, ShieldAlert, Trash2 } from 'lucide-react';
import { apiFetch } from '../../../lib/api';
import type { ChatMessageItem } from '../../../types';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';

const COACH_ROLES = [
  { name: 'Daily Routine', desc: 'Adjusts time blocks around your real wake/sleep hours.' },
  { name: 'Smart Tasks', desc: 'Helps prioritize and split overwhelming tasks.' },
  { name: 'Smart Reminders', desc: 'Recommends gentle timing for focus and breaks.' },
  { name: 'Habit & Focus', desc: 'Supports daily consistency and distraction control.' },
  { name: 'Goal Productivity', desc: 'Reviews real focus hours and goal milestones honestly.' },
];

const AI_RULES_LIST = [
  'Never invent completed tasks, streaks, or focus hours.',
  'Use only the real data stored in your workspace.',
  'Keep suggestions concise, practical, and beginner-friendly.',
];

const QUICK_PROMPTS = [
  'Review my routine and open tasks for today. What should I tackle first?',
  'I feel distracted — give me a 90-minute focus plan right now.',
  'Suggest 2 simple ways to improve my daily consistency this week.',
];

export function AssistantView() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  async function loadMessages() {
    setLoading(true);
    try {
      const res = await apiFetch<{ messages: ChatMessageItem[] }>('/api/chat');
      setMessages(res.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat history.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);

    try {
      const res = await apiFetch<{ userMessage: ChatMessageItem; assistantMessage: ChatMessageItem }>(
        '/api/chat',
        {
          method: 'POST',
          body: JSON.stringify({ message: trimmed }),
        }
      );
      setMessages((prev) => [...prev, res.userMessage, res.assistantMessage]);
      setInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI is waking up, try again in a minute.');
    } finally {
      setSending(false);
    }
  }

  async function handleClear() {
    await apiFetch('/api/chat', { method: 'DELETE' });
    setMessages([]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-[#3B2A1E]">AI Time Management Coach</h1>
          <p className="text-sm text-[#7A6A58]">
            Ask for schedule advice, task prioritization, or focus strategies grounded in your real workspace.
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="h-4 w-4" />
            Clear chat
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-[0.625rem] border border-[#9E2B25]/30 bg-[#9E2B25]/10 px-4 py-3 text-sm text-[#9E2B25]">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="flex flex-col lg:col-span-8">
          <CardHeader className="border-b border-[#E5D9C3] pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-[#9E2B25]" />
              Coach Conversation
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col justify-between gap-4 pt-4">
            <div className="max-h-[460px] min-h-[300px] space-y-3 overflow-y-auto pr-1">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-[#9E2B25]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="space-y-4 py-8 text-center">
                  <p className="text-sm font-medium text-[#3B2A1E]">
                    Ask your coach to organize your day or help you get unstuck on a task.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {QUICK_PROMPTS.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => sendMessage(q)}
                        className="rounded-[0.625rem] border border-[#E5D9C3] bg-[#FAF7F0] px-3 py-2 text-xs font-medium text-[#3B2A1E] hover:border-[#9E2B25] cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-[0.625rem] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#9E2B25] text-[#FAF7F0]'
                          : 'border border-[#E5D9C3] bg-[#FAF7F0] text-[#3B2A1E]'
                      }`}
                    >
                      {msg.role === 'assistant' && msg.agentUsed && (
                        <p className="mb-1 text-[11px] font-bold text-[#9E2B25]">
                          Focus Area: {msg.agentUsed}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2 border-t border-[#E5D9C3] pt-4"
            >
              <Input
                placeholder="Ask about your routine, tasks, or focus..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !input.trim()}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What your coach helps with</CardTitle>
              <CardDescription>Built around daily routine &amp; focus.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COACH_ROLES.map((item) => (
                <div key={item.name} className="flex items-start gap-2.5 text-sm">
                  <span className="diamond-bullet mt-1.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-[#3B2A1E]">{item.name}</p>
                    <p className="text-xs leading-relaxed text-[#7A6A58]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-[#C89B5A]/50 bg-[#F3ECDF]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldAlert className="h-4 w-4 text-[#9E2B25]" />
                AI rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs leading-relaxed text-[#3B2A1E]">
                {AI_RULES_LIST.map((rule) => (
                  <li key={rule} className="flex items-start gap-2">
                    <span className="diamond-bullet mt-1.5" aria-hidden="true" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
