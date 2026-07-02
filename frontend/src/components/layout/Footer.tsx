import { Heart } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 px-4 md:flex-row">
        <p className="text-sm text-muted-foreground">
          © {currentYear} AI Image Generator. All rights reserved.
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          Made with <Heart className="h-4 w-4 text-red-500" /> by the team
        </p>
      </div>
    </footer>
  )
}
