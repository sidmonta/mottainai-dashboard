import { Router, route, getCurrentUrl } from "preact-router"
import { useLocalStorage } from "@rehooks/local-storage"
import { useState } from "preact/hooks"
import { Helmet } from "react-helmet"

import Dashboard from "@/components/routes/dashboard"
import Plans from "@/components/routes/plans"
import Pipelines from "@/components/routes/pipelines"
import Tasks from "@/components/routes/tasks"
import Nodes from "@/components/routes/nodes"
import Artefacts from "@/components/routes/artefacts"
import Login from "@/components/routes/login"
import Tokens from "@/components/routes/tokens"
import Users from "@/components/routes/users"

import Sidebar from "@/components/sidebar"
import Loader from "@/components/common/loader"

import ThemeContext, { THEME_OPTIONS } from "@/contexts/theme"
import UserContext from "@/contexts/user"
import TitleContext from "@/contexts/title"

import themes from "@/themes"
import axios from "@/axios"
import UserService from "./service/user"

const AUTHED = ["/plans", "/pipelines", "/tasks", "/artefacts", "/nodes"]
const UNAUTHED = ["/login"]

const App = () => {
  const [theme, setTheme] = useLocalStorage(
    "mottainai-theme",
    THEME_OPTIONS[0].value
  )
  const themeValue = { theme, setTheme }
  const [user, setUser] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const userVal = { user, setUser }
  const [title, setTitle] = useState("")
  const titleVal = { title, setTitle }

  if (!THEME_OPTIONS.some((t) => t.value === theme)) {
    setTheme(THEME_OPTIONS[0].value)
  }

  axios.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response.status == 403) {
        UserService.clearUser()
        setUser(null)
        handleRoute(getCurrentUrl())
      }
      throw err
    }
  )

  const handleRoute = (url) => {
    if (loadingUser) {
      return
    }
    if (
      (AUTHED.some((val) => url.startsWith(val)) && !user) ||
      (UNAUTHED.some((val) => url.startsWith(val)) && user)
    ) {
      route("/")
    }
  }

  function clearLoadingUser() {
    handleRoute(getCurrentUrl())
    setLoadingUser(false)
  }

  useState(() => {
    if (UserService.isLoggedIn()) {
      UserService.getUser().then(setUser).finally(clearLoadingUser)
    } else {
      clearLoadingUser()
    }
  })

  if (loadingUser) {
    return (
      <div
        className={`flex justify-center items-center min-h-screen w-full ${themes[theme].bg}`}
      >
        <Loader />
      </div>
    )
  }

  return (
    <UserContext.Provider value={userVal}>
      <ThemeContext.Provider value={themeValue}>
        <TitleContext.Provider value={titleVal}>
          <Helmet>
            <title>{`${title && `${title} - `}MottainaiCI`}</title>
          </Helmet>
          <div
            className={`flex h-screen ${themes[theme].bg} ${themes[theme].textColor}`}
          >
            <Sidebar />
            <div className="px-8 py-10 flex-1 overflow-auto">
              <Router onChange={(e) => handleRoute(e.url)}>
                <Dashboard path="/" />
                <Tasks path="/tasks" />
                <Plans path="/plans" />
                <Pipelines path="/pipelines" />
                <Nodes path="/nodes" />
                <Artefacts path="/artefacts" />
                <Login path="/login" />
                <Tokens path="/tokens" />
                <Users path="/users" />
              </Router>
            </div>
          </div>
        </TitleContext.Provider>
      </ThemeContext.Provider>
    </UserContext.Provider>
  )
}

export default App
