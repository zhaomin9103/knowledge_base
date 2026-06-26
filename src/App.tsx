import { RouterProvider } from "react-router-dom"
import { ThemeProvider } from "@/hooks/use-theme"
import { AuthProvider } from "@/hooks/use-auth"
import { router } from "@/router"

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
