
import React, { useState } from 'react'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import Navbar from './Navbar'

const Header = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    // Hide navbar if scrolling down and past 150px
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.div
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.55, ease: "easeInOut" }}
      className='fixed top-0 w-full bg-white/60 backdrop-blur-md rounded-b-2xl h-22 z-50'
    >
      <Navbar />
    </motion.div>
  )
}

export default Header
