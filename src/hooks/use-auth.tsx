import { createContext, useContext, useState } from "react"
import { MOCK_USERS, type User } from "@/mocks/users"

interface AuthContextValue {
  currentUser: User
  setCurrentUserId: (userId: string) => void
  allUsers: User[]
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0])

  const setCurrentUserId = (userId: string) => {
    const user = MOCK_USERS.find((u) => u.id === userId)
    if (user) setCurrentUser(user)
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUserId, allUsers: MOCK_USERS }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
