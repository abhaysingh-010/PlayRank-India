"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Trophy,
  Users,
  Shield,
  Search,
  Home,
} from "lucide-react"

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {

  const pathname = usePathname()

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
    },
    {
      label: "Players",
      href: "/players",
      icon: Users,
    },
    {
      label: "Teams",
      href: "/teams",
      icon: Shield,
    },
    {
      label: "Tournaments",
      href: "/tournaments",
      icon: Trophy,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 font-sans">

      {/* NAVBAR */}
      <header className="h-16 border-b border-violet-500/20 flex items-center justify-between px-6 backdrop-blur-xl bg-slate-950/40">

        <div>
          <Link
            href="/"
            className="text-xl font-display font-bold tracking-wide bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-80 transition"
          >
            PlayRank
          </Link>
        </div>

        {/* SEARCH */}
        <div className="hidden md:flex items-center bg-slate-800/50 hover:bg-slate-800/70 px-4 py-2.5 rounded-lg w-[300px] border border-slate-700/50 transition duration-300">

          <Search size={16} className="text-slate-400" />

          <input
            placeholder="Search..."
            className="bg-transparent outline-none ml-3 w-full text-xs placeholder-slate-500 text-slate-200 font-sans"
          />

        </div>

      </header>

      <div className="flex">

        {/* SIDEBAR */}
        <aside className="w-[240px] border-r border-violet-500/10 min-h-[calc(100vh-64px)] p-4 hidden md:block bg-gradient-to-b from-slate-900/50 to-slate-950/50">

          <nav className="space-y-2">

            {navItems.map((item) => {

              const Icon = item.icon
              const active = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg transition duration-300 font-semibold text-xs

                    ${active
                      ? "bg-gradient-to-r from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/20"
                      : "hover:bg-slate-800/50 text-slate-300 hover:text-slate-100"
                    }
                  `}
                >

                  <Icon size={16} />

                  <span>
                    {item.label}
                  </span>

                </Link>
              )
            })}

          </nav>

        </aside>

        {/* MAIN */}
        <main className="flex-1 p-6">
          {children}
        </main>

      </div>

    </div>
  )
}