"use client"

import { useState, useEffect, useRef } from "react"
import {
  Send,
  Loader2,
  User,
  Bot,
  Download,
  Plus,
  Trash2,
  MessageSquare,
  Search,
  HelpCircle,
  Settings,
  ChevronsUpDown,
  LogOut,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthContext } from "@/store/AuthContext"
import { logout } from "@/actions/actions"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

interface ChatSession {
  id: string
  group_name: string
  title: string
  message_count: number
  first_message: string
  last_message: string
  matching_context?: string
  created_at: string
  updated_at: string
}

interface RansomwareGroup {
  name: string
  size: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [groups, setGroups] = useState<RansomwareGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Session and persistence state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chats, setChats] = useState<ChatSession[]>([])
  const sidebarOpen = true
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [newChatGroup, setNewChatGroup] = useState<string>("")
  const [newChatCompanyName, setNewChatCompanyName] = useState<string>("")
  const [newChatRevenue, setNewChatRevenue] = useState<string>("")

  // Config state
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1")
  const [model, setModel] = useState("gpt-4o")

  // Settings dialog state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsApiKey, setSettingsApiKey] = useState("")
  const [settingsBaseUrl, setSettingsBaseUrl] = useState("https://api.openai.com/v1")
  const [settingsModel, setSettingsModel] = useState("gpt-4o")
  const [settingsApiKeyModified, setSettingsApiKeyModified] = useState(false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Auth context
  const { user, setUser } = useAuthContext()

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch groups, chats, and user settings on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/groups`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setGroups(data.groups))
      .catch((err) => setError("Failed to load groups: " + err.message))

    fetchChats()
    loadUserSettings()
  }, [])

  const fetchChats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats`, { credentials: "include" })
      const data = await res.json()
      setChats(data.chats || [])
    } catch (err) {
      console.error("Failed to load chats:", err)
    }
  }

  // Load user settings from backend
  const loadUserSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/accounts/settings`, {
        credentials: "include",
      })
      if (res.ok) {
        const data = await res.json()
        setSettingsBaseUrl(data.base_url)
        setSettingsModel(data.model)
        // Set the API key from settings (may be masked or empty)
        setSettingsApiKey(data.api_key || "")
        setSettingsApiKeyModified(false)

        // Also populate main state for new chat use
        setBaseUrl(data.base_url)
        setModel(data.model)
        // If API key exists and is not masked, use it; otherwise check /me endpoint for hasApiKey
        if (data.api_key && !data.api_key.includes("****")) {
          setApiKey(data.api_key)
        } else {
          // Check if user has an API key from auth context
          setApiKey(user.hasApiKey ? "" : "")
        }
      }
    } catch (err) {
      console.error("Failed to load settings:", err)
    }
  }

  // Save user settings to backend
  const saveUserSettings = async () => {
    setIsSavingSettings(true)
    try {
      // Always include all fields - empty string is valid for API key (for local endpoints)
      const payload: Record<string, string> = {
        base_url: settingsBaseUrl,
        model: settingsModel,
        api_key: settingsApiKey, // Always include - empty string means no key
      }

      const res = await fetch(`${API_BASE_URL}/api/accounts/settings`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": user.csrfToken,
        },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        // Update main state with the saved settings
        setApiKey(settingsApiKey)
        setBaseUrl(settingsBaseUrl)
        setModel(settingsModel)
        // Update auth context to reflect whether user has an API key
        const hasKey = !!settingsApiKey && settingsApiKey.length > 0
        setUser((prev) => ({ ...prev, hasApiKey: hasKey }))
        setIsSettingsOpen(false)
        // Reset the modified flag
        setSettingsApiKeyModified(false)
      } else {
        setError("Failed to save settings")
      }
    } catch (err) {
      setError("Failed to save settings")
    } finally {
      setIsSavingSettings(false)
    }
  }

  const searchChats = async (query: string) => {
    if (!query.trim()) {
      setIsSearching(false)
      fetchChats()
      return
    }

    setIsSearching(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/chats/search?q=${encodeURIComponent(query)}`, { credentials: "include" })
      const data = await res.json()
      setChats(data.chats || [])
    } catch (err) {
      console.error("Failed to search chats:", err)
    }
  }

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleStartChat = async () => {
    if (!selectedGroup) {
      setError("Please select a group")
      return
    }

    // API key is optional for local unauthenticated endpoints
    if (!apiKey && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
      setError("Please configure your API key in Settings first")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Call init with save_session: true to persist the chat
      const response = await fetch(`${API_BASE_URL}/api/init`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: selectedGroup,
          api_key: apiKey,
          base_url: baseUrl,
          model: model,
          save_session: true,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize chat")
      }

      const data = await response.json()

      setSessionId(data.session_id)
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: data.welcome_message,
        },
      ])

      setIsConfigOpen(false)

      // Refresh chat list
      fetchChats()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const loadChat = async (chatId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/chats/${chatId}`, { credentials: "include" })
      if (!response.ok) {
        throw new Error("Failed to load chat")
      }

      const data = await response.json()

      // Set session config from stored data
      setSessionId(data.id)
      setSelectedGroup(data.group_name)
      setApiKey(data.api_key || "")
      setBaseUrl(data.base_url || "https://api.openai.com/v1")
      setModel(data.model || "gpt-4o")

      // Convert database messages to frontend format
      const loadedMessages: Message[] = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
      }))

      setMessages(loadedMessages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChatToDelete(chatId)
    setIsDeleteOpen(true)
  }

  const confirmDelete = async () => {
    if (!chatToDelete) return

    try {
      await fetch(`${API_BASE_URL}/api/chats/${chatToDelete}/delete`, {
        method: "DELETE",
        credentials: "include",
      })

      // Clear current session if deleted
      if (sessionId === chatToDelete) {
        setSessionId(null)
        setSelectedGroup("")
        setMessages([])
      }

      fetchChats()
    } catch (err) {
      setError("Failed to delete chat")
    }
  }

  const handleNewChat = () => {
    setSessionId(null)
    setSelectedGroup("")
    setMessages([])
    setNewChatGroup("")
    setNewChatCompanyName("")
    setNewChatRevenue("")
    setIsGroupSelectOpen(true)
    setError(null)
  }

  const startNewChat = async () => {
    if (!newChatGroup) {
      setError("Please select a ransomware group")
      return
    }

    // API key is optional for local unauthenticated endpoints (localhost)
    if (!apiKey && !baseUrl.includes("localhost") && !baseUrl.includes("127.0.0.1")) {
      setError("Please configure your API key in Settings first")
      setIsGroupSelectOpen(false)
      return
    }

    setIsGroupSelectOpen(false)
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/init`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group_name: newChatGroup,
          api_key: apiKey,
          base_url: baseUrl,
          model: model,
          save_session: true,
          company_name: newChatCompanyName || "Acme Corp",
          revenue: newChatRevenue || "",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to initialize chat")
      }

      const data = await response.json()

      setSessionId(data.session_id)
      setSelectedGroup(newChatGroup)
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: data.welcome_message,
        },
      ])

      fetchChats()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)
    setError(null)

    try {
      // Use async endpoint that dispatches to Celery
      const response = await fetch(`${API_BASE_URL}/api/chat/async`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          api_key: apiKey,
          base_url: baseUrl,
          model: model,
          group_name: selectedGroup,
          message: inputMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || "Failed to queue message")
      }

      const data = await response.json()
      const taskId = data.task_id

      // Update session_id if it was created during the chat
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id)
        fetchChats()
      }

      // Poll for the result
      const pollForResult = async (): Promise<{ response: string; session_id: string }> => {
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Poll every 1 second

          const statusResponse = await fetch(`${API_BASE_URL}/api/chat/status/${taskId}`, {
            credentials: "include",
          })

          if (!statusResponse.ok) {
            throw new Error("Failed to check message status")
          }

          const statusData = await statusResponse.json()

          if (statusData.status === "completed") {
            return {
              response: statusData.response,
              session_id: statusData.session_id,
            }
          } else if (statusData.status === "error") {
            throw new Error(statusData.error || "Failed to get response")
          }
          // Otherwise status is "processing" or "waiting", continue polling
        }
      }

      const result = await pollForResult()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatBytes = (bytes: number): string => {
    const units = ["", "K", "M", "G", "T", "P"]
    let size = bytes
    let unitIndex = 0
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    return `${size.toFixed(2)}${units[unitIndex]}B`
  }

  const handleExportChat = () => {
    if (messages.length === 0) return

    const chatContent = messages
      .map((m) => `${m.role === "user" ? "You" : selectedGroup}: ${m.content}`)
      .join("\n\n")

    const blob = new Blob([chatContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ransomchat-${selectedGroup.toLowerCase()}-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      {/* Sidebar */}
      <Sidebar side="left" variant="inset" className="border-r">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex aspect-square size-8 items-center justify-center rounded-sm bg-destructive">
                  <MessageSquare className="size-5 text-destructive-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">RansomChat</span>
                  <span className="text-xs text-muted-foreground">
                    Negotiation Simulator
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              searchChats(searchQuery)
            }}
          >
            <SidebarGroup className="py-0">
              <SidebarGroupContent className="relative">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <SidebarInput
                  id="search"
                  placeholder="Search chats..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
              </SidebarGroupContent>
            </SidebarGroup>
          </form>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Chat Sessions</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {chats.length === 0 ? (
                  <SidebarMenuItem>
                    <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                      {isSearching ? "No results found" : "No chats yet"}
                    </p>
                  </SidebarMenuItem>
                ) : (
                  chats.map((chat) => (
                    <SidebarMenuItem key={chat.id}>
                      <div className="flex w-full items-center justify-between gap-1">
                        <div
                          className={`flex flex-1 flex-col items-start gap-0 cursor-pointer min-w-0 ${sessionId === chat.id ? 'bg-accent rounded-md p-1 -mx-1' : ''}`}
                          onClick={() => loadChat(chat.id)}
                        >
                          <span className="font-medium truncate text-sm">{chat.group_name}</span>
                          <span className="text-xs text-muted-foreground truncate w-full">
                            {chat.first_message ? chat.first_message.slice(0, 30) + (chat.first_message.length > 30 ? "..." : "") : "New Chat"}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteChat(chat.id, e)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleNewChat}>
                <Plus className="size-4" />
                <span>New Chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          {/* User dropdown menu */}
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="size-8 rounded-lg">
                      <AvatarImage src="" alt={user.username} />
                      <AvatarFallback className="rounded-lg">
                        {user.username ? user.username.slice(0, 2).toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.username || "User"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email || ""}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="size-8 rounded-lg">
                        <AvatarImage src="" alt={user.username} />
                        <AvatarFallback className="rounded-lg">
                          {user.username ? user.username.slice(0, 2).toUpperCase() : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">{user.username || "User"}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email || ""}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { loadUserSettings(); setIsSettingsOpen(true); }}>
                    <Settings className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => logout(user.csrfToken, setUser)}>
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <div className="flex items-center justify-between flex-1">
            <div>
              <h1 className="text-lg font-semibold">RansomChat</h1>
              {selectedGroup && sessionId && (
                <p className="text-xs text-muted-foreground">
                  Chatting with: <span className="font-medium text-destructive">{selectedGroup}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button variant="outline" size="icon" onClick={handleExportChat} title="Export chat">
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start gap-3 max-w-[80%] ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-destructive text-destructive-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <Card
                      className={`p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </Card>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <Card className="bg-muted p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">
                          Typing...
                        </span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
                  {error}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t bg-card p-4">
            <div className="flex gap-3">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type your message..."
                className="min-h-[44px] max-h-[200px] resize-none"
                disabled={isLoading || !(selectedGroup || sessionId)}
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim() || !(selectedGroup || sessionId)}
                size="icon"
                className="h-auto"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {!(selectedGroup || sessionId) && (
              <p className="mt-2 text-xs text-muted-foreground text-center">
                Select a chat from the sidebar or configure settings to start a new conversation
              </p>
            )}
          </div>
        </div>
      </SidebarInset>

      {/* Config Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure Chat Settings</DialogTitle>
            <DialogDescription>
              Set up your API connection and choose a ransomware group
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="base-url">API Endpoint</Label>
              <Input
                id="base-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                Use OpenAI cloud, Ollama (http://localhost:11434/v1), LM Studio
                (http://localhost:1234/v1), etc.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
              />
            </div>

            <div className="grid gap-2">
              <Label>Ransomware Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a ransomware group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.name} value={group.name}>
                      {group.name} ({formatBytes(group.size)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleStartChat} disabled={isLoading || !selectedGroup || !apiKey}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Chat"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Group Selection Dialog - for New Chat button */}
      <Dialog open={isGroupSelectOpen} onOpenChange={setIsGroupSelectOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Select a ransomware group and configure your company details
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Ransomware Group</Label>
              <Select value={newChatGroup} onValueChange={setNewChatGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a ransomware group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.name} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company-name">Your Company Name</Label>
              <Input
                id="company-name"
                value={newChatCompanyName}
                onChange={(e) => setNewChatCompanyName(e.target.value)}
                placeholder="e.g., Acme Corp, Global Industries"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="revenue">Annual Revenue</Label>
              <Input
                id="revenue"
                value={newChatRevenue}
                onChange={(e) => setNewChatRevenue(e.target.value)}
                placeholder="e.g., $50M, $1.5B (leave empty for random)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={startNewChat} disabled={isLoading || !newChatGroup}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                "Start Chat"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Settings</DialogTitle>
            <DialogDescription>
              Configure your API settings. These will be used as defaults for new chats.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="settings-base-url">API Endpoint</Label>
              <Input
                id="settings-base-url"
                value={settingsBaseUrl}
                onChange={(e) => setSettingsBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
              />
              <p className="text-xs text-muted-foreground">
                Use OpenAI cloud, Ollama (http://localhost:11434/v1), LM Studio
                (http://localhost:1234/v1), etc.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="settings-model">Model</Label>
              <Input
                id="settings-model"
                value={settingsModel}
                onChange={(e) => setSettingsModel(e.target.value)}
                placeholder="gpt-4o"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="settings-api-key">API Key</Label>
              <Input
                id="settings-api-key"
                type="password"
                value={settingsApiKey}
                onChange={(e) => { setSettingsApiKey(e.target.value); setSettingsApiKeyModified(true); }}
                placeholder={user.hasApiKey ? "•••••••• (leave empty to keep current)" : "Enter your API key"}
              />
              {user.hasApiKey && (
                <p className="text-xs text-muted-foreground">
                  You have an API key on file. Leave empty to keep it.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={saveUserSettings} disabled={isSavingSettings}>
              {isSavingSettings ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => {
              confirmDelete()
              setIsDeleteOpen(false)
            }}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}