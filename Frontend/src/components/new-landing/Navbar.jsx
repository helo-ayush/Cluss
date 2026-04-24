
import React from 'react'

const  = '/ref/';
import { Link } from 'react-router-dom'
import { usePathname } from 'next/navigation'
import { useLenis } from 'lenis/react'
import { motion, AnimatePresence } from 'framer-motion'

const Navbar = () => {
  const pathname = usePathname();
  const lenis = useLenis();

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(`#${id}`);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className='flex items-center justify-between p-4 text-black md:mx-10 lg:mx-15 mt-1'>
      <div className='flex gap-2 items-center cursor-pointer'>
        <img src={Logo} alt="Logo" className="rounded-full w-9" / />
        <Link className='text-2xl coiny text-[#666666]' to='/'>cluss</Link>
      </div>
      <motion.div 
        className='hidden gap-8 lg:gap-13 md:flex items-center'
      >
        <motion.div 
          layout="position"
          transition={{ 
            duration: 0.6, 
            ease: [0.32, 0.72, 0, 1] 
          }}
          className='relative cursor-pointer transition duration-300 group'
        >
          <Link 
            to="/" 
            onClick={(e) => {
              if (pathname === '/') {
                handleScroll(e, "home");
              }
            }} 
            className="after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-[#bbbbbb] after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-300"
          >
            Home
          </Link>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {pathname !== '/explore' && (
            <motion.div 
              key="nav-links"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ 
                duration: 0.6, 
                ease: [0.32, 0.72, 0, 1] 
              }}
              className="flex gap-8 lg:gap-13 items-center"
            >
              <motion.a 
                to="#about" 
                onClick={(e) => handleScroll(e, "about")} 
                className='group cursor-pointer flex items-center gap-1.5 hover:text-[#bbbbbb] transition duration-300'
              >
                <div>About</div>
                <img src='https://cdn.prod.website-files.com/673786754d248974527e65b5/673a2c5929486b4e031f7c94_dropdown-arrow.svg' alt="Logo" width={7} height={7} className="rounded-full group-hover:scale-y-[-1] group-hover:invert-75 transition-transform duration-300 cursor-pointer" / />
              </motion.a>
              <motion.a 
                to="#pricing" 
                onClick={(e) => handleScroll(e, "pricing")} 
                className='group cursor-pointer flex items-center gap-1.5 hover:text-[#bbbbbb] transition duration-300'
              >
                <div>Pricing</div>
                <img src='https://cdn.prod.website-files.com/673786754d248974527e65b5/673a2c5929486b4e031f7c94_dropdown-arrow.svg' alt="Logo" width={7} height={7} className="rounded-full group-hover:scale-y-[-1] group-hover:invert-75 transition-transform duration-300 cursor-pointer" / />
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          layout="position"
          transition={{ 
            duration: 0.6, 
            ease: [0.32, 0.72, 0, 1] 
          }}
          className='relative cursor-pointer transition duration-300 group'
        >
          <div className="after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-[#bbbbbb] after:scale-x-0 after:origin-right hover:after:scale-x-100 hover:after:origin-left after:transition-transform after:duration-300">
            <Link to="/explore">
              Explore
            </Link>
          </div>
        </motion.div>
      </motion.div>
      <div className='flex lg:hidden items-center gap-5'>
        <div className='group relative cursor-pointer px-3 py-2 md:px-5 md:py-3 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden'>
          <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
          <div className='relative z-10 flex gap-2 group-hover:text-white transition-colors duration-500'>
            <div>Let's Start</div>
            <div className='group-hover:-rotate-45 transition duration-500' >👋</div>
          </div>
        </div>
        <div className='hover:bg-[#e5e9eb] rounded-full cursor-pointer transition duration-700 hover:translate-x-1 hover:translate-y-[-2px]'><img src="https://cdn.prod.website-files.com/673786754d248974527e65b5/673a401dc37634f53f2462ea_Button%20menu.svg" alt="Logo" width={40} height={40} className="rounded-full" / /></div>
      </div>
      <div className='hidden lg:flex items-center gap-5'>
        <div className='hover:bg-[#e5e9eb] rounded-full cursor-pointer transition duration-700 hover:translate-x-1 hover:translate-y-[-2px]'><img src="https://cdn.prod.website-files.com/673786754d248974527e65b5/673a401dc37634f53f2462ea_Button%20menu.svg" alt="Logo" width={40} height={40} className="rounded-full" / /></div>
        <div className='group relative cursor-pointer px-3 py-2 md:px-5 md:py-3 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden'>
          <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-in-out'></div>
          <div className='relative z-10 flex gap-2 group-hover:text-white transition-colors duration-500'>
            <div>Let's Start</div>
            <div className='group-hover:-rotate-45 transition duration-500' >👋</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar