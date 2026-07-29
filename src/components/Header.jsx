import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi'

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Contact', to: '/contact' },
]

const underlineVariants = {
  rest: { scaleX: 0 },
  hover: { scaleX: 1 },
}

function NavLink({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="text-sm font-medium tracking-wide text-white/80 transition-colors duration-300 hover:text-white"
    >
      <motion.span
        initial="rest"
        whileHover="hover"
        animate="rest"
        className="relative inline-block py-1"
      >
        {label}
        <motion.span
          variants={underlineVariants}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{ originX: 0.5 }}
          className="absolute inset-x-0 -bottom-0.5 h-px bg-white"
        />
      </motion.span>
    </Link>
  )
}

function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#c9a227] bg-black">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link to="/" className="shrink-0">
          <img
            src="/assets/images/agb-logo.png"
            alt="AGB Media"
            className="h-10 w-auto sm:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-8 sm:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} {...link} />
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center justify-center text-white/80 transition-colors duration-300 hover:text-white sm:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <HiOutlineX size={22} /> : <HiOutlineMenu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden bg-black sm:hidden"
          >
            <div className="flex flex-col items-start gap-4 px-5 py-5">
              {navLinks.map((link) => (
                <NavLink key={link.to} {...link} onClick={() => setOpen(false)} />
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}

export default Header
